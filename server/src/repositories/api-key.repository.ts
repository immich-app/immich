import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { ApiKeys, DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { asUuid } from 'src/utils/database';

const columns = ['id', 'name', 'userId', 'createdAt', 'updatedAt', 'permissions'] as const;

@Injectable()
export class ApiKeyRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<ApiKeys>) {
    return this.db.insertInto('api_keys').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  async update(userId: string, id: string, dto: Updateable<ApiKeys>) {
    return this.db
      .updateTable('api_keys')
      .set(dto)
      .where('api_keys.userId', '=', userId)
      .where('id', '=', asUuid(id))
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async delete(userId: string, id: string) {
    await this.db.deleteFrom('api_keys').where('userId', '=', userId).where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getKey(hashedToken: string) {
    return this.db
      .selectFrom('api_keys')
      .innerJoinLateral(
        (eb) =>
          eb
            .selectFrom('users')
            .selectAll('users')
            .select((eb) =>
              eb
                .selectFrom('user_metadata')
                .whereRef('users.id', '=', 'user_metadata.userId')
                .select((eb) => eb.fn('array_agg', [eb.table('user_metadata')]).as('metadata'))
                .as('metadata'),
            )
            .whereRef('users.id', '=', 'api_keys.userId')
            .where('users.deletedAt', 'is', null)
            .as('user'),
        (join) => join.onTrue(),
      )
      .select((eb) => [
        'api_keys.id',
        'api_keys.key',
        'api_keys.userId',
        'api_keys.permissions',
        eb.fn.toJson('user').as('user'),
      ])
      .where('api_keys.key', '=', hashedToken)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string) {
    return this.db
      .selectFrom('api_keys')
      .select(columns)
      .where('id', '=', asUuid(id))
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('api_keys')
      .select(columns)
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();
  }
}
