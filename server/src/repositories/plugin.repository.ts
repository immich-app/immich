import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { DB } from 'src/schema';
import { PluginActionTable, PluginFilterTable, PluginTable } from 'src/schema/tables/plugin.table';

@Injectable()
export class PluginRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  /**
   * Loads a plugin from a validated manifest file in a transaction.
   * This ensures all plugin, filter, and action operations are atomic.
   */
  async loadPlugin(manifest: PluginManifestDto) {
    return this.db.transaction().execute(async (trx) => {
      // Upsert the plugin
      const plugin = await trx
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

      const filters = [];
      const actions = [];

      // Upsert filters
      if (manifest.filters) {
        for (const filter of manifest.filters) {
          const filterResult = await trx
            .insertInto('plugin_filter')
            .values({
              pluginId: plugin.id,
              name: filter.name,
              displayName: filter.displayName,
              description: filter.description,
              supportedContexts: filter.supportedContexts,
              schema: filter.schema,
            })
            .onConflict((oc) =>
              oc.column('name').doUpdateSet({
                pluginId: plugin.id,
                displayName: filter.displayName,
                description: filter.description,
                supportedContexts: filter.supportedContexts,
                schema: filter.schema,
              }),
            )
            .returningAll()
            .executeTakeFirstOrThrow();

          filters.push(filterResult);
        }
      }

      // Upsert actions
      if (manifest.actions) {
        for (const action of manifest.actions) {
          const actionResult = await trx
            .insertInto('plugin_action')
            .values({
              pluginId: plugin.id,
              name: action.name,
              displayName: action.displayName,
              description: action.description,
              supportedContexts: action.supportedContexts,
              schema: action.schema,
            })
            .onConflict((oc) =>
              oc.column('name').doUpdateSet({
                pluginId: plugin.id,
                displayName: action.displayName,
                description: action.description,
                supportedContexts: action.supportedContexts,
                schema: action.schema,
              }),
            )
            .returningAll()
            .executeTakeFirstOrThrow();

          actions.push(actionResult);
        }
      }

      return { plugin, filters, actions };
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getPlugin(id: string) {
    return this.db.selectFrom('plugin').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getPluginByName(name: string) {
    return this.db.selectFrom('plugin').selectAll().where('name', '=', name).executeTakeFirst();
  }

  @GenerateSql()
  getAllPlugins() {
    return this.db.selectFrom('plugin').selectAll().orderBy('name').execute();
  }

  @GenerateSql({
    params: [
      {
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        author: DummyValue.STRING,
        version: DummyValue.STRING,
        manifestPath: DummyValue.STRING,
      },
    ],
  })
  createPlugin(plugin: Insertable<PluginTable>) {
    return this.db.insertInto('plugin').values(plugin).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { version: DummyValue.STRING }] })
  updatePlugin(id: string, dto: Updateable<PluginTable>) {
    return this.db.updateTable('plugin').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deletePlugin(id: string) {
    await this.db.deleteFrom('plugin').where('id', '=', id).execute();
  }

  @GenerateSql({
    params: [
      {
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        author: DummyValue.STRING,
        version: DummyValue.STRING,
        manifestPath: DummyValue.STRING,
      },
    ],
  })
  upsertPlugin(plugin: Insertable<PluginTable>) {
    return this.db
      .insertInto('plugin')
      .values(plugin)
      .onConflict((oc) =>
        oc.column('name').doUpdateSet({
          displayName: plugin.displayName,
          description: plugin.description,
          author: plugin.author,
          version: plugin.version,
          wasmPath: plugin.wasmPath,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFilter(id: string) {
    return this.db.selectFrom('plugin_filter').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getFilterByName(name: string) {
    return this.db.selectFrom('plugin_filter').selectAll().where('name', '=', name).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFiltersByPlugin(pluginId: string) {
    return this.db.selectFrom('plugin_filter').selectAll().where('pluginId', '=', pluginId).execute();
  }

  @GenerateSql()
  getFiltersByContext(context: string) {
    return this.db
      .selectFrom('plugin_filter')
      .selectAll()
      .where('supportedContexts', '@>', [context] as any)
      .execute();
  }

  @GenerateSql()
  getAllFilters() {
    return this.db.selectFrom('plugin_filter').selectAll().orderBy('name').execute();
  }

  @GenerateSql({
    params: [
      {
        pluginId: DummyValue.UUID,
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        supportedContexts: [DummyValue.STRING],
        schema: null,
      },
    ],
  })
  createFilter(filter: Insertable<PluginFilterTable>) {
    return this.db.insertInto('plugin_filter').values(filter).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { displayName: DummyValue.STRING }] })
  updateFilter(id: string, dto: Updateable<PluginFilterTable>) {
    return this.db.updateTable('plugin_filter').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteFilter(id: string) {
    await this.db.deleteFrom('plugin_filter').where('id', '=', id).execute();
  }

  @GenerateSql({
    params: [
      {
        pluginId: DummyValue.UUID,
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        supportedContexts: [DummyValue.STRING],
        schema: null,
      },
    ],
  })
  upsertFilter(filter: Insertable<PluginFilterTable>) {
    return this.db
      .insertInto('plugin_filter')
      .values(filter)
      .onConflict((oc) =>
        oc.column('name').doUpdateSet({
          pluginId: filter.pluginId,
          displayName: filter.displayName,
          description: filter.description,
          supportedContexts: filter.supportedContexts,
          schema: filter.schema,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAction(id: string) {
    return this.db.selectFrom('plugin_action').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getActionByName(name: string) {
    return this.db.selectFrom('plugin_action').selectAll().where('name', '=', name).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getActionsByPlugin(pluginId: string) {
    return this.db.selectFrom('plugin_action').selectAll().where('pluginId', '=', pluginId).execute();
  }

  @GenerateSql()
  getActionsByContext(context: string) {
    return this.db
      .selectFrom('plugin_action')
      .selectAll()
      .where('supportedContexts', '@>', [context] as any)
      .execute();
  }

  @GenerateSql()
  getAllActions() {
    return this.db.selectFrom('plugin_action').selectAll().orderBy('name').execute();
  }

  @GenerateSql({
    params: [
      {
        pluginId: DummyValue.UUID,
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        supportedContexts: [DummyValue.STRING],
        schema: null,
      },
    ],
  })
  createAction(action: Insertable<PluginActionTable>) {
    return this.db.insertInto('plugin_action').values(action).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { displayName: DummyValue.STRING }] })
  updateAction(id: string, dto: Updateable<PluginActionTable>) {
    return this.db.updateTable('plugin_action').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteAction(id: string) {
    await this.db.deleteFrom('plugin_action').where('id', '=', id).execute();
  }

  @GenerateSql({
    params: [
      {
        pluginId: DummyValue.UUID,
        name: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        supportedContexts: [DummyValue.STRING],
        schema: null,
      },
    ],
  })
  upsertAction(action: Insertable<PluginActionTable>) {
    return this.db
      .insertInto('plugin_action')
      .values(action)
      .onConflict((oc) =>
        oc.column('name').doUpdateSet({
          pluginId: action.pluginId,
          displayName: action.displayName,
          description: action.description,
          supportedContexts: action.supportedContexts,
          schema: action.schema,
        }),
      )
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
