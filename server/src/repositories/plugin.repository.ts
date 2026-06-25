import { CallContext, Plugin as ExtismPlugin, newPlugin } from '@extism/extism';
import { Injectable } from '@nestjs/common';
import { createPool, Pool } from 'generic-pool';
import { Insertable, Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { PluginMethodSearchDto, PluginSearchDto } from 'src/dtos/plugin.dto';
import { LogLevel, WorkflowType } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { PluginMethodTable } from 'src/schema/tables/plugin-method.table';
import { PluginTable } from 'src/schema/tables/plugin.table';

type PluginMethod = { pluginKey: string; methodName: string };
type PluginLoad = { key: string; label: string; wasmBytes: Buffer };

export type PluginHostFunction = (callContext: CallContext, input: bigint) => Promise<bigint> | bigint;
export type PluginLoadOptions = {
  runInWorker?: boolean;
  functions?: Record<string, PluginHostFunction>;
  allowedHosts?: string[];
};

export type PluginMethodSearchResponse = {
  id: string;
  name: string;
  pluginName: string;
  types: WorkflowType[];
};

const levels = {
  [LogLevel.Verbose]: 'trace',
  [LogLevel.Debug]: 'debug',
  [LogLevel.Log]: 'info',
  [LogLevel.Warn]: 'warn',
  [LogLevel.Error]: 'error',
  [LogLevel.Fatal]: 'error',
} as const;

const asExtismLogLevel = (logLevel: LogLevel) => levels[logLevel] || 'info';

@Injectable()
export class PluginRepository {
  private pluginMap: Map<string, { label: string; pool: Pool<ExtismPlugin> }> = new Map();

  constructor(
    @InjectKysely() private db: Kysely<DB>,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(PluginRepository.name);
  }

  @GenerateSql()
  getForLoad() {
    return this.db
      .selectFrom('plugin')
      .select((eb) => [
        'plugin.id',
        'plugin.name',
        'plugin.version',
        'plugin.wasmBytes',
        jsonArrayFrom(
          eb
            .selectFrom('plugin_method')
            .whereRef('plugin_method.pluginId', '=', 'plugin.id')
            .select(['plugin_method.name', 'plugin_method.hostFunctions']),
        ).as('methods'),
      ])
      .where('enabled', '=', true)
      .execute();
  }

  private queryBuilder() {
    return this.db.selectFrom('plugin').select((eb) => [
      'plugin.id',
      'plugin.name',
      'plugin.title',
      'plugin.description',
      'plugin.author',
      'plugin.version',
      'plugin.createdAt',
      'plugin.updatedAt',
      'plugin.templates',
      jsonArrayFrom(
        eb
          .selectFrom('plugin_method')
          .select([...columns.pluginMethod, 'plugin.name as pluginName'])
          .whereRef('plugin_method.pluginId', '=', 'plugin.id'),
      ).as('methods'),
    ]);
  }

  @GenerateSql()
  search(dto: PluginSearchDto = {}) {
    return this.queryBuilder()
      .$if(!!dto.id, (qb) => qb.where('plugin.id', '=', dto.id!))
      .$if(!!dto.name, (qb) => qb.where('plugin.name', '=', dto.name!))
      .$if(!!dto.title, (qb) => qb.where('plugin.title', '=', dto.title!))
      .$if(!!dto.description, (qb) => qb.where('plugin.description', '=', dto.description!))
      .$if(!!dto.version, (qb) => qb.where('plugin.version', '=', dto.version!))
      .orderBy('plugin.name')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByHash(hash: Buffer) {
    return this.queryBuilder().where('plugin.sha256hash', '=', hash).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getByName(name: string) {
    return this.queryBuilder().where('plugin.name', '=', name).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.queryBuilder().where('plugin.id', '=', id).executeTakeFirst();
  }

  @GenerateSql()
  getForValidation(): Promise<PluginMethodSearchResponse[]> {
    return this.db
      .selectFrom('plugin_method')
      .innerJoin('plugin', 'plugin_method.pluginId', 'plugin.id')
      .select(['plugin_method.id', 'plugin_method.name', 'plugin.name as pluginName', 'plugin_method.types'])
      .execute();
  }

  @GenerateSql()
  searchMethods(dto: PluginMethodSearchDto = {}) {
    return this.db
      .selectFrom('plugin_method')
      .innerJoin('plugin', 'plugin.id', 'plugin_method.pluginId')
      .select(['plugin.name as pluginName', 'plugin_method.pluginId', 'plugin_method.id', ...columns.pluginMethod])
      .$if(!!dto.id, (qb) => qb.where('plugin_method.id', '=', dto.id!))
      .$if(!!dto.name, (qb) => qb.where('plugin_method.name', '=', dto.name!))
      .$if(!!dto.title, (qb) => qb.where('plugin_method.title', '=', dto.title!))
      .$if(!!dto.type, (qb) => qb.where('plugin_method.types', '@>', [dto.type!]))
      .$if(!!dto.description, (qb) => qb.where('plugin_method.description', '=', dto.description!))
      .$if(!!dto.pluginVersion, (qb) => qb.where('plugin.version', '=', dto.pluginVersion!))
      .$if(!!dto.pluginName, (qb) => qb.where('plugin.name', '=', dto.pluginName!))
      .orderBy('plugin_method.name')
      .execute();
  }

  async upsert(dto: Insertable<PluginTable>, initialMethods: Omit<Insertable<PluginMethodTable>, 'pluginId'>[]) {
    return this.db.transaction().execute(async (tx) => {
      // Upsert the plugin
      const plugin = await tx
        .insertInto('plugin')
        .values(dto)
        .onConflict((oc) =>
          oc.columns(['name', 'version']).doUpdateSet((eb) => ({
            title: eb.ref('excluded.title'),
            description: eb.ref('excluded.description'),
            author: eb.ref('excluded.author'),
            version: eb.ref('excluded.version'),
            wasmBytes: eb.ref('excluded.wasmBytes'),
            templates: eb.ref('excluded.templates'),
            sha256hash: eb.ref('excluded.sha256hash'),
          })),
        )
        .returning(['id', 'name'])
        .executeTakeFirstOrThrow();

      // prune methods that no longer exist
      if (initialMethods.length > 0) {
        await tx
          .deleteFrom('plugin_method')
          .where('plugin_method.pluginId', '=', plugin.id)
          .where(
            'name',
            'not in',
            initialMethods.map((method) => method.name),
          )
          .execute();
      }

      const methods =
        initialMethods.length > 0
          ? await tx
              .insertInto('plugin_method')
              .values(initialMethods.map((method) => ({ ...method, pluginId: plugin.id })))
              .onConflict((oc) =>
                oc.columns(['pluginId', 'name']).doUpdateSet(({ ref }) => ({
                  pluginId: ref('excluded.pluginId'),
                  name: ref('excluded.name'),
                  title: ref('excluded.title'),
                  description: ref('excluded.description'),
                  types: ref('excluded.types'),
                  hostFunctions: ref('excluded.hostFunctions'),
                  allowedHosts: ref('excluded.allowedHosts'),
                  uiHints: ref('excluded.uiHints'),
                  schema: ref('excluded.schema'),
                })),
              )
              .returningAll()
              .execute()
          : [];

      return { ...plugin, methods };
    });
  }

  async load({ key, label, wasmBytes }: PluginLoad, { runInWorker, functions, allowedHosts }: PluginLoadOptions) {
    const data = new Uint8Array(wasmBytes.buffer, wasmBytes.byteOffset, wasmBytes.byteLength);
    const logger = LoggingRepository.create(`Plugin:${label}`);
    const pool = createPool<ExtismPlugin>(
      {
        create: () =>
          newPlugin(
            { wasm: [{ data }] },
            {
              useWasi: true,
              runInWorker,
              functions: {
                'extism:host/user': functions ?? {},
              },
              allowedHosts,
              logger: {
                trace: (message) => logger.verbose(message),
                info: (message) => logger.log(message),
                debug: (message) => logger.debug(message),
                warn: (message) => logger.warn(message),
                error: (message) => logger.error(message),
              } as Console,
              logLevel: asExtismLogLevel(logger.getLogLevel()),
              enableWasiOutput: true,
            },
          ),
        destroy: (plugin) => plugin.close(),
      },
      { min: 1, max: 5 },
    );

    try {
      await pool.ready();
      this.pluginMap.set(key, { pool, label });
    } catch (error: Error | any) {
      throw new Error(`Unable to instantiate plugin: ${key}`, { cause: error });
    }
  }

  async callMethod<T>({ pluginKey, methodName }: PluginMethod, input: unknown, context?: unknown) {
    const item = this.pluginMap.get(pluginKey);
    if (!item) {
      throw new Error(`No loaded plugin found for ${pluginKey}`);
    }

    const { pool, label } = item;

    try {
      const plugin = await pool.acquire();
      try {
        const result = await plugin.call(methodName, JSON.stringify(input), context);
        return (result ? result.json() : result) as T;
      } finally {
        await pool.release(plugin);
      }
    } catch (error: Error | any) {
      throw new Error(`Plugin method call failed: ${label}#${methodName}`, { cause: error });
    }
  }
}
