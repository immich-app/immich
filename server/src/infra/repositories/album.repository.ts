import { AlbumAssetCount, IAlbumRepository } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { dataSource } from '../database.config';
import { AlbumEntity } from '../entities';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(@InjectRepository(AlbumEntity) private repository: Repository<AlbumEntity>) {}

  getByIds(ids: string[]): Promise<AlbumEntity[]> {
    return this.repository.find({
      where: {
        id: In(ids),
      },
      relations: {
        owner: true,
        sharedUsers: true,
      },
    });
  }

  getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]> {
    return this.repository.find({
      where: { ownerId, assets: { id: assetId } },
      relations: { owner: true, sharedUsers: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAssetCountForIds(ids: string[]): Promise<AlbumAssetCount[]> {
    // Guard against running invalid query when ids list is empty.
    if (!ids.length) {
      return [];
    }

    // Only possible with query builder because of GROUP BY.
    const countByAlbums = await this.repository
      .createQueryBuilder('album')
      .select('album.id')
      .addSelect('COUNT(albums_assets.assetsId)', 'asset_count')
      .leftJoin('albums_assets_assets', 'albums_assets', 'albums_assets.albumsId = album.id')
      .where('album.id IN (:...ids)', { ids })
      .groupBy('album.id')
      .getRawMany();

    return countByAlbums.map<AlbumAssetCount>((albumCount) => ({
      albumId: albumCount['album_id'],
      assetCount: Number(albumCount['asset_count']),
    }));
  }

  /**
   * Returns the album IDs that have an invalid thumbnail, when:
   *  - Thumbnail references an asset outside the album
   *  - Empty album still has a thumbnail set
   */
  async getInvalidThumbnail(): Promise<string[]> {
    // Using dataSource, because there is no direct access to albums_assets_assets.
    const albumHasAssets = dataSource
      .createQueryBuilder()
      .select('1')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums"."id" = "albums_assets"."albumsId"');

    const albumContainsThumbnail = albumHasAssets
      .clone()
      .andWhere('"albums"."albumThumbnailAssetId" = "albums_assets"."assetsId"');

    const albums = await this.repository
      .createQueryBuilder('albums')
      .select('albums.id')
      .where(`"albums"."albumThumbnailAssetId" IS NULL AND EXISTS (${albumHasAssets.getQuery()})`)
      .orWhere(`"albums"."albumThumbnailAssetId" IS NOT NULL AND NOT EXISTS (${albumContainsThumbnail.getQuery()})`)
      .getMany();

    return albums.map((album) => album.id);
  }

  getOwned(ownerId: string): Promise<AlbumEntity[]> {
    return this.repository.find({
      relations: { sharedUsers: true, sharedLinks: true, owner: true },
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get albums shared with and shared by owner.
   */
  getShared(ownerId: string): Promise<AlbumEntity[]> {
    return this.repository.find({
      relations: { sharedUsers: true, sharedLinks: true, owner: true },
      where: [
        { sharedUsers: { id: ownerId } },
        { sharedLinks: { userId: ownerId } },
        { ownerId, sharedUsers: { id: Not(IsNull()) } },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get albums of owner that are _not_ shared
   */
  getNotShared(ownerId: string): Promise<AlbumEntity[]> {
    return this.repository.find({
      relations: { sharedUsers: true, sharedLinks: true, owner: true },
      where: { ownerId, sharedUsers: { id: IsNull() }, sharedLinks: { id: IsNull() } },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.repository.delete({ ownerId: userId });
  }

  getAll(): Promise<AlbumEntity[]> {
    return this.repository.find({
      relations: {
        owner: true,
      },
    });
  }

  hasAsset(id: string, assetId: string): Promise<boolean> {
    return this.repository.exist({
      where: {
        id,
        assets: {
          id: assetId,
        },
      },
      relations: {
        assets: true,
      },
    });
  }

  async create(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
    return this.save(album);
  }

  async update(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
    return this.save(album);
  }

  async delete(album: AlbumEntity): Promise<void> {
    await this.repository.remove(album);
  }

  private async save(album: Partial<AlbumEntity>) {
    const { id } = await this.repository.save(album);
    return this.repository.findOneOrFail({
      where: { id },
      relations: {
        owner: true,
        sharedUsers: true,
        assets: true,
      },
    });
  }
}
