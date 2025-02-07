import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Sessions } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { withUser } from 'src/entities/session.entity';
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
      .innerJoinLateral(withUser, (join) => join.onTrue())
      .selectAll('sessions')
      .select((eb) => eb.fn.toJson('user').as('user'))
      .where('sessions.token', '=', token)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('sessions')
      .innerJoinLateral(withUser, (join) => join.onTrue())
      .selectAll('sessions')
      .select((eb) => eb.fn.toJson('user').as('user'))
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
