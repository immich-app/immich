import { AlbumEntity, AssetEntity, dataSource, UserEntity } from '@app/infra';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

export interface IAlbumRepository {
  create(ownerId: string, createAlbumDto: CreateAlbumDto): Promise<AlbumEntity>;
  get(albumId: string): Promise<AlbumEntity | null>;
  delete(album: AlbumEntity): Promise<void>;
  addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity>;
  removeUser(album: AlbumEntity, userId: string): Promise<void>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity>;
  updateThumbnails(): Promise<number | undefined>;
  getCountByUserId(userId: string): Promise<AlbumCountResponseDto>;
  getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number>;
}

export const IAlbumRepository = 'IAlbumRepository';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AlbumEntity)
    private albumRepository: Repository<AlbumEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

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
    album.updatedAt = new Date().toISOString();

    await this.albumRepository.save(album);

    // need to re-load the shared user relation
    return this.get(album.id) as Promise<AlbumEntity>;
  }

  async removeUser(album: AlbumEntity, userId: string): Promise<void> {
    album.sharedUsers = album.sharedUsers.filter((user) => user.id !== userId);
    album.updatedAt = new Date().toISOString();
    await this.albumRepository.save(album);
  }

  async removeAssets(album: AlbumEntity, removeAssetsDto: RemoveAssetsDto): Promise<number> {
    const assetCount = album.assets.length;

    album.assets = album.assets.filter((asset) => {
      return !removeAssetsDto.assetIds.includes(asset.id);
    });

    const numRemovedAssets = assetCount - album.assets.length;
    if (numRemovedAssets > 0) {
      album.updatedAt = new Date().toISOString();
    }
    await this.albumRepository.save(album, {});

    return numRemovedAssets;
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

    const successfullyAdded = addAssetsDto.assetIds.length - alreadyExisting.length;
    if (successfullyAdded > 0) {
      album.updatedAt = new Date().toISOString();
    }
    await this.albumRepository.save(album);

    return {
      successfullyAdded,
      alreadyInAlbum: alreadyExisting,
    };
  }

  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity> {
    album.albumName = updateAlbumDto.albumName || album.albumName;
    album.albumThumbnailAssetId = updateAlbumDto.albumThumbnailAssetId || album.albumThumbnailAssetId;

    return this.albumRepository.save(album);
  }

  /**
   * Makes sure all thumbnails for albums are updated by:
   * - Removing thumbnails from albums without assets
   * - Removing references of thumbnails to assets outside the album
   * - Setting a thumbnail when none is set and the album contains assets
   *
   * @returns Amount of updated album thumbnails or undefined when unknown
   */
  async updateThumbnails(): Promise<number | undefined> {
    // Subquery for getting a new thumbnail.
    const newThumbnail = this.assetRepository
      .createQueryBuilder('assets')
      .select('albums_assets2.assetsId')
      .addFrom('albums_assets_assets', 'albums_assets2')
      .where('albums_assets2.assetsId = assets.id')
      .andWhere('albums_assets2.albumsId = "albums"."id"') // Reference to albums.id outside this query
      .orderBy('assets.fileCreatedAt', 'DESC')
      .limit(1);

    // Using dataSource, because there is no direct access to albums_assets_assets.
    const albumHasAssets = dataSource
      .createQueryBuilder()
      .select('1')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums"."id" = "albums_assets"."albumsId"');

    const albumContainsThumbnail = albumHasAssets
      .clone()
      .andWhere('"albums"."albumThumbnailAssetId" = "albums_assets"."assetsId"');

    const updateAlbums = this.albumRepository
      .createQueryBuilder('albums')
      .update(AlbumEntity)
      .set({ albumThumbnailAssetId: () => `(${newThumbnail.getQuery()})` })
      .where(`"albums"."albumThumbnailAssetId" IS NULL AND EXISTS (${albumHasAssets.getQuery()})`)
      .orWhere(`"albums"."albumThumbnailAssetId" IS NOT NULL AND NOT EXISTS (${albumContainsThumbnail.getQuery()})`);

    const result = await updateAlbums.execute();

    return result.affected;
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
