import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, Selectable, sql, Updateable, UpdateResult } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { Stack } from 'src/database';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, AssetMetadataKey, AssetOrder, AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetFileTable } from 'src/schema/tables/asset-file.table';
import { AssetJobStatusTable } from 'src/schema/tables/asset-job-status.table';
import { AssetTable } from 'src/schema/tables/asset.table';
import { AssetMetadataItem } from 'src/types';
import {
  anyUuid,
  asUuid,
  hasPeople,
  removeUndefinedKeys,
  truncatedDate,
  unnest,
  withDefaultVisibility,
  withExif,
  withFaces,
  withFacesAndPeople,
  withFiles,
  withLibrary,
  withOwner,
  withSmartSearch,
  withTagId,
  withTags,
} from 'src/utils/database';
import { globToSqlPattern } from 'src/utils/misc';

export type AssetStats = Record<AssetType, number>;

interface AssetStatsOptions {
  isFavorite?: boolean;
  isTrashed?: boolean;
  visibility?: AssetVisibility;
}

interface LivePhotoSearchOptions {
  ownerId: string;
  libraryId?: string | null;
  livePhotoCID: string;
  otherAssetId: string;
  type: AssetType;
}

interface AssetBuilderOptions {
  isFavorite?: boolean;
  isTrashed?: boolean;
  isDuplicate?: boolean;
  albumId?: string;
  tagId?: string;
  personId?: string;
  userIds?: string[];
  withStacked?: boolean;
  exifInfo?: boolean;
  status?: AssetStatus;
  assetType?: AssetType;
  visibility?: AssetVisibility;
  withCoordinates?: boolean;
}

export interface TimeBucketOptions extends AssetBuilderOptions {
  order?: AssetOrder;
}

export interface TimeBucketItem {
  timeBucket: string;
  count: number;
}

export interface MonthDay {
  day: number;
  month: number;
}

interface AssetExploreFieldOptions {
  maxFields: number;
  minAssetsPerField: number;
}

interface AssetFullSyncOptions {
  ownerId: string;
  lastId?: string;
  updatedUntil: Date;
  limit: number;
}

interface AssetDeltaSyncOptions {
  userIds: string[];
  updatedAfter: Date;
  limit: number;
}

interface AssetGetByChecksumOptions {
  ownerId: string;
  checksum: Buffer;
  libraryId?: string;
}

interface GetByIdsRelations {
  exifInfo?: boolean;
  faces?: { person?: boolean; withDeleted?: boolean };
  files?: boolean;
  library?: boolean;
  owner?: boolean;
  smartSearch?: boolean;
  stack?: { assets?: boolean };
  tags?: boolean;
}

