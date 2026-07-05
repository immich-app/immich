import { Kysely } from 'kysely';
import { WorkflowType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { DB } from 'src/schema';
import { PluginService } from 'src/services/plugin.service';
import { newMediumService } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const wasmBytes = Buffer.from('some-wasm-binary-data');
const sha256hash = Buffer.from('some-manifest-hash');

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
  await defaultDatabase.deleteFrom('plugin').execute();
});

describe(PluginService.name, () => {
  describe('getAll', () => {
    it('should return empty array when no plugins exist', async () => {
      const { sut } = setup();
      await expect(sut.search({})).resolves.toEqual([]);
    });

    it('should return plugin without methods', async () => {
      const { ctx, sut } = setup();

      const result = await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'test-plugin',
          title: 'Test Plugin',
          description: 'A test plugin',
          author: 'Test Author',
          version: '1.0.0',
          templates: [],
          wasmBytes,
          sha256hash,
        },
        [],
      );

      const plugins = await sut.search({});

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        id: result.id,
        name: 'test-plugin',
        description: 'A test plugin',
        author: 'Test Author',
        version: '1.0.0',
        methods: [],
      });
    });

    it('should return plugin with multiple methods', async () => {
      const { ctx, sut } = setup();

      await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'full-plugin',
          title: 'Full Plugin',
          description: 'A plugin with multiple methods',
          author: 'Test Author',
          version: '1.0.0',
          templates: [],
          wasmBytes,
          sha256hash,
        },
        [
          {
            name: 'test-filter',
            title: 'Test Filter',
            description: 'A test filter',
            types: [WorkflowType.AssetV1],
            schema: { type: 'object', properties: {} },
          },
          {
            name: 'test-action',
            title: 'Test Action',
            description: 'A test action',
            types: [WorkflowType.AssetV1],
            schema: { type: 'object', properties: {} },
          },
        ],
      );

      const plugins = await sut.search({});

      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toMatchObject({
        name: 'full-plugin',
        methods: [
          {
            name: 'test-filter',
            title: 'Test Filter',
            description: 'A test filter',
            types: [WorkflowType.AssetV1],
            schema: { type: 'object', properties: {} },
          },
          {
            name: 'test-action',
            title: 'Test Action',
            description: 'A test action',
            types: [WorkflowType.AssetV1],
            schema: { type: 'object', properties: {} },
          },
        ],
      });
    });

    it('should return multiple plugins with their respective methods', async () => {
      const { ctx, sut } = setup();

      await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'plugin-1',
          title: 'Plugin 1',
          description: 'First plugin',
          author: 'Author 1',
          version: '1.0.0',
          templates: [],
          wasmBytes,
          sha256hash,
        },
        [
          {
            name: 'filter-1',
            title: 'Filter 1',
            description: 'Filter for plugin 1',
            types: [WorkflowType.AssetV1],
          },
        ],
      );

      await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'plugin-2',
          title: 'Plugin 2',
          description: 'Second plugin',
          author: 'Author 2',
          version: '2.0.0',
          templates: [],
          wasmBytes,
          sha256hash,
        },
        [
          {
            name: 'action-2',
            title: 'Action 2',
            description: 'Action for plugin 2',
            types: [WorkflowType.AssetV1],
          },
        ],
      );

      const plugins = await sut.search({});

      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('plugin-1');
      expect(plugins[0].methods).toHaveLength(1);

      expect(plugins[1].name).toBe('plugin-2');
      expect(plugins[1].methods).toHaveLength(1);
    });

    it('should handle plugin with multiple methods', async () => {
      const { ctx, sut } = setup();

      await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'multi-plugin',
          title: 'Multi Plugin',
          description: 'Plugin with multiple methods',
          author: 'Test Author',
          version: '1.0.0',
          templates: [],
          wasmBytes,
          sha256hash,
        },
        [
          {
            name: 'filter-a',
            title: 'Filter A',
            description: 'First filter',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
          {
            name: 'filter-b',
            title: 'Filter B',
            description: 'Second filter',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
          {
            name: 'action-x',
            title: 'Action X',
            description: 'First action',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
          {
            name: 'action-y',
            title: 'Action Y',
            description: 'Second action',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
        ],
      );

      const plugins = await sut.search({});

      expect(plugins).toHaveLength(1);
      expect(plugins[0].methods).toHaveLength(4);
    });
  });

  describe('get', () => {
    it('should throw error when plugin does not exist', async () => {
      const { sut } = setup();

      await expect(sut.get('00000000-0000-0000-0000-000000000000')).rejects.toThrow('Plugin not found');
    });

    it('should return single plugin with methods', async () => {
      const { ctx, sut } = setup();

      const result = await ctx.get(PluginRepository).upsert(
        {
          enabled: true,
          name: 'single-plugin',
          title: 'Single Plugin',
          description: 'A single plugin',
          author: 'Test Author',
          version: '1.0.0',
          templates: [],
          sha256hash,
          wasmBytes,
        },
        [
          {
            name: 'single-filter',
            title: 'Single Filter',
            description: 'A single filter',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
          {
            name: 'single-action',
            title: 'Single Action',
            description: 'A single action',
            types: [WorkflowType.AssetV1],
            schema: undefined,
          },
        ],
      );

      const pluginResult = await sut.get(result.id);

      expect(pluginResult).toMatchObject({
        id: result.id,
        name: 'single-plugin',
        methods: [
          {
            name: 'single-filter',
            title: 'Single Filter',
          },
          {
            name: 'single-action',
            title: 'Single Action',
          },
        ],
      });
    });
  });
});
