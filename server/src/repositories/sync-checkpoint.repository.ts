import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SyncEntityType } from 'src/enum';
import { DB } from 'src/schema';
import { SessionSyncCheckpointTable } from 'src/schema/tables/sync-checkpoint.table';

@Injectable()
export class SyncCheckpointRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(sessionId: string) {
    return this.db
      .selectFrom('session_sync_checkpoint')
      .select(['type', 'ack'])
      .where('sessionId', '=', sessionId)
      .execute();
  }

  upsertAll(items: Insertable<SessionSyncCheckpointTable>[]) {
    return this.db
      .insertInto('session_sync_checkpoint')
      .values(items)
      .onConflict((oc) =>
        oc.columns(['sessionId', 'type']).doUpdateSet((eb) => ({
          ack: eb.ref('excluded.ack'),
        })),
      )
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  deleteAll(sessionId: string, types?: SyncEntityType[]) {
    return this.db
      .deleteFrom('session_sync_checkpoint')
      .where('sessionId', '=', sessionId)
      .$if(!!types, (qb) => qb.where('type', 'in', types!))
      .execute();
  }

  @GenerateSql()
  getNow() {
    return this.db
      .selectNoFrom((eb) => [
        eb.fn<string>('immich_uuid_v7', [sql.raw<Date>("now() - interval '1 millisecond'")]).as('nowId'),
      ])
      .executeTakeFirstOrThrow();
  }
}
