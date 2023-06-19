import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not } from 'typeorm';
import { In } from 'typeorm/find-options/operator/In';
import { Repository } from 'typeorm/repository/Repository';
import { AssetSearchDto } from './dto/asset-search.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { GetAssetCountByTimeBucketDto, TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { SearchPropertiesDto } from './dto/search-properties.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';

export interface AssetCheck {
  id: string;
  checksum: Buffer;
}

export interface IAssetRepository {
  get(id: string): Promise<AssetEntity | null>;
  create(
    asset: Omit<AssetEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'livePhotoVideoId'>,
  ): Promise<AssetEntity>;
  remove(asset: AssetEntity): Promise<void>;
  update(userId: string, asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity>;
  getAllByUserId(userId: string, dto: AssetSearchDto): Promise<AssetEntity[]>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getById(assetId: string): Promise<AssetEntity>;
  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]>;
  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]>;
  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]>;
  getAssetCountByTimeBucket(userId: string, dto: GetAssetCountByTimeBucketDto): Promise<AssetCountByTimeBucket[]>;
  getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto>;
  getArchivedAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto>;
  getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]>;
  getAssetsByChecksums(userId: string, checksums: Buffer[]): Promise<AssetCheck[]>;
  getExistingAssets(userId: string, checkDuplicateAssetDto: CheckExistingAssetsDto): Promise<string[]>;
}

