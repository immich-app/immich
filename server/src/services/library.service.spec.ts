import { BadRequestException } from '@nestjs/common';
import { Stats } from 'node:fs';
import { vitest } from 'vitest';
import { SystemConfig, defaults } from 'src/dtos/config.dto.js';
import { mapLibrary } from 'src/dtos/library.dto.js';
import { AssetStatus, CronJob, ImmichWorker, JobName, JobStatus, LibraryChange } from 'src/enum.js';
import type { LibraryScanAsset } from 'src/repositories/asset.repository.js';
import type { WalkedFiles } from 'src/repositories/storage.repository.js';
import { Resource } from 'src/resource-paths.js';
import { LibraryService, diffLibrary } from 'src/services/library.service.js';
import type { ILibraryFileJob } from 'src/types.js';
import { AssetFactory } from 'test/factories/asset.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { systemConfigStub } from 'test/fixtures/system-config.stub.js';
import { makeMockWatcher } from 'test/repositories/storage.repository.mock.js';
import { mockAdmins } from 'test/repositories/user.repository.mock.js';
import { factory } from 'test/small.factory.js';
import { ServiceMocks, expectResourceEvents, makeStream, newTestService } from 'test/utils.js';

const newScanAsset = (originalPath: string, dto: Partial<LibraryScanAsset> = {}): LibraryScanAsset => ({
  id: originalPath,
  originalPath,
  isOffline: false,
  status: AssetStatus.Active,
  fileModifiedAt: new Date(1),
  ...dto,
});

const diff = (files: WalkedFiles[], assets: LibraryScanAsset[][]) =>
  Array.fromAsync(diffLibrary(makeStream(files), makeStream(assets)));

