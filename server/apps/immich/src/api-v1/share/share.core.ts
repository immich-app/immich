import { SharedLinkEntity, SharedLinkType } from '@app/database/entities/shared-link.entity';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { ISharedLinkRepository } from './shared-link.repository';
import crypto from 'node:crypto';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { IAssetRepository } from '../asset/asset-repository';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { IAlbumRepository } from '../album/album-repository';

export class ShareCore {
  readonly logger = new Logger(ShareCore.name);

  constructor(
    private sharedLinkRepository: ISharedLinkRepository,
    private assetRepository: IAssetRepository,
    private albumRepository: IAlbumRepository,
  ) {}

  async createSharedLink(userId: string, dto: CreateSharedLinkDto): Promise<SharedLinkEntity> {
    const sharedLink = new SharedLinkEntity();

    sharedLink.id = crypto.randomBytes(35).toString('hex');
    sharedLink.key = crypto.randomBytes(25).toString('hex');
    sharedLink.description = dto.description;
    sharedLink.userId = userId;
    sharedLink.createdAt = new Date().toISOString();
    sharedLink.expiresAt = dto.expiredAt;

    if (dto.assetIds?.length) {
      const assets: AssetEntity[] = [];

      for (const id of dto.assetIds) {
        const asset = await this.assetRepository.getById(id);
        assets.push(asset);
      }

      if (assets.length == 0) {
        throw new BadRequestException('Assets not found');
      }
      sharedLink.type = SharedLinkType.INDIVIDUAL;
      sharedLink.assets = assets;
    }

    if (dto.albumId) {
      const album = await this.albumRepository.get(dto.albumId);
      if (!album) {
        this.logger.error('Album not found');
        throw new BadRequestException('Album not found');
      }
      sharedLink.type = SharedLinkType.ALBUM;
      sharedLink.albums = [album];
    }

    return this.sharedLinkRepository.create(sharedLink);
  }
}
