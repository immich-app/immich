import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, sql, Updateable } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { Albums, DB } from 'src/db';
import { Chunked, ChunkedArray, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserCreateDto } from 'src/dtos/album.dto';
import { AlbumEntity } from 'src/entities/album.entity';
import { AlbumAssetCount, AlbumInfoOptions, IAlbumRepository } from 'src/interfaces/album.interface';

const userColumns = [
  'id',
  'email',
  'createdAt',
  'profileImagePath',
  'isAdmin',
  'shouldChangePassword',
  'deletedAt',
  'oauthId',
  'updatedAt',
  'storageLabel',
  'name',
  'quotaSizeInBytes',
  'quotaUsageInBytes',
  'status',
  'profileChangedAt',
] as const;

const withOwner = (eb: ExpressionBuilder<DB, 'albums'>) => {
  return jsonObjectFrom(eb.selectFrom('users').select(userColumns).whereRef('users.id', '=', 'albums.ownerId')).as(
    'owner',
  );
};

const withAlbumUsers = (eb: ExpressionBuilder<DB, 'albums'>) => {
  return jsonArrayFrom(
    eb
      .selectFrom('albums_shared_users_users as album_users')
      .selectAll('album_users')
      .select((eb) =>
        jsonObjectFrom(eb.selectFrom('users').select(userColumns).whereRef('users.id', '=', 'album_users.usersId')).as(
          'user',
        ),
      )
      .whereRef('album_users.albumsId', '=', 'albums.id'),
  ).as('albumUsers');
};

const withSharedLink = (eb: ExpressionBuilder<DB, 'albums'>) => {
  return jsonArrayFrom(eb.selectFrom('shared_links').selectAll().whereRef('shared_links.albumId', '=', 'albums.id')).as(
    'sharedLinks',
  );
};

