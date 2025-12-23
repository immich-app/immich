import { Kysely } from 'kysely';
import { PluginContext, PluginTriggerType } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { WorkflowRepository } from 'src/repositories/workflow.repository';
import { DB } from 'src/schema';
import { WorkflowService } from 'src/services/workflow.service';
import { newMediumService } from 'test/medium.factory';
import { factory } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  return newMediumService(WorkflowService, {
    database: db || defaultDatabase,
    real: [WorkflowRepository, PluginRepository, AccessRepository],
    mock: [LoggingRepository],
  });
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(WorkflowService.name, () => {
  let testPluginId: string;
  let testFilterId: string;
  let testActionId: string;

  beforeAll(async () => {
    // Create a test plugin with filters and actions once for all tests
    const pluginRepo = new PluginRepository(defaultDatabase);
    const result = await pluginRepo.loadPlugin(
      {
        name: 'test-core-plugin',
        title: 'Test Core Plugin',
        description: 'A test core plugin for workflow tests',
        author: 'Test Author',
        version: '1.0.0',
        wasm: {
          path: '/test/path.wasm',
        },
        filters: [
          {
            methodName: 'test-filter',
            title: 'Test Filter',
            description: 'A test filter',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
        ],
        actions: [
          {
            methodName: 'test-action',
            title: 'Test Action',
            description: 'A test action',
            supportedContexts: [PluginContext.Asset],
            schema: undefined,
          },
        ],
      },
      '/plugins/test-core-plugin',
    );

    testPluginId = result.plugin.id;
    testFilterId = result.filters[0].id;
    testActionId = result.actions[0].id;
  });

  afterAll(async () => {
    await defaultDatabase.deleteFrom('plugin').where('id', '=', testPluginId).execute();
  });

  describe('create', () => {
    it('should create a workflow without filters or actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
        filters: [],
        actions: [],
      });

      expect(workflow).toMatchObject({
        id: expect.any(String),
        ownerId: user.id,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
        filters: [],
        actions: [],
      });
    });

    it('should create a workflow with filters and actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow-with-relations',
        description: 'A test workflow with filters and actions',
        enabled: true,
        filters: [
          {
            pluginFilterId: testFilterId,
            filterConfig: { key: 'value' },
          },
        ],
        actions: [
          {
            pluginActionId: testActionId,
            actionConfig: { action: 'test' },
          },
        ],
      });

      expect(workflow).toMatchObject({
        id: expect.any(String),
        ownerId: user.id,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow-with-relations',
        enabled: true,
      });

      expect(workflow.filters).toHaveLength(1);
      expect(workflow.filters[0]).toMatchObject({
        id: expect.any(String),
        workflowId: workflow.id,
        pluginFilterId: testFilterId,
        filterConfig: { key: 'value' },
        order: 0,
      });

      expect(workflow.actions).toHaveLength(1);
      expect(workflow.actions[0]).toMatchObject({
        id: expect.any(String),
        workflowId: workflow.id,
        pluginActionId: testActionId,
        actionConfig: { action: 'test' },
        order: 0,
      });
    });

    it('should throw error when creating workflow with invalid filter', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'invalid-workflow',
          description: 'A workflow with invalid filter',
          enabled: true,
          filters: [{ pluginFilterId: factory.uuid(), filterConfig: { key: 'value' } }],
          actions: [],
        }),
      ).rejects.toThrow('Invalid filter ID');
    });

    it('should throw error when creating workflow with invalid action', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'invalid-workflow',
          description: 'A workflow with invalid action',
          enabled: true,
          filters: [],
          actions: [{ pluginActionId: factory.uuid(), actionConfig: { action: 'test' } }],
        }),
      ).rejects.toThrow('Invalid action ID');
    });

    it('should throw error when filter does not support trigger context', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      // Create a plugin with a filter that only supports Album context
      const pluginRepo = new PluginRepository(defaultDatabase);
      const result = await pluginRepo.loadPlugin(
        {
          name: 'album-only-plugin',
          title: 'Album Only Plugin',
          description: 'Plugin with album-only filter',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/test/album-plugin.wasm' },
          filters: [
            {
              methodName: 'album-filter',
              title: 'Album Filter',
              description: 'A filter that only works with albums',
              supportedContexts: [PluginContext.Album],
              schema: undefined,
            },
          ],
        },
        '/plugins/test-core-plugin',
      );

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'invalid-context-workflow',
          description: 'A workflow with context mismatch',
          enabled: true,
          filters: [{ pluginFilterId: result.filters[0].id }],
          actions: [],
        }),
      ).rejects.toThrow('does not support asset context');
    });

    it('should throw error when action does not support trigger context', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      // Create a plugin with an action that only supports Person context
      const pluginRepo = new PluginRepository(defaultDatabase);
      const result = await pluginRepo.loadPlugin(
        {
          name: 'person-only-plugin',
          title: 'Person Only Plugin',
          description: 'Plugin with person-only action',
          author: 'Test Author',
          version: '1.0.0',
          wasm: { path: '/test/person-plugin.wasm' },
          actions: [
            {
              methodName: 'person-action',
              title: 'Person Action',
              description: 'An action that only works with persons',
              supportedContexts: [PluginContext.Person],
              schema: undefined,
            },
          ],
        },
        '/plugins/test-core-plugin',
      );

      await expect(
        sut.create(auth, {
          triggerType: PluginTriggerType.AssetCreate,
          name: 'invalid-context-workflow',
          description: 'A workflow with context mismatch',
          enabled: true,
          filters: [],
          actions: [{ pluginActionId: result.actions[0].id }],
        }),
      ).rejects.toThrow('does not support asset context');
    });

    it('should create workflow with multiple filters and actions in correct order', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'multi-step-workflow',
        description: 'A workflow with multiple filters and actions',
        enabled: true,
        filters: [
          { pluginFilterId: testFilterId, filterConfig: { step: 1 } },
          { pluginFilterId: testFilterId, filterConfig: { step: 2 } },
        ],
        actions: [
          { pluginActionId: testActionId, actionConfig: { step: 1 } },
          { pluginActionId: testActionId, actionConfig: { step: 2 } },
          { pluginActionId: testActionId, actionConfig: { step: 3 } },
        ],
      });

      expect(workflow.filters).toHaveLength(2);
      expect(workflow.filters[0].order).toBe(0);
      expect(workflow.filters[0].filterConfig).toEqual({ step: 1 });
      expect(workflow.filters[1].order).toBe(1);
      expect(workflow.filters[1].filterConfig).toEqual({ step: 2 });

      expect(workflow.actions).toHaveLength(3);
      expect(workflow.actions[0].order).toBe(0);
      expect(workflow.actions[1].order).toBe(1);
      expect(workflow.actions[2].order).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return all workflows for a user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow1 = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'workflow-1',
        description: 'First workflow',
        enabled: true,
        filters: [],
        actions: [],
      });

      const workflow2 = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'workflow-2',
        description: 'Second workflow',
        enabled: false,
        filters: [],
        actions: [],
      });

      const workflows = await sut.getAll(auth);

      expect(workflows).toHaveLength(2);
      expect(workflows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: workflow1.id, name: 'workflow-1' }),
          expect.objectContaining({ id: workflow2.id, name: 'workflow-2' }),
        ]),
      );
    });

    it('should return empty array when user has no workflows', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflows = await sut.getAll(auth);

      expect(workflows).toEqual([]);
    });

    it('should not return workflows from other users', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth1 = factory.auth({ user: user1 });
      const auth2 = factory.auth({ user: user2 });

      await sut.create(auth1, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'user1-workflow',
        description: 'User 1 workflow',
        enabled: true,
        filters: [],
        actions: [],
      });

      const user2Workflows = await sut.getAll(auth2);

      expect(user2Workflows).toEqual([]);
    });
  });

  describe('get', () => {
    it('should return a specific workflow by id', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
        filters: [{ pluginFilterId: testFilterId, filterConfig: { key: 'value' } }],
        actions: [{ pluginActionId: testActionId, actionConfig: { action: 'test' } }],
      });

      const workflow = await sut.get(auth, created.id);

      expect(workflow).toMatchObject({
        id: created.id,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
      });
      expect(workflow.filters).toHaveLength(1);
      expect(workflow.actions).toHaveLength(1);
    });

    it('should throw error when workflow does not exist', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(sut.get(auth, '66da82df-e424-4bf4-b6f3-5d8e71620dae')).rejects.toThrow();
    });

    it('should throw error when user does not have access to workflow', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth1 = factory.auth({ user: user1 });
      const auth2 = factory.auth({ user: user2 });

      const workflow = await sut.create(auth1, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'private-workflow',
        description: 'Private workflow',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(sut.get(auth2, workflow.id)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update workflow basic fields', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'original-workflow',
        description: 'Original description',
        enabled: true,
        filters: [],
        actions: [],
      });

      const updated = await sut.update(auth, created.id, {
        name: 'updated-workflow',
        description: 'Updated description',
        enabled: false,
      });

      expect(updated).toMatchObject({
        id: created.id,
        name: 'updated-workflow',
        description: 'Updated description',
        enabled: false,
      });
    });

    it('should update workflow filters', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [{ pluginFilterId: testFilterId, filterConfig: { old: 'config' } }],
        actions: [],
      });

      const updated = await sut.update(auth, created.id, {
        filters: [
          { pluginFilterId: testFilterId, filterConfig: { new: 'config' } },
          { pluginFilterId: testFilterId, filterConfig: { second: 'filter' } },
        ],
      });

      expect(updated.filters).toHaveLength(2);
      expect(updated.filters[0].filterConfig).toEqual({ new: 'config' });
      expect(updated.filters[1].filterConfig).toEqual({ second: 'filter' });
    });

    it('should update workflow actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [],
        actions: [{ pluginActionId: testActionId, actionConfig: { old: 'config' } }],
      });

      const updated = await sut.update(auth, created.id, {
        actions: [
          { pluginActionId: testActionId, actionConfig: { new: 'config' } },
          { pluginActionId: testActionId, actionConfig: { second: 'action' } },
        ],
      });

      expect(updated.actions).toHaveLength(2);
      expect(updated.actions[0].actionConfig).toEqual({ new: 'config' });
      expect(updated.actions[1].actionConfig).toEqual({ second: 'action' });
    });

    it('should clear filters when updated with empty array', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [{ pluginFilterId: testFilterId, filterConfig: { key: 'value' } }],
        actions: [],
      });

      const updated = await sut.update(auth, created.id, {
        filters: [],
      });

      expect(updated.filters).toHaveLength(0);
    });

    it('should throw error when no fields to update', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(sut.update(auth, created.id, {})).rejects.toThrow('No fields to update');
    });

    it('should throw error when updating non-existent workflow', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(sut.update(auth, factory.uuid(), { name: 'updated-name' })).rejects.toThrow();
    });

    it('should throw error when user does not have access to update workflow', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth1 = factory.auth({ user: user1 });
      const auth2 = factory.auth({ user: user2 });

      const workflow = await sut.create(auth1, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'private-workflow',
        description: 'Private',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(
        sut.update(auth2, workflow.id, {
          name: 'hacked-workflow',
        }),
      ).rejects.toThrow();
    });

    it('should throw error when updating with invalid filter', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(
        sut.update(auth, created.id, {
          filters: [{ pluginFilterId: factory.uuid(), filterConfig: {} }],
        }),
      ).rejects.toThrow();
    });

    it('should throw error when updating with invalid action', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const created = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(
        sut.update(auth, created.id, { actions: [{ pluginActionId: factory.uuid(), actionConfig: {} }] }),
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [],
        actions: [],
      });

      await sut.delete(auth, workflow.id);

      await expect(sut.get(auth, workflow.id)).rejects.toThrow('Not found or no workflow.read access');
    });

    it('should delete workflow with filters and actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        description: 'Test',
        enabled: true,
        filters: [{ pluginFilterId: testFilterId, filterConfig: {} }],
        actions: [{ pluginActionId: testActionId, actionConfig: {} }],
      });

      await sut.delete(auth, workflow.id);

      await expect(sut.get(auth, workflow.id)).rejects.toThrow('Not found or no workflow.read access');
    });

    it('should throw error when deleting non-existent workflow', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      await expect(sut.delete(auth, factory.uuid())).rejects.toThrow();
    });

    it('should throw error when user does not have access to delete workflow', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth1 = factory.auth({ user: user1 });
      const auth2 = factory.auth({ user: user2 });

      const workflow = await sut.create(auth1, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'private-workflow',
        description: 'Private',
        enabled: true,
        filters: [],
        actions: [],
      });

      await expect(sut.delete(auth2, workflow.id)).rejects.toThrow();
    });
  });
});
