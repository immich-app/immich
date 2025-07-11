import { Injectable } from '@nestjs/common';
import { ExpressionBuilder, Insertable, Kysely, NotNull, sql, Updateable } from 'kysely';
import { jsonArrayFrom, jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns, Exif } from 'src/database';
import { Chunked, ChunkedArray, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserCreateDto } from 'src/dtos/album.dto';
import { DB } from 'src/schema';
import { AlbumTable } from 'src/schema/tables/album.table';
import { withDefaultVisibility } from 'src/utils/database';

export interface AlbumAssetCount {
  albumId: string;
  assetCount: number;
  startDate: Date | null;
  endDate: Date | null;
  lastModifiedAssetTimestamp: Date | null;
}

export interface AlbumInfoOptions {
  withAssets: boolean;
}

const withOwner = (eb: ExpressionBuilder<DB, 'album'>) => {
  return jsonObjectFrom(eb.selectFrom('user').select(columns.user).whereRef('user.id', '=', 'album.ownerId'))
    .$notNull()
    .as('owner');
};

const withAlbumUsers = (eb: ExpressionBuilder<DB, 'album'>) => {
  return jsonArrayFrom(
    eb
      .selectFrom('album_user')
      .select('album_user.role')
      .select((eb) =>
        jsonObjectFrom(eb.selectFrom('user').select(columns.user).whereRef('user.id', '=', 'album_user.usersId'))
          .$notNull()
          .as('user'),
      )
      .whereRef('album_user.albumsId', '=', 'album.id'),
  )
    .$notNull()
    .as('albumUsers');
};

const withSharedLink = (eb: ExpressionBuilder<DB, 'album'>) => {
  return jsonArrayFrom(eb.selectFrom('shared_link').selectAll().whereRef('shared_link.albumId', '=', 'album.id')).as(
    'sharedLinks',
  );
};

const withAssets = (eb: ExpressionBuilder<DB, 'album'>) => {
  return eb
    .selectFrom((eb) =>
      eb
        .selectFrom('asset')
        .selectAll('asset')
        .leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
        .select((eb) => eb.table('asset_exif').$castTo<Exif>().as('exifInfo'))
        .innerJoin('album_asset', 'album_asset.assetsId', 'asset.id')
        .whereRef('album_asset.albumsId', '=', 'album.id')
        .where('asset.deletedAt', 'is', null)
        .$call(withDefaultVisibility)
        .orderBy('asset.fileCreatedAt', 'desc')
        .as('asset'),
    )
    .select((eb) => eb.fn.jsonAgg('asset').as('assets'))
    .as('assets');
};

