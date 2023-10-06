import {
  AssetCreate,
  AssetSearchOptions,
  AssetStats,
  AssetStatsOptions,
  IAssetRepository,
  LivePhotoSearchOptions,
  MapMarker,
  MapMarkerSearchOptions,
  MonthDay,
  Paginated,
  PaginationOptions,
  TimeBucketItem,
  TimeBucketOptions,
  TimeBucketSize,
  WithoutProperty,
  WithProperty,
} from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { And, FindOptionsRelations, FindOptionsWhere, In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType, ExifEntity } from '../entities';
import OptionalBetween from '../utils/optional-between.util';
import { paginate } from '../utils/pagination.util';

const truncateMap: Record<TimeBucketSize, string> = {
  [TimeBucketSize.DAY]: 'day',
  [TimeBucketSize.MONTH]: 'month',
};

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private repository: Repository<AssetEntity>,
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
  ) {}

  async upsertExif(exif: Partial<ExifEntity>): Promise<void> {
    await this.exifRepository.upsert(exif, { conflictPaths: ['assetId'] });
  }

  create(asset: AssetCreate): Promise<AssetEntity> {
    return this.repository.save(asset);
  }

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

  getByDayOfYear(ownerId: string, { day, month }: MonthDay): Promise<AssetEntity[]> {
    return this.repository
      .createQueryBuilder('entity')
      .where(
        `entity.ownerId = :ownerId
      AND entity.isVisible = true
      AND entity.isArchived = false
      AND entity.resizePath IS NOT NULL
      AND EXTRACT(DAY FROM entity.localDateTime) = :day
      AND EXTRACT(MONTH FROM entity.localDateTime) = :month`,
        {
          ownerId,
          day,
          month,
        },
      )
      .orderBy('entity.localDateTime', 'DESC')
      .getMany();
  }

  getByIds(ids: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      withDeleted: true,
    });
  }

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

  getByLibraryId(libraryIds: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { library: { id: In(libraryIds) } },
    });
  }

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
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      withDeleted: !!options.trashedBefore,
      order: {
        // Ensures correct order when paginating
        createdAt: options.order ?? 'ASC',
      },
    });
  }

  getById(id: string): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        faces: {
          person: true,
        },
        library: true,
      },
      // We are specifically asking for this asset. Return it even if it is soft deleted
      withDeleted: true,
    });
  }

  async updateAll(ids: string[], options: Partial<AssetEntity>): Promise<void> {
    await this.repository.update({ id: In(ids) }, options);
  }

  async softDeleteAll(ids: string[]): Promise<void> {
    await this.repository.softDelete({ id: In(ids), isExternal: false });
  }

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

  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    let relations: FindOptionsRelations<AssetEntity> = {};
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithoutProperty.THUMBNAIL:
        where = [
          { resizePath: IsNull(), isVisible: true },
          { resizePath: '', isVisible: true },
          { webpPath: IsNull(), isVisible: true },
          { webpPath: '', isVisible: true },
          { thumbhash: IsNull(), isVisible: true },
        ];
        break;

      case WithoutProperty.ENCODED_VIDEO:
        where = [
          { type: AssetType.VIDEO, encodedVideoPath: IsNull() },
          { type: AssetType.VIDEO, encodedVideoPath: '' },
        ];
        break;

      case WithoutProperty.EXIF:
        relations = {
          exifInfo: true,
        };
        where = {
          isVisible: true,
          exifInfo: {
            assetId: IsNull(),
          },
        };
        break;

      case WithoutProperty.CLIP_ENCODING:
        relations = {
          smartInfo: true,
        };
        where = {
          isVisible: true,
          resizePath: Not(IsNull()),
          smartInfo: {
            clipEmbedding: IsNull(),
          },
        };
        break;

      case WithoutProperty.OBJECT_TAGS:
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

      case WithoutProperty.FACES:
        relations = {
          faces: true,
        };
        where = {
          resizePath: Not(IsNull()),
          isVisible: true,
          faces: {
            assetId: IsNull(),
            personId: IsNull(),
          },
        };
        break;

      case WithoutProperty.SIDECAR:
        where = [
          { sidecarPath: IsNull(), isVisible: true },
          { sidecarPath: '', isVisible: true },
        ];
        break;

      default:
        throw new Error(`Invalid getWithout property: ${property}`);
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
      case WithProperty.SIDECAR:
        where = [{ sidecarPath: Not(IsNull()), isVisible: true }];
        break;
      case WithProperty.IS_OFFLINE:
        if (!libraryId) {
          throw new Error('Library id is required when finding offline assets');
        }
        where = [{ isOffline: true, libraryId: libraryId }];
        break;

      default:
        throw new Error(`Invalid getWith property: ${property}`);
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

  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    const truncateValue = truncateMap[options.size];

    return this.getBuilder(options)
      .select(`COUNT(asset.id)::int`, 'count')
      .addSelect(`date_trunc('${truncateValue}', "fileCreatedAt")`, 'timeBucket')
      .groupBy(`date_trunc('${truncateValue}', "fileCreatedAt")`)
      .orderBy(`date_trunc('${truncateValue}', "fileCreatedAt")`, 'DESC')
      .getRawMany();
  }

  getByTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]> {
    const truncateValue = truncateMap[options.size];
    return this.getBuilder(options)
      .andWhere(`date_trunc('${truncateValue}', "fileCreatedAt") = :timeBucket`, { timeBucket })
      .orderBy(`date_trunc('day', "localDateTime")`, 'DESC')
      .addOrderBy('asset.fileCreatedAt', 'DESC')
      .getMany();
  }

  private getBuilder(options: TimeBucketOptions) {
    const { isArchived, isFavorite, isTrashed, albumId, personId, userId } = options;

    let builder = this.repository
      .createQueryBuilder('asset')
      .where('asset.isVisible = true')
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo');

    if (albumId) {
      builder = builder.leftJoin('asset.albums', 'album').andWhere('album.id = :albumId', { albumId });
    }

    if (userId) {
      builder = builder.andWhere('asset.ownerId = :userId', { userId });
    }

    if (isArchived != undefined) {
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

    return builder;
  }
}
