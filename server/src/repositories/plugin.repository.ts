import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { readFile } from 'node:fs/promises';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { DB } from 'src/schema';

@Injectable()
export class PluginRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  /**
   * Loads a plugin from a validated manifest file in a transaction.
   * This ensures all plugin, filter, and action operations are atomic.
   */
  async loadPlugin(manifest: PluginManifestDto) {
    return this.db.transaction().execute(async (tx) => {
      // Upsert the plugin
      const plugin = await tx
        .insertInto('plugin')
        .values({
          name: manifest.name,
          displayName: manifest.displayName,
          description: manifest.description,
          author: manifest.author,
          version: manifest.version,
          wasmPath: manifest.wasm.path,
        })
        .onConflict((oc) =>
          oc.column('name').doUpdateSet({
            displayName: manifest.displayName,
            description: manifest.description,
            author: manifest.author,
            version: manifest.version,
            wasmPath: manifest.wasm.path,
          }),
        )
        .returningAll()
        .executeTakeFirstOrThrow();

      const filters = manifest.filters
        ? await tx
            .insertInto('plugin_filter')
            .values(
              manifest.filters.map((filter) => ({
                pluginId: plugin.id,
                name: filter.name,
                displayName: filter.displayName,
                description: filter.description,
                supportedContexts: filter.supportedContexts,
                schema: filter.schema,
              })),
            )
            .onConflict((oc) =>
              oc.column('name').doUpdateSet((eb) => ({
                pluginId: eb.ref('excluded.pluginId'),
                displayName: eb.ref('excluded.displayName'),
                description: eb.ref('excluded.description'),
                supportedContexts: eb.ref('excluded.supportedContexts'),
                schema: eb.ref('excluded.schema'),
              })),
            )
            .returningAll()
            .execute()
        : [];

      const actions = manifest.actions
        ? await tx
            .insertInto('plugin_action')
            .values(
              manifest.actions.map((action) => ({
                pluginId: plugin.id,
                name: action.name,
                displayName: action.displayName,
                description: action.description,
                supportedContexts: action.supportedContexts,
                schema: action.schema,
              })),
            )
            .onConflict((oc) =>
              oc.column('name').doUpdateSet((eb) => ({
                pluginId: eb.ref('excluded.pluginId'),
                displayName: eb.ref('excluded.displayName'),
                description: eb.ref('excluded.description'),
                supportedContexts: eb.ref('excluded.supportedContexts'),
                schema: eb.ref('excluded.schema'),
              })),
            )
            .returningAll()
            .execute()
        : [];

      return { plugin, filters, actions };
    });
  }

  async readManifest(manifestFilePath: string): Promise<PluginManifestDto> {
    const content = await readFile(manifestFilePath, { encoding: 'utf8' });
    const manifestData = JSON.parse(content);
    return plainToInstance(PluginManifestDto, manifestData);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPlugin(id: string) {
    return this.db
      .selectFrom('plugin')
      .select((eb) => [
        ...columns.plugin,
        jsonArrayFrom(
          eb.selectFrom('plugin_filter').selectAll().whereRef('plugin_filter.pluginId', '=', 'plugin.id'),
        ).as('filters'),
        jsonArrayFrom(
          eb.selectFrom('plugin_action').selectAll().whereRef('plugin_action.pluginId', '=', 'plugin.id'),
        ).as('actions'),
      ])
      .where('plugin.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getPluginByName(name: string) {
    return this.db
      .selectFrom('plugin')
      .select((eb) => [
        ...columns.plugin,
        jsonArrayFrom(
          eb.selectFrom('plugin_filter').selectAll().whereRef('plugin_filter.pluginId', '=', 'plugin.id'),
        ).as('filters'),
        jsonArrayFrom(
          eb.selectFrom('plugin_action').selectAll().whereRef('plugin_action.pluginId', '=', 'plugin.id'),
        ).as('actions'),
      ])
      .where('plugin.name', '=', name)
      .executeTakeFirst();
  }

  @GenerateSql()
  getAllPlugins() {
    return this.db
      .selectFrom('plugin')
      .select((eb) => [
        ...columns.plugin,
        jsonArrayFrom(
          eb.selectFrom('plugin_filter').selectAll().whereRef('plugin_filter.pluginId', '=', 'plugin.id'),
        ).as('filters'),
        jsonArrayFrom(
          eb.selectFrom('plugin_action').selectAll().whereRef('plugin_action.pluginId', '=', 'plugin.id'),
        ).as('actions'),
      ])
      .orderBy('plugin.name')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFilter(id: string) {
    return this.db.selectFrom('plugin_filter').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFiltersByPlugin(pluginId: string) {
    return this.db.selectFrom('plugin_filter').selectAll().where('pluginId', '=', pluginId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAction(id: string) {
    return this.db.selectFrom('plugin_action').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getActionsByPlugin(pluginId: string) {
    return this.db.selectFrom('plugin_action').selectAll().where('pluginId', '=', pluginId).execute();
  }
}
