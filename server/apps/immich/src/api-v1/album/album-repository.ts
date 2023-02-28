import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, FindManyOptions } from 'typeorm';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { GetAlbumsDto } from './dto/get-albums.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

export interface IAlbumRepository {
  create(ownerId: string, createAlbumDto: CreateAlbumDto): Promise<AlbumEntity>;
  getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]>;
  getPublicSharingList(ownerId: string): Promise<AlbumEntity[]>;
  get(albumId: string): Promise<AlbumEntity | null>;
  delete(album: AlbumEntity): Promise<void>;
  addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity>;
  removeUser(album: AlbumEntity, userId: string): Promise<void>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity>;
  getListByAssetId(userId: string, assetId: string): Promise<AlbumEntity[]>;
  getCountByUserId(userId: string): Promise<AlbumCountResponseDto>;
  getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number>;
}

export const IAlbumRepository = 'IAlbumRepository';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AlbumEntity)
    private albumRepository: Repository<AlbumEntity>,
  ) {}

  async getPublicSharingList(ownerId: string): Promise<AlbumEntity[]> {
    return this.albumRepository.find({
      relations: {
        sharedLinks: true,
        assets: true,
        owner: true,
      },
      where: {
        ownerId,
        sharedLinks: {
          id: Not(IsNull()),
        },
      },
    });
  }

  async getCountByUserId(userId: string): Promise<AlbumCountResponseDto> {
    const ownedAlbums = await this.albumRepository.find({ where: { ownerId: userId }, relations: ['sharedUsers'] });
    const sharedAlbums = await this.albumRepository.count({ where: { sharedUsers: { id: userId } } });
    const sharedAlbumCount = ownedAlbums.filter((album) => album.sharedUsers?.length > 0).length;

    return new AlbumCountResponseDto(ownedAlbums.length, sharedAlbums, sharedAlbumCount);
  }

  async create(ownerId: string, dto: CreateAlbumDto): Promise<AlbumEntity> {
    const album = await this.albumRepository.save({
      ownerId,
      albumName: dto.albumName,
      sharedUsers: dto.sharedWithUserIds?.map((value) => ({ id: value } as UserEntity)) ?? [],
      assets: dto.assetIds?.map((value) => ({ id: value } as AssetEntity)) ?? [],
      albumThumbnailAssetId: dto.assetIds?.[0] || null,
    });

    // need to re-load the relations
    return this.get(album.id) as Promise<AlbumEntity>;
  }

  async getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]> {
    const filteringByShared = typeof getAlbumsDto.shared == 'boolean';
    const userId = ownerId;

    const queryProperties: FindManyOptions<AlbumEntity> = {
      relations: { sharedUsers: true, assets: true, sharedLinks: true, owner: true },
      select: { assets: { id: true } },
      order: { assets: { fileCreatedAt: 'ASC' }, createdAt: 'ASC' },
    };

    let albumsQuery: Promise<AlbumEntity[]>;

    /**
     * `shared` boolean usage
     * true = shared with me, and my albums that are shared
     * false = my albums that are not shared
     * undefined = all my albums
     */
    if (filteringByShared) {
      if (getAlbumsDto.shared) {
        // shared albums
        albumsQuery = this.albumRepository.find({
          where: [{ sharedUsers: { id: userId } }, { ownerId: userId, sharedUsers: { id: Not(IsNull()) } }],
          ...queryProperties,
        });
      } else {
        // owned, not shared albums
        albumsQuery = this.albumRepository.find({
          where: { ownerId: userId, sharedUsers: { id: IsNull() } },
          ...queryProperties,
        });
      }
    } else {
      // owned
      albumsQuery = this.albumRepository.find({
        where: { ownerId: userId },
        ...queryProperties,
      });
    }

    return albumsQuery;
  }

  async getListByAssetId(userId: string, assetId: string): Promise<AlbumEntity[]> {
    const albums = await this.albumRepository.find({
      where: { ownerId: userId },
      relations: { owner: true, assets: true, sharedUsers: true },
      order: { assets: { fileCreatedAt: 'ASC' } },
    });

    return albums.filter((album) => album.assets.some((asset) => asset.id === assetId));
  }

  async get(albumId: string): Promise<AlbumEntity | null> {
    return this.albumRepository.findOne({
      where: { id: albumId },
      relations: {
        owner: true,
        sharedUsers: true,
        assets: {
          exifInfo: true,
        },
        sharedLinks: true,
      },
      order: {
        assets: {
          fileCreatedAt: 'ASC',
        },
      },
    });
  }

  async delete(album: AlbumEntity): Promise<void> {
    await this.albumRepository.delete({ id: album.id, ownerId: album.ownerId });
  }

  async addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity> {
    album.sharedUsers.push(...addUsersDto.sharedUserIds.map((id) => ({ id } as UserEntity)));

    await this.albumRepository.save(album);

    // need to re-load the shared user relation
    return this.get(album.id) as Promise<AlbumEntity>;
  }

  async removeUser(album: AlbumEntity, userId: string): Promise<void> {
    album.sharedUsers = album.sharedUsers.filter((user) => user.id !== userId);
    await this.albumRepository.save(album);
  }

  async removeAssets(album: AlbumEntity, removeAssetsDto: RemoveAssetsDto): Promise<number> {
    const assetCount = album.assets.length;

    album.assets = album.assets.filter((asset) => {
      return !removeAssetsDto.assetIds.includes(asset.id);
    });

    await this.albumRepository.save(album, {});

    return assetCount - album.assets.length;
  }

  async addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto> {
    const alreadyExisting: string[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      // Album already contains that asset
      if (album.assets?.some((a) => a.id === assetId)) {
        alreadyExisting.push(assetId);
        continue;
      }

      album.assets.push({ id: assetId } as AssetEntity);
    }

    // Add album thumbnail if not exist.
    if (!album.albumThumbnailAssetId && album.assets.length > 0) {
      album.albumThumbnailAssetId = album.assets[0].id;
    }

    await this.albumRepository.save(album);

    return {
      successfullyAdded: addAssetsDto.assetIds.length - alreadyExisting.length,
      alreadyInAlbum: alreadyExisting,
    };
  }

  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity> {
    album.albumName = updateAlbumDto.albumName || album.albumName;
    album.albumThumbnailAssetId = updateAlbumDto.albumThumbnailAssetId || album.albumThumbnailAssetId;

    return this.albumRepository.save(album);
  }

  async getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number> {
    return this.albumRepository.count({
      where: [
        {
          ownerId: userId,
          assets: {
            id: assetId,
          },
        },
        {
          sharedUsers: {
            id: userId,
          },
          assets: {
            id: assetId,
          },
        },
      ],
    });
  }
}
