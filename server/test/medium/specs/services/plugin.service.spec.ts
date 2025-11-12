import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { DB } from 'src/schema';
import { PluginContext } from 'src/schema/tables/plugin.table';
import { PluginService } from 'src/services/plugin.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(PluginService, {
    database: db || defaultDatabase,
    real: [PluginRepository, AccessRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

afterEach(async () => {
  await defaultDatabase.deleteFrom('plugin_action').execute();
  await defaultDatabase.deleteFrom('plugin_filter').execute();
  await defaultDatabase.deleteFrom('plugin').execute();
});

describe(PluginService.name, () => {
  describe('getAll', () => {
    it('should return empty array when no plugins exist', async () => {
      const { sut } = setup();

      const plugins = await sut.getAll();

      expect(plugins).toEqual([]);
    });

    it('should return plugin without filters and actions', async () => {
      const { sut, ctx } = setup();

      const plugin = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'test-plugin',
          displayName: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author',
          version: '1.0.0',
          wasmPath: '/path/to/test.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: plugin.id,
        name: 'test-plugin',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        author: 'Test Author',
        version: '1.0.0',
        wasmPath: '/path/to/test.wasm',
        filters: [],
        actions: [],
      });
    });

    it('should return plugin with filters and actions', async () => {
      const { sut, ctx } = setup();

      const plugin = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'full-plugin',
          displayName: 'Full Plugin',
          description: 'A plugin with filters and actions',
          author: 'Test Author',
          version: '1.0.0',
          wasmPath: '/path/to/full.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Insert filter
      const filter = await ctx.database
        .insertInto('plugin_filter')
        .values({
          pluginId: plugin.id,
          name: 'test-filter',
          displayName: 'Test Filter',
          description: 'A test filter',
          supportedContexts: [PluginContext.Asset],
          schema: { type: 'object', properties: {} },
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const action = await ctx.database
        .insertInto('plugin_action')
        .values({
          pluginId: plugin.id,
          name: 'test-action',
          displayName: 'Test Action',
          description: 'A test action',
          supportedContexts: [PluginContext.Asset],
          schema: { type: 'object', properties: {} },
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: plugin.id,
        name: 'full-plugin',
        displayName: 'Full Plugin',
        filters: [
          {
            id: filter.id,
            pluginId: plugin.id,
            name: 'test-filter',
            displayName: 'Test Filter',
            description: 'A test filter',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
        actions: [
          {
            id: action.id,
            pluginId: plugin.id,
            name: 'test-action',
            displayName: 'Test Action',
            description: 'A test action',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
      });
    });

    it('should return multiple plugins with their respective filters and actions', async () => {
      const { sut, ctx } = setup();

      const plugin1 = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'plugin-1',
          displayName: 'Plugin 1',
          description: 'First plugin',
          author: 'Author 1',
          version: '1.0.0',
          wasmPath: '/path/to/plugin1.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await ctx.database
        .insertInto('plugin_filter')
        .values({
          pluginId: plugin1.id,
          name: 'filter-1',
          displayName: 'Filter 1',
          description: 'Filter for plugin 1',
          supportedContexts: [PluginContext.Asset],
          schema: null,
        })
        .execute();

      const plugin2 = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'plugin-2',
          displayName: 'Plugin 2',
          description: 'Second plugin',
          author: 'Author 2',
          version: '2.0.0',
          wasmPath: '/path/to/plugin2.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await ctx.database
        .insertInto('plugin_action')
        .values({
          pluginId: plugin2.id,
          name: 'action-2',
          displayName: 'Action 2',
          description: 'Action for plugin 2',
          supportedContexts: [PluginContext.Album],
          schema: null,
        })
        .execute();

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('plugin-1');
      expect(plugins[0].filters).toHaveLength(1);
      expect(plugins[0].actions).toHaveLength(0);

      expect(plugins[1].name).toBe('plugin-2');
      expect(plugins[1].filters).toHaveLength(0);
      expect(plugins[1].actions).toHaveLength(1);
    });

    it('should handle plugin with multiple filters and actions', async () => {
      const { sut, ctx } = setup();

      const plugin = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'multi-plugin',
          displayName: 'Multi Plugin',
          description: 'Plugin with multiple items',
          author: 'Test Author',
          version: '1.0.0',
          wasmPath: '/path/to/multi.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Insert multiple filters
      await ctx.database
        .insertInto('plugin_filter')
        .values([
          {
            pluginId: plugin.id,
            name: 'filter-a',
            displayName: 'Filter A',
            description: 'First filter',
            supportedContexts: [PluginContext.Asset],
            schema: null,
          },
          {
            pluginId: plugin.id,
            name: 'filter-b',
            displayName: 'Filter B',
            description: 'Second filter',
            supportedContexts: [PluginContext.Album],
            schema: null,
          },
        ])
        .execute();

      // Insert multiple actions
      await ctx.database
        .insertInto('plugin_action')
        .values([
          {
            pluginId: plugin.id,
            name: 'action-x',
            displayName: 'Action X',
            description: 'First action',
            supportedContexts: [PluginContext.Asset],
            schema: null,
          },
          {
            pluginId: plugin.id,
            name: 'action-y',
            displayName: 'Action Y',
            description: 'Second action',
            supportedContexts: [PluginContext.Person],
            schema: null,
          },
        ])
        .execute();

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0].filters).toHaveLength(2);
      expect(plugins[0].actions).toHaveLength(2);
    });
  });

  describe('get', () => {
    it('should throw error when plugin does not exist', async () => {
      const { sut } = setup();

      await expect(sut.get('00000000-0000-0000-0000-000000000000')).rejects.toThrow('Plugin not found');
    });

    it('should return single plugin with filters and actions', async () => {
      const { sut, ctx } = setup();

      const plugin = await ctx.database
        .insertInto('plugin')
        .values({
          name: 'single-plugin',
          displayName: 'Single Plugin',
          description: 'A single plugin',
          author: 'Test Author',
          version: '1.0.0',
          wasmPath: '/path/to/single.wasm',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const filter = await ctx.database
        .insertInto('plugin_filter')
        .values({
          pluginId: plugin.id,
          name: 'single-filter',
          displayName: 'Single Filter',
          description: 'A single filter',
          supportedContexts: [PluginContext.Asset],
          schema: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const action = await ctx.database
        .insertInto('plugin_action')
        .values({
          pluginId: plugin.id,
          name: 'single-action',
          displayName: 'Single Action',
          description: 'A single action',
          supportedContexts: [PluginContext.Asset],
          schema: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const result = await sut.get(plugin.id);

      expect(result).toMatchObject({
        id: plugin.id,
        name: 'single-plugin',
        displayName: 'Single Plugin',
        filters: [
          {
            id: filter.id,
            name: 'single-filter',
            displayName: 'Single Filter',
          },
        ],
        actions: [
          {
            id: action.id,
            name: 'single-action',
            displayName: 'Single Action',
          },
        ],
      });
    });
  });
});
