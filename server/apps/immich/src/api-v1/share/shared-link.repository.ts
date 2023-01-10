import { SharedLinkEntity } from '@app/database/entities/shared-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Logger } from '@nestjs/common';

export interface ISharedLinkRepository {
  get(userId: string): Promise<SharedLinkEntity[]>;
  getById(id: string): Promise<SharedLinkEntity | null>;
  getByIdAndUserId(id: string, userId: string): Promise<SharedLinkEntity | null>;
  getByKey(key: string): Promise<SharedLinkEntity | null>;
  create(payload: SharedLinkEntity): Promise<SharedLinkEntity>;
  remove(entity: SharedLinkEntity): Promise<SharedLinkEntity>;
  save(entity: SharedLinkEntity): Promise<SharedLinkEntity>;
  hasAssetAccess(id: string, assetId: string): Promise<boolean>;
}

export const ISharedLinkRepository = 'ISharedLinkRepository';

export class SharedLinkRepository implements ISharedLinkRepository {
  readonly logger = new Logger(SharedLinkRepository.name);
  constructor(
    @InjectRepository(SharedLinkEntity)
    private readonly sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}
  async getByIdAndUserId(id: string, userId: string): Promise<SharedLinkEntity | null> {
    return await this.sharedLinkRepository.findOne({
      where: {
        userId: userId,
        id: id,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async get(userId: string): Promise<SharedLinkEntity[]> {
    return await this.sharedLinkRepository.find({
      where: {
        userId: userId,
      },
      relations: ['assets', 'album'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async create(payload: SharedLinkEntity): Promise<SharedLinkEntity> {
    return await this.sharedLinkRepository.save(payload);
  }

  async getById(id: string): Promise<SharedLinkEntity | null> {
    return await this.sharedLinkRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        assets: {
          exifInfo: true,
        },
        album: {
          assets: {
            assetInfo: {
              exifInfo: true,
            },
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
            assetInfo: {
              createdAt: 'ASC',
            },
          },
        },
      },
    });
  }

  async getByKey(key: string): Promise<SharedLinkEntity | null> {
    return await this.sharedLinkRepository.findOne({
      where: {
        key: Buffer.from(key, 'hex'),
      },
      relations: {
        assets: true,
        album: {
          assets: {
            assetInfo: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async remove(entity: SharedLinkEntity): Promise<SharedLinkEntity> {
    return await this.sharedLinkRepository.remove(entity);
  }

  async save(entity: SharedLinkEntity): Promise<SharedLinkEntity> {
    return await this.sharedLinkRepository.save(entity);
  }

  async hasAssetAccess(id: string, assetId: string): Promise<boolean> {
    const count1 = await this.sharedLinkRepository.count({
      where: {
        id,
        assets: {
          id: assetId,
        },
      },
    });

    const count2 = await this.sharedLinkRepository.count({
      where: {
        id,
        album: {
          assets: {
            assetId,
          },
        },
      },
    });

    return Boolean(count1 + count2);
  }
}
