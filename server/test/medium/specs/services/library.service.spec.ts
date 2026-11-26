import { Kysely } from 'kysely';
import { chunk } from 'lodash-es';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, mkdtemp, rename, rm, symlink, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
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
import { JobItem, JobOf } from 'src/types.js';
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

const createFilesAcrossBatches = async (folder: string) => {
  await mkdir(folder, { recursive: true });
  const filePaths = Array.from({ length: 10_001 }, (_, index) => join(folder, `${String(index).padStart(5, '0')}.jpg`));
  await Promise.all(
    filePaths.map(async (filePath) => {
      await writeFile(filePath, '');
      await utimes(filePath, fileModifiedAt, fileModifiedAt);
    }),
  );
  return filePaths;
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

  async createAssets(library: { id: string; ownerId: string }, originalPaths: string[]) {
    const assets = originalPaths.map((originalPath) =>
      mediumFactory.assetInsert({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath,
        isExternal: true,
        fileModifiedAt,
      }),
    );
    for (const batch of chunk(assets, 1000)) {
      await this.get(AssetRepository).createAll(batch);
    }
    return assets;
  }

  getQueued() {
    return this.getMock(JobRepository).queue.mock.calls.map(([job]) => job);
  }

  /** Runs a library scan through every library job it queues, and returns the jobs and events it leaves for other services */
  async scan(libraryId: string) {
    const emit = this.getMock(EventRepository).emit;
    emit.mockClear();
    this.queued = [];

    const before = await this.getOfflineStates(libraryId);

    await this.sut.queueScan(libraryId);

    const jobs: JobItem[] = [];
    const failed: JobName[] = [];
    const imports: string[] = [];
    for (let index = 0; index < this.queued.length; index++) {
      const job = this.queued[index];
      if (job.name === JobName.LibrarySyncFiles) {
        imports.push(...job.data.paths);
      }
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

    const existing = new Set(before.map(({ id }) => id));
    const refreshed = new Set<string>();
    for (const job of jobs) {
      if (job.name === JobName.SidecarCheck && existing.has(job.data.id)) {
        refreshed.add(job.data.id);
      }
    }

    const states = await this.getOfflineStates(libraryId);
    const after = new Map(states.map(({ id, isOffline }) => [id, isOffline]));
    const changed = before
      .filter(({ id, isOffline }) => after.get(id) !== isOffline || refreshed.has(id))
      .map(({ id }) => id);

    return { jobs, events: emit.mock.calls, failed, imports, changed, refreshed: [...refreshed] };
  }

  private getOfflineStates(libraryId: string) {
    return this.database
      .selectFrom('asset')
      .select(['id', 'isOffline'])
      .where('libraryId', '=', libraryId)
      .orderBy('originalPath')
      .execute();
  }

  private runLibraryJob(job: JobItem) {
    switch (job.name) {
      case JobName.LibrarySyncFilesQueueAll: {
        return this.sut.handleQueueSyncFiles(job.data);
      }
      case JobName.LibrarySyncFiles: {
        return this.sut.handleSyncFiles(job.data);
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

const setup = () => {
  const ctx = new LibraryTestContext(defaultDatabase);
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
        const { refreshed } = await ctx.scan(library.id);

        expect(refreshed).toEqual([]);
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

        const rescan = await ctx.scan(library.id);
        expect(rescan.changed).toEqual([]);
        await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([includedAsset]);
      },
    );

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

    it.each([
      ...annoyingExclusionPatterns.map((char) => ({
        pattern: `**/${char}folder/**`,
        kept: ['asset1.png'],
        excluded: [`${char}folder/asset2.png`],
      })),
      { pattern: '/*.*', kept: ['sub/asset2.png'], excluded: ['asset1.png'] },
      { pattern: '**/Raw', kept: ['Rawr/asset1.png'], excluded: ['Raw/asset2.png', 'sub/raw/asset3.png'] },
      { pattern: '**/{1..3}/**', kept: ['4/asset1.png'], excluded: ['2/asset2.png'] },
      { pattern: '**/{8..11}/**', kept: ['1/asset1.png'], excluded: ['10/asset2.png'] },
      { pattern: '**/*(1).jpg', kept: ['IMG1.jpg'], excluded: ['IMG(1).jpg'] },
      { pattern: '**/ΚΎΠΡΟΣ/**', kept: ['asset1.png'], excluded: ['Κύπρος/asset2.png'] },
    ])('should exclude the same files of $pattern on import and on rescan', async ({ pattern, kept, excluded }) => {
      const { sut, ctx } = setup();
      const exclusionPattern = pattern.startsWith('/') ? `${importRoot}${pattern}` : pattern;
      const keptPaths = await Promise.all(kept.map((file) => createFile(join(importRoot, file))));
      await Promise.all(excluded.map((file) => createFile(join(importRoot, file))));
      const excludedFirst = await ctx.createLibrary({
        importPaths: [importRoot],
        exclusionPatterns: [exclusionPattern],
      });
      const excludedLater = await ctx.createLibrary({ importPaths: [importRoot] });
      await ctx.scan(excludedLater.id);
      await sut.update(excludedLater.id, { exclusionPatterns: [exclusionPattern] });

      await ctx.scan(excludedFirst.id);
      const { refreshed } = await ctx.scan(excludedLater.id);

      await expect(ctx.getAssetPaths(excludedFirst.id)).resolves.toEqual(keptPaths.sort());
      await expect(ctx.getAssetPaths(excludedLater.id)).resolves.toEqual(keptPaths.sort());
      expect(refreshed).toEqual([]);
    });

    it.each([
      { pattern: '**/İstanbul/**', folder: 'istanbul', isExcluded: false },
      { pattern: '**/ΚΎΠΡΟΣ/**', folder: 'Κύπρος', isExcluded: true },
    ])('should apply $pattern to $folder until it is removed', async ({ pattern, folder, isExcluded }) => {
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

      await sut.update(library.id, { exclusionPatterns: [] });
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([asset]);
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

      await expect(ctx.scan(library.id)).resolves.toEqual({
        jobs: [],
        events: [],
        failed: [],
        imports: [],
        changed: [],
        refreshed: [],
      });
    });

    it.each([
      { name: 'the walk runs', before: ['b', 'c', 'd'], after: ['a', 'b'], imports: ['a'], changed: ['c', 'd'] },
      { name: 'the assets run', before: ['a'], after: ['b', 'c'], imports: ['b', 'c'], changed: ['a'] },
    ])('should import and check every file when $name out first', async ({ before, after, ...expected }) => {
      const { ctx } = setup();
      const toPath = (name: string) => join(importPath, `${name}.png`);
      await Promise.all(before.map((name) => createFile(toPath(name))));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const assets = await Promise.all(before.map((name) => ctx.getAsset(toPath(name))));
      await rm(importPath, { recursive: true });
      await Promise.all(after.map((name) => createFile(toPath(name))));

      const { imports, changed } = await ctx.scan(library.id);

      expect({ imports, changed }).toEqual({
        imports: expected.imports.map((name) => toPath(name)),
        changed: expected.changed.map((name) => assets[before.indexOf(name)].id),
      });
    });

    it('should not check an unchanged asset whose file has a sub-millisecond modification time', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      await utimes(assetPath, 1_700_000_000.0006, 1_700_000_000.0006);
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      const { imports, changed } = await ctx.scan(library.id);

      expect({ imports, changed }).toEqual({ imports: [], changed: [] });
    });

    it('should import, refresh and offline new, modified and deleted files in one scan', async () => {
      const { ctx } = setup();
      const kept = await createFile(join(importPath, 'kept.png'));
      const modified = await createFile(join(importPath, 'modified.png'));
      const deleted = await createFile(join(importPath, 'deleted.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const modifiedAsset = await ctx.getAsset(modified);
      const deletedAsset = await ctx.getAsset(deleted);

      const added = await createFile(join(importPath, 'added.png'));
      await utimes(modified, new Date(1_800_000_000_000), new Date(1_800_000_000_000));
      await rm(deleted);
      const { jobs, imports, changed } = await ctx.scan(library.id);

      expect(imports).toEqual([added]);
      expect(changed).toEqual([deletedAsset.id, modifiedAsset.id]);
      const addedAsset = await ctx.getAsset(added);
      expect(jobs).toEqual([
        { name: JobName.SidecarCheck, data: { id: modifiedAsset.id, source: 'upload' } },
        { name: JobName.SidecarCheck, data: { id: addedAsset.id, source: 'upload' } },
      ]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([added, kept, modified]);
      await expect(ctx.getAsset(deleted)).resolves.toEqual(expect.objectContaining({ isOffline: true }));
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

    it('should import a file with a backslash in its name', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, String.raw`back\slash.png`));
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
    });

    it('should import names that sort differently in UTF-8 and UTF-16 once', async () => {
      const { ctx } = setup();
      const astral = await createFile(join(importPath, '\u{1F4F7}.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const fullwidth = await createFile(join(importPath, '\u{FF5E}.png'));

      const added = await ctx.scan(library.id);
      const rescan = await ctx.scan(library.id);

      expect([added.imports, added.changed, rescan.imports, rescan.changed]).toEqual([[fullwidth], [], [], []]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([astral, fullwidth]);
    });

    it('should import each asset once when import paths overlap', async () => {
      const { ctx } = setup();
      const outer = await createFile(join(importRoot, 'outer.png'));
      const inner = await createFile(join(importPath, 'inner.png'));
      const library = await ctx.createLibrary({ importPaths: [importRoot, importPath] });

      await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([inner, outer]);
    });

    it('should import a file beside a folder of the same name once', async () => {
      const { ctx } = setup();
      const assetPaths = await Promise.all(
        ['a.jpg', 'a/b.jpg', 'a-b.jpg', 'a/b/c.jpg', 'a0.jpg'].map((file) => createFile(join(importPath, file))),
      );
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);

      const { imports, changed } = await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual(assetPaths.toSorted());
      expect({ imports, changed }).toEqual({ imports: [], changed: [] });
    });

    it('should import the files of nested import paths once', async () => {
      const { ctx } = setup();
      const hiddenPath = join(importRoot, '.hidden');
      const outer = await createFile(join(importRoot, 'outer.png'));
      const inner = await createFile(join(importPath, 'inner.png'));
      const hidden = await createFile(join(hiddenPath, 'hidden.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath, importRoot, hiddenPath] });
      await ctx.scan(library.id);

      const { imports, changed } = await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([hidden, inner, outer]);
      expect({ imports, changed }).toEqual({ imports: [], changed: [] });
    });

    it('should import through an import path with a trailing slash', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [`${importPath}/`] });
      await ctx.scan(library.id);

      const { imports, changed } = await ctx.scan(library.id);

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([assetPath]);
      expect({ imports, changed }).toEqual({ imports: [], changed: [] });
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

    it.skipIf(process.getuid?.() === 0)('should keep scanning past a folder that cannot be read', async () => {
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

    it('should leave an asset that is not external alone', async () => {
      const { ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: join(outsidePath, 'asset.png'),
        isExternal: false,
      });

      const { changed } = await ctx.scan(library.id);

      expect(changed).toEqual([]);
      await expect(ctx.getAsset(asset.originalPath)).resolves.toEqual(expect.objectContaining({ isOffline: false }));
    });

    it('should leave an offline asset that is being deleted alone', async () => {
      const { ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: join(outsidePath, 'asset.png'),
        isExternal: true,
        isOffline: true,
        status: AssetStatus.Deleted,
      });

      const { changed } = await ctx.scan(library.id);

      expect(changed).toEqual([]);
      await expect(ctx.getAsset(asset.originalPath)).resolves.toEqual(expect.objectContaining({ isOffline: true }));
    });

    it('should offline an asset whose extension is not supported', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.xyz'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      const { asset } = await ctx.newAsset({
        ownerId: library.ownerId,
        libraryId: library.id,
        originalPath: assetPath,
        isExternal: true,
        fileModifiedAt,
      });

      const { changed } = await ctx.scan(library.id);

      expect(changed).toEqual([asset.id]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([]);
    });

    it('should offline an asset in a hidden folder once its import path is removed', async () => {
      const { sut, ctx } = setup();
      const hiddenPath = join(importPath, '.hidden');
      const kept = await createFile(join(importPath, 'kept.png'));
      const hidden = await createFile(join(hiddenPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath, hiddenPath] });
      await ctx.scan(library.id);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([hidden, kept]);
      await sut.update(library.id, { importPaths: [importPath] });

      const offlining = await ctx.scan(library.id);
      const rescan = await ctx.scan(library.id);

      expect([offlining.refreshed, rescan.changed]).toEqual([[], []]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([kept]);
    });

    it('should offline an asset under an import path that only shares a prefix with a kept one', async () => {
      const { sut, ctx } = setup();
      const lib = join(importRoot, 'lib');
      const library = join(importRoot, 'library');
      const kept = await createFile(join(lib, 'kept.png'));
      await createFile(join(library, 'removed.png'));
      const { id } = await ctx.createLibrary({ importPaths: [lib, library] });
      await ctx.scan(id);
      await sut.update(id, { importPaths: [lib] });

      const { refreshed } = await ctx.scan(id);

      expect(refreshed).toEqual([]);
      await expect(ctx.getAssetPaths(id)).resolves.toEqual([kept]);
    });

    it('should offline assets when no import path is valid', async () => {
      const { ctx } = setup();
      const assetPath = await createFile(join(importPath, 'asset.png'));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.scan(library.id);
      const { id } = await ctx.getAsset(assetPath);
      await rm(importPath, { recursive: true });

      const { changed } = await ctx.scan(library.id);

      expect(changed).toEqual([id]);
      await expect(ctx.getAsset(assetPath)).resolves.toEqual(expect.objectContaining({ isOffline: true }));
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
      const offlining = await ctx.scan(library.id);
      const rescan = await ctx.scan(library.id);
      expect([offlining.refreshed, rescan.changed]).toEqual([[], []]);
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

    it('should queue only the files a scan would import', { timeout: 30_000 }, async () => {
      const { sut, ctx } = setup();
      await mkdir(importRoot, { recursive: true });
      await ctx.createLibrary({ importPaths: [importRoot], exclusionPatterns: ['**/excluded/**'] });
      ctx.getMock(DatabaseRepository).tryLock.mockResolvedValue(true);

      try {
        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
        await createFile(join(excludedPath, 'asset.png'));
        await createFile(join(importRoot, '.hidden/asset.png'));
        await createFile(join(importRoot, 'asset.xyz'));
        const nested = await createFile(join(importRoot, 'nested/2020/asset.png'));

        const queuedPaths = () =>
          ctx.getQueued().flatMap((job) => (job.name === JobName.LibrarySyncFiles ? job.data.paths : []));
        await vitest.waitFor(() => expect(queuedPaths()).toContain(nested), { timeout: 20_000, interval: 100 });

        expect(queuedPaths()).toEqual([nested]);
      } finally {
        await sut.onShutdown();
      }
    });

    it('should watch other libraries when one has an invalid pattern', { timeout: 30_000 }, async () => {
      const { sut, ctx } = setup();
      const invalidPath = join(importRoot, 'invalid');
      await mkdir(invalidPath, { recursive: true });
      await mkdir(importPath, { recursive: true });
      const invalid = await ctx.createLibrary({ importPaths: [invalidPath], exclusionPatterns: ['**/\\'] });
      await ctx.createLibrary({ importPaths: [importPath] });
      ctx.getMock(DatabaseRepository).tryLock.mockResolvedValue(true);

      try {
        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
        const asset = await createFile(join(importPath, 'asset.png'));

        const queuedPaths = () =>
          ctx.getQueued().flatMap((job) => (job.name === JobName.LibrarySyncFiles ? job.data.paths : []));
        await vitest.waitFor(() => expect(queuedPaths()).toContain(asset), { timeout: 20_000, interval: 100 });

        expect(ctx.getMock(LoggingRepository).error).toHaveBeenCalledWith(
          expect.stringContaining(`Unable to watch library ${invalid.id}`),
          expect.anything(),
        );
      } finally {
        await sut.onShutdown();
      }
    });
  });

  describe('handleQueueSyncFiles', () => {
    it('should not queue anything for an empty library and an empty folder', async () => {
      const { sut, ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.Success);

      expect(ctx.getQueued()).toEqual([]);
    });

    it('should queue imports in batches of 10000', async () => {
      const { sut, ctx } = setup();
      const paths = await createFilesAcrossBatches(importPath);
      const library = await ctx.createLibrary({ importPaths: [importPath] });

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(ctx.getQueued()).toEqual([
        {
          name: JobName.LibrarySyncFiles,
          data: { libraryId: library.id, paths: paths.slice(0, 10_000) },
        },
        {
          name: JobName.LibrarySyncFiles,
          data: { libraryId: library.id, paths: [paths[10_000]] },
        },
      ]);
    });

    it('should offline missing assets spanning several batches', async () => {
      const { sut, ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      const missing = Array.from({ length: 10_001 }, (_, index) => join(importPath, `${index}.jpg`));
      await ctx.createAssets(library, missing);

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(ctx.getQueued()).toEqual([]);
      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([]);
    });

    it('should fail when the library has a path twice', async () => {
      const { sut, ctx } = setup();
      await mkdir(importPath, { recursive: true });
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      const duplicate = join(importPath, 'asset.png');
      await ctx.createAssets(library, [duplicate, duplicate]);

      await expect(sut.handleQueueSyncFiles({ id: library.id })).rejects.toThrow(
        `Library asset stream is not in ascending order: ${JSON.stringify(duplicate)} after ${JSON.stringify(duplicate)}`,
      );
    });

    it('should not queue anything for unchanged files spanning several batches', async () => {
      const { sut, ctx } = setup();
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await ctx.createAssets(library, await createFilesAcrossBatches(importPath));

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(ctx.getQueued()).toEqual([]);
    });
  });

  describe('handleSyncFiles', () => {
    it('should import the rest of a queued batch when one of its files was imported first', async () => {
      const { sut, ctx } = setup();
      const [first, second] = await Promise.all(['a.png', 'b.png'].map((file) => createFile(join(importPath, file))));
      const library = await ctx.createLibrary({ importPaths: [importPath] });
      await sut.handleQueueSyncFiles({ id: library.id });
      const [queued] = ctx.getQueued();
      await sut.handleSyncFiles({ libraryId: library.id, paths: [first] });
      const jobs = ctx.getMock(JobRepository);
      const emit = ctx.getMock(EventRepository).emit;
      jobs.queueAll.mockClear();
      emit.mockClear();

      await expect(sut.handleSyncFiles(queued.data as JobOf<JobName.LibrarySyncFiles>)).resolves.toBe(
        JobStatus.Success,
      );

      await expect(ctx.getAssetPaths(library.id)).resolves.toEqual([first, second]);
      const { id } = await ctx.getAsset(second);
      expect(jobs.queueAll.mock.calls).toEqual([[[{ name: JobName.SidecarCheck, data: { id, source: 'upload' } }]]]);
      expect(emit.mock.calls).toEqual([['AssetCreate', { asset: { id, ownerId: library.ownerId } }]]);
    });
  });

  describe('sidecar discovery during library scans', () => {
    it('should only associate with sidecars in the same directory across import paths', async () => {
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

      await ctx.scan(library.id);

      await expect(ctx.getSidecarPaths(library.id)).resolves.toEqual(
        expected.toSorted((a, b) => a.originalPath.localeCompare(b.originalPath)),
      );
    });
  });
});
