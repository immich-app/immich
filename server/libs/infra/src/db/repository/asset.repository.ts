import {
  AssetCountByTimeBucket,
  AssetCountByUserIdResponseDto,
  AssetSearchDto,
  CheckExistingAssetsDto,
  CheckExistingAssetsResponseDto,
  CuratedLocationsResponseDto,
  CuratedObjectsResponseDto,
  GetAssetByTimeBucketDto,
  IAssetRepository,
  SearchPropertiesDto,
  TimeGroupEnum,
  UpdateAssetDto,
} from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not } from 'typeorm';
import { In } from 'typeorm/find-options/operator/In';
import { Repository } from 'typeorm/repository/Repository';
import { AssetEntity, AssetType, TagEntity } from '../entities';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(TagEntity) private tagRepository: Repository<TagEntity>,
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

  async getAssetWithNoSmartInfo(): Promise<AssetEntity[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.smartInfo', 'si')
      .where('asset.resizePath IS NOT NULL')
      .andWhere('si.id IS NULL')
      .andWhere('asset.isVisible = true')
      .getMany();
  }

  async getAssetWithNoThumbnail(): Promise<AssetEntity[]> {
    return await this.assetRepository.find({
      where: [
        { resizePath: IsNull(), isVisible: true },
        { resizePath: '', isVisible: true },
        { webpPath: IsNull(), isVisible: true },
        { webpPath: '', isVisible: true },
      ],
    });
  }

  async getAssetWithNoEncodedVideo(): Promise<AssetEntity[]> {
    return await this.assetRepository.find({
      where: [
        { type: AssetType.VIDEO, encodedVideoPath: IsNull() },
        { type: AssetType.VIDEO, encodedVideoPath: '' },
      ],
    });
  }

  async getAssetWithNoEXIF(): Promise<AssetEntity[]> {
    return await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.exifInfo', 'ei')
      .where('ei."assetId" IS NULL')
      .andWhere('asset.isVisible = true')
      .getMany();
  }

  async getAssetCountByUserId(userId: string): Promise<AssetCountByUserIdResponseDto> {
    // Get asset count by AssetType
    const items = await this.assetRepository
      .createQueryBuilder('asset')
      .select(`COUNT(asset.id)`, 'count')
      .addSelect(`asset.type`, 'type')
      .where('"userId" = :userId', { userId: userId })
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
      .where('asset.userId = :userId', { userId: userId })
      .andWhere(`date_trunc('month', "createdAt") IN (:...buckets)`, {
        buckets: [...getAssetByTimeBucketDto.timeBucket],
      })
      .andWhere('asset.resizePath is not NULL')
      .andWhere('asset.isVisible = true')
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
        .andWhere('asset.isVisible = true')
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
        .andWhere('asset.isVisible = true')
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
        WHERE a."userId" = $1
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
        WHERE a."userId" = $1
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
      relations: ['exifInfo', 'tags', 'sharedLinks'],
    });
  }

  /**
   * Get all assets belong to the user on the database
   * @param userId
   */
  async getAllByUserId(userId: string, dto: AssetSearchDto): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        userId,
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
        createdAt: 'DESC',
      },
    });
  }

  get(id: string): Promise<AssetEntity | null> {
    return this.assetRepository.findOne({ where: { id } });
  }

  async create(asset: Omit<AssetEntity, 'id'>): Promise<AssetEntity> {
    return this.assetRepository.save(asset);
  }

  save(asset: AssetEntity): Promise<AssetEntity> {
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

    if (dto.tagIds) {
      const tags = await this.tagRepository.find({
        where: { id: In(dto.tagIds), userId },
        relations: {
          user: true,
        },
      });
      asset.tags = tags;
    }

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

  async countByIdAndUser(assetId: string, userId: string): Promise<number> {
    return await this.assetRepository.count({
      where: {
        id: assetId,
        userId,
      },
    });
  }

  async searchAsset(userId: string, term: string): Promise<AssetEntity[]> {
    const query = `
    SELECT a.*
    FROM assets a
             LEFT JOIN smart_info si ON a.id = si."assetId"
             LEFT JOIN exif e ON a.id = e."assetId"

    WHERE a."userId" = $1
       AND
       (
         TO_TSVECTOR('english', ARRAY_TO_STRING(si.tags, ',')) @@ PLAINTO_TSQUERY('english', $2) OR
         TO_TSVECTOR('english', ARRAY_TO_STRING(si.objects, ',')) @@ PLAINTO_TSQUERY('english', $2) OR
         e."exifTextSearchableColumn" @@ PLAINTO_TSQUERY('english', $2)
        );
    `;

    return this.assetRepository.query(query, [userId, term]);
  }

  checkExistingAsset(userId: string, deviceId: string, deviceAssetId: string): Promise<AssetEntity | null> {
    return this.assetRepository.findOne({
      where: {
        deviceAssetId,
        deviceId,
        userId,
      },
    });
  }
}
