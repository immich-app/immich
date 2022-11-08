import { SearchPropertiesDto } from './dto/search-properties.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CreateAssetDto } from './dto/create-asset.dto';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { In } from 'typeorm/find-options/operator/In';
import { UpdateAssetDto } from './dto/update-asset.dto';

export interface IAssetRepository {
  create(
    createAssetDto: CreateAssetDto,
    ownerId: string,
    originalPath: string,
    mimeType: string,
    checksum?: Buffer,
  ): Promise<AssetEntity>;
  update(asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity>;
  getAllByUserId(userId: string): Promise<AssetEntity[]>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getById(assetId: string): Promise<AssetEntity>;
  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]>;
  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]>;
  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]>;
  getAssetCountByTimeBucket(userId: string, timeBucket: TimeGroupEnum): Promise<AssetCountByTimeBucket[]>;
  getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto>;
  getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]>;
  getAssetByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity>;
  getAssetWithNoThumbnail(): Promise<AssetEntity[]>;
  getAssetWithNoEXIF(): Promise<AssetEntity[]>;
  getAssetWithNoSmartInfo(): Promise<AssetEntity[]>;
  getExistingAssets(
    userId: string,
    checkDuplicateAssetDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto>;
}

export const ASSET_REPOSITORY = 'ASSET_REPOSITORY';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  async getAssetWithNoSmartInfo(): Promise<AssetEntity[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.smartInfo', 'si')
      .where('asset.resizePath IS NOT NULL')
      .andWhere('si.id IS NULL')
      .getMany();
  }

  async getAssetWithNoThumbnail(): Promise<AssetEntity[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.resizePath IS NULL')
      .orWhere('asset.resizePath = :resizePath', { resizePath: '' })
      .orWhere('asset.webpPath IS NULL')
      .orWhere('asset.webpPath = :webpPath', { webpPath: '' })
      .getMany();
  }

  async getAssetWithNoEXIF(): Promise<AssetEntity[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.exifInfo', 'ei')
      .where('ei."assetId" IS NULL')
      .getMany();
  }

  async getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto> {
    // Get asset count by AssetType
    const res = await this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"userId" = :userId', { userId: userId })
      .groupBy('asset.type')
      .getRawMany();

    const assetCountByUserId = new AssetCountByUserIdResponseDto(0, 0);
    res.map((item) => {
      if (item.type === 'IMAGE') {
        assetCountByUserId.photos = item.count;
      } else if (item.type === 'VIDEO') {
        assetCountByUserId.videos = item.count;
      }
    });

    return assetCountByUserId;
  }

  async getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]> {
    // Get asset entity from a list of time buckets
    return await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.userId = :userId', { userId: userId })
      .andWhere(`date_trunc('month', "createdAt") IN (:...buckets)`, {
        buckets: [...getAssetByTimeBucketDto.timeBucket],
      })
      .andWhere('asset.resizePath is not NULL')
      .orderBy('asset.createdAt', 'DESC')
      .getMany();
  }

  async getAssetCountByTimeBucket(userId: string, timeBucket: TimeGroupEnum) {
    let result: AssetCountByTimeBucket[] = [];

    if (timeBucket === TimeGroupEnum.Month) {
      result = await this.assetRepository
        .createQueryBuilder('asset')
        .select(`COUNT(asset.id)::int`, 'count')
        .addSelect(`date_trunc('month', "createdAt")`, 'timeBucket')
        .where('"userId" = :userId', { userId: userId })
        .andWhere('asset.resizePath is not NULL')
        .groupBy(`date_trunc('month', "createdAt")`)
        .orderBy(`date_trunc('month', "createdAt")`, 'DESC')
        .getRawMany();
    } else if (timeBucket === TimeGroupEnum.Day) {
      result = await this.assetRepository
        .createQueryBuilder('asset')
        .select(`COUNT(asset.id)::int`, 'count')
        .addSelect(`date_trunc('day', "createdAt")`, 'timeBucket')
        .where('"userId" = :userId', { userId: userId })
        .andWhere('asset.resizePath is not NULL')
        .groupBy(`date_trunc('day', "createdAt")`)
        .orderBy(`date_trunc('day', "createdAt")`, 'DESC')
        .getRawMany();
    }

    return result;
  }

  async getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.userId = :userId', { userId: userId })
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

  async getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]> {
    return await this.assetRepository.query(
      `
        SELECT DISTINCT ON (unnest(si.objects)) a.id, unnest(si.objects) as "object", a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN smart_info si ON a.id = si."assetId"
        WHERE a."userId" = $1
        AND si.objects IS NOT NULL
      `,
      [userId],
    );
  }

  async getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]> {
    return await this.assetRepository.query(
      `
        SELECT DISTINCT ON (e.city) a.id, e.city, a."resizePath", a."deviceAssetId", a."deviceId"
        FROM assets a
        LEFT JOIN exif e ON a.id = e."assetId"
        WHERE a."userId" = $1
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
  async getById(assetId: string): Promise<AssetEntity> {
    return await this.assetRepository.findOneOrFail({
      where: {
        id: assetId,
      },
      relations: ['exifInfo'],
    });
  }

  /**
   * Get all assets belong to the user on the database
   * @param userId
   */
  async getAllByUserId(userId: string): Promise<AssetEntity[]> {
    const query = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.userId = :userId', { userId: userId })
      .andWhere('asset.resizePath is not NULL')
      .leftJoinAndSelect('asset.exifInfo', 'exifInfo')
      .orderBy('asset.createdAt', 'DESC');

    return await query.getMany();
  }

  /**
   * Create new asset information in database
   * @param createAssetDto
   * @param ownerId
   * @param originalPath
   * @param mimeType
   * @returns Promise<AssetEntity>
   */
  async create(
    createAssetDto: CreateAssetDto,
    ownerId: string,
    originalPath: string,
    mimeType: string,
    checksum?: Buffer,
  ): Promise<AssetEntity> {
    const asset = new AssetEntity();
    asset.deviceAssetId = createAssetDto.deviceAssetId;
    asset.userId = ownerId;
    asset.deviceId = createAssetDto.deviceId;
    asset.type = createAssetDto.assetType || AssetType.OTHER;
    asset.originalPath = originalPath;
    asset.createdAt = createAssetDto.createdAt;
    asset.modifiedAt = createAssetDto.modifiedAt;
    asset.isFavorite = createAssetDto.isFavorite;
    asset.mimeType = mimeType;
    asset.duration = createAssetDto.duration || null;
    asset.checksum = checksum || null;

    const createdAsset = await this.assetRepository.save(asset);

    if (!createdAsset) {
      throw new BadRequestException('Asset not created');
    }
    return createdAsset;
  }

  /**
   * Update asset
   */
  async update(asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity> {
    asset.isFavorite = dto.isFavorite ?? asset.isFavorite;

    return await this.assetRepository.save(asset);
  }

  /**
   * Get assets by device's Id on the database
   * @param userId
   * @param deviceId
   *
   * @returns Promise<string[]> - Array of assetIds belong to the device
   */
  async getAllByDeviceId(userId: string, deviceId: string): Promise<string[]> {
    const rows = await this.assetRepository.find({
      where: {
        userId: userId,
        deviceId: deviceId,
      },
      select: ['deviceAssetId'],
    });
    const res: string[] = [];
    rows.forEach((v) => res.push(v.deviceAssetId));

    return res;
  }

  /**
   * Get asset by checksum on the database
   * @param userId
   * @param checksum
   *
   */
  getAssetByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity> {
    return this.assetRepository.findOneOrFail({
      where: {
        userId,
        checksum,
      },
      relations: ['exifInfo'],
    });
  }

  async getExistingAssets(
    userId: string,
    checkDuplicateAssetDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    const existingAssets = await this.assetRepository.find({
      select: { deviceAssetId: true },
      where: {
        deviceAssetId: In(checkDuplicateAssetDto.deviceAssetIds),
        deviceId: checkDuplicateAssetDto.deviceId,
        userId,
      },
    });
    return new CheckExistingAssetsResponseDto(existingAssets.map((a) => a.deviceAssetId));
  }
}
