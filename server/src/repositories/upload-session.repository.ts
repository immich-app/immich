import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { DB } from 'src/schema/index.js';
import { UploadSessionTable } from 'src/schema/tables/upload-session.table.js';

@Injectable()
export class UploadSessionRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.STRING, DummyValue.UUID] })
  get(userId: string, id: string) {
    return this.db
      .selectFrom('upload_session')
      .selectAll('upload_session')
      .where('id', '=', id)
      .where('userId', '=', userId)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  create(dto: Insertable<UploadSessionTable>) {
    return this.db.insertInto('upload_session').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  update(id: string, dto: Partial<Insertable<UploadSessionTable>>) {
    return this.db.updateTable('upload_session').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  delete(id: string) {
    return this.db.deleteFrom('upload_session').where('id', '=', id).execute();
  }
}
