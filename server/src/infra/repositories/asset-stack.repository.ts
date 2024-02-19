import { IAssetStackRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetStackEntity } from '../entities';
import { Span } from 'nestjs-otel';

@Injectable()
export class AssetStackRepository implements IAssetStackRepository {
  constructor(@InjectRepository(AssetStackEntity) private repository: Repository<AssetStackEntity>) {}

  @Span()
  create(entity: Partial<AssetStackEntity>) {
    return this.save(entity);
  }

  @Span()
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  @Span()
  update(entity: Partial<AssetStackEntity>) {
    return this.save(entity);
  }

  @Span()
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
