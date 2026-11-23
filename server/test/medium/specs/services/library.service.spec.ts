import { Kysely } from 'kysely';
import { chunk } from 'lodash-es';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants.js';
import { StorageCore } from 'src/cores/storage.core.js';
import type { SystemConfig } from 'src/dtos/config.dto.js';
import { AssetFileType, AssetStatus, AssetType, JobName, JobStatus } from 'src/enum.js';
import { AssetJobRepository } from 'src/repositories/asset-job.repository.js';
import { AssetRepository } from 'src/repositories/asset.repository.js';
import { CronRepository } from 'src/repositories/cron.repository.js';
import { CryptoRepository } from 'src/repositories/crypto.repository.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { EventRepository } from 'src/repositories/event.repository.js';
import { JobRepository } from 'src/repositories/job.repository.js';
import { LibraryRepository } from 'src/repositories/library.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ResourceRepository } from 'src/repositories/resource.repository.js';
import { StorageRepository } from 'src/repositories/storage.repository.js';
import { UserRepository } from 'src/repositories/user.repository.js';
import { WebsocketRepository } from 'src/repositories/websocket.repository.js';
import { DB } from 'src/schema/index.js';
import { LibraryService } from 'src/services/library.service.js';
import { MetadataService } from 'src/services/metadata.service.js';
import { JobItem } from 'src/types.js';
import { systemConfigStub } from 'test/fixtures/system-config.stub.js';
import { MediumTestContext, mediumFactory, newMediumService } from 'test/medium.factory.js';
import { newUuid } from 'test/small.factory.js';
import { getKyselyDB } from 'test/utils.js';

// `validateImportPath` checks candidate paths against the media location
StorageCore.setMediaLocation('/photos');

let defaultDatabase: Kysely<DB>;

const fileModifiedAt = new Date(1_700_000_000_000);

const createFile = async (filePath: string) => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, 'test');
  await utimes(filePath, fileModifiedAt, fileModifiedAt);
  return filePath;
};

class LibraryTestContext extends MediumTestContext<typeof LibraryService> {
  private metadataService: MetadataService;
  private queued: JobItem[] = [];