export const IAssetRepository = 'IAssetRepository';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
  ) {}

  async getAssetCountByUserId(ownerId: string): Promise<AssetCountByUserIdResponseDto> {
    // Get asset count by AssetType
    const items = await this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"ownerId" = :ownerId', { ownerId: ownerId })
      .andWhere('asset.isVisible = true')
      .groupBy('asset.type')
      .getRawMany();

    return this.getAssetCount(items);
  }

  async getArchivedAssetCountByUserId(ownerId: string): Promise<AssetCountByUserIdResponseDto> {
    // Get archived asset count by AssetType
    const items = await this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"ownerId" = :ownerId', { ownerId: ownerId })
      .andWhere('asset.isVisible = true')
      .andWhere('asset.isArchived = true')
      .groupBy('asset.type')
      .getRawMany();

    return this.getAssetCount(items);
  }

  async getAssetByTimeBucket(userId: string, dto: GetAssetByTimeBucketDto): Promise<AssetEntity[]> {
    // Get asset entity from a list of time buckets
    let builder = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
      .where('asset.ownerId = :userId', { userId: userId })
      .andWhere(`date_trunc('month', "fileCreatedAt") IN (:...buckets)`, {
        buckets: [...dto.timeBucket],
      })
      .andWhere('asset.isVisible = true')
      .andWhere('asset.isArchived = false')
      .orderBy('asset.fileCreatedAt', 'DESC');

    if (!dto.withoutThumbs) {
      builder = builder.andWhere('asset.resizePath is not NULL');
    }

    return builder.getMany();
  }

  async getAssetCountByTimeBucket(
    userId: string,
    dto: GetAssetCountByTimeBucketDto,
  ): Promise<AssetCountByTimeBucket[]> {
    const builder = this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)::int`, 'count')
      .where('"ownerId" = :userId', { userId: userId })
      .andWhere('asset.isVisible = true')
      .andWhere('asset.isArchived = false');

    // Using a parameter for this doesn't work https://github.com/typeorm/typeorm/issues/7308
    if (dto.timeGroup === TimeGroupEnum.Month) {
      builder
        .addSelect(`date_trunc('month', "fileCreatedAt")`, 'timeBucket')
        .groupBy(`date_trunc('month', "fileCreatedAt")`)
        .orderBy(`date_trunc('month', "fileCreatedAt")`, 'DESC');
    } else if (dto.timeGroup === TimeGroupEnum.Day) {
      builder
        .addSelect(`date_trunc('day', "fileCreatedAt")`, 'timeBucket')
        .groupBy(`date_trunc('day', "fileCreatedAt")`)
        .orderBy(`date_trunc('day', "fileCreatedAt")`, 'DESC');
    }

    if (!dto.withoutThumbs) {
      builder.andWhere('asset.resizePath is not NULL');
    }

    return builder.getRawMany();
  }

  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]> {
    return this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.ownerId = :userId', { userId: userId })
      .andWhere('asset.isVisible = true')
      .leftJoin('asset.exifInfo', 'ei')
      .leftJoin('asset.smartInfo', 'si')
      .select('si.tags', 'tags')
      .addSelect('si.objects', 'objects')
      .addSelect('asset.type', 'assetType')
      .addSelect('ei.orientation', 'orientation')
      .addSelect('ei."lensModel"', 'lensModel')
      .addSelect('ei.make', 'make')
      .addSelect('ei.model', 'model')
      .addSelect('ei.city', 'city')
      .addSelect('ei.state', 'state')
      .addSelect('ei.country', 'country')
      .distinctOn(['si.tags'])
      .getRawMany();
  }

  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]> {
    return this.assetRepository.query(
      `
        SELECT DISTINCT ON (unnest(si.objects)) a.id, unnest(si.objects) as "object", a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN smart_info si ON a.id = si."assetId"
        WHERE a."ownerId" = $1
        AND a."isVisible" = true
        AND si.objects IS NOT NULL
      `,
      [userId],
    );
  }

  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]> {
    return this.assetRepository.query(
      `
        SELECT DISTINCT ON (e.city) a.id, e.city, a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN exif e ON a.id = e."assetId"
        WHERE a."ownerId" = $1
        AND a."isVisible" = true
        AND e.city IS NOT NULL
        AND a.type = 'IMAGE';
      `,
      [userId],
    );
  }

  /**
   * Get a single asset information by its ID
   * - include exif info
   * @param assetId
   */
  getById(assetId: string): Promise<AssetEntity> {
    return this.assetRepository.findOneOrFail({
      where: {
        id: assetId,
      },
      relations: {
        exifInfo: true,
        tags: true,
        sharedLinks: true,
        smartInfo: true,
        faces: {
          person: true,
        },
      },
    });
  }

  /**
   * Get all assets belong to the user on the database
   * @param ownerId
   */
  getAllByUserId(ownerId: string, dto: AssetSearchDto): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        ownerId,
        resizePath: dto.withoutThumbs ? undefined : Not(IsNull()),
        isVisible: true,
        isFavorite: dto.isFavorite,
        isArchived: dto.isArchived,
      },
      relations: {
        exifInfo: true,
        tags: true,
      },
      skip: dto.skip || 0,
      order: {
        fileCreatedAt: 'DESC',
      },
    });
  }

  get(id: string): Promise<AssetEntity | null> {
    return this.assetRepository.findOne({
      where: { id },
      relations: {
        faces: {
          person: true,
        },
      },
    });
  }

  create(
    asset: Omit<AssetEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'livePhotoVideoId'>,
  ): Promise<AssetEntity> {
    return this.assetRepository.save(asset);
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.assetRepository.remove(asset);
  }

  /**
   * Update asset
   */
  async update(userId: string, asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity> {
    asset.isFavorite = dto.isFavorite ?? asset.isFavorite;
    asset.isArchived = dto.isArchived ?? asset.isArchived;

    if (asset.exifInfo != null) {
      asset.exifInfo.description = dto.description || '';
      await this.exifRepository.save(asset.exifInfo);
    } else {
      const exifInfo = new ExifEntity();
      exifInfo.description = dto.description || '';
      exifInfo.asset = asset;
      await this.exifRepository.save(exifInfo);
      asset.exifInfo = exifInfo;
    }

    await this.assetRepository.update(asset.id, {
      isFavorite: asset.isFavorite,
      isArchived: asset.isArchived,
    });

    return this.assetRepository.findOneOrFail({
      where: {
        id: asset.id,
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
  async getAllByDeviceId(ownerId: string, deviceId: string): Promise<string[]> {
    const items = await this.assetRepository.find({
      select: { deviceAssetId: true },
      where: {
        ownerId,
        deviceId,
        isVisible: true,
      },
    });

    return items.map((asset) => asset.deviceAssetId);
  }

  /**
   * Get assets by checksums on the database
   * @param ownerId
   * @param checksums
   *
   */
  getAssetsByChecksums(ownerId: string, checksums: Buffer[]): Promise<AssetCheck[]> {
    return this.assetRepository.find({
      select: {
        id: true,
        checksum: true,
      },
      where: {
        ownerId,
        checksum: In(checksums),
      },
    });
  }

  async getExistingAssets(ownerId: string, checkDuplicateAssetDto: CheckExistingAssetsDto): Promise<string[]> {
    const assets = await this.assetRepository.find({
      select: { deviceAssetId: true },
      where: {
        deviceAssetId: In(checkDuplicateAssetDto.deviceAssetIds),
        deviceId: checkDuplicateAssetDto.deviceId,
        ownerId,
      },
    });
    return assets.map((asset) => asset.deviceAssetId);
  }

  private getAssetCount(items: any): AssetCountByUserIdResponseDto {
    const assetCountByUserId = new AssetCountByUserIdResponseDto();

    // asset type to dto property mapping
    const map: Record<AssetType, keyof AssetCountByUserIdResponseDto> = {
      [AssetType.AUDIO]: 'audio',
      [AssetType.IMAGE]: 'photos',
      [AssetType.VIDEO]: 'videos',
      [AssetType.OTHER]: 'other',
    };

    for (const item of items) {
      const count = Number(item.count) || 0;
      const assetType = item.type as AssetType;
      const type = map[assetType];

      assetCountByUserId[type] = count;
      assetCountByUserId.total += count;
    }

    return assetCountByUserId;
  }
}
