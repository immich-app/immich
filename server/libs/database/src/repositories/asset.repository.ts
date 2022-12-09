import { IAssetRepository, ServerUsageItems } from '@app/common';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../entities';

@Injectable()
export class AssetRepository implements IAssetRepository {
  constructor(@InjectRepository(AssetEntity) private repository: Repository<AssetEntity>) {}

  public async getUserStats(): Promise<ServerUsageItems> {
    const items = await this.repository
      .createQueryBuilder('a')
      .select('COUNT(a.id)', 'assetCount')
      .addSelect('SUM(ei.fileSizeInByte)', 'totalSizeInBytes')
      .addSelect('a."userId"')
      .addSelect('a.type', 'assetType')
      .where('a.isVisible = true')
      .leftJoin('a.exifInfo', 'ei')
      .groupBy('a."userId"')
      .addGroupBy('a.type')
      .getRawMany();

    return items.map((item) => ({
      ...item,
      assetCount: Number(item.assetCount),
      totalSizeInBytes: Number(item.totalSizeInBytes),
    }));
  }
}
