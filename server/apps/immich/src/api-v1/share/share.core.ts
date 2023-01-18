import { SharedLinkEntity } from '@app/infra';
import { CreateSharedLinkDto } from './dto/create-shared-link.dto';
import { ISharedLinkRepository } from './shared-link.repository';
import crypto from 'node:crypto';
import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { AssetEntity } from '@app/infra';
import { EditSharedLinkDto } from './dto/edit-shared-link.dto';

export class ShareCore {
  readonly logger = new Logger(ShareCore.name);

  constructor(private sharedLinkRepository: ISharedLinkRepository) {}

  async createSharedLink(userId: string, dto: CreateSharedLinkDto): Promise<SharedLinkEntity> {
    try {
      const sharedLink = new SharedLinkEntity();

      sharedLink.key = Buffer.from(crypto.randomBytes(50));
      sharedLink.description = dto.description;
      sharedLink.userId = userId;
      sharedLink.createdAt = new Date().toISOString();
      sharedLink.expiresAt = dto.expiredAt ?? null;
      sharedLink.type = dto.sharedType;
      sharedLink.assets = dto.assets;
      sharedLink.album = dto.album;
      sharedLink.allowUpload = dto.allowUpload ?? false;

      return this.sharedLinkRepository.create(sharedLink);
    } catch (error: any) {
      this.logger.error(error, error.stack);
      throw new InternalServerErrorException('failed to create shared link');
    }
  }

  getSharedLinks(userId: string): Promise<SharedLinkEntity[]> {
    return this.sharedLinkRepository.get(userId);
  }

  async removeSharedLink(id: string, userId: string): Promise<SharedLinkEntity> {
    const link = await this.sharedLinkRepository.getByIdAndUserId(id, userId);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return await this.sharedLinkRepository.remove(link);
  }

  getSharedLinkById(id: string): Promise<SharedLinkEntity | null> {
    return this.sharedLinkRepository.getById(id);
  }

  getSharedLinkByKey(key: string): Promise<SharedLinkEntity | null> {
    return this.sharedLinkRepository.getByKey(key);
  }

  async updateAssetsInSharedLink(sharedLinkId: string, assets: AssetEntity[]) {
    const link = await this.getSharedLinkById(sharedLinkId);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    link.assets = assets;

    return await this.sharedLinkRepository.save(link);
  }

  async updateSharedLink(id: string, userId: string, dto: EditSharedLinkDto): Promise<SharedLinkEntity> {
    const link = await this.sharedLinkRepository.getByIdAndUserId(id, userId);

    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    link.description = dto.description ?? link.description;
    link.allowUpload = dto.allowUpload ?? link.allowUpload;

    if (dto.isEditExpireTime && dto.expiredAt) {
      link.expiresAt = dto.expiredAt;
    } else if (dto.isEditExpireTime && !dto.expiredAt) {
      link.expiresAt = null;
    }

    return await this.sharedLinkRepository.save(link);
  }

  async hasAssetAccess(id: string, assetId: string): Promise<boolean> {
    return this.sharedLinkRepository.hasAssetAccess(id, assetId);
  }
}
