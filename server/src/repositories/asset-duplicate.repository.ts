import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetDuplicateEntity } from 'src/entities/asset-duplicate.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAssetDuplicateRepository } from 'src/interfaces/asset-duplicate.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AssetDuplicateRepository implements IAssetDuplicateRepository {
  constructor(@InjectRepository(AssetDuplicateEntity) private repository: Repository<AssetDuplicateEntity>) {}

  async create(duplicateId: string, assetIds: string[]) {
    await this.repository.manager.transaction(async (manager) => {
      await manager.upsert(
        AssetDuplicateEntity,
        assetIds.map((assetId) => ({ duplicateId, assetId })),
        ['assetId'],
      );
      await manager.update(AssetEntity, assetIds, { duplicateId });
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async getById(id: string): Promise<AssetDuplicateEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: {
        assets: true,
      },
    });
  }
}
