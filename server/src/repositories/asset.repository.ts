import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, Selectable, UpdateResult, Updateable, sql } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { Stack } from 'src/database';
import { AssetFiles, AssetJobStatus, Assets, DB, Exif } from 'src/db';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetFileType, AssetOrder, AssetStatus, AssetType } from 'src/enum';
import {
  anyUuid,
  asUuid,
  hasPeople,
  removeUndefinedKeys,
  truncatedDate,
  unnest,
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

export interface AssetStatsOptions {
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

export interface LivePhotoSearchOptions {
  ownerId: string;
  libraryId?: string | null;
  livePhotoCID: string;
  otherAssetId: string;
  type: AssetType;
}

export enum WithProperty {
  SIDECAR = 'sidecar',
}

export enum TimeBucketSize {
  DAY = 'DAY',
  MONTH = 'MONTH',
}

export interface AssetBuilderOptions {
  isArchived?: boolean;
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
}

export interface TimeBucketOptions extends AssetBuilderOptions {
  size: TimeBucketSize;
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

export interface AssetExploreFieldOptions {
  maxFields: number;
  minAssetsPerField: number;
}

export interface AssetFullSyncOptions {
  ownerId: string;
  lastId?: string;
  updatedUntil: Date;
  limit: number;
}

export interface AssetDeltaSyncOptions {
  userIds: string[];
  updatedAfter: Date;
  limit: number;
}

export interface AssetUpdateDuplicateOptions {
  targetDuplicateId: string | null;
  assetIds: string[];
  duplicateIds: string[];
}

export interface UpsertFileOptions {
  assetId: string;
  type: AssetFileType;
  path: string;
}

export interface AssetGetByChecksumOptions {
  ownerId: string;
  checksum: Buffer;
  libraryId?: string;
}

export interface GetByIdsRelations {
  exifInfo?: boolean;
  faces?: { person?: boolean; withDeleted?: boolean };
  files?: boolean;
  library?: boolean;
  owner?: boolean;
  smartSearch?: boolean;
  stack?: { assets?: boolean };
  tags?: boolean;
}

export interface DuplicateGroup {
  duplicateId: string;
  assets: MapAsset[];
}

export interface DayOfYearAssets {
  yearsAgo: number;
  assets: MapAsset[];
}

@Injectable()
export class AssetRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async upsertExif(exif: Insertable<Exif>): Promise<void> {
    const value = { ...exif, assetId: asUuid(exif.assetId) };
    await this.db
      .insertInto('exif')
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
  async updateAllExif(ids: string[], options: Updateable<Exif>): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    await this.db.updateTable('exif').set(options).where('assetId', 'in', ids).execute();
  }

  async upsertJobStatus(...jobStatus: Insertable<AssetJobStatus>[]): Promise<void> {
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

  create(asset: Insertable<Assets>) {
    return this.db.insertInto('assets').values(asset).returningAll().executeTakeFirstOrThrow();
  }

  createAll(assets: Insertable<Assets>[]) {
    return this.db.insertInto('assets').values(assets).returningAll().execute();
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
                    sql`(select date_part('year', min(("localDateTime" at time zone 'UTC')::date))::int from assets)`,
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
                .selectFrom('assets')
                .selectAll('assets')
                .innerJoin('asset_job_status', 'assets.id', 'asset_job_status.assetId')
                .where('asset_job_status.previewAt', 'is not', null)
                .where(sql`(assets."localDateTime" at time zone 'UTC')::date`, '=', sql`today.date`)
                .where('assets.ownerId', '=', anyUuid(ownerIds))
                .where('assets.isVisible', '=', true)
                .where('assets.isArchived', '=', false)
                .where((eb) =>
                  eb.exists((qb) =>
                    qb
                      .selectFrom('asset_files')
                      .whereRef('assetId', '=', 'assets.id')
                      .where('asset_files.type', '=', AssetFileType.PREVIEW),
                  ),
                )
                .where('assets.deletedAt', 'is', null)
                .orderBy(sql`(assets."localDateTime" at time zone 'UTC')::date`, 'desc')
                .limit(20)
                .as('a'),
            (join) => join.onTrue(),
          )
          .innerJoin('exif', 'a.id', 'exif.assetId')
          .selectAll('a')
          .select((eb) => eb.fn.toJson(eb.table('exif')).as('exifInfo')),
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
    return this.db.selectFrom('assets').selectAll('assets').where('assets.id', '=', anyUuid(ids)).execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIdsWithAllRelationsButStacks(ids: string[]) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .select(withFacesAndPeople)
      .select(withTags)
      .$call(withExif)
      .leftJoin('asset_stack', 'asset_stack.id', 'assets.stackId')
      .where('assets.id', '=', anyUuid(ids))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAll(ownerId: string): Promise<void> {
    await this.db.deleteFrom('assets').where('ownerId', '=', ownerId).execute();
  }

  async getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]> {
    const assets = await this.db
      .selectFrom('assets')
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
      .selectFrom('assets')
      .selectAll('assets')
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
      .selectFrom('assets')
      .select(['deviceAssetId'])
      .where('ownerId', '=', asUuid(ownerId))
      .where('deviceId', '=', deviceId)
      .where('isVisible', '=', true)
      .where('deletedAt', 'is', null)
      .execute();

    return items.map((asset) => asset.deviceAssetId);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getLivePhotoCount(motionId: string): Promise<number> {
    const [{ count }] = await this.db
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('livePhotoVideoId', '=', asUuid(motionId))
      .execute();
    return count;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string, { exifInfo, faces, files, library, owner, smartSearch, stack, tags }: GetByIdsRelations = {}) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('assets.id', '=', asUuid(id))
      .$if(!!exifInfo, withExif)
      .$if(!!faces, (qb) => qb.select(faces?.person ? withFacesAndPeople : withFaces).$narrowType<{ faces: NotNull }>())
      .$if(!!library, (qb) => qb.select(withLibrary))
      .$if(!!owner, (qb) => qb.select(withOwner))
      .$if(!!smartSearch, withSmartSearch)
      .$if(!!stack, (qb) =>
        qb
          .leftJoin('asset_stack', 'asset_stack.id', 'assets.stackId')
          .$if(!stack!.assets, (qb) =>
            qb.select((eb) => eb.fn.toJson(eb.table('asset_stack')).$castTo<Stack | null>().as('stack')),
          )
          .$if(!!stack!.assets, (qb) =>
            qb
              .leftJoinLateral(
                (eb) =>
                  eb
                    .selectFrom('assets as stacked')
                    .selectAll('asset_stack')
                    .select((eb) => eb.fn('array_agg', [eb.table('stacked')]).as('assets'))
                    .whereRef('stacked.stackId', '=', 'asset_stack.id')
                    .whereRef('stacked.id', '!=', 'asset_stack.primaryAssetId')
                    .where('stacked.deletedAt', 'is', null)
                    .where('stacked.isArchived', '=', false)
                    .groupBy('asset_stack.id')
                    .as('stacked_assets'),
                (join) => join.on('asset_stack.id', 'is not', null),
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
  async updateAll(ids: string[], options: Updateable<Assets>): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.db.updateTable('assets').set(options).where('id', '=', anyUuid(ids)).execute();
  }

  async updateByLibraryId(libraryId: string, options: Updateable<Assets>): Promise<void> {
    await this.db.updateTable('assets').set(options).where('libraryId', '=', asUuid(libraryId)).execute();
  }

  @GenerateSql({
    params: [{ targetDuplicateId: DummyValue.UUID, duplicateIds: [DummyValue.UUID], assetIds: [DummyValue.UUID] }],
  })
  async updateDuplicates(options: AssetUpdateDuplicateOptions): Promise<void> {
    await this.db
      .updateTable('assets')
      .set({ duplicateId: options.targetDuplicateId })
      .where((eb) =>
        eb.or([eb('duplicateId', '=', anyUuid(options.duplicateIds)), eb('id', '=', anyUuid(options.assetIds))]),
      )
      .execute();
  }

  async update(asset: Updateable<Assets> & { id: string }) {
    const value = omitBy(asset, isUndefined);
    delete value.id;
    if (!isEmpty(value)) {
      return this.db
        .with('assets', (qb) => qb.updateTable('assets').set(asset).where('id', '=', asUuid(asset.id)).returningAll())
        .selectFrom('assets')
        .selectAll('assets')
        .$call(withExif)
        .$call((qb) => qb.select(withFacesAndPeople))
        .executeTakeFirst();
    }

    return this.getById(asset.id, { exifInfo: true, faces: { person: true } });
  }

  async remove(asset: { id: string }): Promise<void> {
    await this.db.deleteFrom('assets').where('id', '=', asUuid(asset.id)).execute();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, libraryId: DummyValue.UUID, checksum: DummyValue.BUFFER }] })
  getByChecksum({ ownerId, libraryId, checksum }: AssetGetByChecksumOptions) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('ownerId', '=', asUuid(ownerId))
      .where('checksum', '=', checksum)
      .$call((qb) => (libraryId ? qb.where('libraryId', '=', asUuid(libraryId)) : qb.where('libraryId', 'is', null)))
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.BUFFER]] })
  getByChecksums(userId: string, checksums: Buffer[]) {
    return this.db
      .selectFrom('assets')
      .select(['id', 'checksum', 'deletedAt'])
      .where('ownerId', '=', asUuid(userId))
      .where('checksum', 'in', checksums)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  async getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined> {
    const asset = await this.db
      .selectFrom('assets')
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
      .selectFrom('assets')
      .select(['assets.id', 'assets.ownerId'])
      .innerJoin('exif', 'assets.id', 'exif.assetId')
      .where('id', '!=', asUuid(otherAssetId))
      .where('ownerId', '=', asUuid(ownerId))
      .where('type', '=', type)
      .where('exif.livePhotoCID', '=', livePhotoCID)
      .limit(1)
      .executeTakeFirst();
  }

  getStatistics(ownerId: string, { isArchived, isFavorite, isTrashed }: AssetStatsOptions): Promise<AssetStats> {
    return this.db
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.AUDIO).as(AssetType.AUDIO))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.IMAGE).as(AssetType.IMAGE))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.VIDEO).as(AssetType.VIDEO))
      .select((eb) => eb.fn.countAll<number>().filterWhere('type', '=', AssetType.OTHER).as(AssetType.OTHER))
      .where('ownerId', '=', asUuid(ownerId))
      .where('isVisible', '=', true)
      .$if(isArchived !== undefined, (qb) => qb.where('isArchived', '=', isArchived!))
      .$if(isFavorite !== undefined, (qb) => qb.where('isFavorite', '=', isFavorite!))
      .$if(!!isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
      .where('deletedAt', isTrashed ? 'is not' : 'is', null)
      .executeTakeFirstOrThrow();
  }

  getRandom(userIds: string[], take: number) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .where('ownerId', '=', anyUuid(userIds))
      .where('isVisible', '=', true)
      .where('deletedAt', 'is', null)
      .orderBy((eb) => eb.fn('random'))
      .limit(take)
      .execute();
  }

  @GenerateSql({ params: [{ size: TimeBucketSize.MONTH }] })
  async getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    return (
      this.db
        .with('assets', (qb) =>
          qb
            .selectFrom('assets')
            .select(truncatedDate<Date>(options.size).as('timeBucket'))
            .$if(!!options.isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
            .where('assets.deletedAt', options.isTrashed ? 'is not' : 'is', null)
            .where('assets.isVisible', '=', true)
            .$if(!!options.albumId, (qb) =>
              qb
                .innerJoin('albums_assets_assets', 'assets.id', 'albums_assets_assets.assetsId')
                .where('albums_assets_assets.albumsId', '=', asUuid(options.albumId!)),
            )
            .$if(!!options.personId, (qb) => hasPeople(qb, [options.personId!]))
            .$if(!!options.withStacked, (qb) =>
              qb
                .leftJoin('asset_stack', (join) =>
                  join
                    .onRef('asset_stack.id', '=', 'assets.stackId')
                    .onRef('asset_stack.primaryAssetId', '=', 'assets.id'),
                )
                .where((eb) => eb.or([eb('assets.stackId', 'is', null), eb(eb.table('asset_stack'), 'is not', null)])),
            )
            .$if(!!options.userIds, (qb) => qb.where('assets.ownerId', '=', anyUuid(options.userIds!)))
            .$if(options.isArchived !== undefined, (qb) => qb.where('assets.isArchived', '=', options.isArchived!))
            .$if(options.isFavorite !== undefined, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite!))
            .$if(!!options.assetType, (qb) => qb.where('assets.type', '=', options.assetType!))
            .$if(options.isDuplicate !== undefined, (qb) =>
              qb.where('assets.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
            )
            .$if(!!options.tagId, (qb) => withTagId(qb, options.tagId!)),
        )
        .selectFrom('assets')
        .select('timeBucket')
        /*
        TODO: the above line outputs in ISO format, which bloats the response.
        The line below outputs in YYYY-MM-DD format, but needs a change in the web app to work.
          .select(sql<string>`"timeBucket"::date::text`.as('timeBucket'))
        */
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .groupBy('timeBucket')
        .orderBy('timeBucket', options.order ?? 'desc')
        .execute() as any as Promise<TimeBucketItem[]>
    );
  }

  @GenerateSql({ params: [DummyValue.TIME_BUCKET, { size: TimeBucketSize.MONTH, withStacked: true }] })
  async getTimeBucket(timeBucket: string, options: TimeBucketOptions) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .$if(!!options.albumId, (qb) =>
        qb
          .innerJoin('albums_assets_assets', 'albums_assets_assets.assetsId', 'assets.id')
          .where('albums_assets_assets.albumsId', '=', options.albumId!),
      )
      .$if(!!options.personId, (qb) => hasPeople(qb, [options.personId!]))
      .$if(!!options.userIds, (qb) => qb.where('assets.ownerId', '=', anyUuid(options.userIds!)))
      .$if(options.isArchived !== undefined, (qb) => qb.where('assets.isArchived', '=', options.isArchived!))
      .$if(options.isFavorite !== undefined, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite!))
      .$if(!!options.withStacked, (qb) =>
        qb
          .leftJoin('asset_stack', 'asset_stack.id', 'assets.stackId')
          .where((eb) =>
            eb.or([eb('asset_stack.primaryAssetId', '=', eb.ref('assets.id')), eb('assets.stackId', 'is', null)]),
          )
          .leftJoinLateral(
            (eb) =>
              eb
                .selectFrom('assets as stacked')
                .selectAll('asset_stack')
                .select((eb) => eb.fn.count(eb.table('stacked')).as('assetCount'))
                .whereRef('stacked.stackId', '=', 'asset_stack.id')
                .where('stacked.deletedAt', 'is', null)
                .where('stacked.isArchived', '=', false)
                .groupBy('asset_stack.id')
                .as('stacked_assets'),
            (join) => join.on('asset_stack.id', 'is not', null),
          )
          .select((eb) => eb.fn.toJson(eb.table('stacked_assets').$castTo<Stack | null>()).as('stack')),
      )
      .$if(!!options.assetType, (qb) => qb.where('assets.type', '=', options.assetType!))
      .$if(options.isDuplicate !== undefined, (qb) =>
        qb.where('assets.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
      )
      .$if(!!options.isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
      .$if(!!options.tagId, (qb) => withTagId(qb, options.tagId!))
      .where('assets.deletedAt', options.isTrashed ? 'is not' : 'is', null)
      .where('assets.isVisible', '=', true)
      .where(truncatedDate(options.size), '=', timeBucket.replace(/^[+-]/, ''))
      .orderBy('assets.localDateTime', options.order ?? 'desc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getDuplicates(userId: string) {
    return (
      this.db
        .with('duplicates', (qb) =>
          qb
            .selectFrom('assets')
            .leftJoinLateral(
              (qb) =>
                qb
                  .selectFrom('exif')
                  .selectAll('assets')
                  .select((eb) => eb.table('exif').as('exifInfo'))
                  .whereRef('exif.assetId', '=', 'assets.id')
                  .as('asset'),
              (join) => join.onTrue(),
            )
            .select('assets.duplicateId')
            .select((eb) =>
              eb
                .fn('jsonb_agg', [eb.table('asset')])
                .$castTo<MapAsset[]>()
                .as('assets'),
            )
            .where('assets.ownerId', '=', asUuid(userId))
            .where('assets.duplicateId', 'is not', null)
            .$narrowType<{ duplicateId: NotNull }>()
            .where('assets.deletedAt', 'is', null)
            .where('assets.isVisible', '=', true)
            .where('assets.stackId', 'is', null)
            .groupBy('assets.duplicateId'),
        )
        .with('unique', (qb) =>
          qb
            .selectFrom('duplicates')
            .select('duplicateId')
            .where((eb) => eb(eb.fn('jsonb_array_length', ['assets']), '=', 1)),
        )
        .with('removed_unique', (qb) =>
          qb
            .updateTable('assets')
            .set({ duplicateId: null })
            .from('unique')
            .whereRef('assets.duplicateId', '=', 'unique.duplicateId'),
        )
        .selectFrom('duplicates')
        .selectAll()
        // TODO: compare with filtering by jsonb_array_length > 1
        .where(({ not, exists }) =>
          not(exists((eb) => eb.selectFrom('unique').whereRef('unique.duplicateId', '=', 'duplicates.duplicateId'))),
        )
        .execute()
    );
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByCity(ownerId: string, { minAssetsPerField, maxFields }: AssetExploreFieldOptions) {
    const items = await this.db
      .with('cities', (qb) =>
        qb
          .selectFrom('exif')
          .select('city')
          .where('city', 'is not', null)
          .groupBy('city')
          .having((eb) => eb.fn('count', [eb.ref('assetId')]), '>=', minAssetsPerField),
      )
      .selectFrom('assets')
      .innerJoin('exif', 'assets.id', 'exif.assetId')
      .innerJoin('cities', 'exif.city', 'cities.city')
      .distinctOn('exif.city')
      .select(['assetId as data', 'exif.city as value'])
      .$narrowType<{ value: NotNull }>()
      .where('ownerId', '=', asUuid(ownerId))
      .where('isVisible', '=', true)
      .where('isArchived', '=', false)
      .where('type', '=', AssetType.IMAGE)
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
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .leftJoin('asset_stack', 'asset_stack.id', 'assets.stackId')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('assets as stacked')
            .selectAll('asset_stack')
            .select((eb) => eb.fn.count(eb.table('stacked')).as('assetCount'))
            .whereRef('stacked.stackId', '=', 'asset_stack.id')
            .groupBy('asset_stack.id')
            .as('stacked_assets'),
        (join) => join.on('asset_stack.id', 'is not', null),
      )
      .select((eb) => eb.fn.toJson(eb.table('stacked_assets')).$castTo<Stack | null>().as('stack'))
      .where('assets.ownerId', '=', asUuid(ownerId))
      .where('assets.isVisible', '=', true)
      .where('assets.updatedAt', '<=', updatedUntil)
      .$if(!!lastId, (qb) => qb.where('assets.id', '>', lastId!))
      .orderBy('assets.id')
      .limit(limit)
      .execute();
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID], updatedAfter: DummyValue.DATE, limit: 100 }] })
  async getChangedDeltaSync(options: AssetDeltaSyncOptions) {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .leftJoin('asset_stack', 'asset_stack.id', 'assets.stackId')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('assets as stacked')
            .selectAll('asset_stack')
            .select((eb) => eb.fn.count(eb.table('stacked')).as('assetCount'))
            .whereRef('stacked.stackId', '=', 'asset_stack.id')
            .groupBy('asset_stack.id')
            .as('stacked_assets'),
        (join) => join.on('asset_stack.id', 'is not', null),
      )
      .select((eb) => eb.fn.toJson(eb.table('stacked_assets').$castTo<Stack | null>()).as('stack'))
      .where('assets.ownerId', '=', anyUuid(options.userIds))
      .where('assets.isVisible', '=', true)
      .where('assets.updatedAt', '>', options.updatedAfter)
      .limit(options.limit)
      .execute();
  }

  async upsertFile(file: Pick<Insertable<AssetFiles>, 'assetId' | 'path' | 'type'>): Promise<void> {
    const value = { ...file, assetId: asUuid(file.assetId) };
    await this.db
      .insertInto('asset_files')
      .values(value)
      .onConflict((oc) =>
        oc.columns(['assetId', 'type']).doUpdateSet((eb) => ({
          path: eb.ref('excluded.path'),
        })),
      )
      .execute();
  }

  async upsertFiles(files: Pick<Insertable<AssetFiles>, 'assetId' | 'path' | 'type'>[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const values = files.map((row) => ({ ...row, assetId: asUuid(row.assetId) }));
    await this.db
      .insertInto('asset_files')
      .values(values)
      .onConflict((oc) =>
        oc.columns(['assetId', 'type']).doUpdateSet((eb) => ({
          path: eb.ref('excluded.path'),
        })),
      )
      .execute();
  }

  async deleteFiles(files: Pick<Selectable<AssetFiles>, 'id'>[]): Promise<void> {
    if (files.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('asset_files')
      .where('id', '=', anyUuid(files.map((file) => file.id)))
      .execute();
  }

  @GenerateSql({
    params: [{ libraryId: DummyValue.UUID, importPaths: [DummyValue.STRING], exclusionPatterns: [DummyValue.STRING] }],
  })
  async detectOfflineExternalAssets(
    libraryId: string,
    importPaths: string[],
    exclusionPatterns: string[],
  ): Promise<UpdateResult> {
    const paths = importPaths.map((importPath) => `${importPath}%`);
    const exclusions = exclusionPatterns.map((pattern) => globToSqlPattern(pattern));

    return this.db
      .updateTable('assets')
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

  @GenerateSql({
    params: [{ libraryId: DummyValue.UUID, paths: [DummyValue.STRING] }],
  })
  async filterNewExternalAssetPaths(libraryId: string, paths: string[]): Promise<string[]> {
    const result = await this.db
      .selectFrom(unnest(paths).as('path'))
      .select('path')
      .where((eb) =>
        eb.not(
          eb.exists(
            this.db
              .selectFrom('assets')
              .select('originalPath')
              .whereRef('assets.originalPath', '=', eb.ref('path'))
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
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('libraryId', '=', asUuid(libraryId))
      .executeTakeFirstOrThrow();

    return count;
  }
}
