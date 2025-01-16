import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB, VersionHistory } from 'src/db';
import { GenerateSql } from 'src/decorators';
import { VersionHistoryEntity } from 'src/entities/version-history.entity';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';

@Injectable()
export class VersionHistoryRepository implements IVersionHistoryRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql()
  getAll(): Promise<VersionHistoryEntity[]> {
    return this.db.selectFrom('version_history').selectAll().orderBy('createdAt', 'desc').execute();
  }

  @GenerateSql()
  getLatest(): Promise<VersionHistoryEntity | undefined> {
    return this.db.selectFrom('version_history').selectAll().orderBy('createdAt', 'desc').executeTakeFirst();
  }

  @GenerateSql({ params: [{ version: 'v1.123.0' }] })
  create(version: Insertable<VersionHistory>): Promise<VersionHistoryEntity> {
    return this.db.insertInto('version_history').values(version).returningAll().executeTakeFirstOrThrow();
  }
}
