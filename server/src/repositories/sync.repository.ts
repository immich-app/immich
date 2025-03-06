import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, SessionSyncCheckpoints } from 'src/db';
import { SyncEntityType } from 'src/enum';
import { SyncAck } from 'src/types';

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
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['updateId asc'])
      .stream();
  }

  getUserDeletes(ack?: SyncAck) {
    return this.db
      .selectFrom('users_audit')
      .select(['id', 'userId'])
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['id asc'])
      .stream();
  }

  getPartnerUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners')
      .select(['sharedById', 'sharedWithId', 'inTimeline', 'updateId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .orderBy(['updateId asc'])
      .stream();
  }

  getPartnerDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners_audit')
      .select(['id', 'sharedById', 'sharedWithId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['id asc'])
      .stream();
  }

  getAssetUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .where('ownerId', '=', userId)
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['updateId asc'])
      .stream();
  }

  getPartnerAssetsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['updateId asc'])
      .stream();
  }

  getAssetDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .where('ownerId', '=', userId)
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['id asc'])
      .stream();
  }

  getPartnerAssetDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['id asc'])
      .stream();
  }

  getAssetExifsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .innerJoin('assets', 'assets.id', 'exif.assetId')
      .select(columns.syncAssetExif)
      .where('assets.ownerId', '=', userId)
      .$if(!!ack, (qb) => qb.where('exif.updateId', '>', ack!.updateId))
      .where('exif.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['exif.updateId asc'])
      .stream();
  }

  getPartnerAssetExifsUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .innerJoin('assets', 'assets.id', 'exif.assetId')
      .select(columns.syncAssetExif)
      .where('assets.ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$if(!!ack, (qb) => qb.where('exif.updateId', '>', ack!.updateId))
      .where('exif.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy(['exif.updateId asc'])
      .stream();
  }
}
