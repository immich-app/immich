import { SharedLinkEntity } from '@app/database/entities/shared-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Logger } from '@nestjs/common';

export interface ISharedLinkRepository {
  get(userId: string): Promise<SharedLinkEntity[]>;
  create(payload: SharedLinkEntity): Promise<SharedLinkEntity>;
}

export const SHARED_LINK_REPOSITORY = 'SHARED_LINK_REPOSITORY';

export class SharedLinkRepository implements ISharedLinkRepository {
  readonly logger = new Logger(SharedLinkRepository.name);
  constructor(
    @InjectRepository(SharedLinkEntity)
    private readonly sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  async get(userId: string): Promise<SharedLinkEntity[]> {
    return await this.sharedLinkRepository.find({
      where: {
        userId: userId,
      },
      relations: ['assets', 'albums'],
    });
  }

  async create(payload: SharedLinkEntity): Promise<SharedLinkEntity> {
    return await this.sharedLinkRepository.save(payload);
  }
}
