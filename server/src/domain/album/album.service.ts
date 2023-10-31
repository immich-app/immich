import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { AccessCore, Permission } from '../access';
import { BulkIdErrorReason, BulkIdResponseDto, BulkIdsDto } from '../asset';
import { AuthUserDto } from '../auth';
import { JobName } from '../job';
import {
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

  async getCount(authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    const [owned, shared, notShared] = await Promise.all([
      this.albumRepository.getOwned(authUser.id),
      this.albumRepository.getShared(authUser.id),
      this.albumRepository.getNotShared(authUser.id),
    ]);

    return {
      owned: owned.length,
      shared: shared.length,
      notShared: notShared.length,
    };
  }

  async getAll({ id: ownerId }: AuthUserDto, { assetId, shared }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
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
    const albumsAssetCount = await this.albumRepository.getAssetCountForIds(albums.map((album) => album.id));
    const albumsAssetCountObj = albumsAssetCount.reduce((obj: Record<string, number>, { albumId, assetCount }) => {
      obj[albumId] = assetCount;
      return obj;
    }, {});

    return Promise.all(
      albums.map(async (album) => {
        const lastModifiedAsset = await this.assetRepository.getLastUpdatedAssetForAlbumId(album.id);
        return {
          ...mapAlbumWithoutAssets(album),
          sharedLinks: undefined,
          assetCount: albumsAssetCountObj[album.id],
          lastModifiedAssetTimestamp: lastModifiedAsset?.fileModifiedAt,
        };
      }),
    );
  }

  async get(authUser: AuthUserDto, id: string, dto: AlbumInfoDto) {
    await this.access.requirePermission(authUser, Permission.ALBUM_READ, id);
    await this.albumRepository.updateThumbnails();
    return mapAlbum(await this.findOrFail(id, { withAssets: true }), !dto.withoutAssets);
  }

  async create(authUser: AuthUserDto, dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    for (const userId of dto.sharedWithUserIds || []) {
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        throw new BadRequestException('User not found');
      }
    }

    const album = await this.albumRepository.create({
      ownerId: authUser.id,
      albumName: dto.albumName,
      description: dto.description,
      sharedUsers: dto.sharedWithUserIds?.map((value) => ({ id: value }) as UserEntity) ?? [],
      assets: (dto.assetIds || []).map((id) => ({ id }) as AssetEntity),
      albumThumbnailAssetId: dto.assetIds?.[0] || null,
    });

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [album.id] } });
    return mapAlbumWithAssets(album);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    await this.access.requirePermission(authUser, Permission.ALBUM_UPDATE, id);

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
    });

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [updatedAlbum.id] } });

    return mapAlbumWithoutAssets(updatedAlbum);
  }

  async delete(authUser: AuthUserDto, id: string): Promise<void> {
    await this.access.requirePermission(authUser, Permission.ALBUM_DELETE, id);

    const album = await this.findOrFail(id, { withAssets: false });

    await this.albumRepository.delete(album);
    await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ALBUM, data: { ids: [id] } });
  }

  async addAssets(authUser: AuthUserDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, { withAssets: false });

    await this.access.requirePermission(authUser, Permission.ALBUM_READ, id);

    const existingAssetIds = await this.albumRepository.getAssetIds(id, dto.ids);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.DUPLICATE });
        continue;
      }

      const hasAccess = await this.access.hasPermission(authUser, Permission.ASSET_SHARE, assetId);
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

  async removeAssets(authUser: AuthUserDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, { withAssets: false });

    await this.access.requirePermission(authUser, Permission.ALBUM_READ, id);

    const existingAssetIds = await this.albumRepository.getAssetIds(id, dto.ids);

    const results: BulkIdResponseDto[] = [];
    for (const assetId of dto.ids) {
      const hasAsset = existingAssetIds.has(assetId);
      if (!hasAsset) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NOT_FOUND });
        continue;
      }

      const hasAccess = await this.access.hasAny(authUser, [
        { permission: Permission.ALBUM_REMOVE_ASSET, id: assetId },
        { permission: Permission.ASSET_SHARE, id: assetId },
      ]);
      if (!hasAccess) {
        results.push({ id: assetId, success: false, error: BulkIdErrorReason.NO_PERMISSION });
        continue;
      }

      results.push({ id: assetId, success: true });
    }

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.length > 0) {
      await this.albumRepository.removeAssets({ albumId: id, assetIds: removedIds });
      await this.albumRepository.update({ id, updatedAt: new Date() });
      if (album.albumThumbnailAssetId && removedIds.includes(album.albumThumbnailAssetId)) {
        await this.albumRepository.updateThumbnails();
      }
    }

    return results;
  }

  async addUsers(authUser: AuthUserDto, id: string, dto: AddUsersDto): Promise<AlbumResponseDto> {
    await this.access.requirePermission(authUser, Permission.ALBUM_SHARE, id);

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

  async removeUser(authUser: AuthUserDto, id: string, userId: string | 'me'): Promise<void> {
    if (userId === 'me') {
      userId = authUser.id;
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
    if (authUser.id !== userId) {
      await this.access.requirePermission(authUser, Permission.ALBUM_SHARE, id);
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
