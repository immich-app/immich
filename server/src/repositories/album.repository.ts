import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Chunked, ChunkedArray, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumEntity } from 'src/entities/album.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { AlbumAssetCount, AlbumInfoOptions, IAlbumRepository } from 'src/interfaces/album.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import {
  DataSource,
  EntityManager,
  FindOptionsOrder,
  FindOptionsRelations,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

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
    if (assetIds.length === 0) {
      return;
    }

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
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(albumId: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.dataSource
      .createQueryBuilder()
      .select('albums_assets.assetsId', 'assetId')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums_assets"."albumsId" = :albumId', { albumId })
      .andWhere('"albums_assets"."assetsId" IN (:...assetIds)', { assetIds })
      .getRawMany<{ assetId: string }>();

    return new Set(results.map(({ assetId }) => assetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    await this.addAssets(this.dataSource.manager, albumId, assetIds);
  }

  create(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
    return this.dataSource.transaction<AlbumEntity>(async (manager) => {
      const { id } = await manager.save(AlbumEntity, { ...album, assets: [] });
      const assetIds = (album.assets || []).map((asset) => asset.id);
      await this.addAssets(manager, id, assetIds);
      return manager.findOneOrFail(AlbumEntity, {
        where: { id },
        relations: {
          owner: true,
          albumUsers: { user: true },
          sharedLinks: true,
          assets: true,
        },
      });
    });
  }

  update(album: Partial<AlbumEntity>): Promise<AlbumEntity> {
    return this.save(album);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  @Chunked({ paramIndex: 2, chunkSize: 30_000 })
  private async addAssets(manager: EntityManager, albumId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await manager
      .createQueryBuilder()
      .insert()
      .into('albums_assets_assets', ['albumsId', 'assetsId'])
      .values(assetIds.map((assetId) => ({ albumsId: albumId, assetsId: assetId })))
      .execute();
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

    const builder = this.dataSource
      .createQueryBuilder('albums_assets_assets', 'album_assets')
      .innerJoin('assets', 'assets', '"album_assets"."assetsId" = "assets"."id"')
      .where('"album_assets"."albumsId" = "albums"."id"');

    const newThumbnail = builder
      .clone()
      .select('"album_assets"."assetsId"')
      .orderBy('"assets"."fileCreatedAt"', 'DESC')
      .limit(1);
    const hasAssets = builder.clone().select('1');
    const hasInvalidAsset = hasAssets.clone().andWhere('"albums"."albumThumbnailAssetId" = "album_assets"."assetsId"');

    const updateAlbums = this.repository
      .createQueryBuilder('albums')
      .update(AlbumEntity)
      .set({ albumThumbnailAssetId: () => `(${newThumbnail.getQuery()})` })
      .where(`"albums"."albumThumbnailAssetId" IS NULL AND EXISTS (${hasAssets.getQuery()})`)
      .orWhere(`"albums"."albumThumbnailAssetId" IS NOT NULL AND NOT EXISTS (${hasInvalidAsset.getQuery()})`);

    const result = await updateAlbums.execute();

    return result.affected;
  }
}
