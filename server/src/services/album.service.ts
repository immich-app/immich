import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AddUsersDto,
  AlbumInfoDto,
  AlbumResponseDto,
  AlbumStatisticsResponseDto,
  CreateAlbumDto,
  GetAlbumsDto,
  UpdateAlbumDto,
  mapAlbum,
  mapAlbumWithAssets,
  mapAlbumWithoutAssets,
} from 'src/dtos/album.dto';
import { BulkIdResponseDto, BulkIdsDto } from 'src/dtos/asset-ids.response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { AlbumUserEntity } from 'src/entities/album-user.entity';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { Permission } from 'src/enum';
import { AlbumAssetCount, AlbumInfoOptions } from 'src/interfaces/album.interface';
import { BaseService } from 'src/services/base.service';
import { addAssets, removeAssets } from 'src/utils/asset.util';

@Injectable()
export class AlbumService extends BaseService {
  async getStatistics(auth: AuthDto): Promise<AlbumStatisticsResponseDto> {
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
    await this.albumRepository.updateThumbnails();

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
    await this.requireAccess({ auth, permission: Permission.ALBUM_READ, ids: [id] });
    await this.albumRepository.updateThumbnails();
    const withAssets = dto.withoutAssets === undefined ? true : !dto.withoutAssets;
    const album = await this.findOrFail(id, { withAssets });
    const [albumMetadataForIds] = await this.albumRepository.getMetadataForIds([album.id]);

    return {
      ...mapAlbum(album, withAssets, auth),
      startDate: albumMetadataForIds.startDate,
      endDate: albumMetadataForIds.endDate,
      assetCount: albumMetadataForIds.assetCount,
    };
  }

  async create(auth: AuthDto, dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    const albumUsers = dto.albumUsers || [];

    for (const { userId } of albumUsers) {
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        throw new BadRequestException('User not found');
      }
    }

    const allowedAssetIdsSet = await this.checkAccess({
      auth,
      permission: Permission.ASSET_SHARE,
      ids: dto.assetIds || [],
    });
    const assets = [...allowedAssetIdsSet].map((id) => ({ id }) as AssetEntity);

    const album = await this.albumRepository.create({
      ownerId: auth.user.id,
      albumName: dto.albumName,
      description: dto.description,
      albumUsers: albumUsers.map((albumUser) => albumUser as AlbumUserEntity) ?? [],
      assets,
      albumThumbnailAssetId: assets[0]?.id || null,
    });

    for (const { userId } of albumUsers) {
      await this.eventRepository.emit('album.invite', { id: album.id, userId });
    }

    return mapAlbumWithAssets(album);
  }

  async update(auth: AuthDto, id: string, dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_UPDATE, ids: [id] });

    const album = await this.findOrFail(id, { withAssets: true });

    if (dto.albumThumbnailAssetId) {
      const results = await this.albumRepository.getAssetIds(id, [dto.albumThumbnailAssetId]);
      if (results.size === 0) {
        throw new BadRequestException('Invalid album thumbnail');
      }
    }
    const updatedAlbum = await this.albumRepository.update({
      id: album.id,
      albumName: dto.albumName,
      description: dto.description,
      albumThumbnailAssetId: dto.albumThumbnailAssetId,
      isActivityEnabled: dto.isActivityEnabled,
      order: dto.order,
    });

    return mapAlbumWithoutAssets(updatedAlbum);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_DELETE, ids: [id] });
    await this.albumRepository.delete(id);
  }

  async addAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    const album = await this.findOrFail(id, { withAssets: false });
    await this.requireAccess({ auth, permission: Permission.ALBUM_ADD_ASSET, ids: [id] });

    const results = await addAssets(
      auth,
      { access: this.accessRepository, bulk: this.albumRepository },
      { parentId: id, assetIds: dto.ids },
    );

    const { id: firstNewAssetId } = results.find(({ success }) => success) || {};
    if (firstNewAssetId) {
      await this.albumRepository.update({
        id,
        updatedAt: new Date(),
        albumThumbnailAssetId: album.albumThumbnailAssetId ?? firstNewAssetId,
      });

      await this.eventRepository.emit('album.update', { id, updatedBy: auth.user.id });
    }

    return results;
  }

  async removeAssets(auth: AuthDto, id: string, dto: BulkIdsDto): Promise<BulkIdResponseDto[]> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_REMOVE_ASSET, ids: [id] });

    const album = await this.findOrFail(id, { withAssets: false });
    const results = await removeAssets(
      auth,
      { access: this.accessRepository, bulk: this.albumRepository },
      { parentId: id, assetIds: dto.ids, canAlwaysRemove: Permission.ALBUM_DELETE },
    );

    const removedIds = results.filter(({ success }) => success).map(({ id }) => id);
    if (removedIds.length > 0) {
      await this.albumRepository.update({ id, updatedAt: new Date() });
      if (album.albumThumbnailAssetId && removedIds.includes(album.albumThumbnailAssetId)) {
        await this.albumRepository.updateThumbnails();
      }
    }

    return results;
  }

  async addUsers(auth: AuthDto, id: string, { albumUsers }: AddUsersDto): Promise<AlbumResponseDto> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_SHARE, ids: [id] });

    const album = await this.findOrFail(id, { withAssets: false });

    for (const { userId, role } of albumUsers) {
      if (album.ownerId === userId) {
        throw new BadRequestException('Cannot be shared with owner');
      }

      const exists = album.albumUsers.find(({ user: { id } }) => id === userId);
      if (exists) {
        throw new BadRequestException('User already added');
      }

      const user = await this.userRepository.get(userId, {});
      if (!user) {
        throw new BadRequestException('User not found');
      }

      await this.albumUserRepository.create({ userId, albumId: id, role });
      await this.eventRepository.emit('album.invite', { id, userId });
    }

    return this.findOrFail(id, { withAssets: true }).then(mapAlbumWithoutAssets);
  }

  async removeUser(auth: AuthDto, id: string, userId: string | 'me'): Promise<void> {
    if (userId === 'me') {
      userId = auth.user.id;
    }

    const album = await this.findOrFail(id, { withAssets: false });

    if (album.ownerId === userId) {
      throw new BadRequestException('Cannot remove album owner');
    }

    const exists = album.albumUsers.find(({ user: { id } }) => id === userId);
    if (!exists) {
      throw new BadRequestException('Album not shared with user');
    }

    // non-admin can remove themselves
    if (auth.user.id !== userId) {
      await this.requireAccess({ auth, permission: Permission.ALBUM_SHARE, ids: [id] });
    }

    await this.albumUserRepository.delete({ albumId: id, userId });
  }

  async updateUser(auth: AuthDto, id: string, userId: string, dto: Partial<AlbumUserEntity>): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.ALBUM_SHARE, ids: [id] });
    await this.albumUserRepository.update({ albumId: id, userId }, { role: dto.role });
  }

  private async findOrFail(id: string, options: AlbumInfoOptions) {
    const album = await this.albumRepository.getById(id, options);
    if (!album) {
      throw new BadRequestException('Album not found');
    }
    return album;
  }
}
