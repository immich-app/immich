import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, Sessions } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { asUuid } from 'src/utils/database';

export type SessionSearchOptions = { updatedBefore: Date };

@Injectable()
export class SessionRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  cleanup() {
    return this.db
      .deleteFrom('sessions')
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
      .selectFrom('sessions')
      .select(['id', 'expiresAt', 'pinExpiresAt'])
      .where('id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByToken(token: string) {
    return this.db
      .selectFrom('sessions')
      .select((eb) => [
        ...columns.authSession,
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .select(columns.authUser)
            .whereRef('users.id', '=', 'sessions.userId')
            .where('users.deletedAt', 'is', null),
        ).as('user'),
      ])
      .where('sessions.token', '=', token)
      .where((eb) =>
        eb.or([eb('sessions.expiresAt', 'is', null), eb('sessions.expiresAt', '>', DateTime.now().toJSDate())]),
      )
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('sessions')
      .innerJoin('users', (join) => join.onRef('users.id', '=', 'sessions.userId').on('users.deletedAt', 'is', null))
      .selectAll('sessions')
      .where('sessions.userId', '=', userId)
      .where((eb) =>
        eb.or([eb('sessions.expiresAt', 'is', null), eb('sessions.expiresAt', '>', DateTime.now().toJSDate())]),
      )
      .orderBy('sessions.updatedAt', 'desc')
      .orderBy('sessions.createdAt', 'desc')
      .execute();
  }

  create(dto: Insertable<Sessions>) {
    return this.db.insertInto('sessions').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<Sessions>) {
    return this.db
      .updateTable('sessions')
      .set(dto)
      .where('sessions.id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('sessions').where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async lockAll(userId: string) {
    await this.db.updateTable('sessions').set({ pinExpiresAt: null }).where('userId', '=', userId).execute();
  }
}
