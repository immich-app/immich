import { AssetSearchOptions, IAssetRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType } from '../entities';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

  getByIds(ids: string[]): Promise<AssetEntity[]> {
    return this.repository.find({
      where: { id: In(ids) },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
      },
    });
  }

  async deleteAll(ownerId: string): Promise<void> {
    await this.repository.delete({ ownerId });
  }

  getAll(options?: AssetSearchOptions | undefined): Promise<AssetEntity[]> {
    options = options || {};

    return this.repository.find({
      where: {
        isVisible: options.isVisible,
      },
      relations: {
        exifInfo: true,
        smartInfo: true,
        tags: true,
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
      },
    });
  }

  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null> {
    return this.repository.findOne({
      where: {
        id: Not(otherAssetId),
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
}
