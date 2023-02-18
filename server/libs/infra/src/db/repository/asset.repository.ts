import { IAssetRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../entities';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

  async deleteAll(ownerId: string): Promise<void> {
    await this.repository.delete({ ownerId });
  }
}
