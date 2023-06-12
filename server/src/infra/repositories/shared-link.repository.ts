import { ISharedLinkRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedLinkEntity } from '../entities';

@Injectable()
export class SharedLinkRepository implements ISharedLinkRepository {
  constructor(@InjectRepository(SharedLinkEntity) private repository: Repository<SharedLinkEntity>) {}

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
          owner: true,
        },
      },
      order: {
        createdAt: 'DESC',
        assets: {
          fileCreatedAt: 'ASC',
        },
        album: {
          assets: {
            fileCreatedAt: 'ASC',
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
        album: {
          owner: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async getByKey(key: Buffer): Promise<SharedLinkEntity | null> {
    return await this.repository.findOne({
      where: {
        key,
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

  create(entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity> {
    return this.save(entity);
  }

  update(entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity> {
    return this.save(entity);
  }

  async remove(entity: SharedLinkEntity): Promise<void> {
    await this.repository.remove(entity);
  }

  private async save(entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity> {
    await this.repository.save(entity);
    return this.repository.findOneOrFail({ where: { id: entity.id } });
  }
}
