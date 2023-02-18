import { ISharedLinkRepository } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedLinkEntity } from '../entities';

@Injectable()
export class SharedLinkRepository implements ISharedLinkRepository {
  readonly logger = new Logger(SharedLinkRepository.name);
  constructor(
    @InjectRepository(SharedLinkEntity)
    private readonly repository: Repository<SharedLinkEntity>,
  ) {}

  get(userId: string, id: string): Promise<SharedLinkEntity | null> {
    return this.repository.findOne({
      where: {
        id,
        userId,
      },
      relations: {
        assets: {
          exifInfo: true,
        },
        album: {
          assets: {
            exifInfo: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
        assets: {
          createdAt: 'ASC',
        },
        album: {
          assets: {
            createdAt: 'ASC',
          },
        },
      },
    });
  }

  getAll(userId: string): Promise<SharedLinkEntity[]> {
    return this.repository.find({
      where: {
        userId,
      },
      relations: {
        assets: true,
        album: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getByKey(key: string): Promise<SharedLinkEntity | null> {
    return await this.repository.findOne({
      where: {
        key: Buffer.from(key, 'hex'),
      },
      relations: {
        assets: true,
        album: {
          assets: true,
        },
        user: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  create(entity: Omit<SharedLinkEntity, 'id'>): Promise<SharedLinkEntity> {
    return this.repository.save(entity);
  }

  remove(entity: SharedLinkEntity): Promise<SharedLinkEntity> {
    return this.repository.remove(entity);
  }

  async save(entity: SharedLinkEntity): Promise<SharedLinkEntity> {
    await this.repository.save(entity);
    return this.repository.findOneOrFail({ where: { id: entity.id } });
  }

  async hasAssetAccess(id: string, assetId: string): Promise<boolean> {
    const count1 = await this.repository.count({
      where: {
        id,
        assets: {
          id: assetId,
        },
      },
    });

    const count2 = await this.repository.count({
      where: {
        id,
        album: {
          assets: {
            id: assetId,
          },
        },
      },
    });

    return Boolean(count1 + count2);
  }
}
