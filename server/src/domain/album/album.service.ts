import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from '../asset';
import { AuthDto } from '../auth';
import { setUnion } from '../domain.util';
import {
  AlbumAssetCount,
  AlbumInfoOptions,
  IAccessRepository,
  IAlbumRepository,
  IAssetRepository,
  IJobRepository,
  IUserRepository,
} from '../repositories';
import {
  AlbumCountResponseDto,
  AlbumResponseDto,
  mapAlbum,
  mapAlbumWithAssets,
  mapAlbumWithoutAssets,
} from './album-response.dto';
import { AddUsersDto, AlbumInfoDto, CreateAlbumDto, GetAlbumsDto, UpdateAlbumDto } from './dto';

@Injectable()
export class AlbumService {
  private access: AccessCore;
  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.access = AccessCore.create(accessRepository);
  }

  async getCount(auth: AuthDto): Promise<AlbumCountResponseDto> {
    const [owned, shared, notShared] = await Promise.all([
      this.albumRepository.getOwned(auth.user.id),
      this.albumRepository.getShared(auth.user.id),
      this.albumRepository.getNotShared(auth.user.id),
    ]);

    return {
      owned: owned.length,
      shared: shared.length,
      notShared: notShared.length,
    };
  }

  async getAll({ user: { id: ownerId } }: AuthDto, { assetId, shared }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    const invalidAlbumIds = await this.albumRepository.getInvalidThumbnail();
    for (const albumId of invalidAlbumIds) {
      const newThumbnail = await this.assetRepository.getFirstAssetForAlbumId(albumId);
      await this.albumRepository.update({ id: albumId, albumThumbnailAsset: newThumbnail });
    }

    let albums: AlbumEntity[];
    if (assetId) {
      albums = await this.albumRepository.getByAssetId(ownerId, assetId);
    } else if (shared === true) {
      albums = await this.albumRepository.getShared(ownerId);
    } else if (shared === false) {
      albums = await this.albumRepository.getNotShared(ownerId);
    } else {
      albums = await this.albumRepository.getOwned(ownerId);
    }

    // Get asset count for each album. Then map the result to an object:
    // { [albumId]: assetCount }
    const results = await this.albumRepository.getMetadataForIds(albums.map((album) => album.id));
    const albumMetadata: Record<string, AlbumAssetCount> = {};
    for (const metadata of results) {
      const { albumId, assetCount, startDate, endDate } = metadata;
      albumMetadata[albumId] = {
        albumId,
        assetCount,
        startDate,
        endDate,
      };
    }

    return Promise.all(
      albums.map(async (album) => {
        const lastModifiedAsset = await this.assetRepository.getLastUpdatedAssetForAlbumId(album.id);
        return {
          ...mapAlbumWithoutAssets(album),
          sharedLinks: undefined,
          startDate: albumMetadata[album.id].startDate,
          endDate: albumMetadata[album.id].endDate,
          assetCount: albumMetadata[album.id].assetCount,
          lastModifiedAssetTimestamp: lastModifiedAsset?.fileModifiedAt,
        };
      }),
    );
  }

  async get(auth: AuthDto, id: string, dto: AlbumInfoDto): Promise<AlbumResponseDto> {
    await this.access.requirePermission(auth, Permission.ALBUM_READ, id);
    await this.albumRepository.updateThumbnails();
    const withAssets = dto.withoutAssets === undefined ? true : !dto.withoutAssets;
    const album = await this.findOrFail(id, { withAssets });
    const [albumMetadataForIds] = await this.albumRepository.getMetadataForIds([album.id]);

    return {
      ...mapAlbum(album, withAssets),
      startDate: albumMetadataForIds.startDate,
      endDate: albumMetadataForIds.endDate,
      assetCount: albumMetadataForIds.assetCount,
    };
  }

  async create(auth: AuthDto, dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    for (const userId of dto.sharedWithUserIds || []) {
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        throw new BadRequestException('User not found');
      }
    }

    const album = await this.albumRepository.create({
      ownerId: auth.user.id,
      albumName: dto.albumName,
      description: dto.description,
      sharedUsers: dto.sharedWithUserIds?.map((value) => ({ id: value }) as UserEntity) ?? [],
      assets: (dto.assetIds || []).map((id) => ({ id }) as AssetEntity),
      albumThumbnailAssetId: dto.assetIds?.[0] || null,
    });

    return mapAlbumWithAssets(album);
  }

  async update(auth: AuthDto, id: string, dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    await this.access.requirePermission(auth, Permission.ALBUM_UPDATE, id);

    const album = await this.findOrFail(id, { withAssets: true });

    if (dto.albumThumbnailAssetId) {
      const valid = await this.albumRepository.hasAsset({ albumId: id, assetId: dto.albumThumbnailAssetId });
      if (!valid) {
        throw new BadRequestException('Invalid album thumbnail');
      }
    }
    const updatedAlbum = await this.albumRepository.update({
      id: album.id,
      albumName: dto.albumName,
      description: dto.description,
      albumThumbnailAssetId: dto.albumThumbnailAssetId,
      isActivityEnabled: dto.isActivityEnabled,
    });

    return mapAlbumWithoutAssets(updatedAlbum);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.access.requirePermission(auth, Permission.ALBUM_DELETE, id);

    const album = await this.findOrFail(id, { withAssets: false });

    await this.albumRepository.delete(album);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, { withAssets: false });

    await this.access.requirePermission(auth, Permission.ALBUM_READ, id);

    const existingAssetIds = await this.albumRepository.getAssetIds(id, dto.ids);
    const notPresentAssetIds = dto.ids.filter((id) => !existingAssetIds.has(id));
    const allowedAssetIds = await this.access.checkAccess(auth, Permission.ASSET_SHARE, notPresentAssetIds);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
        continue;
      }

      const hasAccess = allowedAssetIds.has(assetId);
      if (!hasAccess) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ id: assetId, success: true });
    }

    const newAssetIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (newAssetIds.length > 0) {
      await this.albumRepository.addAssets({ albumId: id, assetIds: newAssetIds });
      await this.albumRepository.update({
        id,
        updatedAt: new Date(),
        albumThumbnailAssetId: album.albumThumbnailAssetId ?? newAssetIds[0],
      });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, { withAssets: false });

    await this.access.requirePermission(auth, Permission.ALBUM_READ, id);

    const existingAssetIds = await this.albumRepository.getAssetIds(id, dto.ids);
    const canRemove = await this.access.checkAccess(auth, Permission.ALBUM_REMOVE_ASSET, existingAssetIds);
    const canShare = await this.access.checkAccess(auth, Permission.ASSET_SHARE, existingAssetIds);
    const allowedAssetIds = setUnion(canRemove, canShare);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (!hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
        continue;
      }

      const hasAccess = allowedAssetIds.has(assetId);
      if (!hasAccess) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ id: assetId, success: true });
    }

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.length > 0) {
      await this.albumRepository.removeAssets(id, removedIds);
      await this.albumRepository.update({ id, updatedAt: new Date() });
      if (album.albumThumbnailAssetId && removedIds.includes(album.albumThumbnailAssetId)) {
        await this.albumRepository.updateThumbnails();
      }
    }

    return results;
  }

  async addUsers(auth: AuthDto, id: string, dto: AddUsersDto): Promise<AlbumResponseDto> {
    await this.access.requirePermission(auth, Permission.ALBUM_SHARE, id);

    const album = await this.findOrFail(id, { withAssets: false });

    for (const userId of dto.sharedUserIds) {
      if (album.ownerId === userId) {
        throw new BadRequestException('Cannot be shared with owner');
      }

      const exists = album.sharedUsers.find((user) => user.id === userId);
      if (exists) {
        throw new BadRequestException('User already added');
      }

      const user = await this.userRepository.get(userId, {});
      if (!user) {
        throw new BadRequestException('User not found');
      }

      album.sharedUsers.push({ id: userId } as UserEntity);
    }

    return this.albumRepository
      .update({
        id: album.id,
        updatedAt: new Date(),
        sharedUsers: album.sharedUsers,
      })
      .then(mapAlbumWithoutAssets);
  }

  async removeUser(auth: AuthDto, id: string, userId: string | 'me'): Promise<void> {
    if (userId === 'me') {
      userId = auth.user.id;
    }

    const album = await this.findOrFail(id, { withAssets: false });

    if (album.ownerId === userId) {
      throw new BadRequestException('Cannot remove album owner');
    }

    const exists = album.sharedUsers.find((user) => user.id === userId);
    if (!exists) {
      throw new BadRequestException('Album not shared with user');
    }

    // non-admin can remove themselves
    if (auth.user.id !== userId) {
      await this.access.requirePermission(auth, Permission.ALBUM_SHARE, id);
    }

    await this.albumRepository.update({
      id: album.id,
      updatedAt: new Date(),
      sharedUsers: album.sharedUsers.filter((user) => user.id !== userId),
    });
  }

  private async findOrFail(id: string, options: AlbumInfoOptions) {
    const album = await this.albumRepository.getById(id, options);
    if (!album) {
      throw new BadRequestException('Album not found');
    }
    return album;
  }
}
