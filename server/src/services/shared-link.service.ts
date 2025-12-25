import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PostgresError } from 'postgres';
import { SharedLink } from 'src/database';
import { AssetIdErrorReason, AssetIdsResponseDto } from 'src/dtos/asset-ids.response.dto';
import { AssetIdsDto } from 'src/dtos/asset.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  mapSharedLink,
  mapSharedLinkWithoutMetadata,
  SharedLinkCreateDto,
  SharedLinkEditDto,
  SharedLinkPasswordDto,
  SharedLinkResponseDto,
  SharedLinkSearchDto,
} from 'src/dtos/shared-link.dto';
import { Permission, SharedLinkType } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { getExternalDomain, OpenGraphTags } from 'src/utils/misc';

@Injectable()
export class SharedLinkService extends BaseService {
  async getAll(auth: AuthDto, { id, albumId }: SharedLinkSearchDto): Promise<SharedLinkResponseDto[]> {
    return this.sharedLinkRepository
      .getAll({ userId: auth.user.id, id, albumId })
      .then((links) => links.map((link) => mapSharedLink(link)));
  }

  async getMine(auth: AuthDto, dto: SharedLinkPasswordDto): Promise<SharedLinkResponseDto> {
    if (!auth.sharedLink) {
      throw new ForbiddenException();
    }

    const sharedLink = await this.findOrFail(auth.user.id, auth.sharedLink.id);
    const response = this.mapToSharedLink(sharedLink, { withExif: sharedLink.showExif });
    if (sharedLink.password) {
      response.token = this.validateAndRefreshToken(sharedLink, dto);
    }

    return response;
  }

  async get(auth: AuthDto, id: string): Promise<SharedLinkResponseDto> {
    const sharedLink = await this.findOrFail(auth.user.id, id);
    return this.mapToSharedLink(sharedLink, { withExif: true });
  }

  async create(auth: AuthDto, dto: SharedLinkCreateDto): Promise<SharedLinkResponseDto> {
    switch (dto.type) {
      case SharedLinkType.Album: {
        if (!dto.albumId) {
          throw new BadRequestException('Invalid albumId');
        }
        await this.requireAccess({ auth, permission: Permission.AlbumShare, ids: [dto.albumId] });
        break;
      }

      case SharedLinkType.Individual: {
        if (!dto.assetIds || dto.assetIds.length === 0) {
          throw new BadRequestException('Invalid assetIds');
        }

        await this.requireAccess({ auth, permission: Permission.AssetShare, ids: dto.assetIds });

        break;
      }
    }

    try {
      const sharedLink = await this.sharedLinkRepository.create({
        key: this.cryptoRepository.randomBytes(50),
        userId: auth.user.id,
        type: dto.type,
        albumId: dto.albumId || null,
        assetIds: dto.assetIds,
        description: dto.description || null,
        password: dto.password,
        expiresAt: dto.expiresAt || null,
        allowUpload: dto.allowUpload ?? true,
        allowDownload: dto.showMetadata === false ? false : (dto.allowDownload ?? true),
        showExif: dto.showMetadata ?? true,
        slug: dto.slug || null,
      });

      return this.mapToSharedLink(sharedLink, { withExif: true });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if ((error as PostgresError).constraint_name === 'shared_link_slug_uq') {
      throw new BadRequestException('Shared link with this slug already exists');
    }
    throw error;
  }

  async update(auth: AuthDto, id: string, dto: SharedLinkEditDto) {
    await this.findOrFail(auth.user.id, id);
    try {
      const sharedLink = await this.sharedLinkRepository.update({
        id,
        userId: auth.user.id,
        description: dto.description,
        password: dto.password,
        expiresAt: dto.changeExpiryTime && !dto.expiresAt ? null : dto.expiresAt,
        allowUpload: dto.allowUpload,
        allowDownload: dto.allowDownload,
        showExif: dto.showMetadata,
        slug: dto.slug || null,
      });
      return this.mapToSharedLink(sharedLink, { withExif: true });
    } catch (error) {
      this.handleError(error);
    }
  }

  async remove(auth: AuthDto, id: string): Promise<void> {
    const sharedLink = await this.findOrFail(auth.user.id, id);
    await this.sharedLinkRepository.remove(sharedLink.id);
  }

  // TODO: replace `userId` with permissions and access control checks
  private async findOrFail(userId: string, id: string) {
    const sharedLink = await this.sharedLinkRepository.get(userId, id);
    if (!sharedLink) {
      throw new BadRequestException('Shared link not found');
    }
    return sharedLink;
  }

  async addAssets(auth: AuthDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    const sharedLink = await this.findOrFail(auth.user.id, id);

    if (sharedLink.type !== SharedLinkType.Individual) {
      throw new BadRequestException('Invalid shared link type');
    }

    const existingAssetIds = new Set(sharedLink.assets.map((asset) => asset.id));
    const notPresentAssetIds = dto.assetIds.filter((assetId) => !existingAssetIds.has(assetId));
    const allowedAssetIds = await this.checkAccess({
      auth,
      permission: Permission.AssetShare,
      ids: notPresentAssetIds,
    });

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
    }

    await this.sharedLinkRepository.update({
      ...sharedLink,
      assetIds: results.filter(({ success }) => success).map(({ assetId }) => assetId),
    });

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: AssetIdsDto): Promise<AssetIdsResponseDto[]> {
    const sharedLink = await this.findOrFail(auth.user.id, id);

    if (sharedLink.type !== SharedLinkType.Individual) {
      throw new BadRequestException('Invalid shared link type');
    }

    const removedAssetIds = await this.sharedLinkAssetRepository.remove(id, dto.assetIds);

    const results: AssetIdsResponseDto[] = [];
    for (const assetId of dto.assetIds) {
      const wasRemoved = removedAssetIds.find((id) => id === assetId);
      if (!wasRemoved) {
        results.push({ assetId, success: false, error: AssetIdErrorReason.NOT_FOUND });
        continue;
      }

      results.push({ assetId, success: true });
      sharedLink.assets = sharedLink.assets.filter((asset) => asset.id !== assetId);
    }

    await this.sharedLinkRepository.update(sharedLink);

    return results;
  }

  async getMetadataTags(auth: AuthDto, defaultDomain?: string): Promise<null | OpenGraphTags> {
    if (!auth.sharedLink || auth.sharedLink.password) {
      return null;
    }

    const config = await this.getConfig({ withCache: true });
    const sharedLink = await this.findOrFail(auth.sharedLink.userId, auth.sharedLink.id);
    const assetId = sharedLink.album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
    const assetCount = sharedLink.assets.length > 0 ? sharedLink.assets.length : sharedLink.album?.assets?.length || 0;
    const imagePath = assetId
      ? `/api/assets/${assetId}/thumbnail?key=${sharedLink.key.toString('base64url')}`
      : '/feature-panel.png';

    return {
      title: sharedLink.album ? sharedLink.album.albumName : 'Public Share',
      description: sharedLink.description || `${assetCount} shared photos & videos`,
      imageUrl: new URL(imagePath, getExternalDomain(config.server, defaultDomain)).href,
    };
  }

  private mapToSharedLink(sharedLink: SharedLink, { withExif }: { withExif: boolean }) {
    return withExif ? mapSharedLink(sharedLink) : mapSharedLinkWithoutMetadata(sharedLink);
  }

  private validateAndRefreshToken(sharedLink: SharedLink, dto: SharedLinkPasswordDto): string {
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
