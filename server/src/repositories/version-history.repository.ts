import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { VersionHistoryTable } from 'src/schema/tables/version-history.table';

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

  create(version: Insertable<VersionHistoryTable>) {
    return this.db.insertInto('version_history').values(version).returningAll().executeTakeFirstOrThrow();
  }
}
