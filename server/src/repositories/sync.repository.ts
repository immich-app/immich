import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, SelectQueryBuilder, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, SessionSyncCheckpoints } from 'src/db';
import { SyncEntityType } from 'src/enum';
import { SyncAck } from 'src/types';

type auditTables = 'users_audit' | 'partners_audit' | 'assets_audit';
type upsertTables = 'users' | 'partners' | 'assets' | 'exif';

@Injectable()
export class SyncRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  getCheckpoints(sessionId: string) {
    return this.db
      .selectFrom('session_sync_checkpoints')
      .select(['type', 'ack'])
      .where('sessionId', '=', sessionId)
      .execute();
  }

  upsertCheckpoints(items: Insertable<SessionSyncCheckpoints>[]) {
    return this.db
      .insertInto('session_sync_checkpoints')
      .values(items)
      .onConflict((oc) =>
        oc.columns(['sessionId', 'type']).doUpdateSet((eb) => ({
          ack: eb.ref('excluded.ack'),
        })),
      )
      .execute();
  }

  deleteCheckpoints(sessionId: string, types?: SyncEntityType[]) {
    return this.db
      .deleteFrom('session_sync_checkpoints')
      .where('sessionId', '=', sessionId)
      .$if(!!types, (qb) => qb.where('type', 'in', types!))
      .execute();
  }

  getUserUpserts(ack?: SyncAck) {
    return this.db
      .selectFrom('users')
      .select(['id', 'name', 'email', 'deletedAt', 'updateId'])
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  getUserDeletes(ack?: SyncAck) {
    return this.db
      .selectFrom('users_audit')
      .select(['id', 'userId'])
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  getPartnerUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners')
      .select(['sharedById', 'sharedWithId', 'inTimeline', 'updateId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  getPartnerDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners_audit')
      .select(['id', 'sharedById', 'sharedWithId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  getAssetUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .where('ownerId', '=', userId)
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  getPartnerAssetsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  getAssetDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .where('ownerId', '=', userId)
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  getPartnerAssetDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  getAssetExifsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .select(columns.syncAssetExif)
      .where('assetId', 'in', (eb) => eb.selectFrom('assets').select('id').where('ownerId', '=', userId))
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  getPartnerAssetExifsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .select(columns.syncAssetExif)
      .where('assetId', 'in', (eb) =>
        eb
          .selectFrom('assets')
          .select('id')
          .where('ownerId', 'in', (eb) =>
            eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
          ),
      )
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }

  private auditTableFilters<T extends keyof Pick<DB, auditTables>, D>(qb: SelectQueryBuilder<DB, T, D>, ack?: SyncAck) {
    const builder = qb as SelectQueryBuilder<DB, auditTables, D>;
    return builder
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .orderBy(['id asc']) as SelectQueryBuilder<DB, T, D>;
  }

  private upsertTableFilters<T extends keyof Pick<DB, upsertTables>, D>(
    qb: SelectQueryBuilder<DB, T, D>,
    ack?: SyncAck,
  ) {
    const builder = qb as SelectQueryBuilder<DB, upsertTables, D>;
    return builder
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .orderBy(['updateId asc']) as SelectQueryBuilder<DB, T, D>;
  }
}
