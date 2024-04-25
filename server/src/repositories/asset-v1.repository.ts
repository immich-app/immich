import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetSearchDto, CheckExistingAssetsDto } from 'src/dtos/asset-v1.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetCheck, AssetOwnerCheck, IAssetRepositoryV1 } from 'src/interfaces/asset-v1.interface';
import { OptionalBetween } from 'src/utils/database';
import { In } from 'typeorm/find-options/operator/In.js';
import { Repository } from 'typeorm/repository/Repository.js';

@Injectable()
export class AssetRepositoryV1 implements IAssetRepositoryV1 {
  constructor(@InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>) {}

  /**
   * Retrieves all assets by user ID.
   *
   * @param ownerId - The ID of the owner.
   * @param dto - The AssetSearchDto object containing search criteria.
   * @returns A Promise that resolves to an array of AssetEntity objects.
   */
  getAllByUserId(ownerId: string, dto: AssetSearchDto): Promise<AssetEntity[]> {
    return this.assetRepository.find({
      where: {
        ownerId,
        isVisible: true,
        isFavorite: dto.isFavorite,
        isArchived: dto.isArchived,
        updatedAt: OptionalBetween(dto.updatedAfter, dto.updatedBefore),
      },
      relations: {
        exifInfo: true,
        tags: true,
        stack: { assets: true },
      },
      skip: dto.skip || 0,
      take: dto.take,
      order: {
        fileCreatedAt: 'DESC',
      },
      withDeleted: true,
    });
  }

  get(id: string): Promise<AssetEntity | null> {
    return this.assetRepository.findOne({
      where: { id },
      relations: {
        faces: {
          person: true,
        },
        library: true,
      },
      withDeleted: true,
    });
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
      withDeleted: true,
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
      withDeleted: true,
    });
    return assets.map((asset) => asset.deviceAssetId);
  }

  getByOriginalPath(originalPath: string): Promise<AssetOwnerCheck | null> {
    return this.assetRepository.findOne({
      select: {
        id: true,
        ownerId: true,
        checksum: true,
      },
      where: {
        originalPath,
      },
    });
  }
}
