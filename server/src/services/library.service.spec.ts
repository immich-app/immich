import { BadRequestException } from '@nestjs/common';
import { Stats } from 'node:fs';
import { defaults, SystemConfig } from 'src/config';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { mapLibrary } from 'src/dtos/library.dto';
import { UserEntity } from 'src/entities/user.entity';
import { AssetType, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { LibraryService } from 'src/services/library.service';
import { ILibraryAssetJob, ILibraryFileJob } from 'src/types';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { libraryStub } from 'test/fixtures/library.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { makeMockWatcher } from 'test/repositories/storage.repository.mock';
import { newTestService, ServiceMocks } from 'test/utils';
import { vitest } from 'vitest';

async function* mockWalk() {
  yield await Promise.resolve(['/data/user1/photo.jpg']);
}

describe(LibraryService.name, () => {
  let sut: LibraryService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(LibraryService));

    mocks.database.tryLock.mockResolvedValue(true);
    mocks.config.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigInit', () => {
    it('should init cron job and handle config changes', async () => {
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
      mocks.library.getAll.mockResolvedValue([
        libraryStub.externalLibraryWithImportPaths1,
        libraryStub.externalLibraryWithImportPaths2,
      ]);

      mocks.library.get.mockImplementation((id) =>
        Promise.resolve(
          [libraryStub.externalLibraryWithImportPaths1, libraryStub.externalLibraryWithImportPaths2].find(
            (library) => library.id === id,
          ),
        ),
      );

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });

      expect(mocks.storage.watch.mock.calls).toEqual(
        expect.arrayContaining([
          (libraryStub.externalLibrary1.importPaths, expect.anything()),
          (libraryStub.externalLibrary2.importPaths, expect.anything()),
        ]),
      );
    });

    it('should not initialize watcher when watching is disabled', async () => {
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
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.storage.walk.mockImplementation(mockWalk);

      await sut.handleQueueSyncFiles({ id: libraryStub.externalLibrary1.id });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SYNC_FILE,
          data: {
            id: libraryStub.externalLibrary1.id,
            ownerId: libraryStub.externalLibrary1.owner.id,
            assetPath: '/data/user1/photo.jpg',
          },
        },
      ]);
    });

    it("should fail when library can't be found", async () => {
      await expect(sut.handleQueueSyncFiles({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should ignore import paths that do not exist', async () => {
      mocks.storage.stat.mockImplementation((path): Promise<Stats> => {
        if (path === libraryStub.externalLibraryWithImportPaths1.importPaths[0]) {
          const error = { code: 'ENOENT' } as any;
          throw error;
        }
        return Promise.resolve({
          isDirectory: () => true,
        } as Stats);
      });

      mocks.storage.checkFileExists.mockResolvedValue(true);

      mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);

      await sut.handleQueueSyncFiles({ id: libraryStub.externalLibraryWithImportPaths1.id });

      expect(mocks.storage.walk).toHaveBeenCalledWith({
        pathsToCrawl: [libraryStub.externalLibraryWithImportPaths1.importPaths[1]],
        exclusionPatterns: [],
        includeHidden: false,
        take: JOBS_LIBRARY_PAGINATION_SIZE,
      });
    });
  });

  describe('handleQueueRemoveDeleted', () => {
    it('should queue online check of existing assets', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.storage.walk.mockImplementation(async function* generator() {});
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.external], hasNextPage: false });

      await sut.handleQueueSyncAssets({ id: libraryStub.externalLibrary1.id });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SYNC_ASSET,
          data: {
            id: assetStub.external.id,
            importPaths: libraryStub.externalLibrary1.importPaths,
            exclusionPatterns: [],
          },
        },
      ]);
    });

    it("should fail when library can't be found", async () => {
      await expect(sut.handleQueueSyncAssets({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SKIPPED);
    });
  });

  describe('handleSyncAsset', () => {
    it('should skip missing assets', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: [],
      };

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SKIPPED);

      expect(mocks.asset.remove).not.toHaveBeenCalled();
    });

    it('should offline assets no longer on disk', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: [],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.external);
      mocks.storage.stat.mockRejectedValue(new Error('ENOENT, no such file or directory'));

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: true,
        deletedAt: expect.any(Date),
      });
    });

    it('should offline assets matching an exclusion pattern', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: ['**/user1/**'],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.external);

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: true,
        deletedAt: expect.any(Date),
      });
    });

    it('should set assets outside of import paths as offline', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/data/user2'],
        exclusionPatterns: [],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.external);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
        isOffline: true,
        deletedAt: expect.any(Date),
      });
    });

    it('should do nothing with online assets', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: [],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.external);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.external.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).not.toHaveBeenCalled();
    });

    it('should un-trash an asset previously marked as offline', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: [],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.trashedOffline);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.trashedOffline.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.trashedOffline.id], {
        deletedAt: null,
        fileModifiedAt: assetStub.trashedOffline.fileModifiedAt,
        isOffline: false,
        originalFileName: 'path.jpg',
      });
    });

    it('should not touch fileCreatedAt when un-trashing an asset previously marked as offline', async () => {
      const mockAssetJob: ILibraryAssetJob = {
        id: assetStub.external.id,
        importPaths: ['/'],
        exclusionPatterns: [],
      };

      mocks.asset.getById.mockResolvedValue(assetStub.trashedOffline);
      mocks.storage.stat.mockResolvedValue({ mtime: assetStub.trashedOffline.fileModifiedAt } as Stats);

      await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.updateAll).toHaveBeenCalledWith(
        [assetStub.trashedOffline.id],
        expect.not.objectContaining({
          fileCreatedAt: expect.anything(),
        }),
      );
    });
  });

  it('should update file when mtime has changed', async () => {
    const mockAssetJob: ILibraryAssetJob = {
      id: assetStub.external.id,
      importPaths: ['/'],
      exclusionPatterns: [],
    };

    const newMTime = new Date();
    mocks.asset.getById.mockResolvedValue(assetStub.external);
    mocks.storage.stat.mockResolvedValue({ mtime: newMTime } as Stats);

    await expect(sut.handleSyncAsset(mockAssetJob)).resolves.toBe(JobStatus.SUCCESS);

    expect(mocks.asset.updateAll).toHaveBeenCalledWith([assetStub.external.id], {
      fileModifiedAt: newMTime,
      isOffline: false,
      originalFileName: 'photo.jpg',
      deletedAt: null,
    });
  });

  describe('handleSyncFile', () => {
    let mockUser: UserEntity;

    beforeEach(() => {
      mockUser = userStub.admin;

      mocks.storage.stat.mockResolvedValue({
        size: 100,
        mtime: new Date('2023-01-01'),
        ctime: new Date('2023-01-01'),
      } as Stats);
    });

    it('should import a new asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
      };

      mocks.asset.create.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.create.mock.calls).toEqual([
        [
          {
            ownerId: mockUser.id,
            libraryId: libraryStub.externalLibrary1.id,
            checksum: expect.any(Buffer),
            originalPath: '/data/user1/photo.jpg',
            deviceAssetId: expect.any(String),
            deviceId: 'Library Import',
            fileCreatedAt: expect.any(Date),
            fileModifiedAt: expect.any(Date),
            localDateTime: expect.any(Date),
            type: AssetType.IMAGE,
            originalFileName: 'photo.jpg',
            isExternal: true,
          },
        ],
      ]);

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.SIDECAR_DISCOVERY,
            data: {
              id: assetStub.image.id,
              source: 'upload',
            },
          },
        ],
      ]);
    });

    it('should import a new video', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/video.mp4',
      };

      mocks.asset.create.mockResolvedValue(assetStub.video);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.create.mock.calls).toEqual([
        [
          {
            ownerId: mockUser.id,
            libraryId: libraryStub.externalLibrary1.id,
            checksum: expect.any(Buffer),
            originalPath: '/data/user1/video.mp4',
            deviceAssetId: expect.any(String),
            deviceId: 'Library Import',
            fileCreatedAt: expect.any(Date),
            fileModifiedAt: expect.any(Date),
            localDateTime: expect.any(Date),
            type: AssetType.VIDEO,
            originalFileName: 'video.mp4',
            isExternal: true,
          },
        ],
      ]);

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.SIDECAR_DISCOVERY,
            data: {
              id: assetStub.image.id,
              source: 'upload',
            },
          },
        ],
      ]);
    });

    it('should not import an asset to a soft deleted library', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
      };

      mocks.asset.create.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue({ ...libraryStub.externalLibrary1, deletedAt: new Date() });

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.FAILED);

      expect(mocks.asset.create.mock.calls).toEqual([]);
    });

    it('should not refresh a file whose mtime matches existing asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: assetStub.hasFileExtension.originalPath,
      };

      mocks.storage.stat.mockResolvedValue({
        size: 100,
        mtime: assetStub.hasFileExtension.fileModifiedAt,
        ctime: new Date('2023-01-01'),
      } as Stats);

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.hasFileExtension);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SKIPPED);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should skip existing asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
      };

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SKIPPED);
    });

    it('should not refresh an asset trashed by user', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: assetStub.hasFileExtension.originalPath,
      };

      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.trashed);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SKIPPED);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should fail when the file could not be read', async () => {
      mocks.storage.stat.mockRejectedValue(new Error('Could not read file'));

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
      };

      mocks.asset.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.FAILED);
      expect(mocks.library.get).not.toHaveBeenCalled();
      expect(mocks.asset.create).not.toHaveBeenCalled();
    });

    it('should skip if the file could not be found', async () => {
      const error = new Error('File not found') as any;
      error.code = 'ENOENT';
      mocks.storage.stat.mockRejectedValue(error);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
      };

      mocks.asset.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleSyncFile(mockLibraryJob)).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.library.get).not.toHaveBeenCalled();
      expect(mocks.asset.create).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a library', async () => {
      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(libraryStub.externalLibrary1.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: libraryStub.externalLibrary1.id },
      });

      expect(mocks.library.softDelete).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should allow an external library to be deleted', async () => {
      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(libraryStub.externalLibrary1.id);

      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: libraryStub.externalLibrary1.id },
      });

      expect(mocks.library.softDelete).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should unwatch an external library when deleted', async () => {
      mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
      mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

      const mockClose = vitest.fn();
      mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      await sut.delete(libraryStub.externalLibraryWithImportPaths1.id);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return a library', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      await expect(sut.get(libraryStub.externalLibrary1.id)).resolves.toEqual(
        expect.objectContaining({
          id: libraryStub.externalLibrary1.id,
          name: libraryStub.externalLibrary1.name,
          ownerId: libraryStub.externalLibrary1.ownerId,
        }),
      );

      expect(mocks.library.get).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should throw an error when a library is not found', async () => {
      await expect(sut.get(libraryStub.externalLibrary1.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.library.get).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });
  });

  describe('getStatistics', () => {
    it('should return library statistics', async () => {
      mocks.library.getStatistics.mockResolvedValue({ photos: 10, videos: 0, total: 10, usage: 1337 });
      await expect(sut.getStatistics(libraryStub.externalLibrary1.id)).resolves.toEqual({
        photos: 10,
        videos: 0,
        total: 10,
        usage: 1337,
      });

      expect(mocks.library.getStatistics).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should throw an error if the library could not be found', async () => {
      await expect(sut.getStatistics('foo')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create', () => {
    describe('external library', () => {
      it('should create with default settings', async () => {
        mocks.library.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(sut.create({ ownerId: authStub.admin.user.id })).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            name: libraryStub.externalLibrary1.name,
            ownerId: libraryStub.externalLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.externalLibrary1.createdAt,
            updatedAt: libraryStub.externalLibrary1.updatedAt,
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
        mocks.library.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(sut.create({ ownerId: authStub.admin.user.id, name: 'My Awesome Library' })).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            name: libraryStub.externalLibrary1.name,
            ownerId: libraryStub.externalLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.externalLibrary1.createdAt,
            updatedAt: libraryStub.externalLibrary1.updatedAt,
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
        mocks.library.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            importPaths: ['/data/images', '/data/videos'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            name: libraryStub.externalLibrary1.name,
            ownerId: libraryStub.externalLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.externalLibrary1.createdAt,
            updatedAt: libraryStub.externalLibrary1.updatedAt,
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
        mocks.library.create.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([]);

        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
        await sut.create({
          ownerId: authStub.admin.user.id,
          importPaths: libraryStub.externalLibraryWithImportPaths1.importPaths,
        });
      });

      it('should create with exclusion patterns', async () => {
        mocks.library.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            name: libraryStub.externalLibrary1.name,
            ownerId: libraryStub.externalLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.externalLibrary1.createdAt,
            updatedAt: libraryStub.externalLibrary1.updatedAt,
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
      mocks.library.getAll.mockResolvedValue([libraryStub.externalLibrary1]);
      await expect(sut.getAll()).resolves.toEqual([expect.objectContaining({ id: libraryStub.externalLibrary1.id })]);
    });
  });

  describe('handleQueueCleanup', () => {
    it('should queue cleanup jobs', async () => {
      mocks.library.getAllDeleted.mockResolvedValue([libraryStub.externalLibrary1, libraryStub.externalLibrary2]);
      await expect(sut.handleQueueCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.LIBRARY_DELETE, data: { id: libraryStub.externalLibrary1.id } },
        { name: JobName.LIBRARY_DELETE, data: { id: libraryStub.externalLibrary2.id } },
      ]);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      mocks.library.getAll.mockResolvedValue([]);

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
    });

    it('should throw an error if an import path is invalid', async () => {
      mocks.library.update.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await expect(sut.update('library-id', { importPaths: ['foo/bar'] })).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.library.update).not.toHaveBeenCalled();
    });

    it('should update library', async () => {
      mocks.library.update.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      mocks.storage.checkFileExists.mockResolvedValue(true);

      const cwd = process.cwd();

      await expect(sut.update('library-id', { importPaths: [`${cwd}/foo/bar`] })).resolves.toEqual(
        mapLibrary(libraryStub.externalLibrary1),
      );
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
        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchDisabled as SystemConfig });
      });

      it('should not watch library', async () => {
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

        await sut.watchAll();

        expect(mocks.storage.watch).not.toHaveBeenCalled();
      });
    });

    describe('watching enabled', () => {
      beforeEach(async () => {
        mocks.library.getAll.mockResolvedValue([]);
        await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      });

      it('should watch library', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

        await sut.watchAll();

        expect(mocks.storage.watch).toHaveBeenCalledWith(
          libraryStub.externalLibraryWithImportPaths1.importPaths,
          expect.anything(),
          expect.anything(),
        );
      });

      it('should watch and unwatch library', async () => {
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        const mockClose = vitest.fn();
        mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

        await sut.watchAll();
        await sut.unwatch(libraryStub.externalLibraryWithImportPaths1.id);

        expect(mockClose).toHaveBeenCalled();
      });

      it('should not watch library without import paths', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

        await sut.watchAll();

        expect(mocks.storage.watch).not.toHaveBeenCalled();
      });

      it('should handle a new file event', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(mocks.job.queueAll).toHaveBeenCalledWith([
          {
            name: JobName.LIBRARY_SYNC_FILE,
            data: {
              id: libraryStub.externalLibraryWithImportPaths1.id,
              assetPath: '/foo/photo.jpg',
              ownerId: libraryStub.externalLibraryWithImportPaths1.owner.id,
            },
          },
        ]);
        expect(mocks.job.queueAll).toHaveBeenCalledWith([
          { name: JobName.LIBRARY_SYNC_ASSET, data: expect.objectContaining({ id: assetStub.image.id }) },
        ]);
      });

      it('should handle a file change event', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'change', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queueAll).toHaveBeenCalledWith([
          {
            name: JobName.LIBRARY_SYNC_FILE,
            data: {
              id: libraryStub.externalLibraryWithImportPaths1.id,
              assetPath: '/foo/photo.jpg',
              ownerId: libraryStub.externalLibraryWithImportPaths1.owner.id,
            },
          },
        ]);
        expect(mocks.job.queueAll).toHaveBeenCalledWith([
          { name: JobName.LIBRARY_SYNC_ASSET, data: expect.objectContaining({ id: assetStub.image.id }) },
        ]);
      });

      it('should handle a file unlink event', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'unlink', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queueAll).toHaveBeenCalledWith([
          { name: JobName.LIBRARY_SYNC_ASSET, data: expect.objectContaining({ id: assetStub.image.id }) },
        ]);
      });

      it('should handle an error event', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.asset.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.external);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({
            items: [{ event: 'error', value: 'Error!' }],
          }),
        );

        await expect(sut.watchAll()).resolves.toBeUndefined();
      });

      it('should ignore unknown extensions', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        mocks.library.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        mocks.storage.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(mocks.job.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.patternPath);
        mocks.library.getAll.mockResolvedValue([libraryStub.patternPath]);
        mocks.storage.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'add', value: '/dir1/photo.txt' }] }),
        );

        await sut.watchAll();

        expect(mocks.job.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths without case sensitivity', async () => {
        mocks.library.get.mockResolvedValue(libraryStub.patternPath);
        mocks.library.getAll.mockResolvedValue([libraryStub.patternPath]);
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
      mocks.library.getAll.mockResolvedValue([
        libraryStub.externalLibraryWithImportPaths1,
        libraryStub.externalLibraryWithImportPaths2,
      ]);

      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      mocks.library.get.mockImplementation((id) =>
        Promise.resolve(
          [libraryStub.externalLibraryWithImportPaths1, libraryStub.externalLibraryWithImportPaths2].find(
            (library) => library.id === id,
          ),
        ),
      );

      const mockClose = vitest.fn();
      mocks.storage.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

      await sut.onConfigInit({ newConfig: systemConfigStub.libraryWatchEnabled as SystemConfig });
      await sut.onShutdown();

      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDeleteLibrary', () => {
    it('should delete an empty library', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.asset.getAll.mockResolvedValue({ items: [], hasNextPage: false });

      await expect(sut.handleDeleteLibrary({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);
      expect(mocks.library.delete).toHaveBeenCalled();
    });

    it('should delete all assets in a library', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.image1], hasNextPage: false });

      mocks.asset.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleDeleteLibrary({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);
    });
  });

  describe('queueScan', () => {
    it('should queue a library scan', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(libraryStub.externalLibrary1.id);

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_QUEUE_SYNC_FILES,
            data: {
              id: libraryStub.externalLibrary1.id,
            },
          },
        ],
        [
          {
            name: JobName.LIBRARY_QUEUE_SYNC_ASSETS,
            data: {
              id: libraryStub.externalLibrary1.id,
            },
          },
        ],
      ]);
    });
  });

  describe('handleQueueAllScan', () => {
    it('should queue the refresh job', async () => {
      mocks.library.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

      await expect(sut.handleQueueSyncAll()).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_QUEUE_CLEANUP,
            data: {},
          },
        ],
      ]);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_QUEUE_SYNC_FILES,
          data: {
            id: libraryStub.externalLibrary1.id,
          },
        },
      ]);
    });
  });

  describe('handleQueueAssetOfflineCheck', () => {
    it('should queue removal jobs', async () => {
      mocks.library.get.mockResolvedValue(libraryStub.externalLibrary1);
      mocks.asset.getAll.mockResolvedValue({ items: [assetStub.image1], hasNextPage: false });
      mocks.asset.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleQueueSyncAssets({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SYNC_ASSET,
          data: {
            id: assetStub.image1.id,
            importPaths: libraryStub.externalLibrary1.importPaths,
            exclusionPatterns: libraryStub.externalLibrary1.exclusionPatterns,
          },
        },
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
      mocks.storage.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      const cwd = process.cwd();

      const validImport = `${cwd}/${libraryStub.hasImmichPaths.importPaths[1]}`;
      mocks.storage.checkFileExists.mockImplementation((importPath) => Promise.resolve(importPath === validImport));

      const pathStubs = libraryStub.hasImmichPaths.importPaths;
      const importPaths = [pathStubs[0], validImport, pathStubs[2]];

      await expect(sut.validate('library-id', { importPaths })).resolves.toEqual({
        importPaths: [
          {
            importPath: libraryStub.hasImmichPaths.importPaths[0],
            isValid: false,
            message: 'Cannot use media upload folder for external libraries',
          },
          {
            importPath: validImport,
            isValid: true,
          },
          {
            importPath: libraryStub.hasImmichPaths.importPaths[2],
            isValid: false,
            message: 'Cannot use media upload folder for external libraries',
          },
        ],
      });
    });
  });
});
