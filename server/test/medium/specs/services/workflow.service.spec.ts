import { Kysely } from 'kysely';
import { AccessRepository } from 'src/repositories/access.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { WorkflowRepository } from 'src/repositories/workflow.repository';
import { DB } from 'src/schema';
import { PluginContext, PluginTriggerType } from 'src/schema/tables/plugin.table';
import { WorkflowService } from 'src/services/workflow.service';
import { newMediumService } from 'test/medium.factory';
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

  beforeEach(async () => {
    // Create a test plugin with filters and actions before each test
    const pluginRepo = new PluginRepository(defaultDatabase);
    const result = await pluginRepo.loadPlugin({
      name: 'test-core-plugin',
      displayName: 'Test Core Plugin',
      description: 'A test core plugin for workflow tests',
      author: 'Test Author',
      version: '1.0.0',
      wasm: {
        path: '/test/path.wasm',
      },
      filters: [
        {
          name: 'test-filter',
          displayName: 'Test Filter',
          description: 'A test filter',
          supportedContexts: [PluginContext.Asset],
          schema: undefined,
        },
      ],
      actions: [
        {
          name: 'test-action',
          displayName: 'Test Action',
          description: 'A test action',
          supportedContexts: [PluginContext.Asset],
          schema: undefined,
        },
      ],
    });

    testPluginId = result.plugin.id;
    testFilterId = result.filters[0].id;
    testActionId = result.actions[0].id;
  });

  afterEach(async () => {
    await defaultDatabase.deleteFrom('plugin').where('id', '=', testPluginId).execute();
  });

  describe('create', () => {
    it('should create a workflow without filters or actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const auth = { user: { id: user.id } } as any;

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow',
        displayName: 'Test Workflow',
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
        displayName: 'Test Workflow',
        description: 'A test workflow',
        enabled: true,
        filters: [],
        actions: [],
      });
    });

    it.skip('should create a workflow with filters and actions', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = { user: { id: user.id } } as any;

      const workflow = await sut.create(auth, {
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow-with-relations',
        displayName: 'Test Workflow With Relations',
        description: 'A test workflow with filters and actions',
        enabled: true,
        filters: [
          {
            filterId: testFilterId,
            filterConfig: { key: 'value' },
          },
        ],
        actions: [
          {
            actionId: testActionId,
            actionConfig: { action: 'test' },
          },
        ],
      });

      expect(workflow).toMatchObject({
        id: expect.any(String),
        ownerId: user.id,
        triggerType: PluginTriggerType.AssetCreate,
        name: 'test-workflow-with-relations',
        displayName: 'Test Workflow With Relations',
        enabled: true,
      });

      expect(workflow.filters).toHaveLength(1);
      expect(workflow.filters[0]).toMatchObject({
        id: expect.any(String),
        workflowId: workflow.id,
        filterId: testFilterId,
        filterConfig: { key: 'value' },
        order: 0,
      });

      expect(workflow.actions).toHaveLength(1);
      expect(workflow.actions[0]).toMatchObject({
        id: expect.any(String),
        workflowId: workflow.id,
        actionId: testActionId,
        actionConfig: { action: 'test' },
        order: 0,
      });
    });
  });
});
