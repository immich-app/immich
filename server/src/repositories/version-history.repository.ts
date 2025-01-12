import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
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

  @GenerateSql({ params: [DummyValue.STRING] })
  create(version: Omit<VersionHistoryEntity, 'id' | 'createdAt'>): Promise<VersionHistoryEntity> {
    return this.db.insertInto('version_history').values(version).returningAll().executeTakeFirstOrThrow();
  }
}
