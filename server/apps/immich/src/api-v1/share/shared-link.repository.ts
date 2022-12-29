import { SharedLinkEntity, SharedLinkType } from '@app/database/entities/shared-link.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import crypto from 'node:crypto';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { InternalServerErrorException, Logger } from '@nestjs/common';

export interface ISharedLinkRepository {
  get(): Promise<SharedLinkEntity | null>;
  create(payload: SharedLinkEntity): Promise<SharedLinkEntity>;
}

export const SHARED_LINK_REPOSITORY = 'SHARED_LINK_REPOSITORY';

export class SharedLinkRepository implements ISharedLinkRepository {
  readonly logger = new Logger(SharedLinkRepository.name);
  constructor(
    @InjectRepository(SharedLinkEntity)
    private readonly sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  get(): Promise<SharedLinkEntity | null> {
    throw new Error('Method not implemented.');
  }

  async create(payload: SharedLinkEntity): Promise<SharedLinkEntity> {
    return await this.sharedLinkRepository.save(payload);
  }
}
