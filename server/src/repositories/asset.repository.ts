import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prisma } from '@prisma/client';
import { sql } from 'kysely';
import { Chunked, ChunkedArray, DummyValue, GenerateSql } from 'src/decorators';
import { AssetOrder } from 'src/entities/album.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import {
  AssetCreate,
  AssetDeltaSyncOptions,
  AssetExploreFieldOptions,
  AssetFullSyncOptions,
  AssetGetByChecksumOptions,
  AssetPathEntity,
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
import { MapMarker, MapMarkerSearchOptions } from 'src/interfaces/map.interface';
import { AssetSearchOptions, SearchExploreItem } from 'src/interfaces/search.interface';
import { PrismaRepository } from 'src/repositories/prisma.repository';
import { searchAssetBuilder, withExif } from 'src/utils/database';
import { Instrumentation } from 'src/utils/instrumentation';
import { Paginated, PaginationMode, PaginationOptions, paginatedBuilder, paginationHelper } from 'src/utils/pagination';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private repository: Repository<AssetEntity>,
    private prismaRepository: PrismaRepository,
  ) {}

  async upsertExif(exif: Partial<ExifEntity> & { assetId: string }): Promise<void> {
    await this.prismaRepository.exif.upsert({ update: exif, create: exif, where: { assetId: exif.assetId } });
  }

  async upsertJobStatus(...jobStatus: Partial<AssetJobStatusEntity>[] & { assetId: string }): Promise<void> {
    await this.prismaRepository.assetJobStatus.upsert({
      update: jobStatus,
      create: jobStatus,
      where: { assetId: jobStatus.assetId },
    });
  }

  async create(asset: AssetCreate): Promise<AssetEntity> {
    const { ownerId, libraryId, livePhotoVideoId, stackId, ...assetData } = asset;
    const res = await this.prismaRepository.assets.create({
      data: {
        ...assetData,
        livePhotoVideo: livePhotoVideoId ? { connect: { id: livePhotoVideoId } } : undefined,
        stack: stackId ? { connect: { id: stackId } } : undefined,
        library: libraryId ? { connect: { id: libraryId } } : undefined,
        owner: { connect: { id: ownerId } },
      },
    });
    return res as any as AssetEntity;
  }

  @GenerateSql({ params: [DummyValue.UUID, { day: 1, month: 1 }] })
  async getByDayOfYear(ownerIds: string[], { day, month }: MonthDay): Promise<AssetEntity[]> {
    const res = await this.prismaRepository.$kysely
      .selectFrom('assets')
      .where('ownerId', '=', sql<string>`ANY(ARRAY[${ownerIds}]::uuid[])`)
      .where('isVisible', '=', true)
      .where('isArchived', '=', false)
      .where('previewPath', 'is not', null)
      .where(sql`EXTRACT(DAY FROM "localDateTime" AT TIME ZONE 'UTC')`, '=', day)
      .where(sql`EXTRACT(MONTH FROM "localDateTime" AT TIME ZONE 'UTC')`, '=', month)
      .select((qb) => withExif(qb))
      .orderBy('localDateTime', 'desc')
      .execute();

    return res as any as AssetEntity[];
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getByIds(ids: string[], relations?: Prisma.AssetsInclude): Promise<AssetEntity[]> {
    const res = await this.prismaRepository.assets.findMany({
      where: { id: { in: ids } },
      include: {
        ...relations,
        library: relations?.library ? { include: { assets: true, owner: true } } : undefined,
      },
    });
    return res as any as AssetEntity[]; // typeorm type assumes arbitrary level of recursion
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]> {
    const res = await this.prismaRepository.assets.findMany({
      where: { id: { in: ids } },
      include: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          include: {
            person: true,
          },
        },
        stack: { include: { assets: true } },
      },
    });

    return res as any as AssetEntity[];
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAll(ownerId: string): Promise<void> {
    await this.prismaRepository.assets.deleteMany({ where: { ownerId } });
  }

  async getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity> {
    const items = await this.prismaRepository.assets.findMany({
      where: {
        albums: {
          some: {
            id: albumId,
          },
        },
      },
      orderBy: {
        fileCreatedAt: 'desc',
      },
    });

    return paginationHelper(items as any as AssetEntity[], pagination.take);
  }

  async getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]> {
    const assets = await this.prismaRepository.assets.findMany({
      select: { deviceAssetId: true },
      where: {
        deviceAssetId: { in: deviceAssetIds },
        deviceId,
        ownerId,
      },
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

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getExternalLibraryAssetPaths(pagination: PaginationOptions, libraryId: string): Paginated<AssetPathEntity> {
    const items = await this.prismaRepository.assets.findMany({
      where: { libraryId, isExternal: true },
      select: { id: true, originalPath: true, isOffline: true },
      orderBy: { fileCreatedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take + 1,
    });

    return paginationHelper(items as any as AssetPathEntity[], pagination.take);
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null> {
    const res = await this.prismaRepository.assets.findFirst({ where: { libraryId, originalPath } });
    return res as AssetEntity | null;
  }

  getAll(
    pagination: PaginationOptions,
    { orderDirection, ...options }: AssetSearchOptions = {},
  ): Paginated<AssetEntity> {
    let builder = this.repository.createQueryBuilder('asset');
    builder = searchAssetBuilder(builder, options);
    builder.orderBy('asset.createdAt', orderDirection ?? 'ASC');
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
    const items = await this.prismaRepository.assets.findMany({
      where: {
        ownerId,
        deviceId,
        isVisible: true,
      },
      select: {
        deviceAssetId: true,
      },
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
  async getById(id: string, relations: Prisma.AssetsInclude): Promise<AssetEntity | null> {
    const items = await this.prismaRepository.assets.findFirst({ where: { id }, include: relations });
    return items as any as AssetEntity | null;
  }

  @GenerateSql({ params: [[DummyValue.UUID], { deviceId: DummyValue.STRING }] })
  @Chunked()
  async updateAll(ids: string[], options: AssetUpdateAllOptions): Promise<void> {
    await this.prismaRepository.assets.updateMany({ where: { id: { in: ids } }, data: options });
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
        duplicateId: { in: options.duplicateIds },
      })
      .orWhere({ id: { in: options.assetIds } })
      .execute();
  }

  @Chunked()
  async softDeleteAll(ids: string[]): Promise<void> {
    await this.prismaRepository.assets.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  }

  @Chunked()
  async restoreAll(ids: string[]): Promise<void> {
    await this.prismaRepository.assets.updateMany({ where: { id: { in: ids } }, data: { deletedAt: null } });
  }

  async update(asset: AssetUpdateOptions): Promise<AssetEntity> {
    const { ownerId, libraryId, livePhotoVideoId, stackId, ...assetData } = asset;

    const res = await this.prismaRepository.assets.update({
      data: {
        ...assetData,
        livePhotoVideo: livePhotoVideoId ? { connect: { id: livePhotoVideoId } } : undefined,
        stack: stackId ? { connect: { id: stackId } } : undefined,
        library: libraryId ? { connect: { id: libraryId } } : undefined,
        owner: { connect: { id: ownerId } },
      },
      where: { id: asset.id },
      include: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
        faces: {
          include: {
            person: true,
          },
        },
      },
    });

    return res as any as AssetEntity; // typeorm type assumes all relations are included
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.prismaRepository.assets.delete({ where: { id: asset.id } });
  }

  @GenerateSql({ params: [{ ownerId: DummyValue.UUID, libraryId: DummyValue.UUID, checksum: DummyValue.BUFFER }] })
  getByChecksum({ ownerId, libraryId, checksum }: AssetGetByChecksumOptions): Promise<AssetEntity | null> {
    return this.prismaRepository.assets.findFirst({
      where: {
        ownerId,
        libraryId: libraryId ?? null,
        checksum,
      },
    }) as Promise<AssetEntity | null>;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  getByChecksums(userId: string, checksums: Buffer[]): Promise<AssetEntity[]> {
    return this.prismaRepository.assets.findMany({
      where: { ownerId: userId, checksum: { in: checksums } },
    }) as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.BUFFER] })
  async getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined> {
    const asset = await this.prismaRepository.assets.findFirst({
      select: { id: true },
      where: {
        ownerId,
        checksum,
        libraryId: null,
      },
    });

    return asset?.id;
  }

  async findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null> {
    const { ownerId, otherAssetId, livePhotoCID, type } = options;

    const item = await this.prismaRepository.assets.findFirst({
      where: {
        id: { not: otherAssetId },
        ownerId,
        type,
        exifInfo: {
          livePhotoCID,
        },
      },
      include: {
        exifInfo: true,
      },
    });
    return item as AssetEntity | null;
  }

  @GenerateSql(
    ...Object.values(WithProperty)
      .filter((property) => property !== WithProperty.IS_OFFLINE)
      .map((property) => ({
        name: property,
        params: [DummyValue.PAGINATION, property],
      })),
  )
  async getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity> {
    let relations: Prisma.AssetsInclude = {};
    let where: Prisma.AssetsWhereInput = {};

    switch (property) {
      case WithoutProperty.THUMBNAIL: {
        where = {
          OR: [
            { previewPath: null, isVisible: true },
            { previewPath: '', isVisible: true },
            { thumbnailPath: null, isVisible: true },
            { thumbnailPath: '', isVisible: true },
            { thumbhash: null, isVisible: true },
          ],
        };
        break;
      }

      case WithoutProperty.ENCODED_VIDEO: {
        where = {
          OR: [
            { type: AssetType.VIDEO, encodedVideoPath: null },
            { type: AssetType.VIDEO, encodedVideoPath: '' },
          ],
        };
        break;
      }

      case WithoutProperty.EXIF: {
        relations = {
          exifInfo: true,
          assetJobStatus: true,
        };
        where = {
          isVisible: true,
          assetJobStatus: {
            metadataExtractedAt: null,
          },
        };
        break;
      }

      case WithoutProperty.SMART_SEARCH: {
        where = {
          isVisible: true,
          previewPath: { not: null },
          smartSearch: null,
        };
        break;
      }

      case WithoutProperty.DUPLICATE: {
        where = {
          previewPath: { not: null },
          isVisible: true,
          smartSearch: { isNot: null },
          assetJobStatus: {
            duplicatesDetectedAt: null,
          },
        };
        break;
      }

      case WithoutProperty.FACES: {
        relations = {
          faces: true,
          assetJobStatus: true,
        };
        where = {
          previewPath: { not: null },
          isVisible: true,
          faces: {
            some: {
              person: null,
            },
          },
          assetJobStatus: {
            facesRecognizedAt: null,
          },
        };
        break;
      }

      case WithoutProperty.PERSON: {
        relations = {
          faces: true,
        };
        where = {
          previewPath: { not: null },
          isVisible: true,
          faces: {
            some: {
              person: null,
            },
          },
        };
        break;
      }

      case WithoutProperty.SIDECAR: {
        where = {
          OR: [
            { sidecarPath: null, isVisible: true },
            { sidecarPath: '', isVisible: true },
          ],
        };
        break;
      }

      default: {
        throw new Error(`Invalid getWithout property: ${property}`);
      }
    }

    const items = await this.prismaRepository.assets.findMany({
      where,
      orderBy: {
        // Ensures correct order when paginating
        createdAt: 'asc',
      },
      skip: pagination.skip,
      take: pagination.take + 1,
      include: relations,
    });

    return paginationHelper(items as any as AssetEntity[], pagination.take);
  }

  async getWith(pagination: PaginationOptions, property: WithProperty, libraryId?: string): Paginated<AssetEntity> {
    let where: Prisma.AssetsWhereInput = {};

    switch (property) {
      case WithProperty.SIDECAR: {
        where = { sidecarPath: { not: null }, isVisible: true };
        break;
      }
      case WithProperty.IS_OFFLINE: {
        if (!libraryId) {
          throw new Error('Library id is required when finding offline assets');
        }
        where = { isOffline: true, libraryId: libraryId };
        break;
      }

      default: {
        throw new Error(`Invalid getWith property: ${property}`);
      }
    }

    const items = await this.prismaRepository.assets.findMany({
      where,
      orderBy: {
        // Ensures correct order when paginating
        createdAt: 'asc',
      },
      skip: pagination.skip,
      take: pagination.take + 1,
    });

    return paginationHelper(items as any as AssetEntity[], pagination.take);
  }

  async getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    const items = await this.prismaRepository.assets.findFirst({
      where: {
        albums: {
          some: {
            id: albumId,
          },
        },
      },
      orderBy: {
        fileCreatedAt: 'desc',
      },
    });

    return items as AssetEntity | null;
  }

  async getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null> {
    const items = await this.prismaRepository.assets.findFirst({
      where: {
        albums: {
          some: {
            id: albumId,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return items as AssetEntity | null;
  }

  async getMapMarkers(ownerIds: string[], options: MapMarkerSearchOptions = {}): Promise<MapMarker[]> {
    const { isArchived, isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

    const assets = await this.prismaRepository.assets.findMany({
      select: {
        id: true,
        exifInfo: {
          select: {
            city: true,
            state: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      where: {
        ownerId: {
          in: ownerIds,
        },
        isVisible: true,
        isArchived,
        exifInfo: {
          latitude: { not: null },
          longitude: { not: null },
        },
        isFavorite,
        fileCreatedAt: { gte: fileCreatedAfter, lte: fileCreatedBefore },
      },
      orderBy: {
        fileCreatedAt: 'desc',
      },
    });

    return assets.map((asset) => ({
      id: asset.id,
      lat: asset.exifInfo!.latitude!,
      lon: asset.exifInfo!.longitude!,
      city: asset.exifInfo!.city,
      state: asset.exifInfo!.state,
      country: asset.exifInfo!.country,
    }));
  }

  async getStatistics(ownerId: string, { isArchived, isFavorite, isTrashed }: AssetStatsOptions): Promise<AssetStats> {
    const items = await this.prismaRepository.assets.groupBy({
      by: 'type',
      where: {
        ownerId,
        isVisible: true,
        isArchived,
        isFavorite,
        deletedAt: isTrashed ? { not: null } : null,
      },
      _count: {
        id: true,
      },
    });

    const result: AssetStats = {
      [AssetType.AUDIO]: 0,
      [AssetType.IMAGE]: 0,
      [AssetType.VIDEO]: 0,
      [AssetType.OTHER]: 0,
    };

    for (const item of items) {
      result[item.type as AssetType] = item._count.id;
    }

    return result;
  }

  async getRandom(ownerId: string, take: number): Promise<AssetEntity[]> {
    const where = {
      ownerId,
      isVisible: true,
    };

    const count = await this.prismaRepository.assets.count({ where });
    const skip = Math.floor(Math.random() * Math.max(count - take, 0));
    const items = await this.prismaRepository.assets.findMany({ where, take, skip });

    return items as any as AssetEntity[];
  }

  @GenerateSql({ params: [{ size: TimeBucketSize.MONTH }] })
  async getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]> {
    const items = await this.prismaRepository.assets.groupBy({
      by: 'truncatedDate',
      where: {
        ownerId: options.userIds ? { in: options.userIds } : undefined,
        isVisible: true,
        isArchived: options.isArchived,
        isFavorite: options.isFavorite,
        deletedAt: options.isTrashed ? { not: null } : null,
        albums: options.albumId ? { some: { id: options.albumId } } : undefined,
        faces: options.personId ? { some: { personId: options.personId } } : undefined,
        type: options.assetType,
      },
      _count: {
        id: true,
      },
      orderBy: {
        truncatedDate: 'desc',
      },
    });

    return items.map((item) => ({
      timeBucket: item.truncatedDate.toISOString(),
      count: item._count.id,
    }));
  }

  @GenerateSql({ params: [DummyValue.TIME_BUCKET, { size: TimeBucketSize.MONTH }] })
  async getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]> {
    const items = await this.prismaRepository.assets.findMany({
      where: {
        ownerId: options.userIds ? { in: options.userIds } : undefined,
        isVisible: true,
        isArchived: options.isArchived,
        isFavorite: options.isFavorite,
        deletedAt: options.isTrashed ? { not: null } : null,
        truncatedDate: timeBucket.replace(/^[+-]/, ''),
        albums: options.albumId ? { some: { id: options.albumId } } : undefined,
        faces: options.personId ? { some: { personId: options.personId } } : undefined,
        type: options.assetType,
      },
      orderBy: { fileCreatedAt: options.order === AssetOrder.ASC ? 'asc' : 'desc' },
      include: {
        owner: true,
        exifInfo: options.exifInfo,
        stack: options.withStacked ? { include: { assets: true } } : undefined,
      },
      relationLoadStrategy: 'query', // this seems faster than 'join' in this case
    });

    return items as any as AssetEntity[];
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID, DummyValue.UUID] }] })
  getDuplicates(userId: string): Promise<AssetEntity[]> {
    return this.prismaRepository.assets.groupBy({
      by: 'duplicateId',
      where: {
        duplicateId: { not: null },
        ownerId: userId,
      },
      orderBy: { duplicateId: 'desc' },
    }) as Promise<AssetEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByCity(
    ownerId: string,
    { minAssetsPerField, maxFields }: AssetExploreFieldOptions,
  ): Promise<SearchExploreItem<string>> {
    const res = await this.prismaRepository.exif.groupBy({
      by: 'city',
      where: {
        assets: { ownerId, isVisible: true, isArchived: false, type: AssetType.IMAGE },
        city: { not: null },
      },
      having: {
        assetId: {
          _count: {
            gte: minAssetsPerField,
          },
        },
      },
      take: maxFields,
      orderBy: {
        city: 'desc',
      },
    });

    const cities = res.map((item) => item.city!);

    const items = await this.prismaRepository.exif.findMany({
      where: {
        city: {
          in: cities,
        },
      },
      select: {
        city: true,
        assetId: true,
      },
      distinct: ['city'],
    });

    return {
      fieldName: 'exifInfo.city',
      items: items.map((item) => ({ value: item.city!, data: item.assetId })),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID, { minAssetsPerField: 5, maxFields: 12 }] })
  async getAssetIdByTag(
    ownerId: string,
    { minAssetsPerField, maxFields }: AssetExploreFieldOptions,
  ): Promise<SearchExploreItem<string>> {
    const res = await this.prismaRepository.smartInfo.groupBy({
      by: 'tags',
      where: {
        assets: { ownerId, isVisible: true, isArchived: false, type: AssetType.IMAGE },
      },
      having: {
        assetId: {
          _count: {
            gte: minAssetsPerField,
          },
        },
      },
      take: maxFields,
      orderBy: {
        tags: 'desc',
      },
    });

    const tags = res.flatMap((item) => item.tags!);

    const items = await this.prismaRepository.smartInfo.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
      },
      select: {
        tags: true,
        assetId: true,
      },
    });

    return {
      fieldName: 'smartInfo.tags',
      items: items.map((item) => ({ value: item.tags![0], data: item.assetId })),
    };
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
  async getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]> {
    const { ownerId, lastId, updatedUntil, limit } = options;
    const res = await this.prismaRepository.assets.findMany({
      where: {
        ownerId,
        isVisible: true,
        updatedAt: { lte: updatedUntil },
        id: { gt: lastId },
        OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
      },
      include: {
        exifInfo: true,
        stack: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: limit,
    });

    return res as any as AssetEntity[];
  }

  @GenerateSql({ params: [{ userIds: [DummyValue.UUID], updatedAfter: DummyValue.DATE }] })
  async getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]> {
    const res = await this.prismaRepository.assets.findMany({
      where: {
        ownerId: { in: options.userIds },
        isVisible: true,
        updatedAt: { gt: options.updatedAfter },
        OR: [{ deletedAt: null }, { deletedAt: { not: null } }],
      },
      include: {
        exifInfo: true,
        stack: true,
      },
    });

    return res as any as AssetEntity[];
  }
}
