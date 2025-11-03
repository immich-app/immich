import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { Chunked, DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { PluginActionTable, PluginFilterTable, PluginTable, PluginTriggerTable } from 'src/schema/tables/plugin.table';

@Injectable()
export class PluginRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  // ============ Plugin CRUD ============

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

  // ============ Trigger CRUD ============

  @GenerateSql({ params: [DummyValue.UUID] })
  getTrigger(id: string) {
    return this.db.selectFrom('plugin_trigger').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  getTriggerByName(name: string) {
    return this.db.selectFrom('plugin_trigger').selectAll().where('name', '=', name).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getTriggersByPlugin(pluginId: string) {
    return this.db.selectFrom('plugin_trigger').selectAll().where('pluginId', '=', pluginId).execute();
  }

  @GenerateSql()
  getTriggersByContext(context: string) {
    return this.db
      .selectFrom('plugin_trigger')
      .selectAll()
      .where('context', '=', context as any)
      .execute();
  }

  @GenerateSql()
  getAllTriggers() {
    return this.db.selectFrom('plugin_trigger').selectAll().orderBy('name').execute();
  }

  @GenerateSql({
    params: [
      {
        pluginId: DummyValue.UUID,
        name: DummyValue.STRING,
        type: DummyValue.STRING,
        displayName: DummyValue.STRING,
        description: DummyValue.STRING,
        context: DummyValue.STRING,
        functionName: DummyValue.STRING,
        schema: null,
      },
    ],
  })
  createTrigger(trigger: Insertable<PluginTriggerTable>) {
    return this.db.insertInto('plugin_trigger').values(trigger).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { displayName: DummyValue.STRING }] })
  updateTrigger(id: string, dto: Updateable<PluginTriggerTable>) {
    return this.db.updateTable('plugin_trigger').set(dto).where('id', '=', id).returningAll().executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteTrigger(id: string) {
    await this.db.deleteFrom('plugin_trigger').where('id', '=', id).execute();
  }

  // ============ Filter CRUD ============

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
        functionName: DummyValue.STRING,
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

  // ============ Action CRUD ============

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
        functionName: DummyValue.STRING,
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

  // ============ Bulk Operations ============

  @Chunked({ paramIndex: 0 })
  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getPluginsByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.db.selectFrom('plugin').selectAll().where('id', 'in', ids).execute();
  }

  @Chunked({ paramIndex: 0 })
  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getTriggersByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.db.selectFrom('plugin_trigger').selectAll().where('id', 'in', ids).execute();
  }

  @Chunked({ paramIndex: 0 })
  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getFiltersByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.db.selectFrom('plugin_filter').selectAll().where('id', 'in', ids).execute();
  }

  @Chunked({ paramIndex: 0 })
  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getActionsByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }
    return this.db.selectFrom('plugin_action').selectAll().where('id', 'in', ids).execute();
  }
}
