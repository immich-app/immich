import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { ApiKeyTable } from 'src/schema/tables/api-key.table';
import { asUuid } from 'src/utils/database';

@Injectable()
export class ApiKeyRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<ApiKeyTable>) {
    return this.db.insertInto('api_keys').values(dto).returning(columns.apiKey).executeTakeFirstOrThrow();
  }

  async update(userId: string, id: string, dto: Updateable<ApiKeyTable>) {
    return this.db
      .updateTable('api_keys')
      .set(dto)
      .where('api_keys.userId', '=', userId)
      .where('id', '=', asUuid(id))
      .returning(columns.apiKey)
      .executeTakeFirstOrThrow();
  }

  async delete(userId: string, id: string) {
    await this.db.deleteFrom('api_keys').where('userId', '=', userId).where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getKey(hashedToken: string) {
    return this.db
      .selectFrom('api_keys')
      .select((eb) => [
        ...columns.authApiKey,
        jsonObjectFrom(
          eb
            .selectFrom('users')
            .select(columns.authUser)
            .whereRef('users.id', '=', 'api_keys.userId')
            .where('users.deletedAt', 'is', null),
        ).as('user'),
      ])
      .where('api_keys.key', '=', hashedToken)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getById(userId: string, id: string) {
    return this.db
      .selectFrom('api_keys')
      .select(columns.apiKey)
      .where('id', '=', asUuid(id))
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('api_keys')
      .select(columns.apiKey)
      .where('userId', '=', userId)
      .orderBy('createdAt', 'desc')
      .execute();
  }
}
