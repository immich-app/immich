import { Kysely } from 'kysely';
import { Stats } from 'node:fs';
import { join } from 'node:path';
import { AssetStatus, JobName, JobStatus } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { LibraryService } from 'src/services/library.service';
import { newMediumService, testAssetsDir } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const createFileStats = (mtimeMs: number): Stats => {
  return { mtime: new Date(mtimeMs) } as Stats;
};

const setup = (db?: Kysely<DB>) => {
  const context = newMediumService(LibraryService, {
    database: db || defaultDatabase,
    real: [AssetRepository, AssetJobRepository, CryptoRepository, LibraryRepository],
    mock: [StorageRepository, JobRepository, LoggingRepository],
  });

  const jobs = context.ctx.getMock(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();

  return context;
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(LibraryService.name, () => {
  const importRoot = '/libraries/offline';
  const importPath = `${importRoot}/in-path`;
  const excludedPath = `${importRoot}/excluded`;
  const outsidePath = '/libraries/outside';

  const createLibrary = async (
    ctx: ReturnType<typeof setup>['ctx'],
    options: { importPaths?: string[]; exclusionPatterns?: string[] } = {},
  ) => {
    const { user } = await ctx.newUser();
    return ctx.get(LibraryRepository).create({
      ownerId: user.id,
      name: 'Medium test library',
      importPaths: options.importPaths ?? [importPath],
      exclusionPatterns: options.exclusionPatterns ?? [],
    });
  };

  describe('offline asset handling', () => {
    it('should set an asset offline if its file is missing', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx);
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importPath}/offline.png`,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      storage.stat.mockRejectedValue(new Error('ENOENT'));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should set an asset offline if its file is not in any import path', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${outsidePath}/offline.png`,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      await expect(sut.handleQueueSyncAssets({ id: library.id })).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should set an asset offline if its file is covered by an exclusion pattern', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, {
        importPaths: [importRoot],
        exclusionPatterns: ['**/excluded/**'],
      });

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${excludedPath}/offline.png`,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      await expect(sut.handleQueueSyncAssets({ id: library.id })).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should not set an asset offline if file exists in import path and is not excluded', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, {
        importPaths: [importRoot],
        exclusionPatterns: ['**/excluded/**'],
      });

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importPath}/online.png`,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: false }));
      expect(updated?.deletedAt).toBeNull();
    });

    it('should set an offline asset to online if its file exists in an import path and is not excluded', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importPath}/offline.png`,
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: false }));
      expect(updated?.deletedAt).toBeNull();
    });

    it('should not set an offline asset to online if its file exists in an import path but is excluded', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, {
        importPaths: [importRoot],
        exclusionPatterns: ['**/offline/**'],
      });

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importRoot}/offline/offline.png`,
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should keep an offline asset offline if it is outside import paths', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${outsidePath}/offline.png`,
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should set a trashed asset offline if its file is missing', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importPath}/offline.png`,
        isExternal: true,
        isOffline: false,
        deletedAt: new Date(),
        status: AssetStatus.Trashed,
      });

      storage.stat.mockRejectedValue(new Error('ENOENT'));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: true }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });

    it('should set a trashed offline asset to online but keep it in trash', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: `${importPath}/offline.png`,
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Trashed,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      const updated = await assetRepo.getById(asset.id);
      expect(updated).toEqual(expect.objectContaining({ isOffline: false }));
      expect(updated?.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('xmp scan behavior', () => {
    it('should queue sidecar checks for newly imported assets', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const jobs = ctx.getMock(JobRepository);
      jobs.queueAll.mockResolvedValue();

      const library = await createLibrary(ctx, { importPaths: ['/libraries/xmp'] });
      const rawPath = join(testAssetsDir, 'formats/raw/Nikon/D80/glarus.nef');

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_000));

      await expect(
        sut.handleSyncFiles({
          libraryId: library.id,
          paths: [rawPath],
          progressCounter: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      expect(jobs.queueAll).toHaveBeenCalledWith([
        expect.objectContaining({
          name: JobName.SidecarCheck,
          data: expect.objectContaining({ id: expect.any(String) }),
        }),
      ]);
    });

    it('should queue sidecar checks for assets whose file changed', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const jobs = ctx.getMock(JobRepository);
      jobs.queueAll.mockResolvedValue();

      const library = await createLibrary(ctx, { importPaths: ['/libraries/xmp'] });
      const rawPath = join(testAssetsDir, 'formats/raw/Nikon/D80/glarus.nef');

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: rawPath,
        fileModifiedAt: new Date(1_700_000_000_000),
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(1_700_000_000_001));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      expect(jobs.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SidecarCheck,
          data: { id: asset.id, source: 'upload' },
        },
      ]);
    });

    it('should not queue sidecar checks for unchanged assets', async () => {
      const { sut, ctx } = setup();
      const storage = ctx.getMock(StorageRepository);
      const jobs = ctx.getMock(JobRepository);
      jobs.queueAll.mockResolvedValue();

      const library = await createLibrary(ctx, { importPaths: ['/libraries/xmp'] });
      const rawPath = join(testAssetsDir, 'formats/raw/Nikon/D80/glarus.nef');

      const mtimeMs = 1_700_000_000_000;
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: rawPath,
        fileModifiedAt: new Date(mtimeMs),
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

      storage.stat.mockResolvedValue(createFileStats(mtimeMs));

      await expect(
        sut.handleSyncAssets({
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [asset.id],
          progressCounter: 1,
          totalAssets: 1,
        }),
      ).resolves.toBe(JobStatus.Success);

      expect(jobs.queueAll).not.toHaveBeenCalled();
    });
  });
});
