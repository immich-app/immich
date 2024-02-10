import {
  AssetBuilderOptions,
  AssetCreate,
  AssetExploreFieldOptions,
  AssetSearchOptions,
  AssetStats,
  AssetStatsOptions,
  IAssetRepository,
  LivePhotoSearchOptions,
  MapMarker,
  MapMarkerSearchOptions,
  MetadataSearchOptions,
  MonthDay,
  Paginated,
  PaginationOptions,
  SearchExploreItem,
  TimeBucketItem,
  TimeBucketOptions,
  TimeBucketSize,
  WithProperty,
  WithoutProperty,
} from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { DateTime } from 'luxon';
import path from 'node:path';
import {
  And,
  Brackets,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  In,
  IsNull,
  LessThan,
  Not,
  Repository,
} from 'typeorm';
import { AssetEntity, AssetJobStatusEntity, AssetType, ExifEntity, SmartInfoEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Chunked, ChunkedArray, OptionalBetween, paginate } from '../infra.utils';

const DEFAULT_SEARCH_SIZE = 250;

const truncateMap: Record<TimeBucketSize, string> = {
  [TimeBucketSize.DAY]: 'day',
  [TimeBucketSize.MONTH]: 'month',
};

const dateTrunc = (options: TimeBucketOptions) =>
  `(date_trunc('${
    truncateMap[options.size]
  }', (asset."localDateTime" at time zone 'UTC')) at time zone 'UTC')::timestamptz`;

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private repository: Repository<AssetEntity>,
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
    @InjectRepository(AssetJobStatusEntity) private jobStatusRepository: Repository<AssetJobStatusEntity>,
    @InjectRepository(SmartInfoEntity) private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  async upsertExif(exif: Partial<ExifEntity>): Promise<void> {
    await this.exifRepository.upsert(exif, { conflictPaths: ['assetId'] });
  }

  async upsertJobStatus(jobStatus: Partial<AssetJobStatusEntity>): Promise<void> {
    await this.jobStatusRepository.upsert(jobStatus, { conflictPaths: ['assetId'] });
  }

  search(options: AssetSearchOptions): Promise<AssetEntity[]> {
    const {
      id,
      libraryId,
      deviceAssetId,
      type,
      checksum,
      ownerId,

      isVisible,
      isFavorite,
      isExternal,
      isReadOnly,
      isOffline,
      isArchived,
      isMotion,
      isEncoded,

      createdBefore,
      createdAfter,
      updatedBefore,
      updatedAfter,
      trashedBefore,
      trashedAfter,
      takenBefore,
      takenAfter,

      originalFileName,
      originalPath,
      resizePath,
      webpPath,
      encodedVideoPath,

      city,
      state,
      country,
      make,
      model,
      lensModel,

      withDeleted: _withDeleted,
      withExif: _withExif,
      withStacked,
      withPeople,
      withSmartInfo,

      order,
    } = options;

    const withDeleted = _withDeleted ?? (trashedAfter !== undefined || trashedBefore !== undefined);

    const page = Math.max(options.page || 1, 1);
    const size = Math.min(options.size || DEFAULT_SEARCH_SIZE, DEFAULT_SEARCH_SIZE);

    const exifWhere = _.omitBy(
      {
        city,
        state,
        country,
        make,
        model,
        lensModel,
      },
      _.isUndefined,
    );

    const withExif = Object.keys(exifWhere).length > 0 || _withExif;

    const where: FindOptionsWhere<AssetEntity> = _.omitBy(
      {
        ownerId,
        id,
        libraryId,
        deviceAssetId,
        type,
        checksum,
        isVisible,
        isFavorite,
        isExternal,
        isReadOnly,
        isOffline,
        isArchived,
        livePhotoVideoId: isMotion && Not(IsNull()),
        originalFileName,
        originalPath,
        resizePath,
        webpPath,
        encodedVideoPath: encodedVideoPath ?? (isEncoded && Not(IsNull())),
        createdAt: OptionalBetween(createdAfter, createdBefore),
        updatedAt: OptionalBetween(updatedAfter, updatedBefore),
        deletedAt: OptionalBetween(trashedAfter, trashedBefore),
        fileCreatedAt: OptionalBetween(takenAfter, takenBefore),
        exifInfo: Object.keys(exifWhere).length > 0 ? exifWhere : undefined,
      },
      _.isUndefined,
    );

    const builder = this.repository.createQueryBuilder('asset');

    if (withExif) {
      if (_withExif) {
        builder.leftJoinAndSelect('asset.exifInfo', 'exifInfo');
      } else {
        builder.leftJoin('asset.exifInfo', 'exifInfo');
      }
    }

    if (withPeople) {
      builder.leftJoinAndSelect('asset.faces', 'faces');
      builder.leftJoinAndSelect('faces.person', 'person');
    }

    if (withSmartInfo) {
      builder.leftJoinAndSelect('asset.smartInfo', 'smartInfo');
    }

    if (withDeleted) {
      builder.withDeleted();
    }

    builder.where(where);

    if (withStacked) {
      builder
        .leftJoinAndSelect('asset.stack', 'stack')
        .leftJoinAndSelect('stack.assets', 'stackedAssets')
        .andWhere(new Brackets((qb) => qb.where('stack.primaryAssetId = asset.id').orWhere('asset.stackId IS NULL')));
    }

    return builder
      .skip(size * (page - 1))
      .take(size)
      .orderBy('asset.fileCreatedAt', order ?? 'DESC')
      .getMany();
  }

  create(asset: AssetCreate): Promise<AssetEntity> {
    return this.repository.save(asset);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  getByDate(ownerId: string, date: Date): Promise<AssetEntity[]> {
    // For reference of a correct approach although slower

    // let builder = this.repository
    //   .createQueryBuilder('asset')
    //   .leftJoin('asset.exifInfo', 'exifInfo')
    //   .where('asset.ownerId = :ownerId', { ownerId })
    //   .andWhere(
    //     `coalesce(date_trunc('day', asset."fileCreatedAt", "exifInfo"."timeZone") at TIME ZONE "exifInfo"."timeZone", date_trunc('day', asset."fileCreatedAt")) IN (:date)`,
    //     { date },
    //   )
    //   .andWhere('asset.isVisible = true')
    //   .andWhere('asset.isArchived = false')
    //   .orderBy('asset.fileCreatedAt', 'DESC');

    // return builder.getMany();

    return this.repository.find({
      where: {
        ownerId,
        isVisible: true,
        isArchived: false,
        resizePath: Not(IsNull()),
        fileCreatedAt: OptionalBetween(date, DateTime.fromJSDate(date).plus({ day: 1 }).toJSDate()),
      },
      relations: {
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'DESC',
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, { day: 1, month: 1 }] })
  getByDayOfYear(ownerId: string, { day, month }: MonthDay): Promise<AssetEntity[]> {
    return this.repository
      .createQueryBuilder('entity')
      .where(
        `entity.ownerId = :ownerId
      AND entity.isVisible = true
      AND entity.isArchived = false
      AND entity.resizePath IS NOT NULL
      AND EXTRACT(DAY FROM entity.localDateTime AT TIME ZONE 'UTC') = :day
      AND EXTRACT(MONTH FROM entity.localDateTime AT TIME ZONE 'UTC') = :month`,
        {
          ownerId,
          day,
          month,
        },
      )
      .leftJoinAndSelect('entity.exifInfo', 'exifInfo')
      .orderBy('entity.localDateTime', 'DESC')
      .getMany();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByIds(
    ids: string[],
    relations?: FindOptionsRelations<AssetEntity>,
    select?: FindOptionsSelect<AssetEntity>,
  ): Promise<AssetEntity[]> {
    if (!relations) {
      relations = {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
        stack: {
          assets: true,
        },
      };
    }

    return this.repository.find({
      where: { id: In(ids) },
      relations,
      select,
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

  getByUserId(pagination: PaginationOptions, userId: string, options: AssetSearchOptions = {}): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        ownerId: userId,
        isVisible: options.isVisible,
        deletedAt: options.trashedBefore ? And(Not(IsNull()), LessThan(options.trashedBefore)) : undefined,
      },
      relations: {
        exifInfo: true,
      },
      withDeleted: !!options.trashedBefore,
    });
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  getByLibraryId(libraryIds: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { library: { id: In(libraryIds) } },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { library: { id: libraryId }, originalPath: originalPath },
    });
  }

  getAll(pagination: PaginationOptions, options: AssetSearchOptions = {}): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        isVisible: options.isVisible,
        type: options.type,
        deletedAt: options.trashedBefore ? And(Not(IsNull()), LessThan(options.trashedBefore)) : undefined,
      },
      relations: {
        exifInfo: options.withExif !== false,
        smartInfo: options.withSmartInfo !== false,
        tags: options.withSmartInfo !== false,
        faces: options.withFaces !== false,
        smartSearch: options.withSmartInfo === true,
      },
      withDeleted: options.withDeleted ?? !!options.trashedBefore,
      order: {
        // Ensures correct order when paginating
        createdAt: options.order ?? 'ASC',
      },
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
  getById(id: string, relations: FindOptionsRelations<AssetEntity>): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations,
      // We are specifically asking for this asset. Return it even if it is soft deleted
      withDeleted: true,
    });
  }

  @GenerateSql({ params: [[DummyValue.UUID], { deviceId: DummyValue.STRING }] })
  @Chunked()
  async updateAll(ids: string[], options: Partial<AssetEntity>): Promise<void> {
    await this.repository.update({ id: In(ids) }, options);
  }

  @Chunked()
  async softDeleteAll(ids: string[]): Promise<void> {
    await this.repository.softDelete({ id: In(ids), isExternal: false });
  }

  @Chunked()
  async restoreAll(ids: string[]): Promise<void> {
    await this.repository.restore({ id: In(ids) });
  }

  async save(asset: Partial<AssetEntity>): Promise<AssetEntity> {
    const { id } = await this.repository.save(asset);
    return this.repository.findOneOrFail({
      where: { id },
      relations: {
        exifInfo: true,
        owner: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      withDeleted: true,
    });
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.repository.remove(asset);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.BUFFER] })
  getByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity | null> {
    return this.repository.findOne({ where: { ownerId: userId, checksum } });
  }

  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null> {
    const { ownerId, otherAssetId, livePhotoCID, type } = options;

    return this.repository.findOne({
      where: {
        id: Not(otherAssetId),
        ownerId,
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
    ...Object.values(WithProperty)
      .filter((property) => property !== WithProperty.IS_OFFLINE)
      .map((property) => ({
        name: property,
        params: [DummyValue.PAGINATION, property],
      })),
  )
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    let relations: FindOptionsRelations<AssetEntity> = {};
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithoutProperty.THUMBNAIL: {
        where = [
          { resizePath: IsNull(), isVisible: true },
          { resizePath: '', isVisible: true },
          { webpPath: IsNull(), isVisible: true },
          { webpPath: '', isVisible: true },
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
          resizePath: Not(IsNull()),
          smartSearch: {
            embedding: IsNull(),
          },
        };
        break;
      }

      case WithoutProperty.OBJECT_TAGS: {
        relations = {
          smartInfo: true,
        };
        where = {
          resizePath: Not(IsNull()),
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
          resizePath: Not(IsNull()),
          isVisible: true,
          faces: {
            assetId: IsNull(),
            personId: IsNull(),
          },
          jobStatus: {
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
          resizePath: Not(IsNull()),
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

  getWith(pagination: PaginationOptions, property: WithProperty, libraryId?: string): Paginated<AssetEntity> {
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithProperty.SIDECAR: {
        where = [{ sidecarPath: Not(IsNull()), isVisible: true }];
        break;
      }
      case WithProperty.IS_OFFLINE: {
        if (!libraryId) {
          throw new Error('Library id is required when finding offline assets');
        }
        where = [{ isOffline: true, libraryId: libraryId }];
        break;
      }

      default: {
        throw new Error(`Invalid getWith property: ${property}`);
      }
    }

    return paginate(this.repository, pagination, {
      where,
      order: {
        // Ensures correct order when paginating
        createdAt: 'ASC',
      },
    });
  }

  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { albums: { id: albumId } },
      order: { fileCreatedAt: 'DESC' },
    });
  }

  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { albums: { id: albumId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async getMapMarkers(ownerId: string, options: MapMarkerSearchOptions = {}): Promise<MapMarker[]> {
    const { isArchived, isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

    const assets = await this.repository.find({
      select: {
        id: true,
        exifInfo: {
          latitude: true,
          longitude: true,
        },
      },
      where: {
        ownerId,
        isVisible: true,
        isArchived,
        exifInfo: {
          latitude: Not(IsNull()),
          longitude: Not(IsNull()),
        },
        isFavorite,
        fileCreatedAt: OptionalBetween(fileCreatedAfter, fileCreatedBefore),
      },
      relations: {
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'DESC',
      },
    });

    return assets.map((asset) => ({
      id: asset.id,

      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      lat: asset.exifInfo!.latitude!,

      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      lon: asset.exifInfo!.longitude!,
    }));
  }

  async getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats> {
    let builder = await this.repository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"ownerId" = :ownerId', { ownerId })
      .andWhere('asset.isVisible = true')
      .groupBy('asset.type');

    const { isArchived, isFavorite, isTrashed } = options;
    if (isArchived !== undefined) {
      builder = builder.andWhere(`asset.isArchived = :isArchived`, { isArchived });
    }

    if (isFavorite !== undefined) {
      builder = builder.andWhere(`asset.isFavorite = :isFavorite`, { isFavorite });
    }

    if (isTrashed !== undefined) {
      builder = builder.withDeleted().andWhere(`asset.deletedAt is not null`);
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

  getRandom(ownerId: string, count: number): Promise<AssetEntity[]> {
    // can't use queryBuilder because of custom OFFSET clause
    return this.repository.query(
      `SELECT *
       FROM assets
       WHERE "ownerId" = $1
       OFFSET FLOOR(RANDOM() * (SELECT GREATEST(COUNT(*) - $2, 0) FROM ASSETS WHERE "ownerId" = $1)) LIMIT $2`,
      [ownerId, count],
    );
  }

  @GenerateSql({ params: [{ size: TimeBucketSize.MONTH }] })
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    const truncated = dateTrunc(options);
    return this.getBuilder(options)
      .select(`COUNT(asset.id)::int`, 'count')
      .addSelect(truncated, 'timeBucket')
      .groupBy(truncated)
      .orderBy(truncated, 'DESC')
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
        .addOrderBy('asset.fileCreatedAt', 'DESC')
        .getMany()
    );
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
    const { isArchived, isFavorite, isTrashed, albumId, personId, userIds, withStacked, exifInfo, assetType } = options;

    let builder = this.repository.createQueryBuilder('asset').where('asset.isVisible = true');
    if (assetType !== undefined) {
      builder = builder.andWhere('asset.type = :assetType', { assetType });
    }

    let stackJoined = false;

    if (exifInfo !== false) {
      stackJoined = true;
      builder = builder
        .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
        .leftJoinAndSelect('asset.stack', 'stack')
        .leftJoinAndSelect('stack.assets', 'stackedAssets');
    }

    if (albumId) {
      builder = builder.leftJoin('asset.albums', 'album').andWhere('album.id = :albumId', { albumId });
    }

    if (userIds) {
      builder = builder.andWhere('asset.ownerId IN (:...userIds )', { userIds });
    }

    if (isArchived !== undefined) {
      builder = builder.andWhere('asset.isArchived = :isArchived', { isArchived });
    }

    if (isFavorite !== undefined) {
      builder = builder.andWhere('asset.isFavorite = :isFavorite', { isFavorite });
    }

    if (isTrashed !== undefined) {
      builder = builder.andWhere(`asset.deletedAt ${isTrashed ? 'IS NOT NULL' : 'IS NULL'}`).withDeleted();
    }

    if (personId !== undefined) {
      builder = builder
        .innerJoin('asset.faces', 'faces')
        .innerJoin('faces.person', 'person')
        .andWhere('person.id = :personId', { personId });
    }

    if (withStacked) {
      if (!stackJoined) {
        builder = builder.leftJoinAndSelect('asset.stack', 'stack').leftJoinAndSelect('stack.assets', 'stackedAssets');
      }
      builder = builder.andWhere(
        new Brackets((qb) => qb.where('stack.primaryAssetId = asset.id').orWhere('asset.stackId IS NULL')),
      );
    }

    return builder;
  }

  @GenerateSql({ params: [DummyValue.STRING, [DummyValue.UUID], { numResults: 250 }] })
  async searchMetadata(
    query: string,
    userIds: string[],
    { numResults }: MetadataSearchOptions,
  ): Promise<AssetEntity[]> {
    const rows = await this.getBuilder({
      userIds: userIds,
      exifInfo: false,
      isArchived: false,
    })
      .select('asset.*')
      .addSelect('e.*')
      .addSelect('COALESCE(si.tags, array[]::text[])', 'tags')
      .addSelect('COALESCE(si.objects, array[]::text[])', 'objects')
      .innerJoin('exif', 'e', 'asset."id" = e."assetId"')
      .leftJoin('smart_info', 'si', 'si."assetId" = asset."id"')
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            `(e."exifTextSearchableColumn" || COALESCE(si."smartInfoTextSearchableColumn", to_tsvector('english', '')))
          @@ PLAINTO_TSQUERY('english', :query)`,
            { query },
          ).orWhere('asset."originalFileName" = :path', { path: path.parse(query).name });
        }),
      )
      .addOrderBy('asset.fileCreatedAt', 'DESC')
      .limit(numResults)
      .getRawMany();

    return rows.map(
      ({
        tags,
        objects,
        country,
        state,
        city,
        description,
        model,
        make,
        dateTimeOriginal,
        exifImageHeight,
        exifImageWidth,
        exposureTime,
        fNumber,
        fileSizeInByte,
        focalLength,
        iso,
        latitude,
        lensModel,
        longitude,
        modifyDate,
        projectionType,
        timeZone,
        ...assetInfo
      }) =>
        ({
          exifInfo: {
            city,
            country,
            dateTimeOriginal,
            description,
            exifImageHeight,
            exifImageWidth,
            exposureTime,
            fNumber,
            fileSizeInByte,
            focalLength,
            iso,
            latitude,
            lensModel,
            longitude,
            make,
            model,
            modifyDate,
            projectionType,
            state,
            timeZone,
          },
          smartInfo: {
            tags,
            objects,
          },
          ...assetInfo,
        }) as AssetEntity,
    );
  }
}
