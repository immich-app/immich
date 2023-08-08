import {
  AssetSearchOptions,
  AssetStats,
  AssetStatsOptions,
  IAssetRepository,
  LivePhotoSearchOptions,
  MapMarker,
  MapMarkerSearchOptions,
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
import { FindOptionsRelations, FindOptionsWhere, In, IsNull, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType } from '../entities';
import OptionalBetween from '../utils/optional-between.util';
import { paginate } from '../utils/pagination.util';

const truncateMap: Record<TimeBucketSize, string> = {
  [TimeBucketSize.DAY]: 'day',
  [TimeBucketSize.MONTH]: 'month',
};

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

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

  getByUserId(pagination: PaginationOptions, userId: string): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        ownerId: userId,
        isVisible: true,
      },
      relations: {
        exifInfo: true,
      },
    });
  }

  getAll(pagination: PaginationOptions, options: AssetSearchOptions = {}): Paginated<AssetEntity> {
    return paginate(this.repository, pagination, {
      where: {
        isVisible: options.isVisible,
        type: options.type,
      },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          person: true,
        },
      },
      order: {
        // Ensures correct order when paginating
        createdAt: options.order ?? 'ASC',
      },
    });
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
        faces: true,
      },
    });
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

  getWith(pagination: PaginationOptions, property: WithProperty): Paginated<AssetEntity> {
    let where: FindOptionsWhere<AssetEntity> | FindOptionsWhere<AssetEntity>[] = {};

    switch (property) {
      case WithProperty.SIDECAR:
        where = [{ sidecarPath: Not(IsNull()), isVisible: true }];
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
    const { isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

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
        isArchived: false,
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

    const { isArchived, isFavorite } = options;
    if (isArchived !== undefined) {
      builder = builder.andWhere(`asset.isArchived = :isArchived`, { isArchived });
    }

    if (isFavorite !== undefined) {
      builder = builder.andWhere(`asset.isFavorite = :isFavorite`, { isFavorite });
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
      .orderBy('asset.fileCreatedAt', 'DESC')
      .getMany();
  }

  private getBuilder(options: TimeBucketOptions) {
    const { isArchived, isFavorite, albumId, personId, userId } = options;

    let builder = this.repository
      .createQueryBuilder('asset')
      .where('asset.isVisible = true')
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo');

    if (albumId) {
      builder = builder.leftJoin('asset.albums', 'album').andWhere('album.id = :albumId', { albumId });
    }

    if (userId) {
      builder = builder.where('asset.ownerId = :userId', { userId });
    }

    if (isArchived != undefined) {
      builder = builder.andWhere('asset.isArchived = :isArchived', { isArchived });
    }

    if (isFavorite !== undefined) {
      builder = builder.andWhere('asset.isFavorite = :isFavorite', { isFavorite });
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
