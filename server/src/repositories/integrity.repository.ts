import { Injectable } from '@nestjs/common';
import { sql, type Insertable, type Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { MEDIA_FILE_TYPES } from 'src/constants.js';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetFileType, IntegrityReport } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { IntegrityReportTable } from 'src/schema/tables/integrity-report.table.js';
import { onOriginal } from 'src/utils/database.js';

export type ReportPaginationOptions = {
  cursor?: string;
  limit: number;
};

@Injectable()
export class IntegrityRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<IntegrityReportTable> | Insertable<IntegrityReportTable>[]) {
    return this.db
      .insertInto('integrity_report')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['path', 'type']).doUpdateSet({
          assetId: (eb) => eb.ref('excluded.assetId'),
          fileAssetId: (eb) => eb.ref('excluded.fileAssetId'),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getById(id: string) {
    return this.db
      .selectFrom('integrity_report')
      .selectAll('integrity_report')
      .where('id', '=', id)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [] })
  async getIntegrityReportSummary() {
    const counts = await this.db
      .selectFrom('integrity_report')
      .select(['type', this.db.fn.countAll<number>().as('count')])
      .groupBy('type')
      .execute();

    return Object.fromEntries(
      Object.values(IntegrityReport).map((type) => [type, counts.find((count) => count.type === type)?.count || 0]),
    ) as Record<IntegrityReport, number>;
  }

  @GenerateSql({ params: [{ cursor: DummyValue.NUMBER, limit: 100 }, DummyValue.STRING] })
  async getIntegrityReport(pagination: ReportPaginationOptions, type: IntegrityReport) {
    const items = await this.db
      .selectFrom('integrity_report')
      .select(['id', 'type', 'path', 'assetId', 'fileAssetId', 'createdAt'])
      .where('type', '=', type)
      .$if(pagination.cursor !== undefined, (eb) => eb.where('id', '<=', pagination.cursor!))
      .orderBy('id', 'desc')
      .limit(pagination.limit + 1)
      .execute();

    return {
      items: items.slice(0, pagination.limit),
      nextCursor: items.at(pagination.limit)?.id,
    };
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getMediaFilePathsByPaths(paths: string[]) {
    return this.db
      .selectFrom('asset_file')
      .select('path')
      .where('type', 'in', MEDIA_FILE_TYPES)
      .where('path', 'in', paths)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getAssetFilePathsByPaths(paths: string[]) {
    return this.db.selectFrom('asset_file').select('path').where('path', 'in', paths).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getPersonThumbnailPathsByPaths(paths: string[]) {
    return this.db
      .selectFrom('person')
      .select('person.thumbnailPath')
      .where('person.thumbnailPath', 'in', paths)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getTrackedPaths(paths: string[]) {
    return this.db
      .selectFrom('asset_file')
      .select('asset_file.path as path')
      .where('asset_file.path', 'in', paths)
      .union((eb) =>
        eb
          .selectFrom('person')
          .select((eb) => eb.ref('person.thumbnailPath').$castTo<string>().as('path'))
          .where('person.thumbnailPath', 'in', paths),
      )
      .execute();
  }

  @GenerateSql({ params: [] })
  getAssetCount() {
    return this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [], stream: true })
  streamAssetPathsForMissingFiles() {
    return this.db
      .selectFrom((eb) =>
        eb
          .selectFrom('asset_file')
          .innerJoin('asset', 'asset.id', 'asset_file.assetId')
          .where((eb) =>
            eb.or([
              eb('asset_file.type', '!=', sql.lit(AssetFileType.Original)),
              eb.and([eb('asset_file.isEdited', '=', sql.lit(false)), eb('asset.deletedAt', 'is', null)]),
            ]),
          )
          .select((eb) => [
            'asset_file.path',
            eb
              .case()
              .when('asset_file.type', '=', sql.lit(AssetFileType.Original))
              .then(eb.ref('asset.id'))
              .end()
              .as('assetId'),
            eb
              .case()
              .when('asset_file.type', '!=', sql.lit(AssetFileType.Original))
              .then(eb.ref('asset_file.id'))
              .end()
              .as('fileAssetId'),
          ])
          .as('allPaths'),
      )
      .leftJoin('integrity_report', (join) =>
        join
          .on('integrity_report.type', '=', IntegrityReport.MissingFile)
          .on((eb) =>
            eb.or([
              eb('integrity_report.assetId', '=', eb.ref('allPaths.assetId')),
              eb('integrity_report.fileAssetId', '=', eb.ref('allPaths.fileAssetId')),
            ]),
          ),
      )
      .select(['allPaths.path as path', 'allPaths.assetId', 'allPaths.fileAssetId', 'integrity_report.id as reportId'])
      .stream() as AsyncIterableIterator<
      { path: string; reportId: string | null } & (
        { assetId: string; fileAssetId: null } | { assetId: null; fileAssetId: string }
      )
    >;
  }

  @GenerateSql({ params: [DummyValue.DATE], stream: true })
  streamAssetChecksums(startMarker?: Date) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_file as asset_original', onOriginal)
      .where('asset.deletedAt', 'is', null)
      .leftJoin('integrity_report', (join) =>
        join
          .onRef('integrity_report.assetId', '=', 'asset.id')
          .on('integrity_report.type', '=', IntegrityReport.ChecksumFail),
      )
      .select([
        'asset_original.path as originalPath',
        'asset.checksum',
        'asset.createdAt',
        'asset.id as assetId',
        'integrity_report.id as reportId',
      ])
      .where('asset.isExternal', '=', sql.lit(false))
      .$if(startMarker !== undefined, (qb) => qb.where('asset.createdAt', '>=', startMarker!))
      .orderBy('asset.createdAt', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
  streamIntegrityReports(type: IntegrityReport) {
    return this.db
      .selectFrom('integrity_report')
      .select(['id', 'type', 'path', 'assetId', 'fileAssetId'])
      .where('type', '=', type)
      .orderBy('createdAt', 'desc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
  streamIntegrityReportsWithAssetChecksum(type: IntegrityReport) {
    return this.db
      .selectFrom('integrity_report')
      .select(['integrity_report.id as reportId', 'integrity_report.path'])
      .where('integrity_report.type', '=', type)
      .$if(type === IntegrityReport.ChecksumFail, (eb) =>
        eb
          .leftJoin('asset_file as asset_original', (join) =>
            join
              .onRef('asset_original.path', '=', 'integrity_report.path')
              .on('asset_original.type', '=', sql.lit(AssetFileType.Original)),
          )
          .leftJoin('asset', 'asset.id', 'asset_original.assetId')
          .select('asset.checksum'),
      )
      .stream();
  }

  @GenerateSql({ params: ['assetId', IntegrityReport.MissingFile], stream: true })
  streamIntegrityReportsByProperty(property?: 'assetId' | 'fileAssetId', filterType?: IntegrityReport) {
    return this.db
      .selectFrom('integrity_report')
      .select(['id', 'path', 'assetId', 'fileAssetId'])
      .$if(filterType !== undefined, (eb) => eb.where('type', '=', filterType!))
      .$if(property === undefined, (eb) => eb.where('assetId', 'is', null).where('fileAssetId', 'is', null))
      .$if(property !== undefined, (eb) => eb.where(property!, 'is not', null))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  deleteById(id: string) {
    return this.db.deleteFrom('integrity_report').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  deleteByIds(ids: string[]) {
    return this.db.deleteFrom('integrity_report').where('id', 'in', ids).execute();
  }
}