const withAssets = (eb: ExpressionBuilder<DB, 'albums'>) => {
  return eb
    .selectFrom((eb) =>
      eb
        .selectFrom('assets')
        .selectAll('assets')
        .innerJoin('exif', 'assets.id', 'exif.assetId')
        .select((eb) => eb.fn.toJson('exif').as('exifInfo'))
        .innerJoin('albums_assets_assets', 'albums_assets_assets.assetsId', 'assets.id')
        .whereRef('albums_assets_assets.albumsId', '=', 'albums.id')
        .where('assets.deletedAt', 'is', null)
        .orderBy('assets.fileCreatedAt', 'desc')
        .as('asset'),
    )
    .select((eb) => eb.fn.jsonAgg('asset').as('assets'))
    .as('assets');
};

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, { withAssets: true }] })
  async getById(id: string, options: AlbumInfoOptions): Promise<AlbumEntity | undefined> {
    return this.db
      .selectFrom('albums')
      .selectAll('albums')
      .where('albums.id', '=', id)
      .where('albums.deletedAt', 'is', null)
      .select(withOwner)
      .select(withAlbumUsers)
      .select(withSharedLink)
      .$if(options.withAssets, (eb) => eb.select(withAssets))
      .executeTakeFirst() as Promise<AlbumEntity | undefined>;
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getByAssetId(ownerId: string, assetId: string): Promise<AlbumEntity[]> {
    return this.db
      .selectFrom('albums')
      .selectAll('albums')
      .leftJoin('albums_assets_assets as album_assets', 'album_assets.albumsId', 'albums.id')
      .leftJoin('albums_shared_users_users as album_users', 'album_users.albumsId', 'albums.id')
      .where((eb) =>
        eb.or([
          eb.and([eb('albums.ownerId', '=', ownerId), eb('album_assets.assetsId', '=', assetId)]),
          eb.and([eb('album_users.usersId', '=', ownerId), eb('album_assets.assetsId', '=', assetId)]),
        ]),
      )
      .where('albums.deletedAt', 'is', null)
      .orderBy('albums.createdAt', 'desc')
      .select(withOwner)
      .select(withAlbumUsers)
      .orderBy('albums.createdAt', 'desc')
      .execute() as unknown as Promise<AlbumEntity[]>;
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getMetadataForIds(ids: string[]): Promise<AlbumAssetCount[]> {
    // Guard against running invalid query when ids list is empty.
    if (ids.length === 0) {
      return [];
    }

    const metadatas = await this.db
      .selectFrom('albums')
      .leftJoin('albums_assets_assets as album_assets', 'album_assets.albumsId', 'albums.id')
      .leftJoin('assets', 'assets.id', 'album_assets.assetsId')
      .select('albums.id')
      .select((eb) => eb.fn.min('assets.fileCreatedAt').as('startDate'))
      .select((eb) => eb.fn.max('assets.fileCreatedAt').as('endDate'))
      .select((eb) => eb.fn.count('assets.id').as('assetCount'))
      .where('albums.id', 'in', ids)
      .where('assets.deletedAt', 'is', null)
      .groupBy('albums.id')
      .execute();

    return metadatas.map((metadatas) => ({
      albumId: metadatas.id,
      assetCount: Number(metadatas.assetCount),
      startDate: metadatas.startDate ? new Date(metadatas.startDate) : undefined,
      endDate: metadatas.endDate ? new Date(metadatas.endDate) : undefined,
    }));
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getOwned(ownerId: string): Promise<AlbumEntity[]> {
    return this.db
      .selectFrom('albums')
      .selectAll('albums')
      .select(withOwner)
      .select(withAlbumUsers)
      .select(withSharedLink)
      .where('albums.ownerId', '=', ownerId)
      .where('albums.deletedAt', 'is', null)
      .orderBy('albums.createdAt', 'desc')
      .execute() as unknown as Promise<AlbumEntity[]>;
  }

  /**
   * Get albums shared with and shared by owner.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getShared(ownerId: string): Promise<AlbumEntity[]> {
    return this.db
      .selectFrom('albums')
      .selectAll('albums')
      .distinctOn('albums.createdAt')
      .leftJoin('albums_shared_users_users as shared_albums', 'shared_albums.albumsId', 'albums.id')
      .leftJoin('shared_links', 'shared_links.albumId', 'albums.id')
      .where((eb) =>
        eb.or([
          eb('shared_albums.usersId', '=', ownerId),
          eb('shared_links.userId', '=', ownerId),
          eb.and([eb('albums.ownerId', '=', ownerId), eb('shared_albums.usersId', 'is not', null)]),
        ]),
      )
      .where('albums.deletedAt', 'is', null)
      .select(withAlbumUsers)
      .select(withOwner)
      .select(withSharedLink)
      .orderBy('albums.createdAt', 'desc')
      .execute() as unknown as Promise<AlbumEntity[]>;
  }

  /**
   * Get albums of owner that are _not_ shared
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getNotShared(ownerId: string): Promise<AlbumEntity[]> {
    return this.db
      .selectFrom('albums')
      .selectAll('albums')
      .distinctOn('albums.createdAt')
      .leftJoin('albums_shared_users_users as shared_albums', 'shared_albums.albumsId', 'albums.id')
      .leftJoin('shared_links', 'shared_links.albumId', 'albums.id')
      .where('albums.ownerId', '=', ownerId)
      .where('shared_albums.usersId', 'is', null)
      .where('shared_links.userId', 'is', null)
      .where('albums.deletedAt', 'is', null)
      .select(withAlbumUsers)
      .select(withOwner)
      .select(withSharedLink)
      .orderBy('albums.createdAt', 'desc')
      .execute() as unknown as Promise<AlbumEntity[]>;
  }

  async restoreAll(userId: string): Promise<void> {
    await this.db.updateTable('albums').set({ deletedAt: null }).where('ownerId', '=', userId).execute();
  }

  async softDeleteAll(userId: string): Promise<void> {
    await this.db.updateTable('albums').set({ deletedAt: new Date() }).where('ownerId', '=', userId).execute();
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.deleteFrom('albums').where('ownerId', '=', userId).execute();
  }

  async removeAsset(assetId: string): Promise<void> {
    await this.db.deleteFrom('albums_assets_assets').where('albums_assets_assets.assetsId', '=', assetId).execute();
  }

  @Chunked({ paramIndex: 1 })
  async removeAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('albums_assets_assets')
      .where('albums_assets_assets.albumsId', '=', albumId)
      .where('albums_assets_assets.assetsId', 'in', assetIds)
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

    return this.db
      .selectFrom('albums_assets_assets')
      .selectAll()
      .where('albums_assets_assets.albumsId', '=', albumId)
      .where('albums_assets_assets.assetsId', 'in', assetIds)
      .execute()
      .then((results) => new Set(results.map(({ assetsId }) => assetsId)));
  }

  async addAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    await this.addAssets(this.db, albumId, assetIds);
  }

  create(album: Insertable<Albums>, assetIds: string[], albumUsers: AlbumUserCreateDto[]): Promise<AlbumEntity> {
    return this.db.transaction().execute(async (tx) => {
      const newAlbum = await tx.insertInto('albums').values(album).returning('albums.id').executeTakeFirst();

      if (!newAlbum) {
        throw new Error('Failed to create album');
      }

      if (assetIds.length > 0) {
        await this.addAssets(tx, newAlbum.id, assetIds);
      }

      if (albumUsers.length > 0) {
        await tx
          .insertInto('albums_shared_users_users')
          .values(
            albumUsers.map((albumUser) => ({ albumsId: newAlbum.id, usersId: albumUser.userId, role: albumUser.role })),
          )
          .execute();
      }

      return tx
        .selectFrom('albums')
        .selectAll()
        .where('id', '=', newAlbum.id)
        .select(withOwner)
        .select(withSharedLink)
        .select(withAssets)
        .select(withAlbumUsers)
        .executeTakeFirst() as unknown as Promise<AlbumEntity>;
    });
  }

  update(id: string, album: Updateable<Albums>): Promise<AlbumEntity> {
    return this.db
      .updateTable('albums')
      .set({ ...album, updatedAt: new Date() })
      .where('id', '=', id)
      .returningAll('albums')
      .returning(withOwner)
      .returning(withSharedLink)
      .returning(withAlbumUsers)
      .executeTakeFirst() as unknown as Promise<AlbumEntity>;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('albums').where('id', '=', id).execute();
  }

  @Chunked({ paramIndex: 2, chunkSize: 30_000 })
  private async addAssets(db: Kysely<DB>, albumId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await db
      .insertInto('albums_assets_assets')
      .values(assetIds.map((assetId) => ({ albumsId: albumId, assetsId: assetId })))
      .execute();
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

    const result = await this.db
      .updateTable('albums')
      .set((eb) => ({
        albumThumbnailAssetId: this.updateThumbnailBuilder(eb)
          .select('album_assets.assetsId')
          .orderBy('assets.fileCreatedAt', 'desc')
          .limit(1),
        updatedAt: new Date(),
      }))
      .where((eb) =>
        eb.or([
          eb.and([
            eb('albumThumbnailAssetId', 'is', null),
            eb.exists(this.updateThumbnailBuilder(eb).select(sql`1`.as('1'))), // Has assets
          ]),
          eb.and([
            eb('albumThumbnailAssetId', 'is not', null),
            eb.not(
              eb.exists(
                this.updateThumbnailBuilder(eb)
                  .select(sql`1`.as('1'))
                  .whereRef('albums.albumThumbnailAssetId', '=', 'album_assets.assetsId'), // Has invalid assets
              ),
            ),
          ]),
        ]),
      )
      .execute();

    return Number(result[0].numUpdatedRows);
  }

  private updateThumbnailBuilder(eb: ExpressionBuilder<DB, 'albums'>) {
    return eb
      .selectFrom('albums_assets_assets as album_assets')
      .innerJoin('assets', (join) =>
        join.onRef('album_assets.assetsId', '=', 'assets.id').on('assets.deletedAt', 'is', null),
      )
      .whereRef('album_assets.albumsId', '=', 'albums.id');
  }
}
