import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Chunked, ChunkedArray, DATABASE_PARAMETER_CHUNK_SIZE, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { AlbumAsset, AlbumAssetCount, AlbumInfoOptions, IAlbumRepository } from 'src/interfaces/album.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { setUnion } from 'src/utils/set';
import { DataSource, FindOptionsOrder, FindOptionsRelations, In, IsNull, Not, Repository } from 'typeorm';

const withoutDeletedUsers = <T extends AlbumEntity | null>(album: T) => {
  if (album) {
    album.albumUsers = album.albumUsers.filter((albumUser) => albumUser.user && !albumUser.user.deletedAt);
  }
  return album;
};

@Instrumentation()
@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) private repository: Repository<AlbumEntity>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  @GenerateSql({ params: [DummyValue.UUID, {}] })
  async getById(id: string, options: AlbumInfoOptions): Promise<AlbumEntity | null> {
    const relations: FindOptionsRelations<AlbumEntity> = {
      owner: true,
      albumUsers: { user: true },
      assets: false,
      sharedLinks: true,
    };

    const order: FindOptionsOrder<AlbumEntity> = {};

    if (options.withAssets) {
      relations.assets = {
        exifInfo: true,
      };

      order.assets = {
        fileCreatedAt: 'DESC',
      };
    }

    const album = await this.repository.findOne({ where: { id }, relations, order });
    return withoutDeletedUsers(album);
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getByIds(ids: string[]): Promise<AlbumEntity[]> {
    const albums = await this.repository.find({
      where: {
        id: In(ids),
      },
      relations: {
        owner: true,
        albumUsers: { user: true },
      },
    });

    return albums.map((album) => withoutDeletedUsers(album));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]> {
    const albums = await this.repository.find({
      where: [
        { ownerId, assets: { id: assetId } },
        { albumUsers: { userId: ownerId }, assets: { id: assetId } },
      ],
      relations: { owner: true, albumUsers: { user: true } },
      order: { createdAt: 'DESC' },
    });

    return albums.map((album) => withoutDeletedUsers(album));
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getMetadataForIds(ids: string[]): Promise<AlbumAssetCount[]> {
    // Guard against running invalid query when ids list is empty.
    if (ids.length === 0) {
      return [];
    }

    // Only possible with query builder because of GROUP BY.
    const albumMetadatas = await this.repository
      .createQueryBuilder('album')
      .select('album.id')
      .addSelect('MIN(assets.fileCreatedAt)', 'start_date')
      .addSelect('MAX(assets.fileCreatedAt)', 'end_date')
      .addSelect('COUNT(assets.id)', 'asset_count')
      .leftJoin('albums_assets_assets', 'album_assets', 'album_assets.albumsId = album.id')
      .leftJoin('assets', 'assets', 'assets.id = album_assets.assetsId')
      .where('album.id IN (:...ids)', { ids })
      .groupBy('album.id')
      .getRawMany();

    return albumMetadatas.map<AlbumAssetCount>((metadatas) => ({
      albumId: metadatas['album_id'],
      assetCount: Number(metadatas['asset_count']),
      startDate: metadatas['end_date'] ? new Date(metadatas['start_date']) : undefined,
      endDate: metadatas['end_date'] ? new Date(metadatas['end_date']) : undefined,
    }));
  }

  /**
   * Returns the album IDs that have an invalid thumbnail, when:
   *  - Thumbnail references an asset outside the album
   *  - Empty album still has a thumbnail set
   */
  @GenerateSql()
  async getInvalidThumbnail(): Promise<string[]> {
    // Using dataSource, because there is no direct access to albums_assets_assets.
    const albumHasAssets = this.dataSource
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

  @GenerateSql({ params: [DummyValue.UUID] })
  async getOwned(ownerId: string): Promise<AlbumEntity[]> {
    const albums = await this.repository.find({
      relations: { albumUsers: { user: true }, sharedLinks: true, owner: true },
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });

    return albums.map((album) => withoutDeletedUsers(album));
  }

  /**
   * Get albums shared with and shared by owner.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getShared(ownerId: string): Promise<AlbumEntity[]> {
    const albums = await this.repository.find({
      relations: { albumUsers: { user: true }, sharedLinks: true, owner: true },
      where: [
        { albumUsers: { userId: ownerId } },
        { sharedLinks: { userId: ownerId } },
        { ownerId, albumUsers: { user: Not(IsNull()) } },
      ],
      order: { createdAt: 'DESC' },
    });

    return albums.map((album) => withoutDeletedUsers(album));
  }

  /**
   * Get albums of owner that are _not_ shared
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getNotShared(ownerId: string): Promise<AlbumEntity[]> {
    const albums = await this.repository.find({
      relations: { albumUsers: true, sharedLinks: true, owner: true },
      where: { ownerId, albumUsers: { user: IsNull() }, sharedLinks: { id: IsNull() } },
      order: { createdAt: 'DESC' },
    });

    return albums.map((album) => withoutDeletedUsers(album));
  }

  async restoreAll(userId: string): Promise<void> {
    await this.repository.restore({ ownerId: userId });
  }

  async softDeleteAll(userId: string): Promise<void> {
    await this.repository.softDelete({ ownerId: userId });
  }

  async deleteAll(userId: string): Promise<void> {
    await this.repository.delete({ ownerId: userId });
  }

  @GenerateSql()
  getAll(): Promise<AlbumEntity[]> {
    return this.repository.find({
      relations: {
        owner: true,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async removeAsset(assetId: string): Promise<void> {
    // Using dataSource, because there is no direct access to albums_assets_assets.
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('albums_assets_assets')
      .where('"albums_assets_assets"."assetsId" = :assetId', { assetId })
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('albums_assets_assets')
      .where({
        albumsId: albumId,
        assetsId: In(assetIds),
      })
      .execute();
  }

  /**
   * Get asset IDs for the given album ID.
   *
   * @param albumId Album ID to get asset IDs for.
   * @param assetIds Optional list of asset IDs to filter on.
   * @returns Set of Asset IDs for the given album ID.
   */
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] }, { name: 'no assets', params: [DummyValue.UUID] })
  async getAssetIds(albumId: string, assetIds?: string[]): Promise<Set<string>> {
    const query = this.dataSource
      .createQueryBuilder()
      .select('albums_assets.assetsId', 'assetId')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums_assets"."albumsId" = :albumId', { albumId });

    if (!assetIds?.length) {
      const result = await query.getRawMany();
      return new Set(result.map((row) => row['assetId']));
    }

    return Promise.all(
      _.chunk(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
        query
          .andWhere('"albums_assets"."assetsId" IN (:...assetIds)', { assetIds: idChunk })
          .getRawMany()
          .then((result) => new Set(result.map((row) => row['assetId']))),
      ),
    ).then((results) => setUnion(...results));
  }

  @GenerateSql({ params: [{ albumId: DummyValue.UUID, assetId: DummyValue.UUID }] })
  hasAsset(asset: AlbumAsset): Promise<boolean> {
    return this.repository.exist({
      where: {
        id: asset.albumId,
        assets: {
          id: asset.assetId,
        },
      },
      relations: {
        assets: true,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('albums_assets_assets', ['albumsId', 'assetsId'])
      .values(assetIds.map((assetId) => ({ albumsId: albumId, assetsId: assetId })))
      .execute();
  }

  create(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
    return this.save(album);
  }

  update(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
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
        albumUsers: { user: true },
        sharedLinks: true,
        assets: true,
      },
    });
  }

  /**
   * Makes sure all thumbnails for albums are updated by:
   * - Removing thumbnails from albums without assets
   * - Removing references of thumbnails to assets outside the album
   * - Setting a thumbnail when none is set and the album contains assets
   *
   * @returns Amount of updated album thumbnails or undefined when unknown
   */
  @GenerateSql()
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
    const albumHasAssets = this.dataSource
      .createQueryBuilder()
      .select('1')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums"."id" = "albums_assets"."albumsId"');

    const albumContainsThumbnail = albumHasAssets
      .clone()
      .andWhere('"albums"."albumThumbnailAssetId" = "albums_assets"."assetsId"');

    const updateAlbums = this.repository
      .createQueryBuilder('albums')
      .update(AlbumEntity)
      .set({ albumThumbnailAssetId: () => `(${newThumbnail.getQuery()})` })
      .where(`"albums"."albumThumbnailAssetId" IS NULL AND EXISTS (${albumHasAssets.getQuery()})`)
      .orWhere(`"albums"."albumThumbnailAssetId" IS NOT NULL AND NOT EXISTS (${albumContainsThumbnail.getQuery()})`);

    const result = await updateAlbums.execute();

    return result.affected;
  }
}
