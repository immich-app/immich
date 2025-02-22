import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { readFile } from 'node:fs/promises';
import { DB, SystemMetadata as DbSystemMetadata } from 'src/db';
import { GenerateSql } from 'src/decorators';
import { SystemMetadata } from 'src/entities/system-metadata.entity';

type Upsert = Insertable<DbSystemMetadata>;

@Injectable()
export class SystemMetadataRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: ['metadata_key'] })
  async get<T extends keyof SystemMetadata>(key: T): Promise<SystemMetadata[T] | null> {
    const metadata = await this.db
      .selectFrom('system_metadata')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst();

    if (!metadata) {
      return null;
    }
    return metadata.value as SystemMetadata[T];
  }

  @GenerateSql({ params: ['metadata_key', { foo: 'bar' }] })
  async set<T extends keyof SystemMetadata>(key: T, value: SystemMetadata[T]): Promise<void> {
    await this.db
      .insertInto('system_metadata')
      .values({ key, value } as Upsert)
      .onConflict((oc) => oc.columns(['key']).doUpdateSet({ value } as Upsert))
      .execute();
  }

  @GenerateSql({ params: ['metadata_key'] })
  async delete<T extends keyof SystemMetadata>(key: T): Promise<void> {
    await this.db.deleteFrom('system_metadata').where('key', '=', key).execute();
  }

  readFile(filename: string): Promise<string> {
    return readFile(filename, { encoding: 'utf8' });
  }
}
