import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AssetStackEntity } from 'src/entities/asset-stack.entity';
import { IAssetStackRepository } from 'src/interfaces/asset-stack.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class AssetStackRepository implements IAssetStackRepository {
  constructor(@InjectRepository(AssetStackEntity) private repository: Repository<AssetStackEntity>) {}

  create(entity: Partial<AssetStackEntity>) {
    return this.save(entity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  update(entity: Partial<AssetStackEntity>) {
    return this.save(entity);
  }

  async getById(id: string): Promise<AssetStackEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: {
        primaryAsset: true,
        assets: true,
      },
    });
  }

  private async save(entity: Partial<AssetStackEntity>) {
    const { id } = await this.repository.save(entity);
    return this.repository.findOneOrFail({
      where: {
        id,
      },
      relations: {
        primaryAsset: true,
        assets: true,
      },
    });
  }
}
