import { BadRequestException } from '@nestjs/common';
import { JobName, JobStatus, PluginContext, PluginTriggerType } from 'src/enum';
import { pluginTriggers } from 'src/plugins';
import { PluginService } from 'src/services/plugin.service';
import { factory, newUuid, newUuids } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const mockPluginCall = vi.fn();
const mockNewPlugin = vi.fn();

vi.mock('@extism/extism', () => ({
  newPlugin: (...args: unknown[]) => mockNewPlugin(...args),
}));

const newPluginEntity = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  name: 'test-plugin',
  title: 'Test Plugin',
  description: 'A test plugin',
  author: 'Test Author',
  version: '1.0.0',
  wasmPath: '/path/to/plugin.wasm',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  filters: [],
  actions: [],
  ...overrides,
});

const newFilterEntity = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  pluginId: newUuid(),
  methodName: 'filter_by_type',
  title: 'Filter by Type',
  description: 'Filters assets by type',
  supportedContexts: [PluginContext.Asset],
  schema: null,
  ...overrides,
});

const newActionEntity = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  pluginId: newUuid(),
  methodName: 'add_to_album',
  title: 'Add to Album',
  description: 'Adds asset to an album',
  supportedContexts: [PluginContext.Asset],
  schema: null,
  ...overrides,
});

const newWorkflowEntity = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  name: 'Test Workflow',
  ownerId: newUuid(),
  triggerType: PluginTriggerType.AssetCreate,
  enabled: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const newWorkflowFilter = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  workflowId: newUuid(),
  pluginFilterId: newUuid(),
  filterConfig: null,
  order: 0,
  ...overrides,
});

const newWorkflowAction = (overrides: Record<string, unknown> = {}) => ({
  id: newUuid(),
  workflowId: newUuid(),
  pluginActionId: newUuid(),
  actionConfig: null,
  order: 0,
  ...overrides,
});

