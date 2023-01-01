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
    try {
      const sharedLink = new SharedLinkEntity();

      sharedLink.id = crypto.randomBytes(35).toString('hex');
      sharedLink.key = crypto.randomBytes(25).toString('hex');
      sharedLink.description = dto.description;
      sharedLink.userId = userId;
      sharedLink.createdAt = new Date().toISOString();
      sharedLink.expiresAt = dto.expiredAt;

      if (dto.sharedType === SharedLinkType.ALBUM) {
        const assets: AssetEntity[] = [];

        const album = await this.albumRepository.get(dto.albumId);
        if (!album) {
          this.logger.error('Album not found');
          throw new BadRequestException('Album not found');
        }

        if (album.assets) {
          for (const asset of album.assets) {
            assets.push(asset.assetInfo);
          }
        }

        sharedLink.type = SharedLinkType.ALBUM;
        sharedLink.albums = [album];
        sharedLink.assets = assets;
      }

      if (dto.sharedType === SharedLinkType.INDIVIDUAL) {
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

      return this.sharedLinkRepository.create(sharedLink);
    } catch (error: any) {
      this.logger.error(error, error.stack);
      throw new InternalServerErrorException('failed to create shared link');
    }
  }

  async getSharedLinks(userId: string): Promise<SharedLinkEntity[]> {
    return this.sharedLinkRepository.get(userId);
  }

  async getSharedLinkById(id: string): Promise<SharedLinkEntity> {
    const link = await this.getSharedLink(id);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return link;
  }

  async removeSharedLink(id: string): Promise<SharedLinkEntity> {
    const link = await this.getSharedLink(id);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return await this.sharedLinkRepository.remove(link);
  }

  async updateAssetInSharedLink(id: string, assetIds: string[]): Promise<SharedLinkEntity> {
    const link = await this.getSharedLink(id);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    console.log(assetIds);

    return link;
  }

  async getSharedLink(id: string): Promise<SharedLinkEntity> {
    const link = await this.sharedLinkRepository.getbyId(id);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return link;
  }
}
