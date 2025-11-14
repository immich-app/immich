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

      const result = await pluginRepo.loadPlugin(
        {
          name: 'test-plugin',
          title: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/path/to/test.wasm' },
        },
        '/test/base/path',
      );

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: result.plugin.id,
        name: 'test-plugin',
        description: 'A test plugin',
        author: 'Test Author',
        version: '1.0.0',
        filters: [],
        actions: [],
      });
    });

    it('should return plugin with filters and actions', async () => {
      const { sut } = setup();

      const result = await pluginRepo.loadPlugin(
        {
          name: 'full-plugin',
          title: 'Full Plugin',
          description: 'A plugin with filters and actions',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/path/to/full.wasm' },
          filters: [
            {
              methodName: 'test-filter',
              title: 'Test Filter',
              description: 'A test filter',
              supportedContexts: [PluginContext.Asset],
              schema: { type: 'object', properties: {} },
            },
          ],
          actions: [
            {
              methodName: 'test-action',
              title: 'Test Action',
              description: 'A test action',
              supportedContexts: [PluginContext.Asset],
              schema: { type: 'object', properties: {} },
            },
          ],
        },
        '/test/base/path',
      );

      const plugins = await sut.getAll();

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: result.plugin.id,
        name: 'full-plugin',
        filters: [
          {
            id: result.filters[0].id,
            pluginId: result.plugin.id,
            methodName: 'test-filter',
            title: 'Test Filter',
            description: 'A test filter',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
        actions: [
          {
            id: result.actions[0].id,
            pluginId: result.plugin.id,
            methodName: 'test-action',
            title: 'Test Action',
            description: 'A test action',
            supportedContexts: [PluginContext.Asset],
            schema: { type: 'object', properties: {} },
          },
        ],
      });
    });

    it('should return multiple plugins with their respective filters and actions', async () => {
      const { sut } = setup();

      await pluginRepo.loadPlugin(
        {
          name: 'plugin-1',
          title: 'Plugin 1',
          description: 'First plugin',
          author: 'Author 1',
          version: '1.0.0',
          wasm: { path: '/path/to/plugin1.wasm' },
          filters: [
            {
              methodName: 'filter-1',
              title: 'Filter 1',
              description: 'Filter for plugin 1',
              supportedContexts: [PluginContext.Asset],
              schema: undefined,
            },
          ],
        },
        '/test/base/path',
      );

      await pluginRepo.loadPlugin(
        {
          name: 'plugin-2',
          title: 'Plugin 2',
          description: 'Second plugin',
          author: 'Author 2',
          version: '2.0.0',
          wasm: { path: '/path/to/plugin2.wasm' },
          actions: [
            {
              methodName: 'action-2',
              title: 'Action 2',
              description: 'Action for plugin 2',
              supportedContexts: [PluginContext.Album],
              schema: undefined,
            },
          ],
        },
        '/test/base/path',
      );

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

      await pluginRepo.loadPlugin(
        {
          name: 'multi-plugin',
          title: 'Multi Plugin',
          description: 'Plugin with multiple items',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/path/to/multi.wasm' },
          filters: [
            {
              methodName: 'filter-a',
              title: 'Filter A',
              description: 'First filter',
              supportedContexts: [PluginContext.Asset],
              schema: undefined,
            },
            {
              methodName: 'filter-b',
              title: 'Filter B',
              description: 'Second filter',
              supportedContexts: [PluginContext.Album],
              schema: undefined,
            },
          ],
          actions: [
            {
              methodName: 'action-x',
              title: 'Action X',
              description: 'First action',
              supportedContexts: [PluginContext.Asset],
              schema: undefined,
            },
            {
              methodName: 'action-y',
              title: 'Action Y',
              description: 'Second action',
              supportedContexts: [PluginContext.Person],
              schema: undefined,
            },
          ],
        },
        '/test/base/path',
      );

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

      const result = await pluginRepo.loadPlugin(
        {
          name: 'single-plugin',
          title: 'Single Plugin',
          description: 'A single plugin',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/path/to/single.wasm' },
          filters: [
            {
              methodName: 'single-filter',
              title: 'Single Filter',
              description: 'A single filter',
              supportedContexts: [PluginContext.Asset],
              schema: undefined,
            },
          ],
          actions: [
            {
              methodName: 'single-action',
              title: 'Single Action',
              description: 'A single action',
              supportedContexts: [PluginContext.Asset],
              schema: undefined,
            },
          ],
        },
        '/test/base/path',
      );

      const pluginResult = await sut.get(result.plugin.id);

      expect(pluginResult).toMatchObject({
        id: result.plugin.id,
        name: 'single-plugin',
        filters: [
          {
            id: result.filters[0].id,
            methodName: 'single-filter',
            title: 'Single Filter',
          },
        ],
        actions: [
          {
            id: result.actions[0].id,
            methodName: 'single-action',
            title: 'Single Action',
          },
        ],
      });
    });
  });
});
