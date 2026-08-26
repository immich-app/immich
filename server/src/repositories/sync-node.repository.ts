import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AlbumUserRole, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import {
  SyncNodeAlbumTable,
  SyncNodeAssetTable,
  SyncNodeTable,
  SyncNodeUserTable,
} from 'src/schema/tables/sync-node.table';

@Injectable()
export class SyncNodeRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  // -- nodes --

  @GenerateSql({ params: [] })
  getAll() {
    return this.db.selectFrom('sync_node').selectAll('sync_node').orderBy('name asc').execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db.selectFrom('sync_node').selectAll('sync_node').where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByName(name: string) {
    return this.db.selectFrom('sync_node').selectAll('sync_node').where('name', '=', name).executeTakeFirst();
  }

  create(dto: Insertable<SyncNodeTable>) {
    return this.db.insertInto('sync_node').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<SyncNodeTable>) {
    return this.db.updateTable('sync_node').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  async delete(id: string) {
    await this.db.deleteFrom('sync_node').where('id', '=', id).execute();
  }

  // -- user pairings --

  @GenerateSql({ params: [DummyValue.UUID] })
  getPairings(nodeId: string) {
    return this.db
      .selectFrom('sync_node_user')
      .selectAll('sync_node_user')
      .where('nodeId', '=', nodeId)
      .orderBy('createdAt asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPairing(id: string) {
    return this.db.selectFrom('sync_node_user').selectAll('sync_node_user').where('id', '=', id).executeTakeFirst();
  }

  /** Every pairing that a scheduled run should consider, with its node attached. */
  @GenerateSql({ params: [] })
  getSyncablePairings() {
    return this.db
      .selectFrom('sync_node_user')
      .innerJoin('sync_node', 'sync_node.id', 'sync_node_user.nodeId')
      .select([
        'sync_node_user.id as id',
        'sync_node_user.nodeId as nodeId',
        'sync_node_user.localUserId as localUserId',
        'sync_node_user.remoteUserId as remoteUserId',
        'sync_node_user.pushEnabled as pushEnabled',
        'sync_node_user.pullEnabled as pullEnabled',
      ])
      .where('sync_node.isEnabled', '=', true)
      .where((eb) => eb.or([eb('sync_node_user.pushEnabled', '=', true), eb('sync_node_user.pullEnabled', '=', true)]))
      .execute();
  }

  createPairing(dto: Insertable<SyncNodeUserTable>) {
    return this.db.insertInto('sync_node_user').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  updatePairing(id: string, dto: Updateable<SyncNodeUserTable>) {
    return this.db.updateTable('sync_node_user').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  async deletePairing(id: string) {
    await this.db.deleteFrom('sync_node_user').where('id', '=', id).execute();
  }

  // -- asset identity map --

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getAssetMapping(nodeUserId: string, localAssetId: string) {
    return this.db
      .selectFrom('sync_node_asset')
      .selectAll('sync_node_asset')
      .where('nodeUserId', '=', nodeUserId)
      .where('localAssetId', '=', localAssetId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async getMappedRemoteIds(nodeUserId: string, remoteAssetIds: string[]): Promise<Set<string>> {
    if (remoteAssetIds.length === 0) {
      return new Set();
    }

    const rows = await this.db
      .selectFrom('sync_node_asset')
      .select('remoteAssetId')
      .where('nodeUserId', '=', nodeUserId)
      .where('remoteAssetId', 'in', remoteAssetIds)
      .execute();

    return new Set(rows.map(({ remoteAssetId }) => remoteAssetId));
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getMappingByRemoteId(nodeUserId: string, remoteAssetId: string) {
    return this.db
      .selectFrom('sync_node_asset')
      .selectAll('sync_node_asset')
      .where('nodeUserId', '=', nodeUserId)
      .where('remoteAssetId', '=', remoteAssetId)
      .executeTakeFirst();
  }

  upsertAssetMapping(dto: Insertable<SyncNodeAssetTable>) {
    return this.db
      .insertInto('sync_node_asset')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['nodeUserId', 'localAssetId']).doUpdateSet({
          remoteAssetId: (eb) => eb.ref('excluded.remoteAssetId'),
          checksum: (eb) => eb.ref('excluded.checksum'),
          metadataUpdateId: (eb) => eb.ref('excluded.metadataUpdateId'),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  updateAssetMapping(id: string, dto: Updateable<SyncNodeAssetTable>) {
    return this.db
      .updateTable('sync_node_asset')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // -- album identity map --

  @GenerateSql({ params: [DummyValue.UUID] })
  getAlbumMappings(nodeUserId: string) {
    return this.db
      .selectFrom('sync_node_album')
      .selectAll('sync_node_album')
      .where('nodeUserId', '=', nodeUserId)
      .execute();
  }

  upsertAlbumMapping(dto: Insertable<SyncNodeAlbumTable>) {
    return this.db
      .insertInto('sync_node_album')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['nodeUserId', 'localAlbumId']).doUpdateSet({
          remoteAlbumId: (eb) => eb.ref('excluded.remoteAlbumId'),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  // -- local change enumeration --

  /**
   * Local assets that have changed since the cursor, ordered by the UUIDv7
   * `updateId` so the cursor can advance monotonically and a run can resume
   * exactly where the last one stopped.
   *
   * Trashed assets are included on purpose: they are what drives propagating a
   * deletion to the peer.
   */
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, 500] })
  getChangedAssets(ownerId: string, cursor: string | null, limit: number) {
    return this.db
      .selectFrom('asset')
      .leftJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .select([
        'asset.id',
        'asset.ownerId',
        'asset.originalPath',
        'asset.originalFileName',
        'asset.checksum',
        'asset.type',
        'asset.isFavorite',
        'asset.visibility',
        'asset.fileCreatedAt',
        'asset.fileModifiedAt',
        'asset.deletedAt',
        'asset.updateId',
        'asset.isExternal',
        'asset.isOffline',
        'asset_exif.description',
      ])
      .where('asset.ownerId', '=', ownerId)
      .$if(!!cursor, (qb) => qb.where('asset.updateId', '>', cursor!))
      .orderBy('asset.updateId asc')
      .limit(limit)
      .execute();
  }

  /** Album ownership lives in `album_user` with an Owner role, not on the album. */
  @GenerateSql({ params: [DummyValue.UUID] })
  getAlbumsForOwner(ownerId: string) {
    return this.db
      .selectFrom('album')
      .select(['album.id', 'album.albumName', 'album.description'])
      .where('album.deletedAt', 'is', null)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('album_user')
            .whereRef('album_user.albumId', '=', 'album.id')
            .where('album_user.role', '=', AlbumUserRole.Owner)
            .where('album_user.userId', '=', ownerId),
        ),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAlbumAssetIds(albumId: string) {
    return this.db
      .selectFrom('album_asset')
      .innerJoin('asset', 'asset.id', 'album_asset.assetId')
      .select('album_asset.assetId')
      .where('album_asset.albumId', '=', albumId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .execute();
  }
}
