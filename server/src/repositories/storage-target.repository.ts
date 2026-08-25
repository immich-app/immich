import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetVisibility, StorageTransferScopeType, StorageTransferStatus } from 'src/enum';
import { DB } from 'src/schema';
import {
  StorageTargetObjectTable,
  StorageTargetTable,
  StorageTargetTransferTable,
} from 'src/schema/tables/storage-target.table';
import { StorageTransferScope } from 'src/types';

@Injectable()
export class StorageTargetRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [] })
  getAll() {
    return this.db.selectFrom('storage_target').selectAll('storage_target').orderBy('name asc').execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db.selectFrom('storage_target').selectAll('storage_target').where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByName(name: string) {
    return this.db.selectFrom('storage_target').selectAll('storage_target').where('name', '=', name).executeTakeFirst();
  }

  create(dto: Insertable<StorageTargetTable>) {
    return this.db.insertInto('storage_target').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<StorageTargetTable>) {
    return this.db.updateTable('storage_target').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  async delete(id: string) {
    await this.db.deleteFrom('storage_target').where('id', '=', id).execute();
  }

  // -- transfers --

  createTransfer(dto: Insertable<StorageTargetTransferTable>) {
    return this.db.insertInto('storage_target_transfer').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTransfer(id: string) {
    return this.db
      .selectFrom('storage_target_transfer')
      .selectAll('storage_target_transfer')
      .where('id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTransfers(targetId: string) {
    return this.db
      .selectFrom('storage_target_transfer')
      .selectAll('storage_target_transfer')
      .where('targetId', '=', targetId)
      .orderBy('createdAt desc')
      .limit(100)
      .execute();
  }

  updateTransfer(id: string, dto: Updateable<StorageTargetTransferTable>) {
    return this.db
      .updateTable('storage_target_transfer')
      .set(dto)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Atomically bump the progress counters so concurrent workers do not clobber each other,
   * and close the transfer out once every queued item has reported back.
   */
  async incrementTransferProgress(id: string, { completed = 0, failed = 0 }: { completed?: number; failed?: number }) {
    const transfer = await this.db
      .updateTable('storage_target_transfer')
      .set((eb) => ({
        completedCount: eb('completedCount', '+', completed),
        failedCount: eb('failedCount', '+', failed),
      }))
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (
      transfer.status === StorageTransferStatus.Running &&
      transfer.completedCount + transfer.failedCount >= transfer.totalCount
    ) {
      return this.updateTransfer(id, {
        status: transfer.failedCount > 0 ? StorageTransferStatus.Failed : StorageTransferStatus.Completed,
        finishedAt: new Date(),
      });
    }

    return transfer;
  }

  // -- asset enumeration --

  /**
   * Assets eligible for export: owned by the user, not deleted, and physically
   * present locally. External-library and offline assets are excluded because we
   * have no local bytes to upload for them.
   */
  private exportableAssetQuery(ownerId: string) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .where('asset.ownerId', '=', ownerId)
      .where('asset.deletedAt', 'is', null)
      .where('asset.isExternal', '=', false)
      .where('asset.isOffline', '=', false)
      .where('asset.visibility', '!=', AssetVisibility.Hidden);
  }

  @GenerateSql({ params: [DummyValue.UUID, { type: StorageTransferScopeType.All }], stream: true })
  streamAssetsForExport(ownerId: string, scope: StorageTransferScope) {
    let query = this.exportableAssetQuery(ownerId);

    if (scope.type === StorageTransferScopeType.Assets) {
      query = query.where('asset.id', 'in', scope.assetIds);
    } else if (scope.type === StorageTransferScopeType.Albums) {
      query = query.where('asset.id', 'in', (eb) =>
        eb.selectFrom('album_asset').select('album_asset.assetId').where('album_asset.albumId', 'in', scope.albumIds),
      );
    }

    return query.stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAssetForExport(id: string) {
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
        'asset_exif.fileSizeInByte',
      ])
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  // -- object ledger --

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getObjectByAsset(targetId: string, assetId: string) {
    return this.db
      .selectFrom('storage_target_object')
      .selectAll('storage_target_object')
      .where('targetId', '=', targetId)
      .where('assetId', '=', assetId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.STRING]] })
  async filterNewRemoteKeys(targetId: string, remoteKeys: string[]): Promise<string[]> {
    if (remoteKeys.length === 0) {
      return [];
    }

    const known = await this.db
      .selectFrom('storage_target_object')
      .select('remoteKey')
      .where('targetId', '=', targetId)
      .where('remoteKey', 'in', remoteKeys)
      .execute();

    const knownKeys = new Set(known.map(({ remoteKey }) => remoteKey));
    return remoteKeys.filter((key) => !knownKeys.has(key));
  }

  upsertObject(dto: Insertable<StorageTargetObjectTable>) {
    return this.db
      .insertInto('storage_target_object')
      .values(dto)
      .onConflict((oc) =>
        oc.columns(['targetId', 'remoteKey']).doUpdateSet({
          assetId: (eb) => eb.ref('excluded.assetId'),
          size: (eb) => eb.ref('excluded.size'),
          checksum: (eb) => eb.ref('excluded.checksum'),
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