@Injectable()
export class AlbumRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, { withAssets: true }] })
  async getById(id: string, options: AlbumInfoOptions) {
    return this.db
      .selectFrom('album')
      .selectAll('album')
      .where('album.id', '=', id)
      .where('album.deletedAt', 'is', null)
      .select(withOwner)
      .select(withAlbumUsers)
      .select(withSharedLink)
      .$if(options.withAssets, (eb) => eb.select(withAssets))
      .$narrowType<{ assets: NotNull }>()
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getByAssetId(ownerId: string, assetId: string) {
    return this.db
      .selectFrom('album')
      .selectAll('album')
      .innerJoin('album_asset', 'album_asset.albumsId', 'album.id')
      .where((eb) =>
        eb.or([
          eb('album.ownerId', '=', ownerId),
          eb.exists(
            eb
              .selectFrom('album_user')
              .whereRef('album_user.albumsId', '=', 'album.id')
              .where('album_user.usersId', '=', ownerId),
          ),
        ]),
      )
      .where('album_asset.assetsId', '=', assetId)
      .where('album.deletedAt', 'is', null)
      .orderBy('album.createdAt', 'desc')
      .select(withOwner)
      .select(withAlbumUsers)
      .orderBy('album.createdAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @ChunkedArray()
  async getMetadataForIds(ids: string[]): Promise<AlbumAssetCount[]> {
    // Guard against running invalid query when ids list is empty.
    if (ids.length === 0) {
      return [];
    }

    return (
      this.db
        .selectFrom('asset')
        .$call(withDefaultVisibility)
        .innerJoin('album_asset', 'album_asset.assetsId', 'asset.id')
        .select('album_asset.albumsId as albumId')
        .select((eb) => eb.fn.min(sql<Date>`("asset"."localDateTime" AT TIME ZONE 'UTC'::text)::date`).as('startDate'))
        .select((eb) => eb.fn.max(sql<Date>`("asset"."localDateTime" AT TIME ZONE 'UTC'::text)::date`).as('endDate'))
        // lastModifiedAssetTimestamp is only used in mobile app, please remove if not need
        .select((eb) => eb.fn.max('asset.updatedAt').as('lastModifiedAssetTimestamp'))
        .select((eb) => sql<number>`${eb.fn.count('asset.id')}::int`.as('assetCount'))
        .where('album_asset.albumsId', 'in', ids)
        .where('asset.deletedAt', 'is', null)
        .groupBy('album_asset.albumsId')
        .execute()
    );
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getOwned(ownerId: string) {
    return this.db
      .selectFrom('album')
      .selectAll('album')
      .select(withOwner)
      .select(withAlbumUsers)
      .select(withSharedLink)
      .where('album.ownerId', '=', ownerId)
      .where('album.deletedAt', 'is', null)
      .orderBy('album.createdAt', 'desc')
      .execute();
  }

  /**
   * Get albums shared with and shared by owner.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getShared(ownerId: string) {
    return this.db
      .selectFrom('album')
      .selectAll('album')
      .where((eb) =>
        eb.or([
          eb.exists(
            eb
              .selectFrom('album_user')
              .whereRef('album_user.albumsId', '=', 'album.id')
              .where((eb) => eb.or([eb('album.ownerId', '=', ownerId), eb('album_user.usersId', '=', ownerId)])),
          ),
          eb.exists(
            eb
              .selectFrom('shared_link')
              .whereRef('shared_link.albumId', '=', 'album.id')
              .where('shared_link.userId', '=', ownerId),
          ),
        ]),
      )
      .where('album.deletedAt', 'is', null)
      .select(withAlbumUsers)
      .select(withOwner)
      .select(withSharedLink)
      .orderBy('album.createdAt', 'desc')
      .execute();
  }

  /**
   * Get albums of owner that are _not_ shared
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getNotShared(ownerId: string) {
    return this.db
      .selectFrom('album')
      .selectAll('album')
      .where('album.ownerId', '=', ownerId)
      .where('album.deletedAt', 'is', null)
      .where((eb) => eb.not(eb.exists(eb.selectFrom('album_user').whereRef('album_user.albumsId', '=', 'album.id'))))
      .where((eb) => eb.not(eb.exists(eb.selectFrom('shared_link').whereRef('shared_link.albumId', '=', 'album.id'))))
      .select(withOwner)
      .orderBy('album.createdAt', 'desc')
      .execute();
  }

  async restoreAll(userId: string): Promise<void> {
    await this.db.updateTable('album').set({ deletedAt: null }).where('ownerId', '=', userId).execute();
  }

  async softDeleteAll(userId: string): Promise<void> {
    await this.db.updateTable('album').set({ deletedAt: new Date() }).where('ownerId', '=', userId).execute();
  }

  async deleteAll(userId: string): Promise<void> {
    await this.db.deleteFrom('album').where('ownerId', '=', userId).execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  @Chunked()
  async removeAssetsFromAll(assetIds: string[]): Promise<void> {
    await this.db.deleteFrom('album_asset').where('album_asset.assetsId', 'in', assetIds).execute();
  }

  @Chunked({ paramIndex: 1 })
  async removeAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .deleteFrom('album_asset')
      .where('album_asset.albumsId', '=', albumId)
      .where('album_asset.assetsId', 'in', assetIds)
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
      .selectFrom('album_asset')
      .selectAll()
      .where('album_asset.albumsId', '=', albumId)
      .where('album_asset.assetsId', 'in', assetIds)
      .execute()
      .then((results) => new Set(results.map(({ assetsId }) => assetsId)));
  }

  async addAssetIds(albumId: string, assetIds: string[]): Promise<void> {
    await this.addAssets(this.db, albumId, assetIds);
  }

  create(album: Insertable<AlbumTable>, assetIds: string[], albumUsers: AlbumUserCreateDto[]) {
    return this.db.transaction().execute(async (tx) => {
      const newAlbum = await tx.insertInto('album').values(album).returning('album.id').executeTakeFirst();

      if (!newAlbum) {
        throw new Error('Failed to create album');
      }

      if (assetIds.length > 0) {
        await this.addAssets(tx, newAlbum.id, assetIds);
      }

      if (albumUsers.length > 0) {
        await tx
          .insertInto('album_user')
          .values(
            albumUsers.map((albumUser) => ({ albumsId: newAlbum.id, usersId: albumUser.userId, role: albumUser.role })),
          )
          .execute();
      }

      return tx
        .selectFrom('album')
        .selectAll()
        .where('id', '=', newAlbum.id)
        .select(withOwner)
        .select(withAssets)
        .select(withAlbumUsers)
        .$narrowType<{ assets: NotNull }>()
        .executeTakeFirstOrThrow();
    });
  }

  update(id: string, album: Updateable<AlbumTable>) {
    return this.db
      .updateTable('album')
      .set(album)
      .where('id', '=', id)
      .returningAll('album')
      .returning(withOwner)
      .returning(withSharedLink)
      .returning(withAlbumUsers)
      .executeTakeFirstOrThrow();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('album').where('id', '=', id).execute();
  }

  @Chunked({ paramIndex: 2, chunkSize: 30_000 })
  private async addAssets(db: Kysely<DB>, albumId: string, assetIds: string[]): Promise<void> {
    if (assetIds.length === 0) {
      return;
    }

    await db
      .insertInto('album_asset')
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
      .updateTable('album')
      .set((eb) => ({
        albumThumbnailAssetId: this.updateThumbnailBuilder(eb)
          .select('album_asset.assetsId')
          .orderBy('asset.fileCreatedAt', 'desc')
          .limit(1),
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
                  .whereRef('album.albumThumbnailAssetId', '=', 'album_asset.assetsId'), // Has invalid assets
              ),
            ),
          ]),
        ]),
      )
      .execute();

    return Number(result[0].numUpdatedRows);
  }

  private updateThumbnailBuilder(eb: ExpressionBuilder<DB, 'album'>) {
    return eb
      .selectFrom('album_asset')
      .innerJoin('asset', (join) =>
        join.onRef('album_asset.assetsId', '=', 'asset.id').on('asset.deletedAt', 'is', null),
      )
      .whereRef('album_asset.albumsId', '=', 'album.id');
  }
}
