import { Kysely } from 'kysely';
import { copyFile, mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { AssetStatus, JobName, JobStatus } from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { AssetRepository } from 'src/repositories/asset.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { StorageRepository } from 'src/repositories/storage.repository';
import { DB } from 'src/schema';
import { LibraryService } from 'src/services/library.service';
import { newMediumService, testAssetsDir } from 'test/medium.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const fileModifiedAt = new Date(1_700_000_000_000);

const createFile = async (filePath: string, modifiedAt: Date = fileModifiedAt) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, 'test');
  await utimes(filePath, modifiedAt, modifiedAt);
  return filePath;
};

const copyTestAsset = async (source: string, filePath: string, modifiedAt: Date = fileModifiedAt) => {
  await mkdir(dirname(filePath), { recursive: true });
  await copyFile(join(testAssetsDir, source), filePath);
  await utimes(filePath, modifiedAt, modifiedAt);
  return filePath;
};

const setup = (db?: Kysely<DB>) => {
  const context = newMediumService(LibraryService, {
    database: db || defaultDatabase,
    real: [AssetRepository, AssetJobRepository, CryptoRepository, LibraryRepository, StorageRepository],
    mock: [EventRepository, JobRepository, LoggingRepository],
  });

  const jobs = context.ctx.getMock(JobRepository);
  jobs.queue.mockResolvedValue();
  jobs.queueAll.mockResolvedValue();

  context.ctx.getMock(EventRepository).emit.mockResolvedValue();

  return context;
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(LibraryService.name, () => {
  let tempDir: string;
  let importRoot: string;
  let importPath: string;
  let excludedPath: string;
  let outsidePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'immich-library-'));
    importRoot = join(tempDir, 'libraries/offline');
    importPath = join(importRoot, 'in-path');
    excludedPath = join(importRoot, 'excluded');
    outsidePath = join(tempDir, 'libraries/outside');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx);
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        // the file is intentionally never created on disk
        originalPath: join(importPath, 'offline.png'),
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

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
        originalPath: await createFile(join(outsidePath, 'offline.png')),
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
        originalPath: await createFile(join(excludedPath, 'offline.png')),
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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, {
        importPaths: [importRoot],
        exclusionPatterns: ['**/excluded/**'],
      });

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: await createFile(join(importPath, 'online.png')),
        fileModifiedAt,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: await createFile(join(importPath, 'offline.png')),
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, {
        importPaths: [importRoot],
        exclusionPatterns: ['**/excluded/**'],
      });

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: await createFile(join(excludedPath, 'offline.png')),
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: await createFile(join(outsidePath, 'offline.png')),
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Active,
      });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        // the file is intentionally never created on disk
        originalPath: join(importPath, 'offline.png'),
        isExternal: true,
        isOffline: false,
        deletedAt: new Date(),
        status: AssetStatus.Trashed,
      });

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
      const assetRepo = ctx.get(AssetRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: await createFile(join(importPath, 'offline.png')),
        isExternal: true,
        isOffline: true,
        deletedAt: new Date(),
        status: AssetStatus.Trashed,
      });

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
      const jobs = ctx.getMock(JobRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const rawPath = await copyTestAsset('formats/raw/Nikon/D80/glarus.nef', join(importPath, 'glarus.nef'));

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
      const jobs = ctx.getMock(JobRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const rawPath = await copyTestAsset('formats/raw/Nikon/D80/glarus.nef', join(importPath, 'glarus.nef'));

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: rawPath,
        // the file on disk has a newer modified time
        fileModifiedAt: new Date(fileModifiedAt.valueOf() - 1000),
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

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
      const jobs = ctx.getMock(JobRepository);

      const library = await createLibrary(ctx, { importPaths: [importPath] });
      const rawPath = await copyTestAsset('formats/raw/Nikon/D80/glarus.nef', join(importPath, 'glarus.nef'));

      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: rawPath,
        fileModifiedAt,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
      });

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
