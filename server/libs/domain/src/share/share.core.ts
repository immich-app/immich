import { AssetEntity, SharedLinkEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
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
    return this.repository.create({
      key: Buffer.from(this.cryptoRepository.randomBytes(50)),
      description: dto.description,
      userId,
      createdAt: new Date(),
      expiresAt: dto.expiresAt ?? null,
      type: dto.type,
      assets: dto.assets,
      album: dto.album,
      allowUpload: dto.allowUpload ?? false,
      allowDownload: dto.allowDownload ?? true,
      showExif: dto.showExif ?? true,
    });
  }

  async save(userId: string, id: string, entity: Partial<SharedLinkEntity>): Promise<SharedLinkEntity> {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return this.repository.save({ ...entity, userId, id });
  }

  async remove(userId: string, id: string): Promise<void> {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    await this.repository.remove(link);
  }

  async addAssets(userId: string, id: string, assets: AssetEntity[]) {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    return this.repository.save({ ...link, assets: [...link.assets, ...assets] });
  }

  async removeAssets(userId: string, id: string, assets: AssetEntity[]) {
    const link = await this.get(userId, id);
    if (!link) {
      throw new BadRequestException('Shared link not found');
    }

    const newAssets = link.assets.filter((asset) => assets.find((a) => a.id === asset.id));

    return this.repository.save({ ...link, assets: newAssets });
  }

  async hasAssetAccess(id: string, assetId: string): Promise<boolean> {
    return this.repository.hasAssetAccess(id, assetId);
  }

  checkDownloadAccess(user: AuthUserDto) {
    if (user.isPublicUser && !user.isAllowDownload) {
      throw new ForbiddenException();
    }
  }

  async validate(key: string | string[]): Promise<AuthUserDto | null> {
    key = Array.isArray(key) ? key[0] : key;

    const bytes = Buffer.from(key, key.length === 100 ? 'hex' : 'base64url');
    const link = await this.repository.getByKey(bytes);
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
