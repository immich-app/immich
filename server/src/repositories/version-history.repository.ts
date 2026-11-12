import { Injectable } from '@nestjs/common';
import type { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { GenerateSql } from 'src/decorators.js';
import { DB } from 'src/schema/index.js';
import { VersionHistoryTable } from 'src/schema/tables/version-history.table.js';

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
