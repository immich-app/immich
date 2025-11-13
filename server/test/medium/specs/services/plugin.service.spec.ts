import { Kysely } from 'kysely';
import { PluginContext } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { DB } from 'src/schema';
import { PluginService } from 'src/services/plugin.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;
let pluginRepo: PluginRepository;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(PluginService, {
    database: db || defaultDatabase,
    real: [PluginRepository, AccessRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
  pluginRepo = new PluginRepository(defaultDatabase);
});

afterEach(async () => {
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
      const { sut } = setup();

      const result = await pluginRepo.loadPlugin({
        name: 'test-plugin',
        title: 'Test Plugin',
        description: 'A test plugin',
        author: 'Test Author',
        version: '1.0.0',
        wasm: { path: '/path/to/test.wasm' },
      });

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: result.plugin.id,
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
      const { sut } = setup();

      const result = await pluginRepo.loadPlugin({
        name: 'full-plugin',
        title: 'Full Plugin',
        description: 'A plugin with filters and actions',
        author: 'Test Author',
        version: '1.0.0',
        wasm: { path: '/path/to/full.wasm' },
        filters: [
          {
            name: 'test-filter',
            displayName: 'Test Filter',
            description: 'A test filter',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
        actions: [
          {
            name: 'test-action',
            displayName: 'Test Action',
            description: 'A test action',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
      });

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: result.plugin.id,
        name: 'full-plugin',
        displayName: 'Full Plugin',
        filters: [
          {
            id: result.filters[0].id,
            pluginId: result.plugin.id,
            name: 'test-filter',
            displayName: 'Test Filter',
            description: 'A test filter',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
        actions: [
          {
            id: result.actions[0].id,
            pluginId: result.plugin.id,
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
      const { sut } = setup();

      await pluginRepo.loadPlugin({
        name: 'plugin-1',
        title: 'Plugin 1',
        description: 'First plugin',
        author: 'Author 1',
        version: '1.0.0',
        wasm: { path: '/path/to/plugin1.wasm' },
        filters: [
          {
            name: 'filter-1',
            displayName: 'Filter 1',
            description: 'Filter for plugin 1',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
        ],
      });

      await pluginRepo.loadPlugin({
        name: 'plugin-2',
        title: 'Plugin 2',
        description: 'Second plugin',
        author: 'Author 2',
        version: '2.0.0',
        wasm: { path: '/path/to/plugin2.wasm' },
        actions: [
          {
            name: 'action-2',
            displayName: 'Action 2',
            description: 'Action for plugin 2',
            supportedContexts: [PluginContext.Album],
            schema: undefined,
          },
        ],
      });

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
      const { sut } = setup();

      await pluginRepo.loadPlugin({
        name: 'multi-plugin',
        title: 'Multi Plugin',
        description: 'Plugin with multiple items',
        author: 'Test Author',
        version: '1.0.0',
        wasm: { path: '/path/to/multi.wasm' },
        filters: [
          {
            name: 'filter-a',
            displayName: 'Filter A',
            description: 'First filter',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
          {
            name: 'filter-b',
            displayName: 'Filter B',
            description: 'Second filter',
            supportedContexts: [PluginContext.Album],
            schema: undefined,
          },
        ],
        actions: [
          {
            name: 'action-x',
            displayName: 'Action X',
            description: 'First action',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
          {
            name: 'action-y',
            displayName: 'Action Y',
            description: 'Second action',
            supportedContexts: [PluginContext.Person],
            schema: undefined,
          },
        ],
      });

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
      const { sut } = setup();

      const result = await pluginRepo.loadPlugin({
        name: 'single-plugin',
        title: 'Single Plugin',
        description: 'A single plugin',
        author: 'Test Author',
        version: '1.0.0',
        wasm: { path: '/path/to/single.wasm' },
        filters: [
          {
            name: 'single-filter',
            displayName: 'Single Filter',
            description: 'A single filter',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
        ],
        actions: [
          {
            name: 'single-action',
            displayName: 'Single Action',
            description: 'A single action',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
        ],
      });

      const pluginResult = await sut.get(result.plugin.id);

      expect(pluginResult).toMatchObject({
        id: result.plugin.id,
        name: 'single-plugin',
        displayName: 'Single Plugin',
        filters: [
          {
            id: result.filters[0].id,
            name: 'single-filter',
            displayName: 'Single Filter',
          },
        ],
        actions: [
          {
            id: result.actions[0].id,
            name: 'single-action',
            displayName: 'Single Action',
          },
        ],
      });
    });
  });
});
