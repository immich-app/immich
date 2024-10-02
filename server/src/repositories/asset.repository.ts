import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { SmartInfoEntity } from 'src/entities/smart-info.entity';
import { AssetFileType, AssetOrder, AssetStatus, AssetType, PaginationMode } from 'src/enum';
import {
  AssetBuilderOptions,
  AssetCreate,
  AssetDeltaSyncOptions,
  AssetExploreFieldOptions,
  AssetFullSyncOptions,
  AssetStats,
  AssetStatsOptions,
  AssetUpdateAllOptions,
  AssetUpdateDuplicateOptions,
  AssetUpdateOptions,
  IAssetRepository,
  LivePhotoSearchOptions,
  MonthDay,
  TimeBucketItem,
  TimeBucketOptions,
  TimeBucketSize,
  WithProperty,
  WithoutProperty,
} from 'src/interfaces/asset.interface';
import { AssetSearchOptions, SearchExploreItem } from 'src/interfaces/search.interface';
import { searchAssetBuilder } from 'src/utils/database';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, PaginationOptions, paginate, paginatedBuilder } from 'src/utils/pagination';
import {
  Brackets,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  MoreThan,
  Not,
  Repository,
} from 'typeorm';

const truncateMap: Record<TimeBucketSize, string> = {
  [TimeBucketSize.DAY]: 'day',
  [TimeBucketSize.MONTH]: 'month',
};

const dateTrunc = (options: TimeBucketOptions) =>
  `(date_trunc('${
    truncateMap[options.size]
  }', (asset."localDateTime" at time zone 'UTC')) at time zone 'UTC')::timestamptz`;