  constructor(database: Kysely<DB>) {
    super(LibraryService, {
      database,
      real: [
        AssetRepository,
        AssetJobRepository,
        CryptoRepository,
        LibraryRepository,
        StorageRepository,
        UserRepository,
      ],
      mock: [
        CronRepository,
        DatabaseRepository,
        EventRepository,
        JobRepository,
        LoggingRepository,
        ResourceRepository,
        WebsocketRepository,
      ],
    });

    const jobs = this.getMock(JobRepository);
    jobs.queue.mockImplementation((item) => {
      this.queued.push(item);
      return Promise.resolve();
    });
    jobs.queueAll.mockImplementation((items) => {
      this.queued.push(...items);
      return Promise.resolve();
    });

    this.getMock(EventRepository).emit.mockResolvedValue();
    this.getMock(WebsocketRepository).serverSend.mockReturnValue();

    this.metadataService = newMediumService(MetadataService, {
      database,
      real: [AssetRepository, AssetJobRepository, StorageRepository],
      mock: [LoggingRepository],
    }).sut;
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

  /** Runs a library scan through every library job it queues, and returns the jobs and events it leaves for other services */
  async scan(libraryId: string) {
    const emit = this.getMock(EventRepository).emit;
    emit.mockClear();
    this.queued = [];

    await this.sut.queueScan(libraryId);

    const jobs: JobItem[] = [];
    const failed: JobName[] = [];
    for (let index = 0; index < this.queued.length; index++) {
      const job = this.queued[index];
      const status = await this.runLibraryJob(job)?.catch(() => JobStatus.Failed);
      if (status === undefined) {
        jobs.push(job);
      }
      if (status === JobStatus.Failed) {
        failed.push(job.name);
      }
    }

    for (const job of jobs) {
      if (job.name === JobName.SidecarCheck) {
        await this.metadataService.handleSidecarCheck(job.data);
      }
    }

    return { jobs, events: emit.mock.calls, failed };
  }

  private runLibraryJob(job: JobItem) {
    switch (job.name) {
      case JobName.LibrarySyncFilesQueueAll: {
        return this.sut.handleQueueSyncFiles(job.data);
      }
      case JobName.LibrarySyncFiles: {
        return this.sut.handleSyncFiles(job.data);
      }
      case JobName.LibrarySyncAssetsQueueAll: {
        return this.sut.handleQueueSyncAssets(job.data);
      }
      case JobName.LibrarySyncAssets: {
        return this.sut.handleSyncAssets(job.data);
      }
      default: {
        return;
      }
    }
  }

  getSidecarPaths(libraryId: string) {
    return this.database
      .selectFrom('asset')
      .innerJoin('asset_file', 'asset_file.assetId', 'asset.id')
      .where('libraryId', '=', libraryId)
      .where('asset_file.type', '=', AssetFileType.Sidecar)
      .select(['originalPath', 'asset_file.path as sidecarPath'])
      .orderBy('originalPath')
      .execute();
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

  getAsset(originalPath: string) {
    return this.database
      .selectFrom('asset')
      .select([
        'id',
        'ownerId',
        'libraryId',
        'originalPath',
        'originalFileName',
        'type',
        'isExternal',
        'isOffline',
        'status',
        'checksum',
        'checksumAlgorithm',
        'deletedAt',
        'fileCreatedAt',
        'fileModifiedAt',
        'localDateTime',
      ])
      .where('originalPath', '=', originalPath)
      .executeTakeFirstOrThrow();
  }
}

// eslint-disable-next-line unicorn/no-unnecessary-parameters
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

  describe('create', () => {
    it('should create an external library with defaults', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(sut.create({ ownerId: user.id })).resolves.toEqual(
        expect.objectContaining({
          ownerId: user.id,
          name: 'New External Library',
          refreshedAt: null,
          assetCount: 0,
          importPaths: [],
          exclusionPatterns: expect.any(Array),
        }),
      );
    });

    it('should create an external library with options', async () => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();

      await expect(
        sut.create({
          ownerId: user.id,
          name: 'My Awesome Library',
          importPaths: [importPath],
          exclusionPatterns: ['**/Raw/**'],
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          name: 'My Awesome Library',
          importPaths: [importPath],
          exclusionPatterns: ['**/Raw/**'],
        }),
      );
    });
  });

  describe('get', () => {
    it('should get a library by id', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await expect(sut.get(library.id)).resolves.toEqual(
        expect.objectContaining({
          id: library.id,
          ownerId: library.ownerId,
          refreshedAt: null,
          assetCount: 0,
          importPaths: [importPath],
          exclusionPatterns: [],
        }),
      );
    });

    it('should throw an error when the library does not exist', async () => {
      const { sut } = setup();

      await expect(sut.get(newUuid())).rejects.toThrow('Library not found');
    });
  });

  describe('update', () => {
    it('should change the library name', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await expect(sut.update(library.id, { name: 'New Library Name' })).resolves.toEqual(
        expect.objectContaining({ name: 'New Library Name' }),
      );
    });

    it('should change the import paths', async () => {
      const { sut, ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary();

      await expect(sut.update(library.id, { importPaths: [importPath] })).resolves.toEqual(
        expect.objectContaining({ importPaths: [importPath] }),
      );
    });

    it('should reject an import path that does not exist', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary();

      await expect(sut.update(library.id, { importPaths: [join(tempDir, 'missing')] })).rejects.toThrow(
        'Invalid import path: Path does not exist (ENOENT)',
      );
    });

    it('should change the exclusion patterns', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await expect(sut.update(library.id, { exclusionPatterns: ['**/Raw/**'] })).resolves.toEqual(
        expect.objectContaining({ exclusionPatterns: ['**/Raw/**'] }),
      );
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

  describe('handleDeleteLibrary', () => {
    it('should delete an empty library', async () => {
      const { sut, ctx } = setup();
      const libraryRepo = ctx.get(LibraryRepository);
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await sut.delete(library.id);

      // the library is hidden right away, but the row survives until the job runs
      await expect(libraryRepo.get(library.id)).resolves.toBeUndefined();
      await expect(libraryRepo.get(library.id, true)).resolves.toEqual(expect.objectContaining({ id: library.id }));
      expect(ctx.getMock(JobRepository).queue).toHaveBeenCalledWith({
        name: JobName.LibraryDelete,
        data: { id: library.id },
      });

      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.Success);

      await expect(libraryRepo.get(library.id, true)).resolves.toBeUndefined();
    });

    it('should delete a library with assets without deleting the files', async () => {
      const { sut, ctx } = setup();
      const libraryRepo = ctx.get(LibraryRepository);
      const jobs = ctx.getMock(JobRepository);
      const assetA = await createFile(join(importPath, 'assetA.png'));
      const assetB = await createFile(join(importPath, 'assetB.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetA, assetB].sort());

      await sut.delete(library.id);
      await expect(libraryRepo.get(library.id)).resolves.toBeUndefined();

      jobs.queueAll.mockClear();
      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.Success);

      // the assets are trashed and queued for removal, so the library row stays until they are gone
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([]);
      await expect(libraryRepo.get(library.id, true)).resolves.toEqual(expect.objectContaining({ id: library.id }));
      // deleteOnDisk is what keeps the files of an external library, so assert it explicitly
      expect(jobs.queueAll).toHaveBeenCalledWith([
        { name: JobName.AssetDelete, data: { id: expect.any(String), deleteOnDisk: false } },
        { name: JobName.AssetDelete, data: { id: expect.any(String), deleteOnDisk: false } },
      ]);

      // the asset delete jobs are only queued here, so this just proves the handler itself unlinks nothing
      expect(existsSync(assetA)).toBe(true);
      expect(existsSync(assetB)).toBe(true);
    });
  });

  describe('queueScan', () => {
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

    // https://github.com/immich-app/immich/issues/23619
    it.each([
      { pattern: '**/*.{arw,ARW,dng,DNG}', extensions: ['arw', 'ARW', 'dng', 'DNG'] },
      { pattern: '**/*.{arw,dng}', extensions: ['arw', 'ARW', 'ArW', 'dng', 'DNG', 'DnG'] },
      { pattern: '**/*.ARW', extensions: ['arw', 'ARW', 'ArW'] },
      { pattern: '**/*.{tif,jpg}', extensions: ['tif', 'TIF', 'TiF', 'jpg', 'JPG', 'JpG'] },
    ])(
      'should offline existing assets covered by $pattern regardless of extension case',
      async ({ pattern, extensions }) => {
        const { sut, ctx } = setup();

        const excludedAssets = await Promise.all(
          extensions.map((extension, index) => createFile(join(importRoot, 'nested', `asset${index}.${extension}`))),
        );
        const includedAsset = await createFile(join(importRoot, 'included.png'));
        const library = await ctx.createLibrary({ importPaths: [importRoot] });

        await ctx.scan(library.id);
        await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([...excludedAssets, includedAsset].sort());

        await sut.update(library.id, { exclusionPatterns: [pattern] });
        await ctx.scan(library.id);

        await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([includedAsset]);
        const excluded = await ctx.database
          .selectFrom('asset')
          .select(['originalPath', 'isOffline', 'deletedAt'])
          .where('libraryId', '=', library.id)
          .where('originalPath', 'in', excludedAssets)
          .orderBy('originalPath')
          .execute();
        expect(excluded).toEqual(
          excludedAssets.sort().map((originalPath) => ({
            originalPath,
            isOffline: true,
            deletedAt: expect.any(Date),
          })),
        );

        await ctx.scan(library.id);
        await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([includedAsset]);
      },
    );

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

    // Postgres case folding disagreed with picomatch on these: `İ` folds to `i`, but `Σ` does not fold to `ς`
    it.each([
      { pattern: '**/İstanbul/**', folder: 'istanbul', isExcluded: false },
      { pattern: '**/ΚΎΠΡΟΣ/**', folder: 'Κύπρος', isExcluded: true },
    ])('should apply $pattern to $folder the same way on every scan', async ({ pattern, folder, isExcluded }) => {
      const { sut, ctx } = setup();

      const asset = await createFile(join(importRoot, folder, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot] });

      await ctx.scan(library.id);
      await sut.update(library.id, { exclusionPatterns: [pattern] });

      const expected = isExcluded ? [] : [asset];
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual(expected);
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual(expected);
    });

    it('should offline a missing asset when an exclusion pattern is not a valid Postgres regex', async () => {
      const { ctx } = setup();

      const kept = await createFile(join(importPath, 'kept.png'));
      const missing = await createFile(join(importPath, 'missing.png'));
      const library = await ctx.createLibrary({
        importPaths: [importPath],
        exclusionPatterns: [String.raw`**/a\k/**`],
      });

      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept, missing]);

      await rm(missing);
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept]);
    });
  });

  describe('queueScan side effects', () => {
    it.each([
      { file: 'photo.jpg', type: AssetType.Image },
      { file: 'clip.MP4', type: AssetType.Video },
    ])('should import $file as an asset of type $type', async ({ file, type }) => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, file));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAsset(assetPath)).resolves.toEqual({
        id: expect.any(String),
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: assetPath,
        originalFileName: file,
        type,
        isExternal: true,
        isOffline: false,
        status: AssetStatus.Active,
        checksum: createHash('sha1').update(`path:${assetPath}`).digest(),
        checksumAlgorithm: 'sha1-path',
        deletedAt: null,
        fileCreatedAt: fileModifiedAt,
        fileModifiedAt,
        localDateTime: fileModifiedAt,
      });
    });

    it('should queue a sidecar check and emit an event for a new asset', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      const { jobs, events } = await ctx.scan(library.id);

      const asset = await ctx.getAsset(assetPath);
      expect(jobs).toEqual([{ name: JobName.SidecarCheck, data: { id: asset.id, source: 'upload' } }]);
      expect(events).toEqual([['AssetCreate', { asset: { id: asset.id, ownerId: library.ownerId } }]]);
    });

    it('should not queue jobs or emit events for an unchanged asset', async () => {
      const { ctx } = setup();
      await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      await expect(ctx.scan(library.id)).resolves.toEqual({ jobs: [], events: [], failed: [] });
    });

    it('should queue a sidecar check for a modified asset', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const asset = await ctx.getAsset(assetPath);

      const modifiedAt = new Date(1_800_000_000_000);
      await utimes(assetPath, modifiedAt, modifiedAt);
      const { jobs, events } = await ctx.scan(library.id);

      expect(jobs).toEqual([{ name: JobName.SidecarCheck, data: { id: asset.id, source: 'upload' } }]);
      expect(events).toEqual([]);
    });
  });

  describe('queueScan default exclusions', () => {
    it.each([
      { name: 'a hidden file', file: '.asset.png' },
      { name: 'a file in a hidden folder', file: '.thumbnails/asset.png' },
      { name: 'an unsupported file', file: 'asset.txt' },
      { name: 'a sidecar', file: 'asset.png.xmp' },
      { name: 'a Synology thumbnail', file: '@eaDir/asset.png/SYNOPHOTO_THUMB_XL.jpg' },
      { name: 'a recycled file', file: '#recycle/asset.png' },
      { name: 'a snapshot file', file: '#snapshot/asset.png' },
      { name: 'an AppleDouble file', file: '._asset.png' },
      { name: 'a file in an AppleDouble folder', file: '._folder/asset.png' },
    ])('should not import $name', async ({ file }) => {
      const { sut, ctx } = setup();
      const { user } = await ctx.newUser();
      const kept = await createFile(join(importPath, 'kept.png'));
      await createFile(join(importPath, file));
      const library = await sut.create({ ownerId: user.id, importPaths: [importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept]);
    });
  });

  describe('queueScan file names and paths', () => {
    it.each(['new\nline.png', 'tab\t.png', '日本.png', 'camera 📷.png', 'e\u{301}.png'])(
      'should import a file named %j',
      async (name) => {
        const { ctx } = setup();
        const assetPath = await createFile(join(importPath, name));
        const library = await ctx.createLibrary({ importPaths: [importPath] });

        await ctx.scan(library.id);

        await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
      },
    );

    it.fails('should import a file with a backslash in its name', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, String.raw`back\slash.png`));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
    });

    it('should import each asset once when import paths overlap', async () => {
      const { ctx } = setup();
      const outer = await createFile(join(importRoot, 'outer.png'));
      const inner = await createFile(join(importPath, 'inner.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot, importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([inner, outer]);
    });

    it('should import through an import path that is a symbolic link', async () => {
      const { ctx } = setup();
      await createFile(join(importPath, 'asset.png'));
      const link = join(tempDir, 'link');
      await symlink(importPath, link);
      const library = await ctx.createLibrary({ importPaths: [link] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([join(link, 'asset.png')]);
    });

    it('should offline a renamed file and import it under its new name', async () => {
      const { ctx } = setup();
      const before = await createFile(join(importPath, 'before.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      const after = join(importPath, 'after.png');
      await rename(before, after);
      const { jobs } = await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([after]);
      await expect(ctx.getAsset(before)).resolves.toEqual(expect.objectContaining({ isOffline: true }));
      const asset = await ctx.getAsset(after);
      expect(jobs).toEqual([{ name: JobName.SidecarCheck, data: { id: asset.id, source: 'upload' } }]);
    });

    it.skipIf(process.getuid?.() === 0).fails('should keep scanning past a folder that cannot be read', async () => {
      const { ctx } = setup();
      const lockedFolder = join(importPath, 'locked');
      await createFile(join(lockedFolder, 'locked.png'));
      const kept = await createFile(join(importPath, 'kept.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      const added = await createFile(join(importPath, 'added.png'));
      await chmod(lockedFolder, 0o000);
      const { failed } = await ctx.scan(library.id).finally(() => chmod(lockedFolder, 0o755));

      expect(failed).toEqual([]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([added, kept]);
    });
  });

  describe('queueScan offline and online', () => {
    it('should offline an asset whose file is deleted', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      await rm(assetPath);
      const { jobs, events } = await ctx.scan(library.id);

      await expect(ctx.getAsset(assetPath)).resolves.toEqual(
        expect.objectContaining({ isOffline: true, status: AssetStatus.Active, deletedAt: expect.any(Date) }),
      );
      expect(jobs).toEqual([]);
      expect(events).toEqual([]);
    });

    it('should restore an offline asset when its file comes back', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const imported = await ctx.getAsset(assetPath);
      await rm(assetPath);
      await ctx.scan(library.id);

      await createFile(assetPath);
      const { jobs, events } = await ctx.scan(library.id);

      await expect(ctx.getAsset(assetPath)).resolves.toEqual({
        ...imported,
        isOffline: false,
        deletedAt: null,
      });
      expect(jobs).toEqual([]);
      expect(events).toEqual([]);
    });

    it('should keep a trashed asset in the trash while it goes offline and comes back', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const { id } = await ctx.getAsset(assetPath);
      await ctx.get(AssetRepository).updateAll([id], { status: AssetStatus.Trashed, deletedAt: new Date() });

      await rm(assetPath);
      await ctx.scan(library.id);
      await expect(ctx.getAsset(assetPath)).resolves.toEqual(
        expect.objectContaining({ isOffline: true, status: AssetStatus.Trashed, deletedAt: expect.any(Date) }),
      );

      await createFile(assetPath);
      await ctx.scan(library.id);
      await expect(ctx.getAsset(assetPath)).resolves.toEqual(
        expect.objectContaining({ isOffline: false, status: AssetStatus.Trashed, deletedAt: expect.any(Date) }),
      );
    });

    it('should restore assets when their exclusion pattern is removed', async () => {
      const { sut, ctx } = setup();
      const assetPath = await createFile(join(excludedPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot] });
      await ctx.scan(library.id);
      await sut.update(library.id, { exclusionPatterns: ['**/excluded/**'] });
      await ctx.scan(library.id);

      await sut.update(library.id, { exclusionPatterns: [] });
      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
    });

    it('should keep an asset offline when its file comes back in an excluded folder', async () => {
      const { sut, ctx } = setup();
      const assetPath = await createFile(join(excludedPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot] });
      await ctx.scan(library.id);
      await rm(assetPath);
      await ctx.scan(library.id);

      await sut.update(library.id, { exclusionPatterns: ['**/excluded/**'] });
      await createFile(assetPath);
      await ctx.scan(library.id);

      await expect(ctx.getAsset(assetPath)).resolves.toEqual(expect.objectContaining({ isOffline: true }));
    });

    it('should offline assets of a removed import path and restore them when it is added back', async () => {
      const { sut, ctx } = setup();
      const secondPath = join(importRoot, 'second');
      const kept = await createFile(join(importPath, 'kept.png'));
      const removed = await createFile(join(secondPath, 'removed.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath, secondPath] });
      await ctx.scan(library.id);

      await sut.update(library.id, { importPaths: [importPath] });
      await ctx.scan(library.id);
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept]);

      await sut.update(library.id, { importPaths: [importPath, secondPath] });
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept, removed]);
    });
  });

  describe('watch', () => {
    it('should pass exclusion patterns to the library watcher', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary({
        importPaths: [importRoot],
        exclusionPatterns: ['**/excluded/**'],
      });
      const storage = ctx.get(StorageRepository);
      const watch = vitest.spyOn(storage, 'watch');

      ctx.getMock(DatabaseRepository).tryLock.mockResolvedValue(true);

      try {
        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });

        expect(watch).toHaveBeenCalledWith(
          library.importPaths,
          expect.objectContaining({ ignored: library.exclusionPatterns }),
          expect.anything(),
        );
      } finally {
        await sut.onShutdown();
      }
    });
  });

  describe('handleQueueSyncAssets', () => {
    it('should not exhaust the database pool when more libraries are checked at once than it has connections', async () => {
      const { sut, ctx } = setup();
      const assetRepo = ctx.get(AssetRepository);
      // the pool has 10 connections, and each library spans more than one batch so it offlines assets mid-read
      const libraries = await Promise.all(
        Array.from({ length: 10 }, () => ctx.createLibrary({ importPaths: [importPath] })),
      );
      for (const library of libraries) {
        const assets = Array.from({ length: JOBS_LIBRARY_PAGINATION_SIZE + 1 }, (_, index) =>
          mediumFactory.assetInsert({
            ownerId: library.ownerId,
            libraryId: library.id,
            originalPath: join(outsidePath, `${index}.jpg`),
            isExternal: true,
          }),
        );
        for (const batch of chunk(assets, 1000)) {
          await assetRepo.createAll(batch);
        }
      }

      await expect(Promise.all(libraries.map(({ id }) => sut.handleQueueSyncAssets({ id })))).resolves.toEqual(
        libraries.map(() => JobStatus.Success),
      );
      for (const { id } of libraries) {
        await expect(ctx.getAssetPaths(id)).resolves.toEqual([]);
      }
    }, 60_000);
  });

  describe('sidecar discovery during library scans', () => {
    it('should only associate with sidecars in the same directory across multiple scan batches and import paths', async () => {
      const { ctx } = setup();
      const secondImportPath = join(importRoot, 'second');
      const library = await ctx.createLibrary({
        importPaths: [importPath, secondImportPath],
      });
      const expected = [];
      for (const directory of [importPath, secondImportPath]) {
        for (const name of ['a', 'b', 'c']) {
          const originalPath = await createFile(join(directory, name, 'photo.jpg'));
          const sidecarPath = await createFile(join(directory, name, 'photo.xmp'));
          expected.push({ originalPath, sidecarPath });
        }
      }
      const storage = ctx.get(StorageRepository);
      const walk = storage.walk.bind(storage);
      const walker = vi.spyOn(storage, 'walk').mockImplementation((options) => walk({ ...options, take: 2 }));
      const syncFiles = vi.spyOn(ctx.sut, 'handleSyncFiles');

      try {
        await ctx.scan(library.id);
        expect(syncFiles.mock.calls.length).toBeGreaterThan(1);
      } finally {
        walker.mockRestore();
        syncFiles.mockRestore();
      }
      await expect(ctx.getSidecarPaths(library.id)).resolves.toEqual(
        expected.toSorted((a, b) => a.originalPath.localeCompare(b.originalPath)),
      );
    });
  });
});
