import { AssetEntity, SharedLinkEntity, SharedLinkType } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { IAccessRepository } from '../access';
import { AssetIdErrorReason, AssetIdsDto, AssetIdsResponseDto } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { mapSharedLink, mapSharedLinkWithNoExif, SharedLinkResponseDto } from './shared-link-response.dto';
import { SharedLinkCreateDto, SharedLinkEditDto } from './shared-link.dto';
import { ISharedLinkRepository } from './shared-link.repository';

@Injectable()
export class SharedLinkService {
  constructor(
    @Inject(IAccessRepository) private accessRepository: IAccessRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISharedLinkRepository) private repository: ISharedLinkRepository,
  ) {}

  getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.repository.getAll(authUser.id).then((links) => links.map(mapSharedLink));
  }

  async getMine(authUser: AuthUserDto): Promise<SharedLinkResponseDto> {
    const { sharedLinkId: id, isPublicUser, isShowExif } = authUser;

    if (!isPublicUser || !id) {
      throw new ForbiddenException();
    }

    const sharedLink = await this.findOrFail(authUser, id);

    return this.map(sharedLink, { withExif: isShowExif ?? true });
  }

  async get(authUser: AuthUserDto, id: string): Promise<SharedLinkResponseDto> {
    const sharedLink = await this.findOrFail(authUser, id);
    return this.map(sharedLink, { withExif: true });
  }

  async create(authUser: AuthUserDto, dto: SharedLinkCreateDto): Promise<SharedLinkResponseDto> {
    switch (dto.type) {
      case SharedLinkType.ALBUM:
        if (!dto.albumId) {
          throw new BadRequestException('Invalid albumId');
        }

        const isAlbumOwner = await this.accessRepository.hasAlbumOwnerAccess(authUser.id, dto.albumId);
        if (!isAlbumOwner) {
          throw new BadRequestException('Invalid albumId');
        }

        break;

      case SharedLinkType.INDIVIDUAL:
        if (!dto.assetIds || dto.assetIds.length === 0) {
          throw new BadRequestException('Invalid assetIds');
        }

        for (const assetId of dto.assetIds) {
          const hasAccess = await this.accessRepository.hasOwnerAssetAccess(authUser.id, assetId);
          if (!hasAccess) {
            throw new BadRequestException(`No access to assetId: ${assetId}`);
          }
        }

        break;
    }

    const sharedLink = await this.repository.create({
      key: this.cryptoRepository.randomBytes(50),
      userId: authUser.id,
      type: dto.type,
      albumId: dto.albumId || null,
      assets: (dto.assetIds || []).map((id) => ({ id } as AssetEntity)),
      description: dto.description || null,
      expiresAt: dto.expiresAt || null,
      allowUpload: dto.allowUpload ?? true,
      allowDownload: dto.allowDownload ?? true,
      showExif: dto.showExif ?? true,
    });

    return this.map(sharedLink, { withExif: true });
  }

  async update(authUser: AuthUserDto, id: string, dto: SharedLinkEditDto) {
    await this.findOrFail(authUser, id);
    const sharedLink = await this.repository.update({
      id,
      userId: authUser.id,
      description: dto.description,
      expiresAt: dto.expiresAt,
      allowUpload: dto.allowUpload,
      allowDownload: dto.allowDownload,
      showExif: dto.showExif,
    });
    return this.map(sharedLink, { withExif: true });
  }

  async remove(authUser: AuthUserDto, id: string): Promise<void> {
    const sharedLink = await this.findOrFail(authUser, id);
    await this.repository.remove(sharedLink);
  }

  private async findOrFail(authUser: AuthUserDto, id: string) {
    const sharedLink = await this.repository.get(authUser.id, id);
    if (!sharedLink) {
      throw new BadRequestException('Shared link not found');
    }
    return sharedLink;
  }

  async addAssets(authUser: AuthUserDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    const sharedLink = await this.findOrFail(authUser, id);

    if (sharedLink.type !== SharedLinkType.INDIVIDUAL) {
      throw new BadRequestException('Invalid shared link type');
    }

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = sharedLink.assets.find((asset) => asset.id === assetId);
      if (hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.DUPLICATE });
        continue;
      }

      const hasAccess = await this.accessRepository.hasOwnerAssetAccess(authUser.id, assetId);
      if (!hasAccess) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ assetId, success: true });
      sharedLink.assets.push({ id: assetId } as AssetEntity);
    }

    await this.repository.update(sharedLink);

    return results;
  }

  async removeAssets(authUser: AuthUserDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    const sharedLink = await this.findOrFail(authUser, id);

    if (sharedLink.type !== SharedLinkType.INDIVIDUAL) {
      throw new BadRequestException('Invalid shared link type');
    }

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = sharedLink.assets.find((asset) => asset.id === assetId);
      if (!hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.NOT_FOUND });
        continue;
      }

      results.push({ assetId, success: true });
      sharedLink.assets = sharedLink.assets.filter((asset) => asset.id !== assetId);
    }

    await this.repository.update(sharedLink);

    return results;
  }

  private map(sharedLink: SharedLinkEntity, { withExif }: { withExif: boolean }) {
    return withExif ? mapSharedLink(sharedLink) : mapSharedLinkWithNoExif(sharedLink);
  }
}
