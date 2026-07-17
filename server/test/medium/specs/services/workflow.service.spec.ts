import { WorkflowTrigger } from '@immich/plugin-sdk';
import { Kysely } from 'kysely';
import { WorkflowType } from 'src/enum';
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

const wasmBytes = Buffer.from('random-wasm-bytes');
const sha256hash = Buffer.from('some-manifest-hash');

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(WorkflowService.name, () => {
  let testPluginId: string;

  beforeAll(async () => {
    const { ctx } = setup();
    // Create a test plugin with methods and actions once for all tests
    const pluginRepo = ctx.get(PluginRepository);
    const result = await pluginRepo.upsert(
      {
        enabled: true,
        name: 'test-core-plugin',
        title: 'Test Core Plugin',
        description: 'A test core plugin for workflow tests',
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
          schema: undefined,
        },
        {
          name: 'test-action',
          title: 'Test Action',
          description: 'A test action',
          types: [WorkflowType.AssetV1],
          schema: undefined,
        },
      ],
    );

    testPluginId = result.id;
  });

  afterAll(async () => {
    await defaultDatabase.deleteFrom('plugin').where('id', '=', testPluginId).execute();
  });

  describe('create', () => {
    it('should create a workflow', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      const auth = factory.auth({ user });

      const workflow = await sut.create(auth, {
        trigger: WorkflowTrigger.AssetCreate,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
      });

      expect(workflow).toMatchObject({
        id: expect.any(String),
        trigger: WorkflowTrigger.AssetCreate,
        name: 'test-workflow',
        description: 'A test workflow',
        enabled: true,
      });
    });
  });

  describe('getAll', () => {
    it('should return all workflows for a user', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const auth = factory.auth({ user });

      const workflow1 = await sut.create(auth, {
        trigger: WorkflowTrigger.AssetCreate,
        name: 'workflow-1',
        description: 'First workflow',
        enabled: true,
      });

      const workflow2 = await sut.create(auth, {
        trigger: WorkflowTrigger.AssetCreate,
        name: 'workflow-2',
        description: 'Second workflow',
        enabled: false,
      });

      const workflows = await sut.search(auth, {});

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

      const workflows = await sut.search(auth, {});

      expect(workflows).toEqual([]);
    });

    it('should not return workflows from other users', async () => {
      const { sut, ctx } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const auth1 = factory.auth({ user: user1 });
      const auth2 = factory.auth({ user: user2 });

      await sut.create(auth1, {
        trigger: WorkflowTrigger.AssetCreate,
        name: 'user1-workflow',
        description: 'User 1 workflow',
        enabled: true,
      });

      const user2Workflows = await sut.search(auth2, {});

      expect(user2Workflows).toEqual([]);
    });
  });
});