describe(diffLibrary.name, () => {
  it('should classify files and assets', async () => {
    const files = [{ files: ['/a', '/b', '/c', '/d', '/f'], modified: [1, 2, 1, 1, 1] }];
    const assets = [
      [
        newScanAsset('/b'),
        newScanAsset('/c'),
        newScanAsset('/d', { isOffline: true }),
        newScanAsset('/e'),
        newScanAsset('/f', { isOffline: true, status: AssetStatus.Deleted }),
        newScanAsset('/g', { isOffline: true }),
      ],
    ];

    await expect(diff(files, assets)).resolves.toEqual([
      [LibraryChange.Import, ['/a']],
      [LibraryChange.Offline, ['/e']],
      [LibraryChange.Online, ['/d']],
      [LibraryChange.Refresh, ['/b']],
    ]);
  });

  it('should merge batches that end at different paths', async () => {
    const files = [
      { files: ['/a', '/b'], modified: [1, 1] },
      { files: ['/c', '/e'], modified: [1, 1] },
    ];
    const assets = [
      [newScanAsset('/a')],
      [newScanAsset('/b'), newScanAsset('/c'), newScanAsset('/d')],
      [newScanAsset('/f')],
    ];

    await expect(diff(files, assets)).resolves.toEqual([
      [LibraryChange.Import, ['/e']],
      [LibraryChange.Offline, ['/d', '/f']],
    ]);
  });

  it.each([
    { name: 'files', files: [{ files: ['/b', '/a'], modified: [1, 1] }], assets: [] },
    { name: 'assets', files: [], assets: [[newScanAsset('/b')], [newScanAsset('/b')]] },
  ])('should fail when the $name are not in ascending order', async ({ files, assets }) => {
    await expect(diff(files, assets)).rejects.toThrow('is not in ascending order');
  });
});

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(LibraryService));

    mocks.database.tryLock.mockResolvedValue(true);
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.user.getAdminIds.mockResolvedValue([]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigInit', () => {
    it('should init cron job and handle config changes', async () => {
      mocks.cron.create.mockResolvedValue();
      mocks.cron.update.mockResolvedValue();

      await sut.onConfigInit({ newConfig: defaults });

      expect(mocks.cron.create).toHaveBeenCalled();

      await sut.onConfigUpdate({
        oldConfig: defaults,
        newConfig: {
          library: {
            scan: {
              enabled: true,
              cronExpression: '0 1 * * *',
            },
            watch: { enabled: false },
          },
        } as SystemConfig,
      });

      expect(mocks.cron.update).toHaveBeenCalledWith({
        name: CronJob.LibraryScan,
        expression: '0 1 * * *',
        start: true,
      });
    });

    it('should initialize watcher for all external libraries', async () => {
      const library1 = factory.library({ importPaths: ['/foo', '/bar'] });
      const library2 = factory.library({ importPaths: ['/xyz', '/asdf'] });

      mocks.library.getAll.mockResolvedValue([library1, library2]);

      mocks.library.get.mockImplementation((id) =>
        Promise.resolve([library1, library2].find((library) => library.id === id)),
      );
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });

      expect(mocks.storage.watch.mock.calls).toEqual(
        expect.arrayContaining([(library1.importPaths, expect.anything()), (library2.importPaths, expect.anything())]),
      );
    });

    it('should not initialize watcher when watching is disabled', async () => {
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchDisabled as SystemConfig });

      expect(mocks.storage.watch).not.toHaveBeenCalled();
    });

    it('should not initialize watcher when lock is taken', async () => {
      mocks.database.tryLock.mockResolvedValue(false);

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });

      expect(mocks.storage.watch).not.toHaveBeenCalled();
    });

    it('should not initialize library scan cron job when lock is taken', async () => {
      mocks.database.tryLock.mockResolvedValue(false);

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });

      expect(mocks.cron.create).not.toHaveBeenCalled();
    });
  });

  describe('onConfigUpdateEvent', () => {
    beforeEach(async () => {
      mocks.database.tryLock.mockResolvedValue(true);
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: defaults });
    });

    it('should do nothing if instance does not have the watch lock', async () => {
      mocks.database.tryLock.mockResolvedValue(false);
      await sut.onConfigInit({ newConfig: defaults });
      await sut.onConfigUpdate({ newConfig: systemConfigStub.libraryScan as SystemConfig, oldConfig: defaults });
      expect(mocks.cron.update).not.toHaveBeenCalled();
    });

    it('should update cron job and enable watching', async () => {
      mocks.library.getAll.mockResolvedValue([]);
      mocks.cron.create.mockResolvedValue();
      mocks.cron.update.mockResolvedValue();

      await sut.onConfigUpdate({
        newConfig: systemConfigStub.libraryScanAndWatch as SystemConfig,
        oldConfig: defaults,
      });

      expect(mocks.cron.update).toHaveBeenCalledWith({
        name: CronJob.LibraryScan,
        expression: systemConfigStub.libraryScan.library.scan.cronExpression,
        start: systemConfigStub.libraryScan.library.scan.enabled,
      });
    });

    it('should update cron job and disable watching', async () => {
      mocks.library.getAll.mockResolvedValue([]);
      mocks.cron.create.mockResolvedValue();
      mocks.cron.update.mockResolvedValue();

      await sut.onConfigUpdate({
        newConfig: systemConfigStub.libraryScanAndWatch as SystemConfig,
        oldConfig: defaults,
      });
      await sut.onConfigUpdate({
        newConfig: systemConfigStub.libraryScan as SystemConfig,
        oldConfig: defaults,
      });

      expect(mocks.cron.update).toHaveBeenCalledWith({
        name: CronJob.LibraryScan,
        expression: systemConfigStub.libraryScan.library.scan.cronExpression,
        start: systemConfigStub.libraryScan.library.scan.enabled,
      });
    });
  });

  describe('handleQueueSyncFiles', () => {
    it("should fail when library can't be found", async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.Skipped);
    });
  });
  describe('handleSyncFiles', () => {
    it('should not import an asset to a soft deleted library', async () => {
      const library = factory.library({ deletedAt: new Date() });

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: library.id,
        paths: ['/data/user1/photo.jpg'],
      };

      mocks.library.get.mockResolvedValue(library);

      await expect(sut.handleSyncFiles(mockLibraryJob)).resolves.toBe(JobStatus.Failed);

      expect(mocks.asset.createAll.mock.calls).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a library', async () => {
      const library = factory.library();

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(AssetFactory.create());
      mocks.library.get.mockResolvedValue(library);

      await sut.delete(library.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.LibraryDelete, data: { id: library.id } });
      expect(mocks.library.softDelete).toHaveBeenCalledWith(library.id);
      expect(mocks.event.emit).toHaveBeenCalledWith('LibraryDelete');
    });

    it('should tell every admin', async () => {
      const adminIds = mockAdmins(mocks.user);
      const library = factory.library();
      mocks.library.get.mockResolvedValue(library);

      await sut.delete(library.id);

      expectResourceEvents(mocks, { userIds: adminIds, deleted: [Resource.library(library)] });
    });

    it('should allow an external library to be deleted', async () => {
      const library = factory.library();

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(AssetFactory.create());
      mocks.library.get.mockResolvedValue(library);

      await sut.delete(library.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LibraryDelete,
        data: { id: library.id },
      });

      expect(mocks.library.softDelete).toHaveBeenCalledWith(library.id);
    });

    it('should unwatch an external library when deleted', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(AssetFactory.create());
      mocks.library.get.mockResolvedValue(library);
      mocks.library.getAll.mockResolvedValue([library]);

      const mockClose = vitest.fn();
      mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      await sut.delete(library.id);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return a library', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);

      await expect(sut.get(library.id)).resolves.toEqual(
        expect.objectContaining({
          id: library.id,
          name: library.name,
          ownerId: library.ownerId,
        }),
      );

      expect(mocks.library.get).toHaveBeenCalledWith(library.id);
    });

    it('should throw an error when a library is not found', async () => {
      const library = factory.library();

      await expect(sut.get(library.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.library.get).toHaveBeenCalledWith(library.id);
    });
  });

  describe('getStatistics', () => {
    it('should return library statistics', async () => {
      const library = factory.library();

      mocks.library.getStatistics.mockResolvedValue({ photos: 10, videos: 0, total: 10, usage: 1337 });
      await expect(sut.getStatistics(library.id)).resolves.toEqual({
        photos: 10,
        videos: 0,
        total: 10,
        usage: 1337,
      });

      expect(mocks.library.getStatistics).toHaveBeenCalledWith(library.id);
    });
  });

  describe('create', () => {
    it('should tell every admin', async () => {
      const adminIds = mockAdmins(mocks.user);
      mocks.library.create.mockResolvedValue(factory.library());

      await sut.create({ ownerId: authStub.admin.user.id });

      expectResourceEvents(mocks, { userIds: adminIds, changed: [Resource.libraries()] });
    });

    describe('external library', () => {
      it('should create with default settings', async () => {
        const library = factory.library();

        mocks.library.create.mockResolvedValue(library);
        await expect(sut.create({ ownerId: authStub.admin.user.id })).resolves.toEqual(
          expect.objectContaining({
            id: library.id,
            name: library.name,
            ownerId: library.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: library.createdAt,
            updatedAt: library.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(mocks.library.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            importPaths: [],
            exclusionPatterns: expect.any(Array),
          }),
        );
        expect(mocks.event.emit).toHaveBeenCalledWith('LibraryCreate');
      });

      it('should create with name', async () => {
        const library = factory.library();

        mocks.library.create.mockResolvedValue(library);

        await expect(sut.create({ ownerId: authStub.admin.user.id, name: 'My Awesome Library' })).resolves.toEqual(
          expect.objectContaining({
            id: library.id,
            name: library.name,
            ownerId: library.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: library.createdAt,
            updatedAt: library.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(mocks.library.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Awesome Library',
            importPaths: [],
            exclusionPatterns: expect.any(Array),
          }),
        );
      });

      it('should create with import paths', async () => {
        const library = factory.library();

        mocks.library.create.mockResolvedValue(library);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            importPaths: ['/data/images', '/data/videos'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: library.id,
            name: library.name,
            ownerId: library.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: library.createdAt,
            updatedAt: library.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(mocks.library.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            importPaths: ['/data/images', '/data/videos'],
            exclusionPatterns: expect.any(Array),
          }),
        );
      });

      it('should create watched with import paths', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.create.mockResolvedValue(library);
        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([]);
        mocks.cron.create.mockResolvedValue();

        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
        await sut.create({ ownerId: authStub.admin.user.id, importPaths: library.importPaths });
      });

      it('should create with exclusion patterns', async () => {
        const library = factory.library();

        mocks.library.create.mockResolvedValue(library);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: library.id,
            name: library.name,
            ownerId: library.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: library.createdAt,
            updatedAt: library.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(mocks.library.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            importPaths: [],
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        );
      });
    });
  });

  describe('getAll', () => {
    it('should get all libraries', async () => {
      const library = factory.library();

      mocks.library.getAll.mockResolvedValue([library]);

      await expect(sut.getAll()).resolves.toEqual([expect.objectContaining({ id: library.id })]);
    });
  });

  describe('handleQueueCleanup', () => {
    it('should queue cleanup jobs', async () => {
      const library1 = factory.library({ deletedAt: new Date() });
      const library2 = factory.library({ deletedAt: new Date() });

      mocks.library.getAllDeleted.mockResolvedValue([library1, library2]);
      await expect(sut.handleQueueCleanup()).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.LibraryDelete, data: { id: library1.id } },
        { name: JobName.LibraryDelete, data: { id: library2.id } },
      ]);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      mocks.library.getAll.mockResolvedValue([]);
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
    });

    it('should throw an error if an import path is invalid', async () => {
      const library = factory.library();

      mocks.library.update.mockResolvedValue(library);
      mocks.library.get.mockResolvedValue(library);

      await expect(sut.update('library-id', { importPaths: ['foo/bar'] })).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.library.update).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should update library', async () => {
      const library = factory.library();

      mocks.library.update.mockResolvedValue(library);
      mocks.library.get.mockResolvedValue(library);
      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      const cwd = process.cwd();

      await expect(sut.update('library-id', { importPaths: [`${cwd}/foo/bar`] })).resolves.toEqual(mapLibrary(library));
      expect(mocks.library.update).toHaveBeenCalledWith(
        'library-id',
        expect.objectContaining({ importPaths: [`${cwd}/foo/bar`] }),
      );
      expect(mocks.event.emit).toHaveBeenCalledWith('LibraryUpdate');
    });

    it('should tell every admin', async () => {
      const adminIds = mockAdmins(mocks.user);
      const library = factory.library();
      mocks.library.get.mockResolvedValue(library);
      mocks.library.update.mockResolvedValue(library);

      await sut.update(library.id, { name: 'New Name' });

      expectResourceEvents(mocks, { userIds: adminIds, changed: [Resource.library(library)] });
    });
  });

  describe('onShutdown', () => {
    it('should do nothing if instance does not have the watch lock', async () => {
      await sut.onShutdown();
    });
  });

  describe('watchAll', () => {
    it('should return false if instance does not have the watch lock', async () => {
      await expect(sut.watchAll()).resolves.toBe(false);
    });

    describe('watching disabled', () => {
      beforeEach(async () => {
        mocks.cron.create.mockResolvedValue();

        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchDisabled as SystemConfig });
      });

      it('should not watch library', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.getAll.mockResolvedValue([library]);

        await sut.watchAll();

        expect(mocks.storage.watch).not.toHaveBeenCalled();
      });
    });

    describe('watching enabled', () => {
      beforeEach(async () => {
        mocks.library.getAll.mockResolvedValue([]);
        mocks.cron.create.mockResolvedValue();

        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      });

      it('should watch library', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);

        await sut.watchAll();

        expect(mocks.storage.watch).toHaveBeenCalledWith(library.importPaths, expect.anything(), expect.anything());
      });

      it('should exclude paths from the watcher', async () => {
        const library = factory.library({
          importPaths: ['/foo', '/bar'],
          exclusionPatterns: ['**/excluded/**'],
        });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);

        await sut.watchAll();

        expect(mocks.storage.watch).toHaveBeenCalledWith(
          library.importPaths,
          expect.objectContaining({ ignored: library.exclusionPatterns }),
          expect.anything(),
        );
      });

      it('should watch and unwatch library', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.getAll.mockResolvedValue([library]);
        mocks.library.get.mockResolvedValue(library);
        const mockClose = vitest.fn();
        mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

        await sut.watchAll();
        await sut.unwatch(library.id);

        expect(mockClose).toHaveBeenCalled();
      });

      it('should not watch library without import paths', async () => {
        const library = factory.library();

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);

        await sut.watchAll();

        expect(mocks.storage.watch).not.toHaveBeenCalled();
      });

      it('should handle a new file event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(AssetFactory.create());
        mocks.storage.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LibrarySyncFiles,
          data: {
            libraryId: library.id,
            paths: ['/foo/photo.jpg'],
          },
        });
      });

      it('should handle a file change event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(AssetFactory.create());
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'change', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LibrarySyncFiles,
          data: {
            libraryId: library.id,
            paths: ['/foo/photo.jpg'],
          },
        });
      });

      it('should handle a file unlink event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });
        const asset = AssetFactory.create();

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(asset);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'unlink', value: asset.originalPath }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LibraryRemoveAsset,
          data: {
            libraryId: library.id,
            paths: [asset.originalPath],
          },
        });
      });

      it('should handle an error event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });
        const asset = AssetFactory.create({ libraryId: library.id, isExternal: true });

        mocks.library.get.mockResolvedValue(library);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(asset);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({
            items: [{ event: 'error', value: 'Error!' }],
          }),
        );

        await expect(sut.watchAll()).resolves.toBeUndefined();
      });

      it('should not import a file with unknown extension', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.storage.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.xyz' }] }));

        await sut.watchAll();

        expect(mocks.job.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths', async () => {
        const library = factory.library({ importPaths: ['/xyz', '/asdf'], exclusionPatterns: ['**/dir1/**'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'add', value: '/dir1/photo.txt' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths without case sensitivity', async () => {
        const library = factory.library({
          importPaths: ['/xyz', '/asdf'],
          exclusionPatterns: ['**/dir1/**'],
        });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'add', value: '/DIR1/photo.txt' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).not.toHaveBeenCalled();
      });
    });
  });

  describe('teardown', () => {
    it('should tear down all watchers', async () => {
      const library1 = factory.library({ importPaths: ['/foo', '/bar'] });
      const library2 = factory.library({ importPaths: ['/xyz', '/asdf'] });

      mocks.library.getAll.mockResolvedValue([library1, library2]);
      mocks.library.get.mockImplementation((id) =>
        Promise.resolve([library1, library2].find((library) => library.id === id)),
      );

      const mockClose = vitest.fn();
      mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));
      mocks.cron.create.mockResolvedValue();

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      await sut.onShutdown();

      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDeleteLibrary', () => {
    it('should delete an empty library', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);
      mocks.library.streamAssetIds.mockReturnValue(makeStream([]));

      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.library.delete).toHaveBeenCalled();
    });

    it('should delete all assets in a library', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);
      mocks.library.streamAssetIds.mockReturnValue(makeStream([AssetFactory.create()]));

      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.Success);
    });
  });

  describe('queueScan', () => {
    it('should queue a library scan', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);

      await sut.queueScan(library.id);

      expect(mocks.job.queue.mock.calls).toEqual([
        [{ name: JobName.LibrarySyncFilesQueueAll, data: { id: library.id } }],
      ]);
    });
  });

  describe('handleQueueAllScan', () => {
    it('should queue the refresh job', async () => {
      const library = factory.library();

      mocks.library.getAll.mockResolvedValue([library]);

      await expect(sut.handleQueueScanAll()).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LibraryDeleteCheck,
        data: {},
      });
      expect(mocks.job.queueAll.mock.calls).toEqual([
        [[{ name: JobName.LibrarySyncFilesQueueAll, data: { id: library.id } }]],
      ]);
    });
  });

  describe('validate', () => {
    it('should not require import paths', async () => {
      await expect(sut.validate('library-id', {})).resolves.toEqual({ importPaths: [] });
    });

    it('should validate directory', async () => {
      mocks.storage.stat.mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      mocks.storage.checkFileExists.mockResolvedValue(true);

      await expect(sut.validate('library-id', { importPaths: ['/external/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/external/user1/',
            isValid: true,
            message: undefined,
          },
        ],
      });
    });

    it('should detect when path does not exist', async () => {
      mocks.storage.stat.mockImplementation(() => {
        const error = { code: 'ENOENT' } as any;
        throw error;
      });

      await expect(sut.validate('library-id', { importPaths: ['/external/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/external/user1/',
            isValid: false,
            message: 'Path does not exist (ENOENT)',
          },
        ],
      });
    });

    it('should detect when path is not a directory', async () => {
      mocks.storage.stat.mockResolvedValue({
        isDirectory: () => false,
      } as Stats);

      await expect(sut.validate('library-id', { importPaths: ['/external/user1/file'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/external/user1/file',
            isValid: false,
            message: 'Not a directory',
          },
        ],
      });
    });

    it('should return an unknown exception from stat', async () => {
      mocks.storage.stat.mockImplementation(() => {
        throw new Error('Unknown error');
      });

      await expect(sut.validate('library-id', { importPaths: ['/external/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/external/user1/',
            isValid: false,
            message: 'Error: Unknown error',
          },
        ],
      });
    });

    it('should detect when access rights are missing', async () => {
      mocks.storage.stat.mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      mocks.storage.checkFileExists.mockResolvedValue(false);

      await expect(sut.validate('library-id', { importPaths: ['/external/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/external/user1/',
            isValid: false,
            message: 'Lacking read permission for folder',
          },
        ],
      });
    });

    it('should detect when import path is not absolute', async () => {
      const cwd = process.cwd();

      await expect(sut.validate('library-id', { importPaths: ['relative/path'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: 'relative/path',
            isValid: false,
            message: `Import path must be absolute, try ${cwd}/relative/path`,
          },
        ],
      });
    });

    it('should detect when import path is in immich media folder', async () => {
      const importPaths = ['/data/thumbs', `${process.cwd()}/xyz`, '/data/library'];
      const library = factory.library({ importPaths });

      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);

      mocks.storage.checkFileExists.mockImplementation((importPath) => Promise.resolve(importPath === importPaths[1]));

      await expect(sut.validate(library.id, { importPaths })).resolves.toEqual({
        importPaths: [
          {
            importPath: importPaths[0],
            isValid: false,
            message: 'Cannot use media upload folder for external libraries',
          },
          {
            importPath: importPaths[1],
            isValid: true,
          },
          {
            importPath: importPaths[2],
            isValid: false,
            message: 'Cannot use media upload folder for external libraries',
          },
        ],
      });
    });
  });
});
