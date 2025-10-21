import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { writeFile } from 'node:fs/promises';
import { PluginLike } from 'src/interfaces/plugin.interface';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { PluginTable } from 'src/schema/tables/plugin.table';

type PluginSearchOptions = {
  id?: string;
  namespace?: string;
  version?: number;
  name?: string;
  isEnabled?: boolean;
  isInstalled?: boolean;
  isTrusted?: boolean;
};

@Injectable()
export class PluginRepository {
  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(PluginRepository.name);
  }

  search(options: PluginSearchOptions) {
    return this.db
      .selectFrom('plugin')
      .select([
        'id',
        'packageId',
        'version',
        'name',
        'description',
        'isEnabled',
        'isInstalled',
        'isTrusted',
        'requirePath',
        'createdAt',
        'updatedAt',
        'deletedAt',
      ])
      .$if(!!options.id, (qb) => qb.where('id', '=', options.id!))
      .$if(!!options.version, (qb) => qb.where('version', '=', options.version!))
      .$if(!!options.name, (qb) => qb.where('name', '=', options.name!))
      .$if(!!options.isEnabled, (qb) => qb.where('isEnabled', '=', options.isEnabled!))
      .$if(!!options.isInstalled, (qb) => qb.where('isInstalled', '=', options.isInstalled!))
      .$if(!!options.isTrusted, (qb) => qb.where('isTrusted', '=', options.isTrusted!))
      .execute();
  }

  create(dto: Insertable<PluginTable>) {
    return this.db.insertInto('plugin').values(dto).returningAll().executeTakeFirstOrThrow();
  }

  get(id: string) {
    return this.db.selectFrom('plugin').where('id', '=', id).executeTakeFirst();
  }

  update(dto: Updateable<PluginTable>) {
    return this.db.updateTable('plugin').set(dto).returningAll().executeTakeFirstOrThrow();
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('plugin').where('id', '=', id).execute();
  }

  async download(url: string, downloadPath: string): Promise<void> {
    try {
      const { json } = await fetch(url);
      await writeFile(downloadPath, await json());
    } catch (error) {
      this.logger.error(`Error downloading the plugin from ${url}. ${error}`);
    }
  }

  load(pluginPath: string): Promise<PluginLike> {
    return import(pluginPath);
  }
}
