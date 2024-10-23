import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SessionSyncStateEntity, SyncCheckpoint } from 'src/entities/session-sync-state.entity';
import {
  AlbumAssetEntity,
  AlbumAssetPK,
  AssetPartnerSyncOptions,
  DeletedEntity,
  EntityPK,
  ISyncRepository,
  SyncOptions,
} from 'src/interfaces/sync.interface';
import { paginate, Paginated } from 'src/utils/pagination';
import { DataSource, FindOptionsWhere, In, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';

const withCheckpoint = <T>(where: FindOptionsWhere<T>, key: keyof T, checkpoint?: SyncCheckpoint) => {
  if (!checkpoint) {
    return [where];
  }

  const { id: checkpointId, timestamp } = checkpoint;
  const checkpointDate = new Date(timestamp);
  return [
    {
      ...where,
      [key]: MoreThanOrEqual(new Date(checkpointDate)),
      id: MoreThan(checkpointId),
    },
    {
      ...where,
      [key]: MoreThan(checkpointDate),
    },
  ];
};

@Injectable()
export class SyncRepository implements ISyncRepository {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
    @InjectRepository(SessionSyncStateEntity) private repository: Repository<SessionSyncStateEntity>,
  ) {}

  get(sessionId: string): Promise<SessionSyncStateEntity | null> {
    return this.repository.findOneBy({ sessionId });
  }

  async upsert(state: Partial<SessionSyncStateEntity>): Promise<void> {
    await this.repository.upsert(state, { conflictPaths: ['sessionId'] });
  }

  getAssets({ checkpoint, userId, ...options }: AssetPartnerSyncOptions): Paginated<AssetEntity> {
    return paginate(this.assetRepository, options, {
      where: withCheckpoint<AssetEntity>({ ownerId: userId }, 'updatedAt', checkpoint),
      order: {
        updatedAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  getDeletedAssets(): Paginated<DeletedEntity<EntityPK>> {
    return Promise.resolve({ items: [], hasNextPage: false });
  }

  getAssetsPartner({ checkpoint, partnerIds, ...options }: AssetPartnerSyncOptions): Paginated<AssetEntity> {
    return paginate(this.assetRepository, options, {
      where: withCheckpoint<AssetEntity>({ ownerId: In(partnerIds) }, 'updatedAt', checkpoint),
      order: {
        updatedAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  getDeletedAssetsPartner(): Paginated<DeletedEntity<EntityPK>> {
    return Promise.resolve({ items: [], hasNextPage: false });
  }

  getAlbums({ checkpoint, userId, ...options }: SyncOptions): Paginated<AlbumEntity> {
    return paginate(this.albumRepository, options, {
      where: withCheckpoint<AlbumEntity>({ ownerId: userId }, 'updatedAt', checkpoint),
      order: {
        updatedAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  getDeletedAlbums(): Paginated<DeletedEntity<EntityPK>> {
    return Promise.resolve({ items: [], hasNextPage: false });
  }

  getAlbumAssets(): Paginated<AlbumAssetEntity> {
    return Promise.resolve({ items: [], hasNextPage: false });
  }

  getDeletedAlbumAssets(): Paginated<DeletedEntity<AlbumAssetPK>> {
    return Promise.resolve({ items: [], hasNextPage: false });
  }
}
