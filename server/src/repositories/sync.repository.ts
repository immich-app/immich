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
      .select(['id', 'name', 'email', 'deletedAt'])
      .select(columns.ackEpoch('updatedAt'))
      .$if(!!ack, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb(eb.fn<Date>('to_timestamp', [sql.val(ack!.ackEpoch)]), '<', eb.ref('updatedAt')),
            eb.and([
              eb(eb.fn<Date>('to_timestamp', [sql.val(ack!.ackEpoch)]), '<=', eb.ref('updatedAt')),
              eb('id', '>', ack!.ids[0]),
            ]),
          ]),
        ),
      )
      .orderBy(['updatedAt asc', 'id asc'])
      .stream();
  }

  getUserDeletes(ack?: SyncAck) {
    return this.db
      .selectFrom('users_audit')
      .select(['userId'])
      .select(columns.ackEpoch('deletedAt'))
      .$if(!!ack, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb(eb.fn<Date>('to_timestamp', [sql.val(ack!.ackEpoch)]), '<', eb.ref('deletedAt')),
            eb.and([
              eb(eb.fn<Date>('to_timestamp', [sql.val(ack!.ackEpoch)]), '<=', eb.ref('deletedAt')),
              eb('userId', '>', ack!.ids[0]),
            ]),
          ]),
        ),
      )
      .orderBy(['deletedAt asc', 'userId asc'])
      .stream();
  }
}
