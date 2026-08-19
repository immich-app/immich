import { Kysely } from 'kysely';
import { copyFile, mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
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
import { MediumTestContext, testAssetsDir } from 'test/medium.factory';
import { newUuid } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

// `validateImportPath` checks candidate paths against the media location
StorageCore.setMediaLocation('/photos');

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

class LibraryTestContext extends MediumTestContext<typeof LibraryService> {
  constructor(database: Kysely<DB>) {
    super(LibraryService, {
      database,
      real: [AssetRepository, AssetJobRepository, CryptoRepository, LibraryRepository, StorageRepository],
      mock: [EventRepository, JobRepository, LoggingRepository],
    });

    const jobs = this.getMock(JobRepository);
    jobs.queue.mockResolvedValue();
    jobs.queueAll.mockResolvedValue();

    this.getMock(EventRepository).emit.mockResolvedValue();
  }

  async createLibrary(options: { importPaths?: string[]; exclusionPatterns?: string[] } = {}) {
    const { user } = await this.newUser();
    return this.get(LibraryRepository).create({
      ownerId: user.id,
      name: 'Medium test library',
      importPaths: options.importPaths ?? [],
      exclusionPatterns: options.exclusionPatterns ?? [],
    });
  }

  /** Runs a full library scan, manually routing jobs to their handlers */
  async scan(libraryId: string) {
    const jobs = this.getMock(JobRepository);

    jobs.queue.mockClear();
    await this.sut.handleQueueSyncFiles({ id: libraryId });
    for (const [job] of jobs.queue.mock.calls) {
      if (job.name === JobName.LibrarySyncFiles) {
        await this.sut.handleSyncFiles(job.data);
      }
    }

    jobs.queue.mockClear();
    await this.sut.handleQueueSyncAssets({ id: libraryId });
    for (const [job] of jobs.queue.mock.calls) {
      if (job.name === JobName.LibrarySyncAssets) {
        await this.sut.handleSyncAssets(job.data);
      }
    }
  }

  /** The paths a library scan left visible, i.e. neither offline nor trashed */
  async getAssetPaths(libraryId: string) {
    const assets = await this.database
      .selectFrom('asset')
      .select('originalPath')
      .where('libraryId', '=', libraryId)
      .where('deletedAt', 'is', null)
      .execute();

    return assets.map(({ originalPath }) => originalPath).sort();
  }
}

const setup = (db?: Kysely<DB>) => {
  const ctx = new LibraryTestContext(db || defaultDatabase);
  return { sut: ctx.sut, ctx };
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

  describe('offline asset handling', () => {
    it('should set an asset offline if its file is missing', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({
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
      const library = await ctx.createLibrary({
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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
      const library = await ctx.createLibrary({ importPaths: [importPath] });
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

  describe('scanning', () => {
    it('should import a new asset', async () => {
      const { ctx } = setup();

      const assetPath = await createFile(join(importPath, 'assetA.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
    });

    it('should scan multiple import paths', async () => {
      const { ctx } = setup();

      const directoryA = join(importRoot, 'directoryA');
      const directoryB = join(importRoot, 'directoryB');
      const assetA = await createFile(join(directoryA, 'assetA.png'));
      const assetB = await createFile(join(directoryB, 'assetB.png'));
      const library = await ctx.createLibrary({ importPaths: [directoryA, directoryB] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetA, assetB].sort());
    });

    // https://github.com/immich-app/immich/issues/10699
    it('should scan multiple import paths with commas', async () => {
      const { ctx } = setup();

      const folderA = join(importRoot, 'folder, a');
      const folderB = join(importRoot, 'folder, b');
      const assetA = await createFile(join(folderA, 'assetA.png'));
      const assetB = await createFile(join(folderB, 'assetB.png'));
      const library = await ctx.createLibrary({ importPaths: [folderA, folderB] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetA, assetB].sort());
    });

    // https://github.com/immich-app/immich/issues/10699
    it('should scan multiple import paths with braces', async () => {
      const { ctx } = setup();

      const folderA = join(importRoot, 'folder{ a');
      const folderB = join(importRoot, 'folder} b');
      const assetA = await createFile(join(folderA, 'assetA.png'));
      const assetB = await createFile(join(folderB, 'assetB.png'));
      const library = await ctx.createLibrary({ importPaths: [folderA, folderB] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetA, assetB].sort());
    });

    // We never got backslashes to work
    const annoyingChars = [
      "'",
      '"',
      '`',
      '*',
      '{',
      '}',
      ',',
      '(',
      ')',
      '[',
      ']',
      '?',
      '!',
      '@',
      '#',
      '$',
      '%',
      '^',
      '&',
      '=',
      '+',
      '~',
      '|',
      '<',
      '>',
      ';',
      ':',
      '/',
    ];

    it.each(annoyingChars)('should scan multiple import paths with %s', async (char) => {
      const { ctx } = setup();

      const folderA = join(importRoot, `folder${char}1`);
      const folderB = join(importRoot, `folder${char}2`);
      const asset1 = await createFile(join(folderA, 'asset1.png'));
      const asset2 = await createFile(join(folderB, 'asset2.png'));
      const library = await ctx.createLibrary({ importPaths: [folderA, folderB] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1, asset2].sort());
    });
  });

  describe('exclusion patterns', () => {
    it('should not import assets covered by an exclusion pattern', async () => {
      const { ctx } = setup();

      await createFile(join(importRoot, 'directoryA/assetA.png'));
      const assetB = await createFile(join(importRoot, 'directoryB/assetB.png'));
      const library = await ctx.createLibrary({
        importPaths: [importRoot],
        exclusionPatterns: ['**/directoryA/**'],
      });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetB]);
    });

    it('should not import assets covered by multiple exclusion patterns', async () => {
      const { ctx } = setup();

      await createFile(join(importRoot, 'directoryA/assetA.png'));
      await createFile(join(importRoot, 'directoryB/assetB.png'));
      const library = await ctx.createLibrary({
        importPaths: [importRoot],
        exclusionPatterns: ['**/directoryA/**', '**/directoryB/**'],
      });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([]);
    });

    it('should offline assets covered by a new exclusion pattern', async () => {
      const { sut, ctx } = setup();

      const assetA = await createFile(join(importRoot, 'directoryA/assetA.png'));
      const assetB = await createFile(join(importRoot, 'directoryB/assetB.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot] });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetA, assetB].sort());

      await sut.update(library.id, { exclusionPatterns: ['**/directoryA/**'] });
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetB]);

      await sut.update(library.id, { exclusionPatterns: ['**/directoryA/**', '**/directoryB/**'] });
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([]);
    });

    // https://github.com/immich-app/immich/issues/17121
    it('should respect exclusion patterns when using multiple import paths', async () => {
      const { sut, ctx } = setup();

      const inPath = join(importRoot, 'exclusion');
      // a second import path that never exists on disk, as in the original report
      const missingPath = join(importRoot, 'exclusion2');
      const asset1 = await createFile(join(inPath, 'asset1.png'));
      const asset2 = await createFile(join(inPath, 'Raw/asset2.png'));
      const library = await ctx.createLibrary({ importPaths: [`${inPath}/`, `${missingPath}/`] });

      // scanning twice must be idempotent
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1, asset2].sort());
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1, asset2].sort());

      await sut.update(library.id, { exclusionPatterns: ['**/Raw/**'] });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1]);
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1]);
    });

    const annoyingExclusionPatterns = ['@', '#', '$', '%', '^', '&', '='];

    it.each(annoyingExclusionPatterns)('should support exclusion patterns with %s', async (char) => {
      const { sut, ctx } = setup();

      const inPath = join(importRoot, 'exclusion');
      const excludedFolder = `${char}folder`;
      const asset1 = await createFile(join(inPath, 'asset1.png'));
      const asset2 = await createFile(join(inPath, excludedFolder, 'asset2.png'));
      const library = await ctx.createLibrary({ importPaths: [inPath] });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1, asset2].sort());

      await sut.update(library.id, { exclusionPatterns: [`**/${excludedFolder}/**`] });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset1]);
    });
  });

  describe('validate', () => {
    it('should pass with no import paths', async () => {
      const { sut } = setup();

      await expect(sut.validate(newUuid(), { importPaths: [] })).resolves.toEqual({ importPaths: [] });
    });

    it('should fail if the path does not exist', async () => {
      const { sut } = setup();
      const missingPath = join(tempDir, 'does/not/exist');

      await expect(sut.validate(newUuid(), { importPaths: [missingPath] })).resolves.toEqual({
        importPaths: [{ importPath: missingPath, isValid: false, message: 'Path does not exist (ENOENT)' }],
      });
    });

    it('should fail if the path is not absolute', async () => {
      const { sut } = setup();

      await expect(sut.validate(newUuid(), { importPaths: ['relative/path'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: 'relative/path',
            isValid: false,
            message: `Import path must be absolute, try ${resolve('relative/path')}`,
          },
        ],
      });
    });

    it('should fail if the path is a file', async () => {
      const { sut } = setup();
      const filePath = await createFile(join(importPath, 'assetA.png'));

      await expect(sut.validate(newUuid(), { importPaths: [filePath] })).resolves.toEqual({
        importPaths: [{ importPath: filePath, isValid: false, message: 'Not a directory' }],
      });
    });
  });
});
