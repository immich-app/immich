import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, VersionHistory } from 'src/db';
import { GenerateSql } from 'src/decorators';

@Injectable()
export class VersionHistoryRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql()
  getAll() {
    return this.db.selectFrom('version_history').selectAll().orderBy('createdAt', 'desc').execute();
  }

  @GenerateSql()
  getLatest() {
    return this.db.selectFrom('version_history').selectAll().orderBy('createdAt', 'desc').executeTakeFirst();
  }

  @GenerateSql({ params: [{ version: 'v1.123.0' }] })
  create(version: Insertable<VersionHistory>) {
    return this.db.insertInto('version_history').values(version).returningAll().executeTakeFirstOrThrow();
  }
}
