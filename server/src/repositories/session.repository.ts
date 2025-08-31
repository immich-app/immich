import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { SessionTable } from 'src/schema/tables/session.table';
import { asUuid } from 'src/utils/database';

export type SessionSearchOptions = { updatedBefore: Date };

@Injectable()
export class SessionRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  cleanup() {
    return this.db
      .deleteFrom('session')
      .where((eb) =>
        eb.or([
          eb('updatedAt', '<=', DateTime.now().minus({ days: 90 }).toJSDate()),
          eb.and([eb('expiresAt', 'is not', null), eb('expiresAt', '<=', DateTime.now().toJSDate())]),
        ]),
      )
      .returning(['id', 'deviceOS', 'deviceType'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db
      .selectFrom('session')
      .select(['id', 'expiresAt', 'pinExpiresAt'])
      .where('id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async isPendingSyncReset(id: string) {
    const result = await this.db
      .selectFrom('session')
      .select(['isPendingSyncReset'])
      .where('id', '=', id)
      .executeTakeFirst();
    return result?.isPendingSyncReset ?? false;
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string) {
    return this.db
      .selectFrom('session')
      .select((eb) => [
        ...columns.authSession,
        jsonObjectFrom(
          eb
            .selectFrom('user')
            .select(columns.authUser)
            .whereRef('user.id', '=', 'session.userId')
            .where('user.deletedAt', 'is', null),
        ).as('user'),
      ])
      .where('session.token', '=', token)
      .where((eb) =>
        eb.or([eb('session.expiresAt', 'is', null), eb('session.expiresAt', '>', DateTime.now().toJSDate())]),
      )
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('session')
      .innerJoin('user', (join) => join.onRef('user.id', '=', 'session.userId').on('user.deletedAt', 'is', null))
      .selectAll('session')
      .where('session.userId', '=', userId)
      .where((eb) =>
        eb.or([eb('session.expiresAt', 'is', null), eb('session.expiresAt', '>', DateTime.now().toJSDate())]),
      )
      .orderBy('session.updatedAt', 'desc')
      .orderBy('session.createdAt', 'desc')
      .execute();
  }

  create(dto: Insertable<SessionTable>) {
    return this.db.insertInto('session').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<SessionTable>) {
    return this.db
      .updateTable('session')
      .set(dto)
      .where('session.id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('session').where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async lockAll(userId: string) {
    await this.db.updateTable('session').set({ pinExpiresAt: null }).where('userId', '=', userId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async resetSyncProgress(sessionId: string) {
    await this.db.transaction().execute((tx) => {
      return Promise.all([
        tx.updateTable('session').set({ isPendingSyncReset: false }).where('id', '=', sessionId).execute(),
        tx.deleteFrom('session_sync_checkpoint').where('sessionId', '=', sessionId).execute(),
      ]);
    });
  }
}