@Injectable()
export class AssetRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async upsertExif(exif: Insertable<AssetExifTable>): Promise<void> {
    const value = { ...exif, assetId: asUuid(exif.assetId) };
    await this.db
      .insertInto('asset_exif')
      .values(value)
      .onConflict((oc) =>
        oc.column('assetId').doUpdateSet((eb) =>
          removeUndefinedKeys(
            {
              description: eb.ref('excluded.description'),
              exifImageWidth: eb.ref('excluded.exifImageWidth'),
              exifImageHeight: eb.ref('excluded.exifImageHeight'),
              fileSizeInByte: eb.ref('excluded.fileSizeInByte'),
              orientation: eb.ref('excluded.orientation'),
              dateTimeOriginal: eb.ref('excluded.dateTimeOriginal'),
              modifyDate: eb.ref('excluded.modifyDate'),
              timeZone: eb.ref('excluded.timeZone'),
              latitude: eb.ref('excluded.latitude'),
              longitude: eb.ref('excluded.longitude'),
              projectionType: eb.ref('excluded.projectionType'),
              city: eb.ref('excluded.city'),
              livePhotoCID: eb.ref('excluded.livePhotoCID'),
              autoStackId: eb.ref('excluded.autoStackId'),
              state: eb.ref('excluded.state'),
              country: eb.ref('excluded.country'),
              make: eb.ref('excluded.make'),
              model: eb.ref('excluded.model'),
              lensModel: eb.ref('excluded.lensModel'),
              fNumber: eb.ref('excluded.fNumber'),
              focalLength: eb.ref('excluded.focalLength'),
              iso: eb.ref('excluded.iso'),
              exposureTime: eb.ref('excluded.exposureTime'),
              profileDescription: eb.ref('excluded.profileDescription'),
              colorspace: eb.ref('excluded.colorspace'),
              bitsPerSample: eb.ref('excluded.bitsPerSample'),
              rating: eb.ref('excluded.rating'),
              fps: eb.ref('excluded.fps'),
            },
            value,
          ),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID], { model: DummyValue.STRING }] })
  @Chunked()
  async updateAllExif(ids: string[], options: Updateable<AssetExifTable>): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.updateTable('asset_exif').set(options).where('assetId', 'in', ids).execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.NUMBER, DummyValue.STRING] })
  @Chunked()
  async updateDateTimeOriginal(
    ids: string[],
    delta?: number,
    timeZone?: string,
  ): Promise<{ assetId: string; dateTimeOriginal: Date | null; timeZone: string | null }[]> {
    return await this.db
      .updateTable('asset_exif')
      .set({ dateTimeOriginal: sql`"dateTimeOriginal" + ${(delta ?? 0) + ' minute'}::interval`, timeZone })
      .where('assetId', 'in', ids)
      .returning(['assetId', 'dateTimeOriginal', 'timeZone'])
      .execute();
  }

  async upsertJobStatus(...jobStatus: Insertable<AssetJobStatusTable>[]): Promise<void> {
    if (jobStatus.length === 0) {
      return;
    }

    const values = jobStatus.map((row) => ({ ...row, assetId: asUuid(row.assetId) }));
    await this.db
      .insertInto('asset_job_status')
      .values(values)
      .onConflict((oc) =>
        oc.column('assetId').doUpdateSet((eb) =>
          removeUndefinedKeys(
            {
              duplicatesDetectedAt: eb.ref('excluded.duplicatesDetectedAt'),
              facesRecognizedAt: eb.ref('excluded.facesRecognizedAt'),
              metadataExtractedAt: eb.ref('excluded.metadataExtractedAt'),
              previewAt: eb.ref('excluded.previewAt'),
              thumbnailAt: eb.ref('excluded.thumbnailAt'),
            },
            values[0],
          ),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMetadata(assetId: string) {
    return this.db
      .selectFrom('asset_metadata')
      .select(['key', 'value', 'updatedAt'])
      .where('assetId', '=', assetId)
      .execute();
  }

  upsertMetadata(id: string, items: AssetMetadataItem[]) {
    return this.db
      .insertInto('asset_metadata')
      .values(items.map((item) => ({ assetId: id, ...item })))
      .onConflict((oc) =>
        oc
          .columns(['assetId', 'key'])
          .doUpdateSet((eb) => ({ key: eb.ref('excluded.key'), value: eb.ref('excluded.value') })),
      )
      .returning(['key', 'value', 'updatedAt'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getMetadataByKey(assetId: string, key: AssetMetadataKey) {
    return this.db
      .selectFrom('asset_metadata')
      .select(['key', 'value', 'updatedAt'])
      .where('assetId', '=', assetId)
      .where('key', '=', key)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async deleteMetadataByKey(id: string, key: AssetMetadataKey) {
    await this.db.deleteFrom('asset_metadata').where('assetId', '=', id).where('key', '=', key).execute();
  }

  create(asset: Insertable<AssetTable>) {
    return this.db.insertInto('asset').values(asset).returningAll().executeTakeFirstOrThrow();
  }

  createAll(assets: Insertable<AssetTable>[]) {
    return this.db.insertInto('asset').values(assets).returningAll().execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { day: 1, month: 1 }] })
  getByDayOfYear(ownerIds: string[], { day, month }: MonthDay) {
    return this.db
      .with('res', (qb) =>
        qb
          .with('today', (qb) =>
            qb
              .selectFrom((eb) =>
                eb
                  .fn('generate_series', [
                    sql`(select date_part('year', min(("localDateTime" at time zone 'UTC')::date))::int from asset)`,
                    sql`date_part('year', current_date)::int - 1`,
                  ])
                  .as('year'),
              )
              .select((eb) => eb.fn('make_date', [sql`year::int`, sql`${month}::int`, sql`${day}::int`]).as('date')),
          )
          .selectFrom('today')
          .innerJoinLateral(
            (qb) =>
              qb
                .selectFrom('asset')
                .selectAll('asset')
                .innerJoin('asset_job_status', 'asset.id', 'asset_job_status.assetId')
                .where('asset_job_status.previewAt', 'is not', null)
                .where(sql`(asset."localDateTime" at time zone 'UTC')::date`, '=', sql`today.date`)
                .where('asset.ownerId', '=', anyUuid(ownerIds))
                .where('asset.visibility', '=', AssetVisibility.Timeline)
                .where((eb) =>
                  eb.exists((qb) =>
                    qb
                      .selectFrom('asset_file')
                      .whereRef('assetId', '=', 'asset.id')
                      .where('asset_file.type', '=', AssetFileType.Preview),
                  ),
                )
                .where('asset.deletedAt', 'is', null)
                .orderBy(sql`(asset."localDateTime" at time zone 'UTC')::date`, 'desc')
                .limit(20)
                .as('a'),
            (join) => join.onTrue(),
          )
          .innerJoin('asset_exif', 'a.id', 'asset_exif.assetId')
          .selectAll('a')
          .select((eb) => eb.fn.toJson(eb.table('asset_exif')).as('exifInfo')),
      )
      .selectFrom('res')
      .select(sql<number>`date_part('year', ("localDateTime" at time zone 'UTC')::date)::int`.as('year'))
      .select((eb) => eb.fn.jsonAgg(eb.table('res')).as('assets'))
      .groupBy(sql`("localDateTime" at time zone 'UTC')::date`)
      .orderBy(sql`("localDateTime" at time zone 'UTC')::date`, 'desc')
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIds(ids: string[]) {
    return this.db.selectFrom('asset').selectAll('asset').where('asset.id', '=', anyUuid(ids)).execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIdsWithAllRelationsButStacks(ids: string[]) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .select(withFacesAndPeople)
      .select(withTags)
      .$call(withExif)
      .where('asset.id', '=', anyUuid(ids))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAll(ownerId: string): Promise<void> {
    await this.db.deleteFrom('asset').where('ownerId', '=', ownerId).execute();
  }

  async getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]> {
    const assets = await this.db
      .selectFrom('asset')
      .select(['deviceAssetId'])
      .where('deviceAssetId', 'in', deviceAssetIds)
      .where('deviceId', '=', deviceId)
      .where('ownerId', '=', asUuid(ownerId))
      .execute();

    return assets.map((asset) => asset.deviceAssetId);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .where('libraryId', '=', asUuid(libraryId))
      .where('originalPath', '=', originalPath)
      .limit(1)
      .executeTakeFirst();
  }

  /**
   * Get assets by device's Id on the database
   * @param ownerId
   * @param deviceId
   *
   * @returns Promise<string[]> - Array of assetIds belong to the device
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getAllByDeviceId(ownerId: string, deviceId: string): Promise<string[]> {
    const items = await this.db
      .selectFrom('asset')
      .select(['deviceAssetId'])
      .where('ownerId', '=', asUuid(ownerId))
      .where('deviceId', '=', deviceId)
      .where('visibility', '!=', AssetVisibility.Hidden)
      .where('deletedAt', 'is', null)
      .execute();

    return items.map((asset) => asset.deviceAssetId);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getLivePhotoCount(motionId: string): Promise<number> {
    const [{ count }] = await this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('livePhotoVideoId', '=', asUuid(motionId))
      .execute();
    return count;
  }

  @GenerateSql()
  getFileSamples() {
    return this.db.selectFrom('asset_file').select(['assetId', 'path']).limit(sql.lit(3)).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string, { exifInfo, faces, files, library, owner, smartSearch, stack, tags }: GetByIdsRelations = {}) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .where('asset.id', '=', asUuid(id))
      .$if(!!exifInfo, withExif)
      .$if(!!faces, (qb) => qb.select(faces?.person ? withFacesAndPeople : withFaces).$narrowType<{ faces: NotNull }>())
      .$if(!!library, (qb) => qb.select(withLibrary))
      .$if(!!owner, (qb) => qb.select(withOwner))
      .$if(!!smartSearch, withSmartSearch)
      .$if(!!stack, (qb) =>
        qb
          .leftJoin('stack', 'stack.id', 'asset.stackId')
          .$if(!stack!.assets, (qb) =>
            qb.select((eb) => eb.fn.toJson(eb.table('stack')).$castTo<Stack | null>().as('stack')),
          )
          .$if(!!stack!.assets, (qb) =>
            qb
              .leftJoinLateral(
                (eb) =>
                  eb
                    .selectFrom('asset as stacked')
                    .selectAll('stack')
                    .select((eb) => eb.fn('array_agg', [eb.table('stacked')]).as('assets'))
                    .whereRef('stacked.stackId', '=', 'stack.id')
                    .whereRef('stacked.id', '!=', 'stack.primaryAssetId')
                    .where('stacked.deletedAt', 'is', null)
                    .where('stacked.visibility', '=', AssetVisibility.Timeline)
                    .groupBy('stack.id')
                    .as('stacked_assets'),
                (join) => join.on('stack.id', 'is not', null),
              )
              .select((eb) => eb.fn.toJson(eb.table('stacked_assets')).$castTo<Stack | null>().as('stack')),
          ),
      )
      .$if(!!files, (qb) => qb.select(withFiles))
      .$if(!!tags, (qb) => qb.select(withTags))
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [[DummyValue.UUID], { deviceId: DummyValue.STRING }] })
  @Chunked()
  async updateAll(ids: string[], options: Updateable<AssetTable>): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.db.updateTable('asset').set(options).where('id', '=', anyUuid(ids)).execute();
  }

  async updateByLibraryId(libraryId: string, options: Updateable<AssetTable>): Promise<void> {
    await this.db.updateTable('asset').set(options).where('libraryId', '=', asUuid(libraryId)).execute();
  }

  async update(asset: Updateable<AssetTable> & { id: string }) {
    const value = omitBy(asset, isUndefined);
    delete value.id;
    if (!isEmpty(value)) {
      return this.db
        .with('asset', (qb) => qb.updateTable('asset').set(asset).where('id', '=', asUuid(asset.id)).returningAll())
        .selectFrom('asset')
        .selectAll('asset')
        .$call(withExif)
        .$call((qb) => qb.select(withFacesAndPeople))
        .executeTakeFirst();
    }

    return this.getById(asset.id, { exifInfo: true, faces: { person: true } });
  }

  async remove(asset: { id: string }): Promise<void> {
    await this.db.deleteFrom('asset').where('id', '=', asUuid(asset.id)).execute();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, libraryId: DummyValue.UUID, checksum: DummyValue.BUFFER }] })
  getByChecksum({ ownerId, libraryId, checksum }: AssetGetByChecksumOptions) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .where('ownerId', '=', asUuid(ownerId))
      .where('checksum', '=', checksum)
      .$call((qb) => (libraryId ? qb.where('libraryId', '=', asUuid(libraryId)) : qb.where('libraryId', 'is', null)))
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.BUFFER]] })
  getByChecksums(userId: string, checksums: Buffer[]) {
    return this.db
      .selectFrom('asset')
      .select(['id', 'checksum', 'deletedAt'])
      .where('ownerId', '=', asUuid(userId))
      .where('checksum', 'in', checksums)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  async getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined> {
    const asset = await this.db
      .selectFrom('asset')
      .select('id')
      .where('ownerId', '=', asUuid(ownerId))
      .where('checksum', '=', checksum)
      .where('libraryId', 'is', null)
      .limit(1)
      .executeTakeFirst();

    return asset?.id;
  }

  findLivePhotoMatch(options: LivePhotoSearchOptions) {
    const { ownerId, otherAssetId, livePhotoCID, type } = options;
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.ownerId'])
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .where('id', '!=', asUuid(otherAssetId))
      .where('ownerId', '=', asUuid(ownerId))
      .where('type', '=', type)
      .where('asset_exif.livePhotoCID', '=', livePhotoCID)
      .limit(1)
      .executeTakeFirst();
  }

  getStatistics(ownerId: string, { visibility, isFavorite, isTrashed }: AssetStatsOptions): Promise<AssetStats> {
    return this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.Audio).as(AssetType.Audio))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.Image).as(AssetType.Image))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.Video).as(AssetType.Video))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.Other).as(AssetType.Other))
      .where('ownerId', '=', asUuid(ownerId))
      .$if(visibility === undefined, withDefaultVisibility)
      .$if(!!visibility, (qb) => qb.where('asset.visibility', '=', visibility!))
      .$if(isFavorite !== undefined, (qb) => qb.where('isFavorite', '=', isFavorite!))
      .$if(!!isTrashed, (qb) => qb.where('asset.status', '!=', AssetStatus.Deleted))
      .where('deletedAt', isTrashed ? 'is not' : 'is', null)
      .executeTakeFirstOrThrow();
  }

  getRandom(userIds: string[], take: number) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .$call(withExif)
      .$call(withDefaultVisibility)
      .where('ownerId', '=', anyUuid(userIds))
      .where('deletedAt', 'is', null)
      .orderBy((eb) => eb.fn('random'))
      .limit(take)
      .execute();
  }

  @GenerateSql({ params: [{}] })
  async getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    return this.db
      .with('asset', (qb) =>
        qb
          .selectFrom('asset')
          .select(truncatedDate<Date>().as('timeBucket'))
          .$if(!!options.isTrashed, (qb) => qb.where('asset.status', '!=', AssetStatus.Deleted))
          .where('asset.deletedAt', options.isTrashed ? 'is not' : 'is', null)
          .$if(options.visibility === undefined, withDefaultVisibility)
          .$if(!!options.visibility, (qb) => qb.where('asset.visibility', '=', options.visibility!))
          .$if(!!options.albumId, (qb) =>
            qb
              .innerJoin('album_asset', 'asset.id', 'album_asset.assetsId')
              .where('album_asset.albumsId', '=', asUuid(options.albumId!)),
          )
          .$if(!!options.personId, (qb) => hasPeople(qb, [options.personId!]))
          .$if(!!options.withStacked, (qb) =>
            qb
              .leftJoin('stack', (join) =>
                join.onRef('stack.id', '=', 'asset.stackId').onRef('stack.primaryAssetId', '=', 'asset.id'),
              )
              .where((eb) => eb.or([eb('asset.stackId', 'is', null), eb(eb.table('stack'), 'is not', null)])),
          )
          .$if(!!options.userIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(options.userIds!)))
          .$if(options.isFavorite !== undefined, (qb) => qb.where('asset.isFavorite', '=', options.isFavorite!))
          .$if(!!options.assetType, (qb) => qb.where('asset.type', '=', options.assetType!))
          .$if(options.isDuplicate !== undefined, (qb) =>
            qb.where('asset.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
          )
          .$if(!!options.tagId, (qb) => withTagId(qb, options.tagId!)),
      )
      .selectFrom('asset')
      .select(sql<string>`("timeBucket" AT TIME ZONE 'UTC')::date::text`.as('timeBucket'))
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .groupBy('timeBucket')
      .orderBy('timeBucket', options.order ?? 'desc')
      .execute() as any as Promise<TimeBucketItem[]>;
  }

  @GenerateSql({
    params: [DummyValue.TIME_BUCKET, { withStacked: true }],
  })
  getTimeBucket(timeBucket: string, options: TimeBucketOptions) {
    const query = this.db
      .with('cte', (qb) =>
        qb
          .selectFrom('asset')
          .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
          .select((eb) => [
            'asset.duration',
            'asset.id',
            'asset.visibility',
            'asset.isFavorite',
            sql`asset.type = 'IMAGE'`.as('isImage'),
            sql`asset."deletedAt" is not null`.as('isTrashed'),
            'asset.livePhotoVideoId',
            sql`extract(epoch from (asset."localDateTime" AT TIME ZONE 'UTC' - asset."fileCreatedAt" at time zone 'UTC'))::real / 3600`.as(
              'localOffsetHours',
            ),
            'asset.ownerId',
            'asset.status',
            sql`asset."fileCreatedAt" at time zone 'utc'`.as('fileCreatedAt'),
            eb.fn('encode', ['asset.thumbhash', sql.lit('base64')]).as('thumbhash'),
            'asset_exif.city',
            'asset_exif.country',
            'asset_exif.projectionType',
            eb.fn
              .coalesce(
                eb
                  .case()
                  .when(sql`asset_exif."exifImageHeight" = 0 or asset_exif."exifImageWidth" = 0`)
                  .then(eb.lit(1))
                  .when('asset_exif.orientation', 'in', sql<string>`('5', '6', '7', '8', '-90', '90')`)
                  .then(sql`round(asset_exif."exifImageHeight"::numeric / asset_exif."exifImageWidth"::numeric, 3)`)
                  .else(sql`round(asset_exif."exifImageWidth"::numeric / asset_exif."exifImageHeight"::numeric, 3)`)
                  .end(),
                eb.lit(1),
              )
              .as('ratio'),
          ])
          .$if(!!options.withCoordinates, (qb) => qb.select(['asset_exif.latitude', 'asset_exif.longitude']))
          .where('asset.deletedAt', options.isTrashed ? 'is not' : 'is', null)
          .$if(options.visibility == undefined, withDefaultVisibility)
          .$if(!!options.visibility, (qb) => qb.where('asset.visibility', '=', options.visibility!))
          .where(truncatedDate(), '=', timeBucket.replace(/^[+-]/, ''))
          .$if(!!options.albumId, (qb) =>
            qb.where((eb) =>
              eb.exists(
                eb
                  .selectFrom('album_asset')
                  .whereRef('album_asset.assetsId', '=', 'asset.id')
                  .where('album_asset.albumsId', '=', asUuid(options.albumId!)),
              ),
            ),
          )
          .$if(!!options.personId, (qb) => hasPeople(qb, [options.personId!]))
          .$if(!!options.userIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(options.userIds!)))
          .$if(options.isFavorite !== undefined, (qb) => qb.where('asset.isFavorite', '=', options.isFavorite!))
          .$if(!!options.withStacked, (qb) =>
            qb
              .where((eb) =>
                eb.not(
                  eb.exists(
                    eb
                      .selectFrom('stack')
                      .whereRef('stack.id', '=', 'asset.stackId')
                      .whereRef('stack.primaryAssetId', '!=', 'asset.id'),
                  ),
                ),
              )
              .leftJoinLateral(
                (eb) =>
                  eb
                    .selectFrom('asset as stacked')
                    .select(sql`array[stacked."stackId"::text, count('stacked')::text]`.as('stack'))
                    .whereRef('stacked.stackId', '=', 'asset.stackId')
                    .where('stacked.deletedAt', 'is', null)
                    .where('stacked.visibility', '=', AssetVisibility.Timeline)
                    .groupBy('stacked.stackId')
                    .as('stacked_assets'),
                (join) => join.onTrue(),
              )
              .select('stack'),
          )
          .$if(!!options.assetType, (qb) => qb.where('asset.type', '=', options.assetType!))
          .$if(options.isDuplicate !== undefined, (qb) =>
            qb.where('asset.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
          )
          .$if(!!options.isTrashed, (qb) => qb.where('asset.status', '!=', AssetStatus.Deleted))
          .$if(!!options.tagId, (qb) => withTagId(qb, options.tagId!))
          .orderBy('asset.fileCreatedAt', options.order ?? 'desc'),
      )
      .with('agg', (qb) =>
        qb
          .selectFrom('cte')
          .select((eb) => [
            eb.fn.coalesce(eb.fn('array_agg', ['city']), sql.lit('{}')).as('city'),
            eb.fn.coalesce(eb.fn('array_agg', ['country']), sql.lit('{}')).as('country'),
            eb.fn.coalesce(eb.fn('array_agg', ['duration']), sql.lit('{}')).as('duration'),
            eb.fn.coalesce(eb.fn('array_agg', ['id']), sql.lit('{}')).as('id'),
            eb.fn.coalesce(eb.fn('array_agg', ['visibility']), sql.lit('{}')).as('visibility'),
            eb.fn.coalesce(eb.fn('array_agg', ['isFavorite']), sql.lit('{}')).as('isFavorite'),
            eb.fn.coalesce(eb.fn('array_agg', ['isImage']), sql.lit('{}')).as('isImage'),
            // TODO: isTrashed is redundant as it will always be all true or false depending on the options
            eb.fn.coalesce(eb.fn('array_agg', ['isTrashed']), sql.lit('{}')).as('isTrashed'),
            eb.fn.coalesce(eb.fn('array_agg', ['livePhotoVideoId']), sql.lit('{}')).as('livePhotoVideoId'),
            eb.fn.coalesce(eb.fn('array_agg', ['fileCreatedAt']), sql.lit('{}')).as('fileCreatedAt'),
            eb.fn.coalesce(eb.fn('array_agg', ['localOffsetHours']), sql.lit('{}')).as('localOffsetHours'),
            eb.fn.coalesce(eb.fn('array_agg', ['ownerId']), sql.lit('{}')).as('ownerId'),
            eb.fn.coalesce(eb.fn('array_agg', ['projectionType']), sql.lit('{}')).as('projectionType'),
            eb.fn.coalesce(eb.fn('array_agg', ['ratio']), sql.lit('{}')).as('ratio'),
            eb.fn.coalesce(eb.fn('array_agg', ['status']), sql.lit('{}')).as('status'),
            eb.fn.coalesce(eb.fn('array_agg', ['thumbhash']), sql.lit('{}')).as('thumbhash'),
          ])
          .$if(!!options.withCoordinates, (qb) =>
            qb.select((eb) => [
              eb.fn.coalesce(eb.fn('array_agg', ['latitude']), sql.lit('{}')).as('latitude'),
              eb.fn.coalesce(eb.fn('array_agg', ['longitude']), sql.lit('{}')).as('longitude'),
            ]),
          )
          .$if(!!options.withStacked, (qb) =>
            qb.select((eb) => eb.fn.coalesce(eb.fn('json_agg', ['stack']), sql.lit('[]')).as('stack')),
          ),
      )
      .selectFrom('agg')
      .select(sql<string>`to_json(agg)::text`.as('assets'));

    return query.executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByCity(ownerId: string, { minAssetsPerField, maxFields }: AssetExploreFieldOptions) {
    const items = await this.db
      .with('cities', (qb) =>
        qb
          .selectFrom('asset_exif')
          .select('city')
          .where('city', 'is not', null)
          .groupBy('city')
          .having((eb) => eb.fn('count', [eb.ref('assetId')]), '>=', minAssetsPerField),
      )
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .innerJoin('cities', 'asset_exif.city', 'cities.city')
      .distinctOn('asset_exif.city')
      .select(['assetId as data', 'asset_exif.city as value'])
      .$narrowType<{ value: NotNull }>()
      .where('ownerId', '=', asUuid(ownerId))
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('type', '=', AssetType.Image)
      .where('deletedAt', 'is', null)
      .limit(maxFields)
      .execute();

    return { fieldName: 'exifInfo.city', items };
  }

  @GenerateSql({
    params: [
      {
        ownerId: DummyValue.UUID,
        lastId: DummyValue.UUID,
        updatedUntil: DummyValue.DATE,
        limit: 10,
      },
    ],
  })
  getAllForUserFullSync(options: AssetFullSyncOptions) {
    const { ownerId, lastId, updatedUntil, limit } = options;
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .$call(withExif)
      .leftJoin('stack', 'stack.id', 'asset.stackId')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset as stacked')
            .selectAll('stack')
            .select((eb) => eb.fn.count(eb.table('stacked')).as('assetCount'))
            .whereRef('stacked.stackId', '=', 'stack.id')
            .groupBy('stack.id')
            .as('stacked_assets'),
        (join) => join.on('stack.id', 'is not', null),
      )
      .select((eb) => eb.fn.toJson(eb.table('stacked_assets')).$castTo<Stack | null>().as('stack'))
      .where('asset.ownerId', '=', asUuid(ownerId))
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .where('asset.updatedAt', '<=', updatedUntil)
      .$if(!!lastId, (qb) => qb.where('asset.id', '>', lastId!))
      .orderBy('asset.id')
      .limit(limit)
      .execute();
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID], updatedAfter: DummyValue.DATE, limit: 100 }] })
  async getChangedDeltaSync(options: AssetDeltaSyncOptions) {
    return this.db
      .selectFrom('asset')
      .selectAll('asset')
      .$call(withExif)
      .leftJoin('stack', 'stack.id', 'asset.stackId')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset as stacked')
            .selectAll('stack')
            .select((eb) => eb.fn.count(eb.table('stacked')).as('assetCount'))
            .whereRef('stacked.stackId', '=', 'stack.id')
            .groupBy('stack.id')
            .as('stacked_assets'),
        (join) => join.on('stack.id', 'is not', null),
      )
      .select((eb) => eb.fn.toJson(eb.table('stacked_assets').$castTo<Stack | null>()).as('stack'))
      .where('asset.ownerId', '=', anyUuid(options.userIds))
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .where('asset.updatedAt', '>', options.updatedAfter)
      .limit(options.limit)
      .execute();
  }

  async upsertFile(file: Pick<Insertable<AssetFileTable>, 'assetId' | 'path' | 'type'>): Promise<void> {
    const value = { ...file, assetId: asUuid(file.assetId) };
    await this.db
      .insertInto('asset_file')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['assetId', 'type']).doUpdateSet((eb) => ({
          path: eb.ref('excluded.path'),
        })),
      )
      .execute();
  }

  async upsertFiles(files: Pick<Insertable<AssetFileTable>, 'assetId' | 'path' | 'type'>[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const values = files.map((row) => ({ ...row, assetId: asUuid(row.assetId) }));
    await this.db
      .insertInto('asset_file')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['assetId', 'type']).doUpdateSet((eb) => ({
          path: eb.ref('excluded.path'),
        })),
      )
      .execute();
  }

  async deleteFiles(files: Pick<Selectable<AssetFileTable>, 'id'>[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('asset_file')
      .where('id', '=', anyUuid(files.map((file) => file.id)))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.STRING], [DummyValue.STRING]] })
  async detectOfflineExternalAssets(
    libraryId: string,
    importPaths: string[],
    exclusionPatterns: string[],
  ): Promise<UpdateResult> {
    const paths = importPaths.map((importPath) => `${importPath}%`);
    const exclusions = exclusionPatterns.map((pattern) => globToSqlPattern(pattern));

    return this.db
      .updateTable('asset')
      .set({
        isOffline: true,
        deletedAt: new Date(),
      })
      .where('isOffline', '=', false)
      .where('isExternal', '=', true)
      .where('libraryId', '=', asUuid(libraryId))
      .where((eb) =>
        eb.or([
          eb.not(eb.or(paths.map((path) => eb('originalPath', 'like', path)))),
          eb.or(exclusions.map((path) => eb('originalPath', 'like', path))),
        ]),
      )
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.STRING]] })
  async filterNewExternalAssetPaths(libraryId: string, paths: string[]): Promise<string[]> {
    const result = await this.db
      .selectFrom(unnest(paths).as('path'))
      .select('path')
      .where((eb) =>
        eb.not(
          eb.exists(
            this.db
              .selectFrom('asset')
              .select('originalPath')
              .whereRef('asset.originalPath', '=', eb.ref('path'))
              .where('libraryId', '=', asUuid(libraryId))
              .where('isExternal', '=', true),
          ),
        ),
      )
      .execute();

    return result.map((row) => row.path as string);
  }

  async getLibraryAssetCount(libraryId: string): Promise<number> {
    const { count } = await this.db
      .selectFrom('asset')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('libraryId', '=', asUuid(libraryId))
      .executeTakeFirstOrThrow();

    return count;
  }
}
