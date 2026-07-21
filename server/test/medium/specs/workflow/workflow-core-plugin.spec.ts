import { WorkflowStepConfig, WorkflowTrigger } from '@immich/plugin-sdk';
import { Kysely } from 'kysely';
import { readFileSync } from 'node:fs';
import { PluginManifestDto } from 'src/dtos/plugin-manifest.dto';
import { AssetType, AssetVisibility, LogLevel } from 'src/enum';
import { AccessRepository } from 'src/repositories/access.repository';
import { AlbumRepository } from 'src/repositories/album.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { PluginRepository } from 'src/repositories/plugin.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { WorkflowRepository } from 'src/repositories/workflow.repository';
import { DB } from 'src/schema';
import { WorkflowExecutionService } from 'src/services/workflow-execution.service';
import { resolveMethod } from 'src/utils/workflow';
import { MediumTestContext } from 'test/medium.factory';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { getKyselyDB } from 'test/utils';

let isInitialized = false;

class WorkflowTestContext extends MediumTestContext<WorkflowExecutionService> {
  constructor(database: Kysely<DB>) {
    super(WorkflowExecutionService, {
      database,
      real: [
        AccessRepository,
        AlbumRepository,
        AssetRepository,
        CryptoRepository,
        DatabaseRepository,
        LoggingRepository,
        PluginRepository,
        StorageRepository,
        UserRepository,
        WorkflowRepository,
      ],
      mock: [ConfigRepository, EventRepository],
    });
  }

  async init() {
    if (isInitialized) {
      return;
    }

    const mockData = mockEnvData({});
    mockData.resourcePaths.corePlugin = '../packages/plugin-core';
    mockData.plugins.external.allow = false;
    this.getMock(ConfigRepository).getEnv.mockReturnValue(mockData);
    this.getMock(EventRepository).emit.mockResolvedValue();
    this.get(LoggingRepository).setLogLevel(LogLevel.Verbose);

    await this.sut.onPluginSync();
    await this.sut.onPluginLoad();

    isInitialized = true;
  }
}

type WorkflowTemplate = {
  ownerId: string;
  trigger: WorkflowTrigger;
  steps: WorkflowTemplateStep[];
};

type WorkflowTemplateStep = {
  method: string;
  config?: WorkflowStepConfig;
};

const createWorkflow = async (template: WorkflowTemplate) => {
  const workflowRepo = ctx.get(WorkflowRepository);
  const pluginRepo = ctx.get(PluginRepository);

  const methods = await pluginRepo.getForValidation();
  const steps = template.steps.map((step) => {
    const pluginMethod = resolveMethod(methods, step.method);
    if (!pluginMethod) {
      throw new Error(`Plugin method not found: ${step.method}`);
    }

    return { ...step, pluginMethod };
  });

  return workflowRepo.create(
    {
      enabled: true,
      name: 'Test workflow',
      description: 'A workflow to test the core plugin',
      ownerId: template.ownerId,
      trigger: template.trigger,
    },
    steps.map((step) => ({
      enabled: true,
      pluginMethodId: step.pluginMethod.id,
      config: step.config,
    })),
  );
};

let ctx: WorkflowTestContext;

beforeAll(async () => {
  const db = await getKyselyDB();
  ctx = new WorkflowTestContext(db);
  await ctx.init();
}, 30_000);

