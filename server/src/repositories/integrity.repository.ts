import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Readable } from 'node:stream';
import { DummyValue, GenerateSql } from 'src/decorators';
import { IntegrityReportType } from 'src/enum';
import { DB } from 'src/schema';
import { IntegrityReportTable } from 'src/schema/tables/integrity-report.table';

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
      .executeTakeFirst();
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
  getIntegrityReportSummary() {
    return this.db
      .selectFrom('integrity_report')
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.ChecksumFail)
          .as(IntegrityReportType.ChecksumFail),
      )
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.MissingFile)
          .as(IntegrityReportType.MissingFile),
      )
      .select((eb) =>
        eb.fn
          .countAll<number>()
          .filterWhere('type', '=', IntegrityReportType.OrphanFile)
          .as(IntegrityReportType.OrphanFile),
      )
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getIntegrityReports(type: IntegrityReportType) {
    return this.db
      .selectFrom('integrity_report')
      .select(['id', 'type', 'path', 'assetId', 'fileAssetId'])
      .where('type', '=', type)
      .orderBy('createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getAssetPathsByPaths(paths: string[]) {
    return this.db
      .selectFrom('asset')
      .select(['originalPath', 'encodedVideoPath'])
      .where((eb) => eb.or([eb('originalPath', 'in', paths), eb('encodedVideoPath', 'in', paths)]))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getAssetFilePathsByPaths(paths: string[]) {
    return this.db.selectFrom('asset_file').select(['path']).where('path', 'in', paths).execute();
  }

  @GenerateSql({ params: [] })
  getAssetCount() {
    return this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
  streamIntegrityReportsCSV(type: IntegrityReportType): Readable {
    const items = this.db
      .selectFrom('integrity_report')
      .select(['id', 'type', 'path', 'assetId', 'fileAssetId'])
      .where('type', '=', type)
      .orderBy('createdAt', 'desc')
      .stream();

    // very rudimentary csv serialiser
    async function* generator() {
      yield 'id,type,assetId,fileAssetId,path\n';

      for await (const item of items) {
        // no expectation of particularly bad filenames
        // but they could potentially have a newline or quote character
        yield `${item.id},${item.type},${item.assetId},${item.fileAssetId},"${item.path.replaceAll('"', '""')}"\n`;
      }
    }

    return Readable.from(generator());
  }

  @GenerateSql({ params: [], stream: true })
  streamAllAssetPaths() {
    return this.db.selectFrom('asset').select(['originalPath', 'encodedVideoPath']).stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamAllAssetFilePaths() {
    return this.db.selectFrom('asset_file').select(['path']).stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamAssetPaths() {
    return this.db
      .selectFrom((eb) =>
        eb
          .selectFrom('asset')
          .where('asset.deletedAt', 'is', null)
          .select(['asset.originalPath as path'])
          .select((eb) => [
            eb.ref('asset.id').$castTo<string | null>().as('assetId'),
            sql<string | null>`null::uuid`.as('fileAssetId'),
          ])
          .unionAll(
            eb
              .selectFrom('asset')
              .where('asset.deletedAt', 'is', null)
              .select((eb) => [
                eb.ref('asset.encodedVideoPath').$castTo<string>().as('path'),
                eb.ref('asset.id').$castTo<string | null>().as('assetId'),
                sql<string | null>`null::uuid`.as('fileAssetId'),
              ])
              .where('asset.encodedVideoPath', 'is not', null)
              .where('asset.encodedVideoPath', '!=', sql<string>`''`),
          )
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
      .leftJoin(
        'integrity_report',
        (join) =>
          join
            .on('integrity_report.type', '=', IntegrityReportType.OrphanFile)
            .on((eb) =>
              eb.or([
                eb('integrity_report.assetId', '=', eb.ref('allPaths.assetId')),
                eb('integrity_report.fileAssetId', '=', eb.ref('allPaths.fileAssetId')),
              ]),
            ),
        // .onRef('integrity_report.path', '=', 'allPaths.path')
      )
      .select([
        'allPaths.path as path',
        'allPaths.assetId',
        'allPaths.fileAssetId',
        'integrity_report.path as reportId',
      ])
      .stream();
  }

  @GenerateSql({ params: [DummyValue.DATE, DummyValue.DATE], stream: true })
  streamAssetChecksums(startMarker?: Date, endMarker?: Date) {
    return this.db
      .selectFrom('asset')
      .leftJoin('integrity_report', (join) =>
        join
          .onRef('integrity_report.assetId', '=', 'asset.id')
          // .onRef('integrity_report.path', '=', 'asset.originalPath')
          .on('integrity_report.type', '=', IntegrityReportType.ChecksumFail),
      )
      .select([
        'asset.originalPath',
        'asset.checksum',
        'asset.createdAt',
        'asset.id as assetId',
        'integrity_report.id as reportId',
      ])
      .$if(startMarker !== undefined, (qb) => qb.where('createdAt', '>=', startMarker!))
      .$if(endMarker !== undefined, (qb) => qb.where('createdAt', '<=', endMarker!))
      .orderBy('createdAt', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
  streamIntegrityReports(type: IntegrityReportType) {
    return this.db
      .selectFrom('integrity_report')
      .select(['integrity_report.id as reportId', 'integrity_report.path'])
      .where('integrity_report.type', '=', type)
      .$if(type === IntegrityReportType.ChecksumFail, (eb) =>
        eb.leftJoin('asset', 'integrity_report.path', 'asset.originalPath').select('asset.checksum'),
      )
      .stream();
  }

  @GenerateSql({ params: [DummyValue.STRING], stream: true })
  streamIntegrityReportsByProperty(property?: 'assetId' | 'fileAssetId', filterType?: IntegrityReportType) {
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
