import { BadRequestException } from '@nestjs/common';
import { Stats } from 'node:fs';
import { defaults, SystemConfig } from 'src/config';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { mapLibrary } from 'src/dtos/library.dto';
import { AssetType, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { LibraryService } from 'src/services/library.service';
import { ILibraryBulkIdsJob, ILibraryFileJob } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeMockWatcher } from 'test/repositories/storage.repository.mock';
import { factory, newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { vitest } from 'vitest';

async function* mockWalk() {
  yield await Promise.resolve(['/data/user1/photo.jpg']);
}

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(LibraryService, {}));

    mocks.database.tryLock.mockResolvedValue(true);
    mocks.config.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
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

      expect(mocks.cron.update).toHaveBeenCalledWith({ name: 'libraryScan', expression: '0 1 * * *', start: true });
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
        name: 'libraryScan',
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
        name: 'libraryScan',
        expression: systemConfigStub.libraryScan.library.scan.cronExpression,
        start: systemConfigStub.libraryScan.library.scan.enabled,
      });
    });
  });

  describe('handleQueueSyncFiles', () => {
    it('should queue refresh of a new asset', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.library.get.mockResolvedValue(library);
      mocks.storage.walk.mockImplementation(mockWalk);
      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      mocks.storage.checkFileExists.mockResolvedValue(true);
      mocks.asset.filterNewExternalAssetPaths.mockResolvedValue(['/data/user1/photo.jpg']);

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_SYNC_FILES,
        data: {
          libraryId: library.id,
          paths: ['/data/user1/photo.jpg'],
          progressCounter: 1,
        },
      });
    });

    it('should fail when library is not found', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should ignore import paths that do not exist', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });
      mocks.storage.stat.mockImplementation((path): Promise<Stats> => {
        if (path === library.importPaths[0]) {
          const error = { code: 'ENOENT' } as any;
          throw error;
        }
        return Promise.resolve({
          isDirectory: () => true,
        } as Stats);
      });

      mocks.storage.checkFileExists.mockResolvedValue(true);

      mocks.library.get.mockResolvedValue(library);

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(mocks.storage.walk).toHaveBeenCalledWith({
        pathsToCrawl: [library.importPaths[1]],
        exclusionPatterns: [],
        includeHidden: false,
        take: JOBS_LIBRARY_PAGINATION_SIZE,
      });
    });
  });

  describe('handleQueueSyncFiles', () => {
    it('should queue refresh of a new asset', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.library.get.mockResolvedValue(library);
      mocks.storage.walk.mockImplementation(mockWalk);
      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      mocks.storage.checkFileExists.mockResolvedValue(true);
      mocks.asset.filterNewExternalAssetPaths.mockResolvedValue(['/data/user1/photo.jpg']);

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_SYNC_FILES,
        data: {
          libraryId: library.id,
          paths: ['/data/user1/photo.jpg'],
          progressCounter: 1,
        },
      });
    });

    it("should fail when library can't be found", async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      await expect(sut.handleQueueSyncFiles({ id: library.id })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should ignore import paths that do not exist', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.storage.stat.mockImplementation((path): Promise<Stats> => {
        if (path === library.importPaths[0]) {
          const error = { code: 'ENOENT' } as any;
          throw error;
        }
        return Promise.resolve({
          isDirectory: () => true,
        } as Stats);
      });

      mocks.storage.checkFileExists.mockResolvedValue(true);

      mocks.library.get.mockResolvedValue(library);

      await sut.handleQueueSyncFiles({ id: library.id });

      expect(mocks.storage.walk).toHaveBeenCalledWith({
        pathsToCrawl: [library.importPaths[1]],
        exclusionPatterns: [],
        includeHidden: false,
        take: JOBS_LIBRARY_PAGINATION_SIZE,
      });
    });
  });

  describe('handleQueueSyncAssets', () => {
    it('should call the offline check', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);
      mocks.storage.walk.mockImplementation(async function* generator() {});
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.external], hasNextPage: false });
      mocks.asset.getLibraryAssetCount.mockResolvedValue(1);
      mocks.asset.detectOfflineExternalAssets.mockResolvedValue({ numUpdatedRows: BigInt(1) });

      const response = await sut.handleQueueSyncAssets({ id: library.id });

      expect(response).toBe(JobStatus.SUCCESS);
      expect(mocks.asset.detectOfflineExternalAssets).toHaveBeenCalledWith(
        library.id,
        library.importPaths,
        library.exclusionPatterns,
      );
    });

    it('should skip an empty library', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);
      mocks.storage.walk.mockImplementation(async function* generator() {});
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.external], hasNextPage: false });
      mocks.asset.getLibraryAssetCount.mockResolvedValue(0);
      mocks.asset.detectOfflineExternalAssets.mockResolvedValue({ numUpdatedRows: BigInt(1) });

      const response = await sut.handleQueueSyncAssets({ id: library.id });

      expect(response).toBe(JobStatus.SUCCESS);
      expect(mocks.asset.detectOfflineExternalAssets).not.toHaveBeenCalled();
    });

    it('should queue asset sync', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.library.get.mockResolvedValue(library);
      mocks.storage.walk.mockImplementation(async function* generator() {});
      mocks.library.streamAssetIds.mockReturnValue(makeStream([assetStub.external]));
      mocks.asset.getLibraryAssetCount.mockResolvedValue(1);
      mocks.asset.detectOfflineExternalAssets.mockResolvedValue({ numUpdatedRows: BigInt(0) });
      mocks.library.streamAssetIds.mockReturnValue(makeStream([assetStub.external]));

      const response = await sut.handleQueueSyncAssets({ id: library.id });

      expect(mocks.job.queue).toBeCalledWith({
        name: JobName.LIBRARY_SYNC_ASSETS,
        data: {
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: [assetStub.external.id],
          progressCounter: 1,
          totalAssets: 1,
        },
      });

      expect(response).toBe(JobStatus.SUCCESS);
      expect(mocks.asset.detectOfflineExternalAssets).toHaveBeenCalledWith(
        library.id,
        library.importPaths,
        library.exclusionPatterns,
      );
    });

    it("should fail if library can't be found", async () => {
      await expect(sut.handleQueueSyncAssets({ id: newUuid() })).resolves.toBe(JobStatus.SKIPPED);
    });
  });

  describe('handleSyncAssets', () => {
    it('should offline assets no longer on disk', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.external.id],
        libraryId: newUuid(),
        importPaths: ['/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.external]);
      mocks.storage.stat.mockRejectedValue(new Error('ENOENT, no such file or directory'));

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: true,
        deletedAt: expect.anything(),
      });
    });

    it('should set assets deleted from disk as offline', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.external.id],
        libraryId: newUuid(),
        importPaths: ['/data/user2'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.external]);
      mocks.storage.stat.mockRejectedValue(new Error('Could not read file'));

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: true,
        deletedAt: expect.anything(),
      });
    });

    it('should do nothing with offline assets deleted from disk', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.trashedOffline.id],
        libraryId: newUuid(),
        importPaths: ['/data/user2'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.trashedOffline]);
      mocks.storage.stat.mockRejectedValue(new Error('Could not read file'));

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should un-trash an asset previously marked as offline', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.trashedOffline.id],
        libraryId: newUuid(),
        importPaths: ['/original/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.trashedOffline]);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.external.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: false,
        deletedAt: null,
      });
    });

    it('should do nothing with offline asset if covered by exclusion pattern', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.trashedOffline.id],
        libraryId: newUuid(),
        importPaths: ['/original/'],
        exclusionPatterns: ['**/path.jpg'],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.trashedOffline]);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.external.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should do nothing with offline asset if not in import path', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.trashedOffline.id],
        libraryId: newUuid(),
        importPaths: ['/import/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.trashedOffline]);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.external.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();

      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should do nothing with unchanged online assets', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.external.id],
        libraryId: newUuid(),
        importPaths: ['/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.external]);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.external.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should not touch fileCreatedAt when un-trashing an asset previously marked as offline', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.trashedOffline.id],
        libraryId: newUuid(),
        importPaths: ['/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      mocks.asset.getByIds.mockResolvedValue([assetStub.trashedOffline]);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.trashedOffline.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(
        [assetStub.trashedOffline.id],
        expect.not.objectContaining({
          fileCreatedAt: expect.anything(),
        }),
      );
    });

    it('should update with online assets that have changed', async () => {
      const mockAssetJob: ILibraryBulkIdsJob = {
        assetIds: [assetStub.external.id],
        libraryId: newUuid(),
        importPaths: ['/'],
        exclusionPatterns: [],
        totalAssets: 1,
        progressCounter: 0,
      };

      if (assetStub.external.fileModifiedAt == null) {
        throw new Error('fileModifiedAt is null');
      }

      const mtime = new Date(assetStub.external.fileModifiedAt.getDate() + 1);

      mocks.asset.getByIds.mockResolvedValue([assetStub.external]);
      mocks.storage.stat.mockResolvedValue({ mtime } as Stats);

      await expect(sut.handleSyncAssets(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_DISCOVERY,
          data: {
            id: assetStub.external.id,
            source: 'upload',
          },
        },
      ]);
    });
  });

  describe('handleSyncFiles', () => {
    beforeEach(() => {
      mocks.storage.stat.mockResolvedValue({
        size: 100,
        mtime: new Date('2023-01-01'),
        ctime: new Date('2023-01-01'),
      } as Stats);
    });

    it('should import a new asset', async () => {
      const library = factory.library();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: library.id,
        paths: ['/data/user1/photo.jpg'],
      };

      mocks.asset.createAll.mockResolvedValue([assetStub.image]);
      mocks.library.get.mockResolvedValue(library);

      await expect(sut.handleSyncFiles(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.createAll).toHaveBeenCalledWith([
        expect.objectContaining({
          ownerId: library.ownerId,
          libraryId: library.id,
          originalPath: '/data/user1/photo.jpg',
          deviceId: 'Library Import',
          type: AssetType.IMAGE,
          originalFileName: 'photo.jpg',
          isExternal: true,
        }),
      ]);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.SIDECAR_DISCOVERY,
          data: {
            id: assetStub.image.id,
            source: 'upload',
          },
        },
      ]);
    });

    it('should not import an asset to a soft deleted library', async () => {
      const library = factory.library({ deletedAt: new Date() });

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: library.id,
        paths: ['/data/user1/photo.jpg'],
      };

      mocks.library.get.mockResolvedValue(library);

      await expect(sut.handleSyncFiles(mockLibraryJob)).resolves.toBe(JobStatus.FAILED);

      expect(mocks.asset.createAll.mock.calls).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a library', async () => {
      const library = factory.library();

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(library);

      await sut.delete(library.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.LIBRARY_DELETE, data: { id: library.id } });
      expect(mocks.library.softDelete).toHaveBeenCalledWith(library.id);
    });

    it('should allow an external library to be deleted', async () => {
      const library = factory.library();

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(library);

      await sut.delete(library.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: library.id },
      });

      expect(mocks.library.softDelete).toHaveBeenCalledWith(library.id);
    });

    it('should unwatch an external library when deleted', async () => {
      const library = factory.library({ importPaths: ['/foo', '/bar'] });

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
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
      await expect(sut.handleQueueCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.LIBRARY_DELETE, data: { id: library1.id } },
        { name: JobName.LIBRARY_DELETE, data: { id: library2.id } },
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
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LIBRARY_SYNC_FILES,
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
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'change', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LIBRARY_SYNC_FILES,
          data: {
            libraryId: library.id,
            paths: ['/foo/photo.jpg'],
          },
        });
      });

      it('should handle a file unlink event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.library.getAll.mockResolvedValue([library]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'unlink', value: assetStub.image.originalPath }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).toHaveBeenCalledWith({
          name: JobName.LIBRARY_ASSET_REMOVAL,
          data: {
            libraryId: library.id,
            paths: [assetStub.image.originalPath],
          },
        });
      });

      it('should handle an error event', async () => {
        const library = factory.library({ importPaths: ['/foo', '/bar'] });

        mocks.library.get.mockResolvedValue(library);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.external);
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

      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.library.delete).toHaveBeenCalled();
    });

    it('should delete all assets in a library', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);
      mocks.library.streamAssetIds.mockReturnValue(makeStream([assetStub.image1]));

      mocks.asset.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleDeleteLibrary({ id: library.id })).resolves.toBe(JobStatus.SUCCESS);
    });
  });

  describe('queueScan', () => {
    it('should queue a library scan', async () => {
      const library = factory.library();

      mocks.library.get.mockResolvedValue(library);

      await sut.queueScan(library.id);

      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_QUEUE_SYNC_FILES,
        data: { id: library.id },
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_QUEUE_SYNC_ASSETS,
        data: { id: library.id },
      });
    });
  });

  describe('handleQueueAllScan', () => {
    it('should queue the refresh job', async () => {
      const library = factory.library();

      mocks.library.getAll.mockResolvedValue([library]);

      await expect(sut.handleQueueScanAll()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_QUEUE_CLEANUP,
        data: {},
      });
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.LIBRARY_QUEUE_SYNC_FILES, data: { id: library.id } },
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

      await expect(sut.validate('library-id', { importPaths: ['/data/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/data/user1/',
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

      await expect(sut.validate('library-id', { importPaths: ['/data/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/data/user1/',
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

      await expect(sut.validate('library-id', { importPaths: ['/data/user1/file'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/data/user1/file',
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

      await expect(sut.validate('library-id', { importPaths: ['/data/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/data/user1/',
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

      await expect(sut.validate('library-id', { importPaths: ['/data/user1/'] })).resolves.toEqual({
        importPaths: [
          {
            importPath: '/data/user1/',
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
      const importPaths = ['upload/thumbs', `${process.cwd()}/xyz`, 'upload/library'];
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
