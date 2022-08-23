import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CreateAssetDto } from './dto/create-asset.dto';

export interface IAssetRepository {
  create(createAssetDto: CreateAssetDto, ownerId: string, originalPath: string, mimeType: string): Promise<AssetEntity>;
  getAllByUserId(userId: string): Promise<AssetEntity[]>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getById(assetId: string): Promise<AssetEntity>;
  getCountByTimeGroup(): any;
}

export const ASSET_REPOSITORY = 'ASSET_REPOSITORY';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

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

    const createdAsset = await this.assetRepository.save(asset);

    if (!createdAsset) {
      throw new BadRequestException('Asset not created');
    }
    return createdAsset;
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

  getCountByTimeGroup() {
    throw new Error('Method not implemented.');
  }
}
