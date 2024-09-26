import { InjectRepository } from '@nestjs/typeorm';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetStatus } from 'src/enum';
import { ITrashRepository } from 'src/interfaces/trash.interface';
import { Paginated, paginatedBuilder, PaginationOptions } from 'src/utils/pagination';
import { In, Repository } from 'typeorm';

export class TrashRepository implements ITrashRepository {
  constructor(@InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>) {}

  async getDeletedIds(pagination: PaginationOptions): Paginated<string> {
    const { hasNextPage, items } = await paginatedBuilder(
      this.assetRepository
        .createQueryBuilder('asset')
        .select('asset.id')
        .where({ status: AssetStatus.DELETED })
        .withDeleted(),
      pagination,
    );

    return {
      hasNextPage,
      items: items.map((asset) => asset.id),
    };
  }

  async restore(userId: string): Promise<number> {
    const result = await this.assetRepository.update(
      { ownerId: userId, status: AssetStatus.TRASHED },
      { status: AssetStatus.ACTIVE, deletedAt: null },
    );

    return result.affected || 0;
  }

  async empty(userId: string): Promise<number> {
    const result = await this.assetRepository.update(
      { ownerId: userId, status: AssetStatus.TRASHED },
      { status: AssetStatus.DELETED },
    );

    return result.affected || 0;
  }

  async restoreAll(ids: string[]): Promise<number> {
    const result = await this.assetRepository.update(
      { id: In(ids), status: AssetStatus.TRASHED },
      { status: AssetStatus.ACTIVE, deletedAt: null },
    );
    return result.affected ?? 0;
  }
}
