import { AssetEntity, SharedLinkEntity } from '@app/infra/db/entities';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { CreateSharedLinkDto } from './dto';
import { ISharedLinkRepository } from './shared-link.repository';

export class ShareCore {
  readonly logger = new Logger(ShareCore.name);

  constructor(private repository: ISharedLinkRepository, private cryptoRepository: ICryptoRepository) {}

  getAll(userId: string): Promise<SharedLinkEntity[]> {
    return this.repository.getAll(userId);
  }

  get(userId: string, id: string): Promise<SharedLinkEntity | null> {
    return this.repository.get(userId, id);
  }

  create(userId: string, dto: CreateSharedLinkDto): Promise<SharedLinkEntity> {
    try {
      return this.repository.create({
        key: Buffer.from(this.cryptoRepository.randomBytes(50)),
        description: dto.description,
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: dto.expiresAt ?? null,
        type: dto.type,
        assets: dto.assets,
        album: dto.album,
        allowUpload: dto.allowUpload ?? false,
        allowDownload: dto.allowDownload ?? true,
        showExif: dto.showExif ?? true,
      });
    } catch (error: any) {
      this.logger.error(error, error.stack);
      throw new InternalServerErrorException('failed to create shared link');
    }
  }

  async save(userId: string, id: string, entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity> {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return this.repository.save({ ...entity, userId, id });
  }

  async remove(userId: string, id: string): Promise<SharedLinkEntity> {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return this.repository.remove(link);
  }

  async updateAssets(userId: string, id: string, assets: AssetEntity[]) {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return this.repository.save({ ...link, assets });
  }

  async hasAssetAccess(id: string, assetId: string): Promise<boolean> {
    return this.repository.hasAssetAccess(id, assetId);
  }

  checkDownloadAccess(user: AuthUserDto) {
    if (user.isPublicUser && !user.isAllowDownload) {
      throw new ForbiddenException();
    }
  }

  async validate(key: string): Promise<AuthUserDto | null> {
    const link = await this.repository.getByKey(key);
    if (link) {
      if (!link.expiresAt || new Date(link.expiresAt) > new Date()) {
        const user = link.user;
        if (user) {
          return {
            id: user.id,
            email: user.email,
            isAdmin: user.isAdmin,
            isPublicUser: true,
            sharedLinkId: link.id,
            isAllowUpload: link.allowUpload,
            isAllowDownload: link.allowDownload,
            isShowExif: link.showExif,
          };
        }
      }
    }
    throw new UnauthorizedException('Invalid share key');
  }
}
