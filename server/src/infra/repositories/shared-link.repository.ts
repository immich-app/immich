import { ISharedLinkRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SharedLinkEntity } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Instrumentation } from '../instrumentation';

@Instrumentation()
@Injectable()
export class SharedLinkRepository implements ISharedLinkRepository {
  constructor(@InjectRepository(SharedLinkEntity) private repository: Repository<SharedLinkEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
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

  @GenerateSql({ params: [DummyValue.UUID] })
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

  @GenerateSql({ params: [DummyValue.BUFFER] })
  async getByKey(key: Buffer): Promise<SharedLinkEntity | null> {
    return await this.repository.findOne({
      where: {
        key,
      },
      relations: {
        user: true,
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
