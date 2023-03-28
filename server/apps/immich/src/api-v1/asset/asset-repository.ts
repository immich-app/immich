import { SearchPropertiesDto } from './dto/search-properties.dto';
import { CuratedLocationsResponseDto } from './response-dto/curated-locations-response.dto';
import { AssetEntity, AssetType } from '@app/infra/db/entities';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CuratedObjectsResponseDto } from './response-dto/curated-objects-response.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { GetAssetByTimeBucketDto } from './dto/get-asset-by-time-bucket.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { CheckExistingAssetsDto } from './dto/check-existing-assets.dto';
import { CheckExistingAssetsResponseDto } from './response-dto/check-existing-assets-response.dto';
import { In } from 'typeorm/find-options/operator/In';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { ITagRepository } from '../tag/tag.repository';
import { IsNull, Not } from 'typeorm';
import { AssetSearchDto } from './dto/asset-search.dto';

export interface IAssetRepository {
  get(id: string): Promise<AssetEntity | null>;
  create(
    asset: Omit<AssetEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'livePhotoVideoId'>,
  ): Promise<AssetEntity>;
  remove(asset: AssetEntity): Promise<void>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;

  update(userId: string, asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity>;
  getAll(): Promise<AssetEntity[]>;
  getAllVideos(): Promise<AssetEntity[]>;
  getAllByUserId(userId: string, dto: AssetSearchDto): Promise<AssetEntity[]>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getById(assetId: string): Promise<AssetEntity>;
  getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]>;
  getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]>;
  getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]>;
  getAssetCountByTimeBucket(userId: string, timeBucket: TimeGroupEnum): Promise<AssetCountByTimeBucket[]>;
  getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto>;
  getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]>;
  getAssetByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity>;
  getExistingAssets(
    userId: string,
    checkDuplicateAssetDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto>;
  countByIdAndUser(assetId: string, userId: string): Promise<number>;
}

