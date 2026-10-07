import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import type { Insertable, Kysely, Updateable } from 'kysely';
import { columns } from 'src/database.js';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { DB } from 'src/schema/index.js';
import { PasskeyTable } from 'src/schema/tables/passkey.table.js';
import { asUuid } from 'src/utils/database.js';

export type PasskeySearchOptions = {
  id?: string;
  userId?: string;
};

@Injectable()
export class PasskeyRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  create(dto: Insertable<PasskeyTable>) {
    return this.db.insertInto('passkey').values(dto).returning(columns.passkey).executeTakeFirstOrThrow();
  }

  update(id: string, dto: Updateable<PasskeyTable>) {
    return this.db
      .updateTable('passkey')
      .set(dto)
      .where('id', '=', asUuid(id))
      .returning(columns.passkey)
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('passkey').where('id', '=', asUuid(id)).execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByCredentialId(credentialId: string) {
    return this.db.selectFrom('passkey').selectAll().where('credentialId', '=', credentialId).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db.selectFrom('passkey').select(columns.passkey).where('id', '=', asUuid(id)).executeTakeFirst();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID }] })
  search(options: PasskeySearchOptions) {
    return this.db
      .selectFrom('passkey')
      .select(columns.passkey)
      .$if(!!options.id, (qb) => qb.where('id', '=', asUuid(options.id!)))
      .$if(!!options.userId, (qb) => qb.where('userId', '=', options.userId!))
      .orderBy('createdAt', 'desc')
      .execute();
  }
}
