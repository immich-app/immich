import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Insertable, Kysely, Updateable, sql } from 'kysely';
import { isEmpty, isUndefined, omitBy } from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { ASSET_FILE_CONFLICT_KEYS, EXIF_CONFLICT_KEYS, JOB_STATUS_CONFLICT_KEYS } from 'src/constants';
import { AssetFiles, AssetJobStatus, Assets, DB, Exif } from 'src/db';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import {
  AssetEntity,
  hasPeople,
  hasPeopleCte,
  searchAssetBuilder,
  withAlbums,
  withExif,
  withFaces,
  withFacesAndPeople,
  withFiles,
  withLibrary,
  withOwner,
  withSmartSearch,
  withStack,
  withTags,
} from 'src/entities/asset.entity';
import { AssetFileType, AssetStatus, AssetType } from 'src/enum';
import {
  AssetDeltaSyncOptions,
  AssetExploreFieldOptions,
  AssetFullSyncOptions,
  AssetGetByChecksumOptions,
  AssetStats,
  AssetStatsOptions,
  AssetUpdateDuplicateOptions,
  DayOfYearAssets,
  DuplicateGroup,
  GetByIdsRelations,
  IAssetRepository,
  LivePhotoSearchOptions,
  MonthDay,
  TimeBucketItem,
  TimeBucketOptions,
  TimeBucketSize,
  WithProperty,
  WithoutProperty,
} from 'src/interfaces/asset.interface';
import { MapMarker, MapMarkerSearchOptions } from 'src/interfaces/map.interface';
import { AssetSearchOptions, SearchExploreItem, SearchExploreItemSet } from 'src/interfaces/search.interface';
import { anyUuid, asUuid, introspectTables, mapUpsertColumns } from 'src/utils/database';
import { Paginated, PaginationOptions, paginationHelper } from 'src/utils/pagination';
import { DataSource } from 'typeorm';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    introspectTables(this.dataSource, 'exif', 'asset_job_status', 'asset_files');
  }

  async upsertExif(exif: Insertable<Exif>): Promise<void> {
    const value = { ...exif, assetId: asUuid(exif.assetId) };
    await this.db
      .insertInto('exif')
      .values(value)
      .onConflict((oc) =>
        oc.columns(EXIF_CONFLICT_KEYS).doUpdateSet(() => mapUpsertColumns('exif', value, EXIF_CONFLICT_KEYS)),
      )
      .execute();
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
        oc
          .columns(JOB_STATUS_CONFLICT_KEYS)
          .doUpdateSet(() => mapUpsertColumns('asset_job_status', values[0], JOB_STATUS_CONFLICT_KEYS)),
      )
      .execute();
  }

  create(asset: Insertable<Assets>): Promise<AssetEntity> {
    return this.db.insertInto('assets').values(asset).returningAll().executeTakeFirst() as any as Promise<AssetEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID, { day: 1, month: 1 }] })
  getByDayOfYear(ownerIds: string[], { day, month }: MonthDay): Promise<DayOfYearAssets[]> {
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
                .limit(10)
                .as('a'),
            (join) => join.onTrue(),
          )
          .innerJoin('exif', 'a.id', 'exif.assetId')
          .selectAll('a')
          .select((eb) => eb.fn('to_jsonb', [eb.table('exif')]).as('exifInfo')),
      )
      .selectFrom('res')
      .select(
        sql<number>`((now() at time zone 'UTC')::date - ("localDateTime" at time zone 'UTC')::date) / 365`.as(
          'yearsAgo',
        ),
      )
      .select((eb) => eb.fn('jsonb_agg', [eb.table('res')]).as('assets'))
      .groupBy(sql`("localDateTime" at time zone 'UTC')::date`)
      .orderBy(sql`("localDateTime" at time zone 'UTC')::date`, 'desc')
      .limit(10)
      .execute() as any as Promise<DayOfYearAssets[]>;
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getByIds(
    ids: string[],
    { exifInfo, faces, files, library, owner, smartSearch, stack, tags }: GetByIdsRelations = {},
  ): Promise<AssetEntity[]> {
    const res = await this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('assets.id', '=', anyUuid(ids))
      .$if(!!exifInfo, withExif)
      .$if(!!faces, (qb) => qb.select(faces?.person ? withFacesAndPeople : withFaces))
      .$if(!!files, (qb) => qb.select(withFiles))
      .$if(!!library, (qb) => qb.select(withLibrary))
      .$if(!!owner, (qb) => qb.select(withOwner))
      .$if(!!smartSearch, (qb) => withSmartSearch(qb))
      .$if(!!stack, (qb) => withStack(qb, { assets: stack!.assets }))
      .$if(!!tags, (qb) => qb.select(withTags))
      .execute();

    return res as any as AssetEntity[];
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .select(withFacesAndPeople)
      .select(withTags)
      .$call(withExif)
      .$call((qb) => withStack(qb, { assets: true }))
      .where('assets.id', '=', anyUuid(ids))
      .execute() as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAll(ownerId: string): Promise<void> {
    await this.db.deleteFrom('assets').where('ownerId', '=', ownerId).execute();
  }

  async getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity> {
    const items = await withAlbums(this.db.selectFrom('assets'), { albumId })
      .selectAll('assets')
      .where('deletedAt', 'is', null)
      .orderBy('fileCreatedAt', 'desc')
      .execute();

    return paginationHelper(items as any as AssetEntity[], pagination.take);
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

  getByUserId(
    pagination: PaginationOptions,
    userId: string,
    options: Omit<AssetSearchOptions, 'userIds'> = {},
  ): Paginated<AssetEntity> {
    return this.getAll(pagination, { ...options, userIds: [userId] });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | undefined> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('libraryId', '=', asUuid(libraryId))
      .where('originalPath', '=', originalPath)
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetEntity | undefined>;
  }

  async getAll(
    pagination: PaginationOptions,
    { orderDirection, ...options }: AssetSearchOptions = {},
  ): Paginated<AssetEntity> {
    const builder = searchAssetBuilder(this.db, options)
      .select(withFiles)
      .orderBy('assets.createdAt', orderDirection ?? 'asc')
      .limit(pagination.take + 1)
      .offset(pagination.skip ?? 0);
    const items = await builder.execute();
    return paginationHelper(items as any as AssetEntity[], pagination.take);
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
      .select((eb) => eb.fn.countAll().as('count'))
      .where('livePhotoVideoId', '=', asUuid(motionId))
      .execute();
    return count as number;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(
    id: string,
    { exifInfo, faces, files, library, owner, smartSearch, stack, tags }: GetByIdsRelations = {},
  ): Promise<AssetEntity | undefined> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('assets.id', '=', asUuid(id))
      .$if(!!exifInfo, withExif)
      .$if(!!faces, (qb) => qb.select(faces?.person ? withFacesAndPeople : withFaces))
      .$if(!!library, (qb) => qb.select(withLibrary))
      .$if(!!owner, (qb) => qb.select(withOwner))
      .$if(!!smartSearch, withSmartSearch)
      .$if(!!stack, (qb) => withStack(qb, { assets: stack!.assets }))
      .$if(!!files, (qb) => qb.select(withFiles))
      .$if(!!tags, (qb) => qb.select(withTags))
      .limit(1)
      .executeTakeFirst() as any as Promise<AssetEntity | undefined>;
  }

  @GenerateSql({ params: [[DummyValue.UUID], { deviceId: DummyValue.STRING }] })
  @Chunked()
  async updateAll(ids: string[], options: Updateable<Assets>): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    await this.db.updateTable('assets').set(options).where('id', '=', anyUuid(ids)).execute();
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

  async update(asset: Updateable<Assets> & { id: string }): Promise<AssetEntity> {
    const value = omitBy(asset, isUndefined);
    delete value.id;
    if (!isEmpty(value)) {
      return this.db
        .with('assets', (qb) => qb.updateTable('assets').set(asset).where('id', '=', asUuid(asset.id)).returningAll())
        .selectFrom('assets')
        .selectAll('assets')
        .$call(withExif)
        .$call((qb) => qb.select(withFacesAndPeople))
        .executeTakeFirst() as Promise<AssetEntity>;
    }

    return this.getById(asset.id, { exifInfo: true, faces: { person: true } }) as Promise<AssetEntity>;
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.db.deleteFrom('assets').where('id', '=', asUuid(asset.id)).execute();
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, libraryId: DummyValue.UUID, checksum: DummyValue.BUFFER }] })
  getByChecksum({ ownerId, libraryId, checksum }: AssetGetByChecksumOptions): Promise<AssetEntity | undefined> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .where('ownerId', '=', asUuid(ownerId))
      .where('checksum', '=', checksum)
      .$call((qb) => (libraryId ? qb.where('libraryId', '=', asUuid(libraryId)) : qb.where('libraryId', 'is', null)))
      .limit(1)
      .executeTakeFirst() as Promise<AssetEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.BUFFER]] })
  getByChecksums(userId: string, checksums: Buffer[]): Promise<AssetEntity[]> {
    return this.db
      .selectFrom('assets')
      .select(['id', 'checksum', 'deletedAt'])
      .where('ownerId', '=', asUuid(userId))
      .where('checksum', 'in', checksums)
      .execute() as any as Promise<AssetEntity[]>;
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

  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | undefined> {
    const { ownerId, otherAssetId, livePhotoCID, type } = options;

    return this.db
      .selectFrom('assets')
      .innerJoin('exif', 'assets.id', 'exif.assetId')
      .where('id', '!=', asUuid(otherAssetId))
      .where('ownerId', '=', asUuid(ownerId))
      .where('type', '=', type)
      .where('exif.livePhotoCID', '=', livePhotoCID)
      .limit(1)
      .executeTakeFirst() as Promise<AssetEntity | undefined>;
  }

  @GenerateSql(
    ...Object.values(WithProperty).map((property) => ({
      name: property,
      params: [DummyValue.PAGINATION, property],
    })),
  )
  async getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    const items = await this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$if(property === WithoutProperty.DUPLICATE, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'assets.id', 'job_status.assetId')
          .where('job_status.duplicatesDetectedAt', 'is', null)
          .where('job_status.previewAt', 'is not', null)
          .where((eb) => eb.exists(eb.selectFrom('smart_search').where('assetId', '=', eb.ref('assets.id'))))
          .where('assets.isVisible', '=', true),
      )
      .$if(property === WithoutProperty.ENCODED_VIDEO, (qb) =>
        qb
          .where('assets.type', '=', AssetType.VIDEO)
          .where((eb) => eb.or([eb('assets.encodedVideoPath', 'is', null), eb('assets.encodedVideoPath', '=', '')])),
      )
      .$if(property === WithoutProperty.EXIF, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'assets.id', 'job_status.assetId')
          .where('job_status.metadataExtractedAt', 'is', null)
          .where('assets.isVisible', '=', true),
      )
      .$if(property === WithoutProperty.FACES, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'assetId', 'assets.id')
          .where('job_status.previewAt', 'is not', null)
          .where('job_status.facesRecognizedAt', 'is', null)
          .where('assets.isVisible', '=', true),
      )
      .$if(property === WithoutProperty.SIDECAR, (qb) =>
        qb
          .where((eb) => eb.or([eb('assets.sidecarPath', '=', ''), eb('assets.sidecarPath', 'is', null)]))
          .where('assets.isVisible', '=', true),
      )
      .$if(property === WithoutProperty.SMART_SEARCH, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'assetId', 'assets.id')
          .where('job_status.previewAt', 'is not', null)
          .where('assets.isVisible', '=', true)
          .where((eb) =>
            eb.not((eb) => eb.exists(eb.selectFrom('smart_search').whereRef('assetId', '=', 'assets.id'))),
          ),
      )
      .$if(property === WithoutProperty.THUMBNAIL, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'assetId', 'assets.id')
          .select(withFiles)
          .where('assets.isVisible', '=', true)
          .where((eb) =>
            eb.or([
              eb('job_status.previewAt', 'is', null),
              eb('job_status.thumbnailAt', 'is', null),
              eb('assets.thumbhash', 'is', null),
            ]),
          ),
      )
      .where('deletedAt', 'is', null)
      .limit(pagination.take + 1)
      .offset(pagination.skip ?? 0)
      .orderBy('createdAt', 'asc')
      .execute();

    return paginationHelper(items as any as AssetEntity[], pagination.take);
  }

  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | undefined> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .innerJoin('albums_assets_assets', 'assets.id', 'albums_assets_assets.assetsId')
      .where('albums_assets_assets.albumsId', '=', asUuid(albumId))
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .executeTakeFirst() as Promise<AssetEntity | undefined>;
  }

  getMapMarkers(ownerIds: string[], options: MapMarkerSearchOptions = {}): Promise<MapMarker[]> {
    const { isArchived, isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

    return this.db
      .selectFrom('assets')
      .leftJoin('exif', 'assets.id', 'exif.assetId')
      .select(['id', 'latitude as lat', 'longitude as lon', 'city', 'state', 'country'])
      .where('ownerId', '=', anyUuid(ownerIds))
      .where('latitude', 'is not', null)
      .where('longitude', 'is not', null)
      .where('isVisible', '=', true)
      .where('deletedAt', 'is', null)
      .$if(!!isArchived, (qb) => qb.where('isArchived', '=', isArchived!))
      .$if(!!isFavorite, (qb) => qb.where('isFavorite', '=', isFavorite!))
      .$if(!!fileCreatedAfter, (qb) => qb.where('fileCreatedAt', '>=', fileCreatedAfter!))
      .$if(!!fileCreatedBefore, (qb) => qb.where('fileCreatedAt', '<=', fileCreatedBefore!))
      .orderBy('fileCreatedAt', 'desc')
      .execute() as Promise<MapMarker[]>;
  }

  getStatistics(ownerId: string, { isArchived, isFavorite, isTrashed }: AssetStatsOptions): Promise<AssetStats> {
    return this.db
      .selectFrom('assets')
      .select((eb) => eb.fn.countAll().filterWhere('type', '=', AssetType.AUDIO).as(AssetType.AUDIO))
      .select((eb) => eb.fn.countAll().filterWhere('type', '=', AssetType.IMAGE).as(AssetType.IMAGE))
      .select((eb) => eb.fn.countAll().filterWhere('type', '=', AssetType.VIDEO).as(AssetType.VIDEO))
      .select((eb) => eb.fn.countAll().filterWhere('type', '=', AssetType.OTHER).as(AssetType.OTHER))
      .where('ownerId', '=', asUuid(ownerId))
      .where('isVisible', '=', true)
      .$if(isArchived !== undefined, (qb) => qb.where('isArchived', '=', isArchived!))
      .$if(isFavorite !== undefined, (qb) => qb.where('isFavorite', '=', isFavorite!))
      .$if(!!isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
      .where('deletedAt', isTrashed ? 'is not' : 'is', null)
      .executeTakeFirst() as Promise<AssetStats>;
  }

  getRandom(userIds: string[], take: number): Promise<AssetEntity[]> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .$call(withExif)
      .where('ownerId', '=', anyUuid(userIds))
      .where('isVisible', '=', true)
      .where('deletedAt', 'is', null)
      .orderBy((eb) => eb.fn('random'))
      .limit(take)
      .execute() as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [{ size: TimeBucketSize.MONTH }] })
  async getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    return (
      ((options.personId ? hasPeopleCte(this.db, [options.personId]) : this.db) as Kysely<DB>)
        .with('assets', (qb) =>
          qb
            .selectFrom('assets')
            .select((eb) =>
              eb
                .fn<Date>('date_trunc', [eb.val(options.size), sql`"localDateTime" at time zone 'UTC'`])
                .as('timeBucket'),
            )
            .$if(!!options.isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
            .where('assets.deletedAt', options.isTrashed ? 'is not' : 'is', null)
            .where('assets.isVisible', '=', true)
            .$if(!!options.albumId, (qb) =>
              qb
                .innerJoin('albums_assets_assets', 'assets.id', 'albums_assets_assets.assetsId')
                .where('albums_assets_assets.albumsId', '=', asUuid(options.albumId!)),
            )
            .$if(!!options.personId, (qb) =>
              qb.innerJoin(sql.table('has_people').as('has_people'), (join) =>
                join.onRef(sql`has_people."assetId"`, '=', 'assets.id'),
              ),
            )
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
            .$if(!!options.isArchived, (qb) => qb.where('assets.isArchived', '=', options.isArchived!))
            .$if(!!options.isFavorite, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite!))
            .$if(!!options.assetType, (qb) => qb.where('assets.type', '=', options.assetType!))
            .$if(!!options.isDuplicate, (qb) =>
              qb.where('assets.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
            ),
        )
        .selectFrom('assets')
        .select('timeBucket')
        /*
        TODO: the above line outputs in ISO format, which bloats the response.
        The line below outputs in YYYY-MM-DD format, but needs a change in the web app to work.
          .select(sql<string>`"timeBucket"::date::text`.as('timeBucket'))
        */
        .select((eb) => eb.fn.countAll().as('count'))
        .groupBy('timeBucket')
        .orderBy('timeBucket', 'desc')
        .execute() as any as Promise<TimeBucketItem[]>
    );
  }

  @GenerateSql({ params: [DummyValue.TIME_BUCKET, { size: TimeBucketSize.MONTH }] })
  async getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]> {
    return hasPeople(this.db, options.personId ? [options.personId] : undefined)
      .selectAll('assets')
      .$call(withExif)
      .$if(!!options.albumId, (qb) => withAlbums(qb, { albumId: options.albumId }))
      .$if(!!options.userIds, (qb) => qb.where('assets.ownerId', '=', anyUuid(options.userIds!)))
      .$if(options.isArchived !== undefined, (qb) => qb.where('assets.isArchived', '=', options.isArchived!))
      .$if(options.isFavorite !== undefined, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite!))
      .$if(!!options.withStacked, (qb) => withStack(qb, { assets: true })) // TODO: optimize this; it's a huge performance hit
      .$if(!!options.assetType, (qb) => qb.where('assets.type', '=', options.assetType!))
      .$if(options.isDuplicate !== undefined, (qb) =>
        qb.where('assets.duplicateId', options.isDuplicate ? 'is not' : 'is', null),
      )
      .$if(!!options.isTrashed, (qb) => qb.where('assets.status', '!=', AssetStatus.DELETED))
      .where('assets.deletedAt', options.isTrashed ? 'is not' : 'is', null)
      .where('assets.isVisible', '=', true)
      .where(
        (eb) => eb.fn('date_trunc', [eb.val(options.size), sql`assets."localDateTime" at time zone 'UTC'`]),
        '=',
        timeBucket.replace(/^[+-]/, ''),
      )
      .orderBy('assets.localDateTime', 'desc')
      .execute() as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getDuplicates(userId: string): Promise<DuplicateGroup[]> {
    return (
      this.db
        .with('duplicates', (qb) =>
          qb
            .selectFrom('assets')
            .select('duplicateId')
            .select((eb) => eb.fn<Assets[]>('jsonb_agg', [eb.table('assets')]).as('assets'))
            .where('ownerId', '=', asUuid(userId))
            .where('duplicateId', 'is not', null)
            .where('deletedAt', 'is', null)
            .where('isVisible', '=', true)
            .groupBy('duplicateId'),
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
        .execute() as any as Promise<DuplicateGroup[]>
    );
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByCity(
    ownerId: string,
    { minAssetsPerField, maxFields }: AssetExploreFieldOptions,
  ): Promise<SearchExploreItem<string>> {
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
      .where('ownerId', '=', asUuid(ownerId))
      .where('isVisible', '=', true)
      .where('isArchived', '=', false)
      .where('type', '=', AssetType.IMAGE)
      .where('deletedAt', 'is', null)
      .limit(maxFields)
      .execute();

    return { fieldName: 'exifInfo.city', items: items as SearchExploreItemSet<string> };
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
  getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]> {
    const { ownerId, lastId, updatedUntil, limit } = options;
    return this.db
      .selectFrom('assets')
      .where('ownerId', '=', asUuid(ownerId))
      .where('isVisible', '=', true)
      .where('updatedAt', '<=', updatedUntil)
      .$if(!!lastId, (qb) => qb.where('id', '>', lastId!))
      .orderBy('id', 'asc')
      .limit(limit)
      .execute() as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID], updatedAfter: DummyValue.DATE, limit: 100 }] })
  async getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]> {
    return this.db
      .selectFrom('assets')
      .selectAll('assets')
      .select((eb) =>
        eb
          .selectFrom('asset_stack')
          .select((eb) => eb.fn.countAll().as('stackedAssetsCount'))
          .whereRef('asset_stack.id', '=', 'assets.stackId')
          .as('stackedAssetsCount'),
      )
      .where('ownerId', '=', anyUuid(options.userIds))
      .where('isVisible', '=', true)
      .where('updatedAt', '>', options.updatedAfter)
      .limit(options.limit)
      .execute() as any as Promise<AssetEntity[]>;
  }

  async upsertFile(file: Pick<Insertable<AssetFiles>, 'assetId' | 'path' | 'type'>): Promise<void> {
    const value = { ...file, assetId: asUuid(file.assetId) };
    await this.db
      .insertInto('asset_files')
      .values(value)
      .onConflict((oc) =>
        oc
          .columns(ASSET_FILE_CONFLICT_KEYS)
          .doUpdateSet(() => mapUpsertColumns('asset_files', value, ASSET_FILE_CONFLICT_KEYS)),
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
        oc
          .columns(ASSET_FILE_CONFLICT_KEYS)
          .doUpdateSet(() => mapUpsertColumns('asset_files', values[0], ASSET_FILE_CONFLICT_KEYS)),
      )
      .execute();
  }
}