describe('core plugin', () => {
  describe('validation', () => {
    it('should have a valid manifest.json', () => {
      const buffer = readFileSync('../packages/plugin-core/manifest.json');
      const result = PluginManifestDto.schema.safeParse(JSON.parse(buffer.toString()));
      if (!result.success) {
        const issues =
          'error' in result
            ? result.error.issues.map((issue) => `  - [${issue.path.join('.')}] ${issue.message}`).join('\n')
            : '';
        const message = `Invalid packages/plugin-core/manifest.json:\n${issues}`;
        expect(result.success, message).toBe(true);
      }

      expect(result.success).toBe(true);
    });
  });

  describe('assetArchive', () => {
    it('should archive an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetArchive' }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({
        visibility: AssetVisibility.Archive,
      });
    });

    it('should unarchive an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetArchive', config: { inverse: true } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({
        visibility: AssetVisibility.Timeline,
      });
    });
  });

  describe('assetLock', () => {
    it('should lock an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetLock' }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({
        visibility: AssetVisibility.Locked,
      });
    });

    it('should unlock an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Locked });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetLock', config: { inverse: true } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({
        visibility: AssetVisibility.Timeline,
      });
    });
  });

  describe('assetFavorite', () => {
    it('should favorite an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetFavorite' }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: true });
    });

    it('should unfavorite an asset', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isFavorite: true });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetFavorite', config: { inverse: true } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: false });
    });
  });

  describe('assetAddToAlbums', () => {
    it('should create an album by name', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isFavorite: true });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetAddToAlbums', config: { albumIds: [], albumName: 'Screenshots' } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      const albums = await ctx.get(AlbumRepository).getAll(user.id);
      expect(albums).toHaveLength(1);

      const album = albums[0]!;
      expect(album.albumName).toEqual('Screenshots');

      const updated = await ctx.get(WorkflowRepository).get(workflow.id);
      expect(updated?.steps[0].config).toEqual({ albumIds: [album.id], albumName: 'Screenshots' });

      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.toContain(asset.id);
    });

    it('should not use the name when there is an albumId', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isFavorite: true });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [
          { method: 'immich-plugin-core#assetAddToAlbums', config: { albumIds: [album.id], albumName: 'Screenshots' } },
        ],
      });

      const albums = await ctx.get(AlbumRepository).getAll(user.id);
      expect(albums).toHaveLength(1);
      expect(albums[0].albumName).toEqual(album.albumName);

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.toContain(asset.id);
    });

    it('should add an asset to an album', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, isFavorite: true });
      const { album } = await ctx.newAlbum({ ownerId: user.id });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetAddToAlbums', config: { albumIds: [album.id] } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.toContain(asset.id);
    });

    it('should add an asset to multiple albums', async () => {
      const { user } = await ctx.newUser();
      const [{ asset }, { album: album1 }, { album: album2 }] = await Promise.all([
        ctx.newAsset({ ownerId: user.id, isFavorite: true }),
        ctx.newAlbum({ ownerId: user.id }),
        ctx.newAlbum({ ownerId: user.id }),
      ]);

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetAddToAlbums', config: { albumIds: [album1.id, album2.id] } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();

      await expect(ctx.get(AlbumRepository).getAssetIds(album1.id, [asset.id])).resolves.toContain(asset.id);
      await expect(ctx.get(AlbumRepository).getAssetIds(album2.id, [asset.id])).resolves.toContain(asset.id);
    });

    it('should require album access', async () => {
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user1.id, isFavorite: true });
      const { album } = await ctx.newAlbum({ ownerId: user2.id });

      const workflow = await createWorkflow({
        ownerId: user1.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [{ method: 'immich-plugin-core#assetAddToAlbums', config: { albumIds: [album.id] } }],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeTruthy();

      await expect(ctx.get(AlbumRepository).getAssetIds(album.id, [asset.id])).resolves.not.toContain(asset.id);
    });
  });

  describe('assetLocationFilter', () => {
    it('should favorite an asset within a given radius', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, latitude: 49.27335322114536, longitude: -123.10387144078764 });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetMetadataExtraction,
        steps: [
          {
            method: 'immich-plugin-core#assetLocationFilter',
            config: { coordinate: { latitude: 49.28882167994929, longitude: -123.1111530988137, radius: 2 } },
          },
          {
            method: 'immich-plugin-core#assetFavorite',
          },
        ],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();
      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: true });
    });

    it('should not favorite asset outside a given radius', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, latitude: 49.26126605257035, longitude: -123.24895939078196 });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetMetadataExtraction,
        steps: [
          {
            method: 'immich-plugin-core#assetLocationFilter',
            config: { coordinate: { latitude: 49.28882167994929, longitude: -123.1111530988137, radius: 10 } },
          },
          {
            method: 'immich-plugin-core#assetFavorite',
          },
        ],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();
      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: false });
    });

    it('should favorite asset by location name', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });
      await ctx.newExif({ assetId: asset.id, city: 'Vancouver' });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetMetadataExtraction,
        steps: [
          {
            method: 'immich-plugin-core#assetLocationFilter',
            config: { region: { city: 'Vancouver' } },
          },
          {
            method: 'immich-plugin-core#assetFavorite',
          },
        ],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();
      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: true });
    });
  });

  describe('assetTypeFilter', () => {
    it('should favorite asset if it is a video', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id, type: AssetType.Video });

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [
          {
            method: 'immich-plugin-core#assetTypeFilter',
            config: { allowedTypes: ['VIDEO'] },
          },
          {
            method: 'immich-plugin-core#assetFavorite',
          },
        ],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();
      await expect(ctx.get(AssetRepository).getById(asset.id)).resolves.toMatchObject({ isFavorite: true });
    });
  });

  describe('assetDateFilter', () => {
    it('should favorite assets created during the first 7 days of a specific year and month', async () => {
      const { user } = await ctx.newUser();
      const [{ asset: asset1 }, { asset: asset2 }] = await Promise.all([
        ctx.newAsset({ ownerId: user.id, localDateTime: new Date('2000-04-01') }),
        ctx.newAsset({ ownerId: user.id, localDateTime: new Date('2000-04-07T23:59:59Z') }),
      ]);

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [
          {
            method: 'immich-plugin-core#assetDateFilter',
            config: {
              startDate: { day: 1, month: 4, year: 2000 },
              endDate: { day: 7, month: 4, year: 2000 },
              recurring: false,
            },
          },
          {
            method: 'immich-plugin-core#assetFavorite',
          },
        ],
      });

      await ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset1.id });
      await expect(ctx.get(AssetRepository).getById(asset1.id)).resolves.toMatchObject({ isFavorite: true });

      await ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset2.id });
      await expect(ctx.get(AssetRepository).getById(asset2.id)).resolves.toMatchObject({ isFavorite: true });
    });
  });

  describe('webhook', () => {
    it('should trigger a webhook on asset upload', async () => {
      const { user } = await ctx.newUser();
      const { asset } = await ctx.newAsset({ ownerId: user.id });

      const fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve('') }));
      vi.stubGlobal('fetch', fetchMock);

      const workflow = await createWorkflow({
        ownerId: user.id,
        trigger: WorkflowTrigger.AssetCreate,
        steps: [
          {
            method: 'immich-plugin-core#webhook',
            config: { url: 'http://localhost', method: 'POST' },
          },
        ],
      });

      await expect(ctx.sut.handleAssetTrigger({ workflowId: workflow.id, assetId: asset.id })).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalled();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });
  });
});
