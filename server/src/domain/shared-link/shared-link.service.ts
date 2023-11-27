import { AssetEntity, SharedLinkEntity, SharedLinkType } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { AssetIdErrorReason, AssetIdsDto, AssetIdsResponseDto } from '../asset';
import { AuthUserDto } from '../auth';
import { IAccessRepository, ICryptoRepository, ISharedLinkRepository } from '../repositories';
import { SharedLinkResponseDto, mapSharedLink, mapSharedLinkWithoutMetadata } from './shared-link-response.dto';
import { SharedLinkCreateDto, SharedLinkEditDto, SharedLinkPasswordDto } from './shared-link.dto';

@Injectable()
export class SharedLinkService {
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(ISharedLinkRepository) private repository: ISharedLinkRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  getAll(authUser: AuthUserDto): Promise<SharedLinkResponseDto[]> {
    return this.repository.getAll(authUser.id).then((links) => links.map(mapSharedLink));
  }

  async getMine(authUser: AuthUserDto, dto: SharedLinkPasswordDto): Promise<SharedLinkResponseDto> {
    const { sharedLinkId: id, isPublicUser, isShowMetadata: isShowExif } = authUser;

    if (!isPublicUser || !id) {
      throw new ForbiddenException();
    }

    const sharedLink = await this.findOrFail(authUser, id);

    let newToken;
    if (sharedLink.password) {
      newToken = this.validateAndRefreshToken(sharedLink, dto);
    }

    return {
      ...this.map(sharedLink, { withExif: isShowExif ?? true }),
      token: newToken,
    };
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
        await this.access.requirePermission(authUser, Permission.ALBUM_SHARE, dto.albumId);
        break;

      case SharedLinkType.INDIVIDUAL:
        if (!dto.assetIds || dto.assetIds.length === 0) {
          throw new BadRequestException('Invalid assetIds');
        }

        await this.access.requirePermission(authUser, Permission.ASSET_SHARE, dto.assetIds);

        break;
    }

    const sharedLink = await this.repository.create({
      key: this.cryptoRepository.randomBytes(50),
      userId: authUser.id,
      type: dto.type,
      albumId: dto.albumId || null,
      assets: (dto.assetIds || []).map((id) => ({ id }) as AssetEntity),
      description: dto.description || null,
      password: dto.password,
      expiresAt: dto.expiresAt || null,
      allowUpload: dto.allowUpload ?? true,
      allowDownload: dto.allowDownload ?? true,
      showExif: dto.showMetadata ?? true,
    });

    return this.map(sharedLink, { withExif: true });
  }

  async update(authUser: AuthUserDto, id: string, dto: SharedLinkEditDto) {
    await this.findOrFail(authUser, id);
    const sharedLink = await this.repository.update({
      id,
      userId: authUser.id,
      description: dto.description,
      password: dto.password,
      expiresAt: dto.changeExpiryTime && !dto.expiresAt ? null : dto.expiresAt,
      allowUpload: dto.allowUpload,
      allowDownload: dto.allowDownload,
      showExif: dto.showMetadata,
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

    const existingAssetIds = new Set(sharedLink.assets.map((asset) => asset.id));
    const notPresentAssetIds = dto.assetIds.filter((assetId) => !existingAssetIds.has(assetId));
    const allowedAssetIds = await this.access.checkAccess(authUser, Permission.ASSET_SHARE, notPresentAssetIds);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const hasAsset = existingAssetIds.has(assetId);
      if (hasAsset) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.DUPLICATE });
        continue;
      }

      const hasAccess = allowedAssetIds.has(assetId);
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
    return withExif ? mapSharedLink(sharedLink) : mapSharedLinkWithoutMetadata(sharedLink);
  }

  private validateAndRefreshToken(sharedLink: SharedLinkEntity, dto: SharedLinkPasswordDto): string {
    const token = this.cryptoRepository.hashSha256(`${sharedLink.id}-${sharedLink.password}`);
    const sharedLinkTokens = dto.token?.split(',') || [];
    if (sharedLink.password !== dto.password && !sharedLinkTokens.includes(token)) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!sharedLinkTokens.includes(token)) {
      sharedLinkTokens.push(token);
    }
    return sharedLinkTokens.join(',');
  }
}