describe(PluginService.name, () => {
  let sut: PluginService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PluginService));
    mockNewPlugin.mockReset();
    mockPluginCall.mockReset();
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getTriggers', () => {
    it('should return all plugin triggers', () => {
      const result = sut.getTriggers();

      expect(result).toEqual(pluginTriggers);
      expect(result).toHaveLength(2);
    });

    it('should include AssetCreate trigger', () => {
      const result = sut.getTriggers();

      expect(result).toContainEqual({
        type: PluginTriggerType.AssetCreate,
        contextType: PluginContext.Asset,
      });
    });

    it('should include PersonRecognized trigger', () => {
      const result = sut.getTriggers();

      expect(result).toContainEqual({
        type: PluginTriggerType.PersonRecognized,
        contextType: PluginContext.Person,
      });
    });
  });

  describe('getAll', () => {
    it('should return all plugins mapped to response DTOs', async () => {
      const plugin1 = newPluginEntity({ name: 'plugin-a' });
      const plugin2 = newPluginEntity({ name: 'plugin-b' });

      mocks.plugin.getAllPlugins.mockResolvedValue([plugin1, plugin2]);

      const result = await sut.getAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: plugin1.id,
          name: 'plugin-a',
          createdAt: plugin1.createdAt.toISOString(),
          updatedAt: plugin1.updatedAt.toISOString(),
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          id: plugin2.id,
          name: 'plugin-b',
        }),
      );
    });

    it('should return an empty array when no plugins exist', async () => {
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      const result = await sut.getAll();

      expect(result).toEqual([]);
    });

    it('should include filters and actions in the response', async () => {
      const pluginId = newUuid();
      const filter = newFilterEntity({ pluginId });
      const action = newActionEntity({ pluginId });
      const plugin = newPluginEntity({ id: pluginId, filters: [filter], actions: [action] });

      mocks.plugin.getAllPlugins.mockResolvedValue([plugin]);

      const result = await sut.getAll();

      expect(result[0].filters).toHaveLength(1);
      expect(result[0].actions).toHaveLength(1);
      expect(result[0].filters[0].methodName).toBe('filter_by_type');
      expect(result[0].actions[0].methodName).toBe('add_to_album');
    });
  });

  describe('get', () => {
    it('should return a plugin by id', async () => {
      const plugin = newPluginEntity();

      mocks.plugin.getPlugin.mockResolvedValue(plugin);

      const result = await sut.get(plugin.id);

      expect(result).toEqual(
        expect.objectContaining({
          id: plugin.id,
          name: plugin.name,
          title: plugin.title,
          description: plugin.description,
          author: plugin.author,
          version: plugin.version,
          createdAt: plugin.createdAt.toISOString(),
          updatedAt: plugin.updatedAt.toISOString(),
        }),
      );
      expect(mocks.plugin.getPlugin).toHaveBeenCalledWith(plugin.id);
    });

    it('should throw BadRequestException when plugin is not found', async () => {
      const id = newUuid();

      mocks.plugin.getPlugin.mockResolvedValue(undefined);

      await expect(sut.get(id)).rejects.toBeInstanceOf(BadRequestException);
      await expect(sut.get(id)).rejects.toThrow('Plugin not found');
    });
  });

  describe('onBootstrap', () => {
    it('should initialize pluginJwtSecret, load manifests, and load plugins', async () => {
      const manifestContent = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
        filters: [],
        actions: [],
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(manifestContent);
      mocks.plugin.getPluginByName.mockResolvedValue(undefined);
      mocks.plugin.loadPlugin.mockResolvedValue({
        plugin: newPluginEntity({ name: 'core-plugin' }),
        filters: [],
        actions: [],
      });
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      await sut.onBootstrap();

      expect(mocks.crypto.randomBytesAsText).toHaveBeenCalledWith(32);
      expect(mocks.storage.readTextFile).toHaveBeenCalledWith('/build/corePlugin/manifest.json');
    });

    it('should load external plugins when allowed', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      const externalManifest = JSON.stringify({
        name: 'external-plugin',
        version: '2.0.0',
        title: 'External Plugin',
        description: 'An external plugin',
        author: 'External',
        wasm: { path: 'ext.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValueOnce(coreManifest).mockResolvedValueOnce(externalManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(undefined);
      mocks.plugin.loadPlugin.mockResolvedValue({
        plugin: newPluginEntity(),
        filters: [],
        actions: [],
      });
      mocks.plugin.readDirectory.mockResolvedValue([
        { name: 'ext-plugin-dir', isDirectory: () => true } as any,
      ]);
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      await sut.onBootstrap();

      expect(mocks.plugin.readDirectory).toHaveBeenCalledWith('/app/data/plugins');
      expect(mocks.storage.readTextFile).toHaveBeenCalledWith('/app/data/plugins/ext-plugin-dir/manifest.json');
    });

    it('should skip non-directory entries in external plugins folder', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(undefined);
      mocks.plugin.loadPlugin.mockResolvedValue({
        plugin: newPluginEntity(),
        filters: [],
        actions: [],
      });
      mocks.plugin.readDirectory.mockResolvedValue([
        { name: 'some-file.txt', isDirectory: () => false } as any,
      ]);
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      await sut.onBootstrap();

      // readTextFile is called once for core manifest, not for the non-directory entry
      expect(mocks.storage.readTextFile).toHaveBeenCalledTimes(1);
    });

    it('should skip loading a plugin if it is already up to date', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      await sut.onBootstrap();

      expect(mocks.plugin.loadPlugin).not.toHaveBeenCalled();
    });

    it('should reload a plugin if the version has changed', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '2.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.loadPlugin.mockResolvedValue({
        plugin: newPluginEntity({ name: 'core-plugin', version: '2.0.0' }),
        filters: [],
        actions: [],
      });
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      await sut.onBootstrap();

      expect(mocks.plugin.loadPlugin).toHaveBeenCalled();
    });

    it('should load extism plugins for all plugins from the database', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      const pluginEntity = newPluginEntity({ wasmPath: '/path/to/plugin.wasm' });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.getAllPlugins.mockResolvedValue([pluginEntity]);
      mockNewPlugin.mockResolvedValue({ call: mockPluginCall });

      await sut.onBootstrap();

      expect(mockNewPlugin).toHaveBeenCalledWith('/path/to/plugin.wasm', expect.objectContaining({ useWasi: true }));
    });

    it('should handle extism plugin load failure gracefully', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      const pluginEntity = newPluginEntity({ wasmPath: '/path/to/broken.wasm' });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.getAllPlugins.mockResolvedValue([pluginEntity]);
      mockNewPlugin.mockRejectedValue(new Error('WASM load failed'));

      // Should not throw; the error is caught and logged
      await expect(sut.onBootstrap()).resolves.not.toThrow();
    });

    it('should handle external plugin folder read failure gracefully', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.readDirectory.mockRejectedValue(new Error('ENOENT'));
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      // Should not throw; the error is caught and logged
      await expect(sut.onBootstrap()).resolves.not.toThrow();
    });

    it('should handle individual external plugin manifest read failure gracefully', async () => {
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-secret');
      mocks.storage.readTextFile
        .mockResolvedValueOnce(coreManifest)
        .mockRejectedValueOnce(new Error('File not found'));
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );
      mocks.plugin.readDirectory.mockResolvedValue([
        { name: 'broken-plugin', isDirectory: () => true } as any,
      ]);
      mocks.plugin.getAllPlugins.mockResolvedValue([]);

      // Should not throw; the error is caught and logged
      await expect(sut.onBootstrap()).resolves.not.toThrow();
    });
  });

  describe('handleAssetCreate', () => {
    it('should queue workflow jobs when workflows exist for the owner', async () => {
      const [ownerId, workflowId] = newUuids();
      const asset = factory.asset({ ownerId });
      const workflow = newWorkflowEntity({ id: workflowId, ownerId });

      mocks.workflow.getWorkflowByOwnerAndTrigger.mockResolvedValue([workflow as any]);

      await sut.handleAssetCreate({ asset: asset as any });

      expect(mocks.workflow.getWorkflowByOwnerAndTrigger).toHaveBeenCalledWith(ownerId, PluginTriggerType.AssetCreate);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.WorkflowRun,
          data: {
            id: workflowId,
            type: PluginTriggerType.AssetCreate,
            event: { userId: ownerId, asset },
          },
        },
      ]);
    });

    it('should not queue jobs when no workflows exist for the owner', async () => {
      const ownerId = newUuid();
      const asset = factory.asset({ ownerId });

      mocks.workflow.getWorkflowByOwnerAndTrigger.mockResolvedValue([]);

      await sut.handleAssetCreate({ asset: asset as any });

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should queue multiple workflow jobs when multiple workflows match', async () => {
      const ownerId = newUuid();
      const asset = factory.asset({ ownerId });
      const [workflowId1, workflowId2] = newUuids();
      const workflow1 = newWorkflowEntity({ id: workflowId1, ownerId });
      const workflow2 = newWorkflowEntity({ id: workflowId2, ownerId });

      mocks.workflow.getWorkflowByOwnerAndTrigger.mockResolvedValue([workflow1, workflow2] as any);

      await sut.handleAssetCreate({ asset: asset as any });

      expect(mocks.job.queueAll).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: JobName.WorkflowRun, data: expect.objectContaining({ id: workflowId1 }) }),
          expect.objectContaining({ name: JobName.WorkflowRun, data: expect.objectContaining({ id: workflowId2 }) }),
        ]),
      );
    });
  });

  describe('handleWorkflowRun', () => {
    const setupForWorkflowRun = async () => {
      const [workflowId, ownerId, pluginId, filterId, actionId] = newUuids();
      const asset = factory.asset({ ownerId });

      // Bootstrap the service to set the pluginJwtSecret and loadedPlugins
      const coreManifest = JSON.stringify({
        name: 'core-plugin',
        version: '1.0.0',
        title: 'Core Plugin',
        description: 'The core plugin',
        author: 'Immich',
        wasm: { path: 'plugin.wasm' },
      });

      mocks.crypto.randomBytesAsText.mockReturnValue('mock-jwt-secret');
      mocks.storage.readTextFile.mockResolvedValue(coreManifest);
      mocks.plugin.getPluginByName.mockResolvedValue(
        newPluginEntity({ name: 'core-plugin', version: '1.0.0' }),
      );

      const pluginEntity = newPluginEntity({ id: pluginId, wasmPath: '/path/to/plugin.wasm' });
      mocks.plugin.getAllPlugins.mockResolvedValue([pluginEntity]);
      mockNewPlugin.mockResolvedValue({ call: mockPluginCall });

      await sut.onBootstrap();

      // Reset mocks that were used during bootstrap
      mocks.plugin.getAllPlugins.mockReset();

      return { workflowId, ownerId, pluginId, filterId, actionId, asset };
    };

    it('should return Failed when workflow is not found', async () => {
      mocks.workflow.getWorkflow.mockResolvedValue(undefined);

      const result = await sut.handleWorkflowRun({
        id: newUuid(),
        type: PluginTriggerType.AssetCreate,
        event: { userId: newUuid(), asset: factory.asset() as any },
      });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should return Success when all filters pass and actions execute', async () => {
      const { workflowId, ownerId, pluginId, filterId, actionId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: filterId });
      const wfAction = newWorkflowAction({ workflowId, pluginActionId: actionId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([wfAction as any]);

      const filter = newFilterEntity({ id: filterId, pluginId });
      const action = newActionEntity({ id: actionId, pluginId });

      mocks.plugin.getFilter.mockResolvedValue(filter as any);
      mocks.plugin.getAction.mockResolvedValue(action as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall
        .mockResolvedValueOnce({ text: () => JSON.stringify({ passed: true }) })
        .mockResolvedValueOnce(undefined);

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Success);
      expect(mockPluginCall).toHaveBeenCalledTimes(2);
    });

    it('should return Skipped when a filter returns passed=false', async () => {
      const { workflowId, ownerId, pluginId, filterId, actionId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: filterId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const filter = newFilterEntity({ id: filterId, pluginId });
      mocks.plugin.getFilter.mockResolvedValue(filter as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValueOnce({ text: () => JSON.stringify({ passed: false }) });

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Skipped when a filter returns null result', async () => {
      const { workflowId, ownerId, pluginId, filterId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: filterId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const filter = newFilterEntity({ id: filterId, pluginId });
      mocks.plugin.getFilter.mockResolvedValue(filter as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      // Simulate filter returning null
      mockPluginCall.mockResolvedValueOnce(null);

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Skipped when filter is not found in the plugin repository', async () => {
      const { workflowId, ownerId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: newUuid() });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      mocks.plugin.getFilter.mockResolvedValue(undefined);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Skipped when filter plugin instance is not loaded', async () => {
      const { workflowId, ownerId, asset } = await setupForWorkflowRun();

      const unknownPluginId = newUuid();
      const workflow = newWorkflowEntity({ id: workflowId });
      const filterId = newUuid();
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: filterId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const filter = newFilterEntity({ id: filterId, pluginId: unknownPluginId });
      mocks.plugin.getFilter.mockResolvedValue(filter as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Failed when action is not found', async () => {
      const { workflowId, ownerId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([newWorkflowAction({ workflowId, pluginActionId: newUuid() }) as any]);

      mocks.plugin.getAction.mockResolvedValue(undefined);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should return Failed when action plugin instance is not loaded', async () => {
      const { workflowId, ownerId, asset } = await setupForWorkflowRun();

      const unknownPluginId = newUuid();
      const workflow = newWorkflowEntity({ id: workflowId });
      const actionId = newUuid();

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([
        newWorkflowAction({ workflowId, pluginActionId: actionId }) as any,
      ]);

      const action = newActionEntity({ id: actionId, pluginId: unknownPluginId });
      mocks.plugin.getAction.mockResolvedValue(action as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should execute workflow with no filters and only actions', async () => {
      const { workflowId, ownerId, pluginId, actionId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfAction = newWorkflowAction({ workflowId, pluginActionId: actionId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([wfAction as any]);

      const action = newActionEntity({ id: actionId, pluginId });
      mocks.plugin.getAction.mockResolvedValue(action as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValueOnce(undefined);

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Success);
      expect(mockPluginCall).toHaveBeenCalledTimes(1);
    });

    it('should pass correct input to filter plugin calls', async () => {
      const { workflowId, ownerId, pluginId, filterId, asset } = await setupForWorkflowRun();

      const filterConfig = { assetType: 'image' };
      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter = newWorkflowFilter({ workflowId, pluginFilterId: filterId, filterConfig });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter as any]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const filter = newFilterEntity({ id: filterId, pluginId, methodName: 'filter_by_type' });
      mocks.plugin.getFilter.mockResolvedValue(filter as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValueOnce({ text: () => JSON.stringify({ passed: true }) });

      await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(mockPluginCall).toHaveBeenCalledWith(
        'filter_by_type',
        expect.any(Uint8Array),
      );

      // Decode the Uint8Array argument to verify its content
      const callArgs = mockPluginCall.mock.calls[0];
      const inputBytes = callArgs[1];
      const inputJson = JSON.parse(new TextDecoder().decode(inputBytes));

      // Asset goes through JSON.stringify which converts Dates to ISO strings and Buffers to { type, data }
      expect(inputJson).toEqual({
        authToken: 'signed-jwt-token',
        config: filterConfig,
        data: { asset: JSON.parse(JSON.stringify(asset)) },
      });
    });

    it('should pass correct input to action plugin calls', async () => {
      const { workflowId, ownerId, pluginId, actionId, asset } = await setupForWorkflowRun();

      const actionConfig = { albumId: newUuid() };
      const workflow = newWorkflowEntity({ id: workflowId });
      const wfAction = newWorkflowAction({ workflowId, pluginActionId: actionId, actionConfig });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([wfAction as any]);

      const action = newActionEntity({ id: actionId, pluginId, methodName: 'add_to_album' });
      mocks.plugin.getAction.mockResolvedValue(action as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValueOnce(undefined);

      await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(mockPluginCall).toHaveBeenCalledWith(
        'add_to_album',
        expect.any(String),
      );

      const callArgs = mockPluginCall.mock.calls[0];
      const inputJson = JSON.parse(callArgs[1]);

      // Asset goes through JSON.stringify which converts Dates to ISO strings and Buffers to { type, data }
      expect(inputJson).toEqual({
        authToken: 'signed-jwt-token',
        config: actionConfig,
        data: { asset: JSON.parse(JSON.stringify(asset)) },
      });
    });

    it('should return Skipped for PersonRecognized trigger type (unimplemented)', async () => {
      mocks.workflow.getWorkflow.mockResolvedValue(newWorkflowEntity() as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.handleWorkflowRun({
        id: newUuid(),
        type: PluginTriggerType.PersonRecognized,
        event: { personId: newUuid(), assetId: newUuid() },
      });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Failed for unknown trigger type', async () => {
      mocks.workflow.getWorkflow.mockResolvedValue(newWorkflowEntity() as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([]);

      const result = await sut.handleWorkflowRun({
        id: newUuid(),
        type: 'UnknownTrigger' as PluginTriggerType,
        event: {} as any,
      });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should return Failed when an unexpected error occurs during workflow execution', async () => {
      mocks.workflow.getWorkflow.mockRejectedValue(new Error('Database connection lost'));

      const result = await sut.handleWorkflowRun({
        id: newUuid(),
        type: PluginTriggerType.AssetCreate,
        event: { userId: newUuid(), asset: factory.asset() as any },
      });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should execute multiple filters sequentially and stop on first failure', async () => {
      const { workflowId, ownerId, pluginId, asset } = await setupForWorkflowRun();

      const [filterId1, filterId2] = newUuids();
      const workflow = newWorkflowEntity({ id: workflowId });
      const wfFilter1 = newWorkflowFilter({ workflowId, pluginFilterId: filterId1 });
      const wfFilter2 = newWorkflowFilter({ workflowId, pluginFilterId: filterId2 });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([wfFilter1, wfFilter2] as any);
      mocks.workflow.getActions.mockResolvedValue([]);

      const filter1 = newFilterEntity({ id: filterId1, pluginId, methodName: 'filter_1' });
      const filter2 = newFilterEntity({ id: filterId2, pluginId, methodName: 'filter_2' });
      mocks.plugin.getFilter.mockResolvedValueOnce(filter1 as any).mockResolvedValueOnce(filter2 as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      // First filter passes, second fails
      mockPluginCall
        .mockResolvedValueOnce({ text: () => JSON.stringify({ passed: true }) })
        .mockResolvedValueOnce({ text: () => JSON.stringify({ passed: false }) });

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Skipped);
      expect(mockPluginCall).toHaveBeenCalledTimes(2);
    });

    it('should execute multiple actions sequentially', async () => {
      const { workflowId, ownerId, pluginId, asset } = await setupForWorkflowRun();

      const [actionId1, actionId2] = newUuids();
      const workflow = newWorkflowEntity({ id: workflowId });
      const wfAction1 = newWorkflowAction({ workflowId, pluginActionId: actionId1 });
      const wfAction2 = newWorkflowAction({ workflowId, pluginActionId: actionId2 });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([wfAction1, wfAction2] as any);

      const action1 = newActionEntity({ id: actionId1, pluginId, methodName: 'action_1' });
      const action2 = newActionEntity({ id: actionId2, pluginId, methodName: 'action_2' });
      mocks.plugin.getAction.mockResolvedValueOnce(action1 as any).mockResolvedValueOnce(action2 as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValue(undefined);

      const result = await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(result).toBe(JobStatus.Success);
      expect(mockPluginCall).toHaveBeenCalledTimes(2);
      expect(mockPluginCall).toHaveBeenCalledWith('action_1', expect.any(String));
      expect(mockPluginCall).toHaveBeenCalledWith('action_2', expect.any(String));
    });

    it('should sign JWT with the user ID from the event', async () => {
      const { workflowId, ownerId, pluginId, actionId, asset } = await setupForWorkflowRun();

      const workflow = newWorkflowEntity({ id: workflowId });
      const wfAction = newWorkflowAction({ workflowId, pluginActionId: actionId });

      mocks.workflow.getWorkflow.mockResolvedValue(workflow as any);
      mocks.workflow.getFilters.mockResolvedValue([]);
      mocks.workflow.getActions.mockResolvedValue([wfAction as any]);

      const action = newActionEntity({ id: actionId, pluginId });
      mocks.plugin.getAction.mockResolvedValue(action as any);
      mocks.crypto.signJwt.mockReturnValue('signed-jwt-token');

      mockPluginCall.mockResolvedValueOnce(undefined);

      await sut.handleWorkflowRun({
        id: workflowId,
        type: PluginTriggerType.AssetCreate,
        event: { userId: ownerId, asset: asset as any },
      });

      expect(mocks.crypto.signJwt).toHaveBeenCalledWith(
        { userId: ownerId },
        'mock-jwt-secret',
      );
    });
  });
});
