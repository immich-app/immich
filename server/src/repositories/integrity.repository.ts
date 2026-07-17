import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, IntegrityReport } from 'src/enum';
import { DB } from 'src/schema';
import { IntegrityReportTable } from 'src/schema/tables/integrity-report.table';

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
  getAssetPathsByPaths(paths: string[]) {
    return this.db
      .selectFrom('asset')
      .leftJoin('asset_file', (join) =>
        join.onRef('asset.id', '=', 'asset_file.assetId').on('asset_file.type', '=', AssetFileType.EncodedVideo),
      )
      .select(['asset.originalPath', 'asset_file.path as encodedVideoPath'])
      .where((eb) => eb.or([eb('originalPath', 'in', paths), eb('asset_file.path', 'in', paths)]))
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

  @GenerateSql({ params: [] })
  getAssetCount() {
    return this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [], stream: true })
  streamAllAssetPaths() {
    return this.db
      .selectFrom('asset')
      .leftJoin('asset_file', (join) =>
        join.onRef('asset.id', '=', 'asset_file.assetId').on('asset_file.type', '=', AssetFileType.EncodedVideo),
      )
      .select(['originalPath', 'asset_file.path as encodedVideoPath'])
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamAllAssetFilePaths() {
    return this.db.selectFrom('asset_file').select(['path']).stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamAssetPathsForMissingFiles() {
    return this.db
      .selectFrom((eb) =>
        eb
          .selectFrom('asset')
          .where('asset.deletedAt', 'is', null)
          .select('asset.originalPath as path')
          .select((eb) => [
            eb.ref('asset.id').$castTo<string | null>().as('assetId'),
            sql<string | null>`null::uuid`.as('fileAssetId'),
          ])
          .unionAll(
            eb
              .selectFrom('asset_file')
              .select(['path'])
              .select((eb) => [
                sql<string | null>`null::uuid`.as('assetId'),
                eb.ref('asset_file.id').$castTo<string | null>().as('fileAssetId'),
              ]),
          )
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
      .where('asset.deletedAt', 'is', null)
      .leftJoin('integrity_report', (join) =>
        join
          .onRef('integrity_report.assetId', '=', 'asset.id')
          .on('integrity_report.type', '=', IntegrityReport.ChecksumFail),
      )
      .select([
        'asset.originalPath',
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
        eb.leftJoin('asset', 'integrity_report.path', 'asset.originalPath').select('asset.checksum'),
      )
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
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
