import { dataSource } from '@app/infra/database.config';
import { AlbumEntity, AssetEntity } from '@app/infra/entities';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddAssetsDto } from './dto/add-assets.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

export interface IAlbumRepository {
  get(albumId: string): Promise<AlbumEntity | null>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateThumbnails(): Promise<number | undefined>;
}

export const IAlbumRepository = 'IAlbumRepository';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
  ) {}

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

  async removeAssets(album: AlbumEntity, removeAssetsDto: RemoveAssetsDto): Promise<number> {
    const assetCount = album.assets.length;

    album.assets = album.assets.filter((asset) => {
      return !removeAssetsDto.assetIds.includes(asset.id);
    });

    const numRemovedAssets = assetCount - album.assets.length;
    if (numRemovedAssets > 0) {
      album.updatedAt = new Date();
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
      album.updatedAt = new Date();
    }
    await this.albumRepository.save(album);

    return {
      successfullyAdded,
      alreadyInAlbum: alreadyExisting,
    };
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
}
