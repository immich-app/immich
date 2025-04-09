import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB, Sessions } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { asUuid } from 'src/utils/database';

export type SessionSearchOptions = { updatedBefore: Date };

@Injectable()
export class SessionRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ updatedBefore: DummyValue.DATE }] })
  search(options: SessionSearchOptions) {
    return this.db
      .selectFrom('sessions')
      .selectAll()
      .where('sessions.updatedAt', '<=', options.updatedBefore)
      .execute();
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
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('sessions')
      .innerJoin('users', (join) => join.onRef('users.id', '=', 'sessions.userId').on('users.deletedAt', 'is', null))
      .selectAll('sessions')
      .where('sessions.userId', '=', userId)
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
}
