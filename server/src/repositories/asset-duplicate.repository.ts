import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetDuplicateEntity } from 'src/entities/asset-duplicate.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAssetDuplicateRepository } from 'src/interfaces/asset-duplicate.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { In, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AssetDuplicateRepository implements IAssetDuplicateRepository {
  constructor(@InjectRepository(AssetDuplicateEntity) private repository: Repository<AssetDuplicateEntity>) {}

  async upsert(id: string, assetIds: string[], oldDuplicateIds: string[] = []): Promise<void> {
    await this.repository.manager.transaction(async (manager) => {
      await manager.upsert(
        AssetDuplicateEntity,
        assetIds.map((assetId) => ({ id, assetId })),
        ['assetId'],
      );
      if (oldDuplicateIds.length > 0) {
        await manager.update(AssetDuplicateEntity, { id: In(oldDuplicateIds) }, { id });
      }
      await manager.update(AssetEntity, { id: In(assetIds) }, { duplicateId: id });
      await manager.update(AssetEntity, { duplicateId: In(oldDuplicateIds) }, { duplicateId: id });
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