export const IAssetRepository = 'IAssetRepository';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @Inject(ITagRepository) private _tagRepository: ITagRepository,
  ) {}

  async getAllVideos(): Promise<AssetEntity[]> {
    return await this.assetRepository.find({
      where: { type: AssetType.VIDEO },
    });
  }

  async getAll(): Promise<AssetEntity[]> {
    return await this.assetRepository.find({
      where: { isVisible: true },
      relations: {
        exifInfo: true,
        smartInfo: true,
      },
    });
  }

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

  async getAssetByTimeBucket(userId: string, getAssetByTimeBucketDto: GetAssetByTimeBucketDto): Promise<AssetEntity[]> {
    // Get asset entity from a list of time buckets
    return await this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.ownerId = :userId', { userId: userId })
      .andWhere(`date_trunc('month', "fileCreatedAt") IN (:...buckets)`, {
        buckets: [...getAssetByTimeBucketDto.timeBucket],
      })
      .andWhere('asset.resizePath is not NULL')
      .andWhere('asset.isVisible = true')
      .orderBy('asset.fileCreatedAt', 'DESC')
      .getMany();
  }

  async getAssetCountByTimeBucket(userId: string, timeBucket: TimeGroupEnum) {
    let result: AssetCountByTimeBucket[] = [];

    if (timeBucket === TimeGroupEnum.Month) {
      result = await this.assetRepository
        .createQueryBuilder('asset')
        .select(`COUNT(asset.id)::int`, 'count')
        .addSelect(`date_trunc('month', "fileCreatedAt")`, 'timeBucket')
        .where('"ownerId" = :userId', { userId: userId })
        .andWhere('asset.resizePath is not NULL')
        .andWhere('asset.isVisible = true')
        .groupBy(`date_trunc('month', "fileCreatedAt")`)
        .orderBy(`date_trunc('month', "fileCreatedAt")`, 'DESC')
        .getRawMany();
    } else if (timeBucket === TimeGroupEnum.Day) {
      result = await this.assetRepository
        .createQueryBuilder('asset')
        .select(`COUNT(asset.id)::int`, 'count')
        .addSelect(`date_trunc('day', "fileCreatedAt")`, 'timeBucket')
        .where('"ownerId" = :userId', { userId: userId })
        .andWhere('asset.resizePath is not NULL')
        .andWhere('asset.isVisible = true')
        .groupBy(`date_trunc('day', "fileCreatedAt")`)
        .orderBy(`date_trunc('day', "fileCreatedAt")`, 'DESC')
        .getRawMany();
    }

    return result;
  }

  async getSearchPropertiesByUserId(userId: string): Promise<SearchPropertiesDto[]> {
    return await this.assetRepository
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

  async getDetectedObjectsByUserId(userId: string): Promise<CuratedObjectsResponseDto[]> {
    return await this.assetRepository.query(
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

  async getLocationsByUserId(userId: string): Promise<CuratedLocationsResponseDto[]> {
    return await this.assetRepository.query(
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
  async getById(assetId: string): Promise<AssetEntity> {
    return await this.assetRepository.findOneOrFail({
      where: {
        id: assetId,
      },
      relations: ['exifInfo', 'tags', 'sharedLinks', 'smartInfo'],
    });
  }

  /**
   * Get all assets belong to the user on the database
   * @param ownerId
   */
  async getAllByUserId(ownerId: string, dto: AssetSearchDto): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        ownerId,
        resizePath: Not(IsNull()),
        isVisible: true,
        isFavorite: dto.isFavorite,
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
    return this.assetRepository.findOne({ where: { id } });
  }

  async create(
    asset: Omit<AssetEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'livePhotoVideoId'>,
  ): Promise<AssetEntity> {
    return this.assetRepository.save(asset);
  }

  async remove(asset: AssetEntity): Promise<void> {
    await this.assetRepository.remove(asset);
  }

  async save(asset: Partial<AssetEntity>): Promise<AssetEntity> {
    const { id } = await this.assetRepository.save(asset);
    return this.assetRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Update asset
   */
  async update(userId: string, asset: AssetEntity, dto: UpdateAssetDto): Promise<AssetEntity> {
    asset.isFavorite = dto.isFavorite ?? asset.isFavorite;

    if (dto.tagIds) {
      const tags = await this._tagRepository.getByIds(userId, dto.tagIds);
      asset.tags = tags;
    }

    return await this.assetRepository.save(asset);
  }

  /**
   * Get assets by device's Id on the database
   * @param ownerId
   * @param deviceId
   *
   * @returns Promise<string[]> - Array of assetIds belong to the device
   */
  async getAllByDeviceId(ownerId: string, deviceId: string): Promise<string[]> {
    const rows = await this.assetRepository.find({
      where: {
        ownerId,
        deviceId,
        isVisible: true,
      },
      select: ['deviceAssetId'],
    });
    const res: string[] = [];
    rows.forEach((v) => res.push(v.deviceAssetId));

    return res;
  }

  /**
   * Get asset by checksum on the database
   * @param ownerId
   * @param checksum
   *
   */
  getAssetByChecksum(ownerId: string, checksum: Buffer): Promise<AssetEntity> {
    return this.assetRepository.findOneOrFail({
      where: {
        ownerId,
        checksum,
      },
      relations: ['exifInfo'],
    });
  }

  async getExistingAssets(
    ownerId: string,
    checkDuplicateAssetDto: CheckExistingAssetsDto,
  ): Promise<CheckExistingAssetsResponseDto> {
    const existingAssets = await this.assetRepository.find({
      select: { deviceAssetId: true },
      where: {
        deviceAssetId: In(checkDuplicateAssetDto.deviceAssetIds),
        deviceId: checkDuplicateAssetDto.deviceId,
        ownerId,
      },
    });
    return new CheckExistingAssetsResponseDto(existingAssets.map((a) => a.deviceAssetId));
  }

  async countByIdAndUser(assetId: string, ownerId: string): Promise<number> {
    return await this.assetRepository.count({
      where: {
        id: assetId,
        ownerId,
      },
    });
  }
}