@Instrumentation()
@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private repository: Repository<AssetEntity>,
    @InjectRepository(AssetFileEntity) private fileRepository: Repository<AssetFileEntity>,
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
    @InjectRepository(AssetJobStatusEntity) private jobStatusRepository: Repository<AssetJobStatusEntity>,
    @InjectRepository(SmartInfoEntity) private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  async upsertExif(exif: Partial<ExifEntity>): Promise<void> {
    await this.exifRepository.upsert(exif, { conflictPaths: ['assetId'] });
  }

  async upsertJobStatus(...jobStatus: Partial<AssetJobStatusEntity>[]): Promise<void> {
    await this.jobStatusRepository.upsert(jobStatus, { conflictPaths: ['assetId'] });
  }

  create(asset: AssetCreate): Promise<AssetEntity> {
    return this.repository.save(asset);
  }

  @GenerateSql({ params: [[DummyValue.UUID], { day: 1, month: 1 }] })
  getByDayOfYear(ownerIds: string[], { day, month }: MonthDay): Promise<AssetEntity[]> {
    return this.repository
      .createQueryBuilder('entity')
      .where(
        `entity.ownerId IN (:...ownerIds)
      AND entity.isVisible = true
      AND entity.isArchived = false
      AND EXTRACT(DAY FROM entity.localDateTime AT TIME ZONE 'UTC') = :day
      AND EXTRACT(MONTH FROM entity.localDateTime AT TIME ZONE 'UTC') = :month`,
        {
          ownerIds,
          day,
          month,
        },
      )
      .leftJoinAndSelect('entity.exifInfo', 'exifInfo')
      .leftJoinAndSelect('entity.files', 'files')
      .orderBy('entity.localDateTime', 'ASC')
      .getMany();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIds(
    ids: string[],
    relations?: FindOptionsRelations<AssetEntity>,
    select?: FindOptionsSelect<AssetEntity>,
  ): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations,
      select,
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
        stack: {
          assets: true,
        },
        files: true,
      },
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAll(ownerId: string): Promise<void> {
    await this.repository.delete({ ownerId });
  }

  getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        albums: {
          id: albumId,
        },
      },
      relations: {
        albums: true,
        exifInfo: true,
      },
    });
  }

  async getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]> {
    const assets = await this.repository.find({
      select: { deviceAssetId: true },
      where: {
        deviceAssetId: In(deviceAssetIds),
        deviceId,
        ownerId,
      },
      withDeleted: true,
    });

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
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { library: { id: libraryId }, originalPath },
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.STRING]] })
  @ChunkedArray({ paramIndex: 1 })
  async getPathsNotInLibrary(libraryId: string, originalPaths: string[]): Promise<string[]> {
    const result = await this.repository.query(
      `
        WITH paths AS (SELECT unnest($2::text[]) AS path)
        SELECT path
        FROM paths
        WHERE NOT EXISTS (SELECT 1 FROM assets WHERE "libraryId" = $1 AND "originalPath" = path);
      `,
      [libraryId, originalPaths],
    );
    return result.map((row: { path: string }) => row.path);
  }

  getAll(pagination: PaginationOptions, options: AssetSearchOptions = {}): Paginated<AssetEntity> {
    let builder = this.repository.createQueryBuilder('asset').leftJoinAndSelect('asset.files', 'files');
    builder = searchAssetBuilder(builder, options);
    builder.orderBy('asset.createdAt', options.orderDirection ?? 'ASC');
    return paginatedBuilder<AssetEntity>(builder, {
      mode: PaginationMode.SKIP_TAKE,
      skip: pagination.skip,
      take: pagination.take,
    });
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
    const items = await this.repository.find({
      select: { deviceAssetId: true },
      where: {
        ownerId,
        deviceId,
        isVisible: true,
      },
      withDeleted: true,
    });

    return items.map((asset) => asset.deviceAssetId);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getLivePhotoCount(motionId: string): Promise<number> {
    return this.repository.count({
      where: {
        livePhotoVideoId: motionId,
      },
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(
    id: string,
    relations: FindOptionsRelations<AssetEntity>,
    order?: FindOptionsOrder<AssetEntity>,
  ): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations,
      // We are specifically asking for this asset. Return it even if it is soft deleted
      withDeleted: true,
      order,
    });
  }

  @GenerateSql({ params: [[DummyValue.UUID], { deviceId: DummyValue.STRING }] })
  @Chunked()
  async updateAll(ids: string[], options: AssetUpdateAllOptions): Promise<void> {
    await this.repository.update({ id: In(ids) }, options);
  }

  @GenerateSql({
    params: [{ targetDuplicateId: DummyValue.UUID, duplicateIds: [DummyValue.UUID], assetIds: [DummyValue.UUID] }],
  })
  async updateDuplicates(options: AssetUpdateDuplicateOptions): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      .set({ duplicateId: options.targetDuplicateId })
      .where({
        duplicateId: In(options.duplicateIds),
      })
      .orWhere({ id: In(options.assetIds) })
      .execute();
  }

  async update(asset: AssetUpdateOptions): Promise<void> {
    await this.repository.update(asset.id, asset);
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.repository.remove(asset);
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, libraryId: DummyValue.UUID, checksum: DummyValue.BUFFER }] })
  getByChecksum({
    ownerId,
    libraryId,
    checksum,
  }: {
    ownerId: string;
    checksum: Buffer;
    libraryId?: string;
  }): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: {
        ownerId,
        libraryId: libraryId || IsNull(),
        checksum,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  getByChecksums(ownerId: string, checksums: Buffer[]): Promise<AssetEntity[]> {
    return this.repository.find({
      select: {
        id: true,
        checksum: true,
        deletedAt: true,
      },
      where: {
        ownerId,
        checksum: In(checksums),
      },
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  async getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined> {
    const asset = await this.repository.findOne({
      select: { id: true },
      where: {
        ownerId,
        checksum,
        library: IsNull(),
      },
      withDeleted: true,
    });

    return asset?.id;
  }

  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null> {
    const { ownerId, libraryId, otherAssetId, livePhotoCID, type } = options;

    return this.repository.findOne({
      where: {
        id: Not(otherAssetId),
        ownerId,
        libraryId: libraryId || IsNull(),
        type,
        exifInfo: {
          livePhotoCID,
        },
      },
      relations: {
        exifInfo: true,
      },
    });
  }

  @GenerateSql(
    ...Object.values(WithProperty).map((property) => ({
      name: property,
      params: [DummyValue.PAGINATION, property],
    })),
  )
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    let relations: FindOptionsRelations<AssetEntity> = {};
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithoutProperty.THUMBNAIL: {
        relations = { jobStatus: true, files: true };
        where = [
          { jobStatus: { previewAt: IsNull() }, isVisible: true },
          { jobStatus: { thumbnailAt: IsNull() }, isVisible: true },
          { thumbhash: IsNull(), isVisible: true },
        ];
        break;
      }

      case WithoutProperty.ENCODED_VIDEO: {
        where = [
          { type: AssetType.VIDEO, encodedVideoPath: IsNull() },
          { type: AssetType.VIDEO, encodedVideoPath: '' },
        ];
        break;
      }

      case WithoutProperty.EXIF: {
        relations = {
          exifInfo: true,
          jobStatus: true,
        };
        where = {
          isVisible: true,
          jobStatus: {
            metadataExtractedAt: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.SMART_SEARCH: {
        relations = {
          smartSearch: true,
        };
        where = {
          isVisible: true,
          jobStatus: { previewAt: Not(IsNull()) },
          smartSearch: {
            embedding: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.DUPLICATE: {
        where = {
          isVisible: true,
          smartSearch: true,
          jobStatus: {
            previewAt: Not(IsNull()),
            duplicatesDetectedAt: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.OBJECT_TAGS: {
        relations = {
          smartInfo: true,
        };
        where = {
          jobStatus: {
            previewAt: Not(IsNull()),
          },
          isVisible: true,
          smartInfo: {
            tags: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.FACES: {
        relations = {
          faces: true,
          jobStatus: true,
        };
        where = {
          isVisible: true,
          faces: {
            assetId: IsNull(),
            personId: IsNull(),
          },
          jobStatus: {
            previewAt: Not(IsNull()),
            facesRecognizedAt: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.PERSON: {
        relations = {
          faces: true,
        };
        where = {
          jobStatus: {
            previewAt: Not(IsNull()),
          },
          isVisible: true,
          faces: {
            assetId: Not(IsNull()),
            personId: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.SIDECAR: {
        where = [
          { sidecarPath: IsNull(), isVisible: true },
          { sidecarPath: '', isVisible: true },
        ];
        break;
      }

      default: {
        throw new Error(`Invalid getWithout property: ${property}`);
      }
    }

    return paginate(this.repository, pagination, {
      relations,
      where,
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  getWith(
    pagination: PaginationOptions,
    property: WithProperty,
    libraryId?: string,
    withDeleted = false,
  ): Paginated<AssetEntity> {
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithProperty.SIDECAR: {
        where = [{ sidecarPath: Not(IsNull()), isVisible: true }];
        break;
      }

      default: {
        throw new Error(`Invalid getWith property: ${property}`);
      }
    }

    if (libraryId) {
      where = [{ ...where, libraryId }];
    }

    return paginate(this.repository, pagination, {
      where,
      withDeleted,
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { albums: { id: albumId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats> {
    const builder = this.repository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"ownerId" = :ownerId', { ownerId })
      .andWhere('asset.isVisible = true')
      .groupBy('asset.type');

    const { isArchived, isFavorite, isTrashed } = options;
    if (isArchived !== undefined) {
      builder.andWhere(`asset.isArchived = :isArchived`, { isArchived });
    }

    if (isFavorite !== undefined) {
      builder.andWhere(`asset.isFavorite = :isFavorite`, { isFavorite });
    }

    if (isTrashed !== undefined) {
      builder
        .withDeleted()
        .andWhere(`asset.deletedAt is not null`)
        .andWhere('asset.status = :status', { status: AssetStatus.TRASHED });
    }

    const items = await builder.getRawMany();

    const result: AssetStats = {
      [AssetType.AUDIO]: 0,
      [AssetType.IMAGE]: 0,
      [AssetType.VIDEO]: 0,
      [AssetType.OTHER]: 0,
    };

    for (const item of items) {
      result[item.type as AssetType] = Number(item.count) || 0;
    }

    return result;
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.NUMBER] })
  getRandom(userIds: string[], count: number): Promise<AssetEntity[]> {
    return this.getBuilder({ userIds, exifInfo: true }).orderBy('RANDOM()').limit(count).getMany();
  }

  @GenerateSql({ params: [{ size: TimeBucketSize.MONTH }] })
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    const truncated = dateTrunc(options);
    return this.getBuilder(options)
      .select(`COUNT(asset.id)::int`, 'count')
      .addSelect(truncated, 'timeBucket')
      .groupBy(truncated)
      .orderBy(truncated, options.order === AssetOrder.ASC ? 'ASC' : 'DESC')
      .getRawMany();
  }

  @GenerateSql({ params: [DummyValue.TIME_BUCKET, { size: TimeBucketSize.MONTH }] })
  getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]> {
    const truncated = dateTrunc(options);
    return (
      this.getBuilder(options)
        .andWhere(`${truncated} = :timeBucket`, { timeBucket: timeBucket.replace(/^[+-]/, '') })
        // First sort by the day in localtime (put it in the right bucket)
        .orderBy(truncated, 'DESC')
        // and then sort by the actual time
        .addOrderBy('asset.fileCreatedAt', options.order === AssetOrder.ASC ? 'ASC' : 'DESC')
        .getMany()
    );
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID, DummyValue.UUID] }] })
  getDuplicates(options: AssetBuilderOptions): Promise<AssetEntity[]> {
    return this.getBuilder({ ...options, isDuplicate: true })
      .orderBy('asset.duplicateId')
      .getMany();
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByCity(
    ownerId: string,
    { minAssetsPerField, maxFields }: AssetExploreFieldOptions,
  ): Promise<SearchExploreItem<string>> {
    const cte = this.exifRepository
      .createQueryBuilder('e')
      .select('city')
      .groupBy('city')
      .having('count(city) >= :minAssetsPerField', { minAssetsPerField });

    const items = await this.getBuilder({
      userIds: [ownerId],
      exifInfo: false,
      assetType: AssetType.IMAGE,
      isArchived: false,
    })
      .select('c.city', 'value')
      .addSelect('asset.id', 'data')
      .distinctOn(['c.city'])
      .innerJoin('exif', 'e', 'asset.id = e."assetId"')
      .addCommonTableExpression(cte, 'cities')
      .innerJoin('cities', 'c', 'c.city = e.city')
      .limit(maxFields)
      .getRawMany();

    return { fieldName: 'exifInfo.city', items };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByTag(
    ownerId: string,
    { minAssetsPerField, maxFields }: AssetExploreFieldOptions,
  ): Promise<SearchExploreItem<string>> {
    const cte = this.smartInfoRepository
      .createQueryBuilder('si')
      .select('unnest(tags)', 'tag')
      .groupBy('tag')
      .having('count(*) >= :minAssetsPerField', { minAssetsPerField });

    const items = await this.getBuilder({
      userIds: [ownerId],
      exifInfo: false,
      assetType: AssetType.IMAGE,
      isArchived: false,
    })
      .select('unnest(si.tags)', 'value')
      .addSelect('asset.id', 'data')
      .distinctOn(['unnest(si.tags)'])
      .innerJoin('smart_info', 'si', 'asset.id = si."assetId"')
      .addCommonTableExpression(cte, 'random_tags')
      .innerJoin('random_tags', 't', 'si.tags @> ARRAY[t.tag]')
      .limit(maxFields)
      .getRawMany();

    return { fieldName: 'smartInfo.tags', items };
  }

  private getBuilder(options: AssetBuilderOptions) {
    const builder = this.repository.createQueryBuilder('asset').where('asset.isVisible = true');

    if (options.assetType !== undefined) {
      builder.andWhere('asset.type = :assetType', { assetType: options.assetType });
    }

    if (options.tagId) {
      builder.innerJoin(
        'asset.tags',
        'asset_tags',
        'asset_tags.id IN (SELECT id_descendant FROM tags_closure WHERE id_ancestor = :tagId)',
        { tagId: options.tagId },
      );
    }

    let stackJoined = false;

    if (options.exifInfo !== false) {
      stackJoined = true;
      builder
        .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
        .leftJoinAndSelect('asset.stack', 'stack')
        .leftJoinAndSelect('stack.assets', 'stackedAssets');
    }

    if (options.albumId) {
      builder.leftJoin('asset.albums', 'album').andWhere('album.id = :albumId', { albumId: options.albumId });
    }

    if (options.userIds) {
      builder.andWhere('asset.ownerId IN (:...userIds )', { userIds: options.userIds });
    }

    if (options.isArchived !== undefined) {
      builder.andWhere('asset.isArchived = :isArchived', { isArchived: options.isArchived });
    }

    if (options.isFavorite !== undefined) {
      builder.andWhere('asset.isFavorite = :isFavorite', { isFavorite: options.isFavorite });
    }

    if (options.isTrashed !== undefined) {
      builder.andWhere(`asset.deletedAt ${options.isTrashed ? 'IS NOT NULL' : 'IS NULL'}`).withDeleted();

      if (options.isTrashed) {
        // TODO: Temporarily inverted to support showing offline assets in the trash queries.
        // Once offline assets are handled in a separate screen, this should be set back to status = TRASHED
        // and the offline screens should use a separate isOffline = true parameter in the timeline query.
        builder.andWhere('asset.status != :status', { status: AssetStatus.DELETED });
      }
    }

    if (options.isDuplicate !== undefined) {
      builder.andWhere(`asset.duplicateId ${options.isDuplicate ? 'IS NOT NULL' : 'IS NULL'}`);
    }

    if (options.personId !== undefined) {
      builder
        .innerJoin('asset.faces', 'faces')
        .innerJoin('faces.person', 'person')
        .andWhere('person.id = :personId', { personId: options.personId });
    }

    if (options.withStacked) {
      if (!stackJoined) {
        builder.leftJoinAndSelect('asset.stack', 'stack').leftJoinAndSelect('stack.assets', 'stackedAssets');
      }
      builder.andWhere(
        new Brackets((qb) => qb.where('stack.primaryAssetId = asset.id').orWhere('asset.stackId IS NULL')),
      );
    }

    return builder;
  }

  @GenerateSql({
    params: [
      {
        ownerId: DummyValue.UUID,
        lastCreationDate: DummyValue.DATE,
        lastId: DummyValue.UUID,
        updatedUntil: DummyValue.DATE,
        limit: 10,
      },
    ],
  })
  getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]> {
    const { ownerId, lastId, updatedUntil, limit } = options;
    const builder = this.getBuilder({
      userIds: [ownerId],
      exifInfo: false, // need to do this manually because `exifInfo: true` also loads stacked assets messing with `limit`
      withStacked: false, // return all assets individually as expected by the app
    })
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
      .leftJoinAndSelect('asset.stack', 'stack')
      .loadRelationCountAndMap('stack.assetCount', 'stack.assets', 'stackedAssetsCount');

    if (lastId !== undefined) {
      builder.andWhere('asset.id > :lastId', { lastId });
    }
    builder
      .andWhere('asset.updatedAt <= :updatedUntil', { updatedUntil })
      .orderBy('asset.id', 'ASC')
      .limit(limit) // cannot use `take` for performance reasons
      .withDeleted();
    return builder.getMany();
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID], updatedAfter: DummyValue.DATE }] })
  getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]> {
    const builder = this.getBuilder({
      userIds: options.userIds,
      exifInfo: false, // need to do this manually because `exifInfo: true` also loads stacked assets messing with `limit`
      withStacked: false, // return all assets individually as expected by the app
    })
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
      .leftJoinAndSelect('asset.stack', 'stack')
      .loadRelationCountAndMap('stack.assetCount', 'stack.assets', 'stackedAssetsCount')
      .andWhere({ updatedAt: MoreThan(options.updatedAfter) })
      .limit(options.limit) // cannot use `take` for performance reasons
      .withDeleted();
    return builder.getMany();
  }

  @GenerateSql({ params: [{ assetId: DummyValue.UUID, type: AssetFileType.PREVIEW, path: '/path/to/file' }] })
  async upsertFile(file: { assetId: string; type: AssetFileType; path: string }): Promise<void> {
    await this.fileRepository.upsert(file, { conflictPaths: ['assetId', 'type'] });
  }

  @GenerateSql({ params: [{ assetId: DummyValue.UUID, type: AssetFileType.PREVIEW, path: '/path/to/file' }] })
  async upsertFiles(files: { assetId: string; type: AssetFileType; path: string }[]): Promise<void> {
    await this.fileRepository.upsert(files, { conflictPaths: ['assetId', 'type'] });
  }
}
