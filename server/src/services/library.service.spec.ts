import { BadRequestException } from '@nestjs/common';
import { Stats } from 'node:fs';
import { SystemConfig } from 'src/config';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { mapLibrary } from 'src/dtos/library.dto';
import { AssetType } from 'src/entities/asset.entity';
import { LibraryType } from 'src/entities/library.entity';
import { UserEntity } from 'src/entities/user.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IJobRepository, ILibraryFileJob, ILibraryRefreshJob, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { LibraryService } from 'src/services/library.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { libraryStub } from 'test/fixtures/library.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLibraryRepositoryMock } from 'test/repositories/library.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { makeMockWatcher, newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked, vitest } from 'vitest';

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let assetMock: Mocked<IAssetRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let jobMock: Mocked<IJobRepository>;
  let libraryMock: Mocked<ILibraryRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    systemMock = newSystemMetadataRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    storageMock = newStorageRepositoryMock();
    databaseMock = newDatabaseRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new LibraryService(
      assetMock,
      systemMock,
      cryptoMock,
      jobMock,
      libraryMock,
      storageMock,
      databaseMock,
      loggerMock,
    );

    databaseMock.tryLock.mockResolvedValue(true);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    it('should init cron job and subscribe to config changes', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.libraryScan);

      await sut.init();
      expect(systemMock.get).toHaveBeenCalled();
      expect(jobMock.addCronJob).toHaveBeenCalled();

      SystemConfigCore.create(newSystemMetadataRepositoryMock(false), newLoggerRepositoryMock()).config$.next({
        library: {
          scan: {
            enabled: true,
            cronExpression: '0 1 * * *',
          },
          watch: { enabled: false },
        },
      } as SystemConfig);

      expect(jobMock.updateCronJob).toHaveBeenCalledWith('libraryScan', '0 1 * * *', true);
    });

    it('should initialize watcher for all external libraries', async () => {
      libraryMock.getAll.mockResolvedValue([
        libraryStub.externalLibraryWithImportPaths1,
        libraryStub.externalLibraryWithImportPaths2,
      ]);

      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
      libraryMock.get.mockImplementation((id) =>
        Promise.resolve(
          [libraryStub.externalLibraryWithImportPaths1, libraryStub.externalLibraryWithImportPaths2].find(
            (library) => library.id === id,
          ) || null,
        ),
      );

      await sut.init();

      expect(storageMock.watch.mock.calls).toEqual(
        expect.arrayContaining([
          (libraryStub.externalLibrary1.importPaths, expect.anything()),
          (libraryStub.externalLibrary2.importPaths, expect.anything()),
        ]),
      );
    });

    it('should not initialize watcher when watching is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchDisabled);

      await sut.init();

      expect(storageMock.watch).not.toHaveBeenCalled();
    });

    it('should not initialize watcher when lock is taken', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
      databaseMock.tryLock.mockResolvedValue(false);

      await sut.init();

      expect(storageMock.watch).not.toHaveBeenCalled();
    });
  });

  describe('onValidateConfig', () => {
    it('should allow a valid cron expression', () => {
      expect(() =>
        sut.onValidateConfig({
          newConfig: { library: { scan: { cronExpression: '0 0 * * *' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).not.toThrow(expect.stringContaining('Invalid cron expression'));
    });

    it('should fail for an invalid cron expression', () => {
      expect(() =>
        sut.onValidateConfig({
          newConfig: { library: { scan: { cronExpression: 'foo' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).toThrow(/Invalid cron expression.*/);
    });
  });

  describe('handleQueueAssetRefresh', () => {
    it('should queue new assets', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      // eslint-disable-next-line @typescript-eslint/require-await
      storageMock.walk.mockImplementation(async function* generator() {
        yield '/data/user1/photo.jpg';
      });
      assetMock.getExternalLibraryAssetPaths.mockResolvedValue({ items: [], hasNextPage: false });

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SCAN_ASSET,
          data: {
            id: libraryStub.externalLibrary1.id,
            ownerId: libraryStub.externalLibrary1.owner.id,
            assetPath: '/data/user1/photo.jpg',
            force: false,
          },
        },
      ]);
    });

    it('should force queue new assets', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: true,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      // eslint-disable-next-line @typescript-eslint/require-await
      storageMock.walk.mockImplementation(async function* generator() {
        yield '/data/user1/photo.jpg';
      });
      assetMock.getExternalLibraryAssetPaths.mockResolvedValue({ items: [], hasNextPage: false });

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SCAN_ASSET,
          data: {
            id: libraryStub.externalLibrary1.id,
            ownerId: libraryStub.externalLibrary1.owner.id,
            assetPath: '/data/user1/photo.jpg',
            force: true,
          },
        },
      ]);
    });

    it('should not scan upload libraries', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);

      await expect(sut.handleQueueAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.FAILED);
    });

    it('should ignore import paths that do not exist', async () => {
      storageMock.stat.mockImplementation((path): Promise<Stats> => {
        if (path === libraryStub.externalLibraryWithImportPaths1.importPaths[0]) {
          const error = { code: 'ENOENT' } as any;
          throw error;
        }
        return Promise.resolve({
          isDirectory: () => true,
        } as Stats);
      });

      storageMock.checkFileExists.mockResolvedValue(true);

      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibraryWithImportPaths1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
      assetMock.getExternalLibraryAssetPaths.mockResolvedValue({ items: [], hasNextPage: false });

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(storageMock.walk).toHaveBeenCalledWith({
        pathsToCrawl: [libraryStub.externalLibraryWithImportPaths1.importPaths[1]],
        exclusionPatterns: [],
      });
    });

    it('should set missing assets offline', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      assetMock.getExternalLibraryAssetPaths.mockResolvedValue({
        items: [assetStub.external],
        hasNextPage: false,
      });

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(assetMock.updateAll).toHaveBeenCalledWith([assetStub.image.id], { isOffline: true });
      expect(assetMock.updateAll).not.toHaveBeenCalledWith(expect.anything(), { isOffline: false });
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should set crawled assets that were previously offline back online', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      // eslint-disable-next-line @typescript-eslint/require-await
      storageMock.walk.mockImplementation(async function* generator() {
        yield assetStub.externalOffline.originalPath;
      });
      assetMock.getExternalLibraryAssetPaths.mockResolvedValue({
        items: [assetStub.externalOffline],
        hasNextPage: false,
      });

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(assetMock.updateAll).toHaveBeenCalledWith([assetStub.externalOffline.id], { isOffline: false });
      expect(assetMock.updateAll).not.toHaveBeenCalledWith(expect.anything(), { isOffline: true });
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('handleAssetRefresh', () => {
    let mockUser: UserEntity;

    beforeEach(() => {
      mockUser = userStub.admin;

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: new Date('2023-01-01'),
        ctime: new Date('2023-01-01'),
      } as Stats);
    });

    it('should reject an unknown file extension', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject an unknown file type', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        force: false,
      };

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should add a new image', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.create.mock.calls).toEqual([
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
            sidecarPath: null,
            isExternal: true,
          },
        ],
      ]);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: {
              id: assetStub.image.id,
              source: 'upload',
            },
          },
        ],
      ]);
    });

    it('should add a new image with sidecar', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);
      storageMock.checkFileExists.mockResolvedValue(true);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.create.mock.calls).toEqual([
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
            sidecarPath: '/data/user1/photo.jpg.xmp',
            isExternal: true,
          },
        ],
      ]);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: {
              id: assetStub.image.id,
              source: 'upload',
            },
          },
        ],
      ]);
    });

    it('should add a new video', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/video.mp4',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.video);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.create.mock.calls).toEqual([
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
            sidecarPath: null,
            isExternal: true,
          },
        ],
      ]);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: {
              id: assetStub.image.id,
              source: 'upload',
            },
          },
        ],
        [
          {
            name: JobName.VIDEO_CONVERSION,
            data: {
              id: assetStub.video.id,
            },
          },
        ],
      ]);
    });

    it('should not add an image to a soft deleted library', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);
      libraryMock.get.mockResolvedValue({ ...libraryStub.externalLibrary1, deletedAt: new Date() });

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.FAILED);

      expect(assetMock.create.mock.calls).toEqual([]);
    });

    it('should not import an asset when mtime matches db asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: assetStub.hasFileExtension.originalPath,
        force: false,
      };

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: assetStub.hasFileExtension.fileModifiedAt,
        ctime: new Date('2023-01-01'),
      } as Stats);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.hasFileExtension);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SKIPPED);

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should import an asset when mtime differs from db asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.image.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.image.id,
        },
      });
    });

    it('should import an asset that is missing a file extension', async () => {
      // This tests for the case where the file extension is missing from the asset path.
      // This happened in previous versions of Immich
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: assetStub.missingFileExtension.originalPath,
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.missingFileExtension);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.updateAll).toHaveBeenCalledWith(
        [assetStub.missingFileExtension.id],
        expect.objectContaining({ originalFileName: 'photo.jpg' }),
      );
    });

    it('should set a missing asset to offline', async () => {
      storageMock.stat.mockRejectedValue(new Error('Path not found'));

      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.image.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.image.id, isOffline: true });
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should online a previously-offline asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.offline.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.offline);
      assetMock.create.mockResolvedValue(assetStub.offline);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.offline.id, isOffline: false });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.offline.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.offline.id,
        },
      });
    });

    it('should do nothing when mtime matches existing asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.image.id,
        ownerId: assetStub.image.ownerId,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      expect(assetMock.update).not.toHaveBeenCalled();

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);
    });

    it('should refresh an existing asset if forced', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.image.id,
        ownerId: assetStub.hasFileExtension.ownerId,
        assetPath: assetStub.hasFileExtension.originalPath,
        force: true,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.hasFileExtension);
      assetMock.create.mockResolvedValue(assetStub.hasFileExtension);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.updateAll).toHaveBeenCalledWith([assetStub.hasFileExtension.id], {
        fileCreatedAt: new Date('2023-01-01'),
        fileModifiedAt: new Date('2023-01-01'),
        originalFileName: assetStub.hasFileExtension.originalFileName,
      });
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetStub.image.fileModifiedAt.getSeconds() + 10);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: filemtime,
        ctime: new Date('2023-01-01'),
      } as Stats);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.create).toHaveBeenCalled();
      const createdAsset = assetMock.create.mock.calls[0][0];

      expect(createdAsset.fileModifiedAt).toEqual(filemtime);
    });

    it('should throw error when asset does not exist', async () => {
      storageMock.stat.mockRejectedValue(new Error("ENOENT, no such file or directory '/data/user1/photo.jpg'"));

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        force: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete a library', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(2);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(libraryStub.externalLibrary1.id);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: libraryStub.externalLibrary1.id },
      });

      expect(libraryMock.softDelete).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should throw error if the last upload library is deleted', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(1);
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);

      await expect(sut.delete(libraryStub.uploadLibrary1.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(libraryMock.softDelete).not.toHaveBeenCalled();
    });

    it('should allow an external library to be deleted', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(1);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(libraryStub.externalLibrary1.id);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: libraryStub.externalLibrary1.id },
      });

      expect(libraryMock.softDelete).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });

    it('should unwatch an external library when deleted', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(1);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
      libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);

      const mockClose = vitest.fn();
      storageMock.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

      await sut.init();
      await sut.delete(libraryStub.externalLibraryWithImportPaths1.id);

      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return a library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      await expect(sut.get(libraryStub.uploadLibrary1.id)).resolves.toEqual(
        expect.objectContaining({
          id: libraryStub.uploadLibrary1.id,
          name: libraryStub.uploadLibrary1.name,
          ownerId: libraryStub.uploadLibrary1.ownerId,
        }),
      );

      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.uploadLibrary1.id);
    });

    it('should throw an error when a library is not found', async () => {
      libraryMock.get.mockResolvedValue(null);
      await expect(sut.get(libraryStub.uploadLibrary1.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.uploadLibrary1.id);
    });
  });

  describe('getStatistics', () => {
    it('should return library statistics', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.getStatistics.mockResolvedValue({ photos: 10, videos: 0, total: 10, usage: 1337 });
      await expect(sut.getStatistics(libraryStub.uploadLibrary1.id)).resolves.toEqual({
        photos: 10,
        videos: 0,
        total: 10,
        usage: 1337,
      });

      expect(libraryMock.getStatistics).toHaveBeenCalledWith(libraryStub.uploadLibrary1.id);
    });
  });

  describe('create', () => {
    describe('external library', () => {
      it('should create with default settings', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(sut.create({ ownerId: authStub.admin.user.id, type: LibraryType.EXTERNAL })).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            type: LibraryType.EXTERNAL,
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

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('should create with name', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create({ ownerId: authStub.admin.user.id, type: LibraryType.EXTERNAL, name: 'My Awesome Library' }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            type: LibraryType.EXTERNAL,
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

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Awesome Library',
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('should create with import paths', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            type: LibraryType.EXTERNAL,
            importPaths: ['/data/images', '/data/videos'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            type: LibraryType.EXTERNAL,
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

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            type: LibraryType.EXTERNAL,
            importPaths: ['/data/images', '/data/videos'],
            exclusionPatterns: [],
          }),
        );
      });

      it('should create watched with import paths', async () => {
        systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
        libraryMock.create.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([]);

        await sut.init();
        await sut.create({
          ownerId: authStub.admin.user.id,
          type: LibraryType.EXTERNAL,
          importPaths: libraryStub.externalLibraryWithImportPaths1.importPaths,
        });
      });

      it('should create with exclusion patterns', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            type: LibraryType.EXTERNAL,
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.externalLibrary1.id,
            type: LibraryType.EXTERNAL,
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

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.any(String),
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        );
      });
    });

    describe('upload library', () => {
      it('should create with default settings', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.uploadLibrary1);
        await expect(sut.create({ ownerId: authStub.admin.user.id, type: LibraryType.UPLOAD })).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.uploadLibrary1.id,
            type: LibraryType.UPLOAD,
            name: libraryStub.uploadLibrary1.name,
            ownerId: libraryStub.uploadLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.uploadLibrary1.createdAt,
            updatedAt: libraryStub.uploadLibrary1.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'New Upload Library',
            type: LibraryType.UPLOAD,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('should create with name', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.uploadLibrary1);
        await expect(
          sut.create({ ownerId: authStub.admin.user.id, type: LibraryType.UPLOAD, name: 'My Awesome Library' }),
        ).resolves.toEqual(
          expect.objectContaining({
            id: libraryStub.uploadLibrary1.id,
            type: LibraryType.UPLOAD,
            name: libraryStub.uploadLibrary1.name,
            ownerId: libraryStub.uploadLibrary1.ownerId,
            assetCount: 0,
            importPaths: [],
            exclusionPatterns: [],
            createdAt: libraryStub.uploadLibrary1.createdAt,
            updatedAt: libraryStub.uploadLibrary1.updatedAt,
            refreshedAt: null,
          }),
        );

        expect(libraryMock.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Awesome Library',
            type: LibraryType.UPLOAD,
            importPaths: [],
            exclusionPatterns: [],
          }),
        );
      });

      it('should not create with import paths', async () => {
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            type: LibraryType.UPLOAD,
            importPaths: ['/data/images', '/data/videos'],
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(libraryMock.create).not.toHaveBeenCalled();
      });

      it('should not create with exclusion patterns', async () => {
        await expect(
          sut.create({
            ownerId: authStub.admin.user.id,
            type: LibraryType.UPLOAD,
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(libraryMock.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleQueueCleanup', () => {
    it('should queue cleanup jobs', async () => {
      libraryMock.getAllDeleted.mockResolvedValue([libraryStub.uploadLibrary1, libraryStub.externalLibrary1]);
      await expect(sut.handleQueueCleanup()).resolves.toBe(JobStatus.SUCCESS);

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.LIBRARY_DELETE, data: { id: libraryStub.uploadLibrary1.id } },
        { name: JobName.LIBRARY_DELETE, data: { id: libraryStub.externalLibrary1.id } },
      ]);
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
      libraryMock.getAll.mockResolvedValue([]);

      await sut.init();
    });

    it('should update library', async () => {
      libraryMock.update.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      await expect(sut.update('library-id', {})).resolves.toEqual(mapLibrary(libraryStub.uploadLibrary1));
      expect(libraryMock.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'library-id' }));
    });
  });

  describe('watchAll', () => {
    describe('watching disabled', () => {
      beforeEach(async () => {
        systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchDisabled);

        await sut.init();
      });

      it('should not watch library', async () => {
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

        await sut.watchAll();

        expect(storageMock.watch).not.toHaveBeenCalled();
      });
    });

    describe('watching enabled', () => {
      beforeEach(async () => {
        systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
        libraryMock.getAll.mockResolvedValue([]);
        await sut.init();
      });

      it('should watch library', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);

        await sut.watchAll();

        expect(storageMock.watch).toHaveBeenCalledWith(
          libraryStub.externalLibraryWithImportPaths1.importPaths,
          expect.anything(),
          expect.anything(),
        );
      });

      it('should watch and unwatch library', async () => {
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        const mockClose = vitest.fn();
        storageMock.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

        await sut.watchAll();
        await sut.unwatch(libraryStub.externalLibraryWithImportPaths1.id);

        expect(mockClose).toHaveBeenCalled();
      });

      it('should not watch library without import paths', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

        await sut.watchAll();

        expect(storageMock.watch).not.toHaveBeenCalled();
      });

      it('should throw error when watching upload library', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
        libraryMock.getAll.mockResolvedValue([libraryStub.uploadLibrary1]);

        await expect(sut.watchAll()).rejects.toThrow('Can only watch external libraries');

        expect(storageMock.watch).not.toHaveBeenCalled();
      });

      it('should handle a new file event', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        storageMock.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(jobMock.queueAll).toHaveBeenCalledWith([
          {
            name: JobName.LIBRARY_SCAN_ASSET,
            data: {
              id: libraryStub.externalLibraryWithImportPaths1.id,
              assetPath: '/foo/photo.jpg',
              ownerId: libraryStub.externalLibraryWithImportPaths1.owner.id,
              force: false,
            },
          },
        ]);
      });

      it('should handle a file change event', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        storageMock.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'change', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(jobMock.queueAll).toHaveBeenCalledWith([
          {
            name: JobName.LIBRARY_SCAN_ASSET,
            data: {
              id: libraryStub.externalLibraryWithImportPaths1.id,
              assetPath: '/foo/photo.jpg',
              ownerId: libraryStub.externalLibraryWithImportPaths1.owner.id,
              force: false,
            },
          },
        ]);
      });

      it('should handle a file unlink event', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.external);
        storageMock.watch.mockImplementation(
          makeMockWatcher({ items: [{ event: 'unlink', value: '/foo/photo.jpg' }] }),
        );

        await sut.watchAll();

        expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.external.id, isOffline: true });
      });

      it('should handle an error event', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.external);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        storageMock.watch.mockImplementation(
          makeMockWatcher({
            items: [{ event: 'error', value: 'Error!' }],
          }),
        );

        await expect(sut.watchAll()).resolves.toBeUndefined();
      });

      it('should ignore unknown extensions', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.externalLibraryWithImportPaths1);
        libraryMock.getAll.mockResolvedValue([libraryStub.externalLibraryWithImportPaths1]);
        storageMock.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/foo/photo.jpg' }] }));

        await sut.watchAll();

        expect(jobMock.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.patternPath);
        libraryMock.getAll.mockResolvedValue([libraryStub.patternPath]);
        storageMock.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/dir1/photo.txt' }] }));

        await sut.watchAll();

        expect(jobMock.queue).not.toHaveBeenCalled();
      });

      it('should ignore excluded paths without case sensitivity', async () => {
        libraryMock.get.mockResolvedValue(libraryStub.patternPath);
        libraryMock.getAll.mockResolvedValue([libraryStub.patternPath]);
        storageMock.watch.mockImplementation(makeMockWatcher({ items: [{ event: 'add', value: '/DIR1/photo.txt' }] }));

        await sut.watchAll();

        expect(jobMock.queue).not.toHaveBeenCalled();
      });
    });
  });

  describe('teardown', () => {
    it('should tear down all watchers', async () => {
      libraryMock.getAll.mockResolvedValue([
        libraryStub.externalLibraryWithImportPaths1,
        libraryStub.externalLibraryWithImportPaths2,
      ]);

      systemMock.get.mockResolvedValue(systemConfigStub.libraryWatchEnabled);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      libraryMock.get.mockImplementation((id) =>
        Promise.resolve(
          [libraryStub.externalLibraryWithImportPaths1, libraryStub.externalLibraryWithImportPaths2].find(
            (library) => library.id === id,
          ) || null,
        ),
      );

      const mockClose = vitest.fn();
      storageMock.watch.mockImplementation(makeMockWatcher({ close: mockClose }));

      await sut.init();
      await sut.teardown();

      expect(mockClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('handleDeleteLibrary', () => {
    it('should not delete a nonexistent library', async () => {
      libraryMock.get.mockResolvedValue(null);

      libraryMock.getAssetIds.mockResolvedValue([]);
      libraryMock.delete.mockImplementation(async () => {});

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(JobStatus.FAILED);
    });

    it('should delete an empty library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.getAssetIds.mockResolvedValue([]);
      libraryMock.delete.mockImplementation(async () => {});

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);
    });

    it('should delete a library with assets', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.getAssetIds.mockResolvedValue([assetStub.image1.id]);
      libraryMock.delete.mockImplementation(async () => {});

      assetMock.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);
    });
  });

  describe('queueScan', () => {
    it('should queue a library scan of external library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(libraryStub.externalLibrary1.id, {});

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_SCAN,
            data: {
              id: libraryStub.externalLibrary1.id,
              refreshModifiedFiles: false,
              refreshAllFiles: false,
            },
          },
        ],
      ]);
    });

    it('should not queue a library scan of upload library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);

      await expect(sut.queueScan(libraryStub.uploadLibrary1.id, {})).rejects.toBeInstanceOf(BadRequestException);

      expect(jobMock.queue).not.toBeCalled();
    });

    it('should queue a library scan of all modified assets', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(libraryStub.externalLibrary1.id, { refreshModifiedFiles: true });

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_SCAN,
            data: {
              id: libraryStub.externalLibrary1.id,
              refreshModifiedFiles: true,
              refreshAllFiles: false,
            },
          },
        ],
      ]);
    });

    it('should queue a forced library scan', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(libraryStub.externalLibrary1.id, { refreshAllFiles: true });

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_SCAN,
            data: {
              id: libraryStub.externalLibrary1.id,
              refreshModifiedFiles: false,
              refreshAllFiles: true,
            },
          },
        ],
      ]);
    });
  });

  describe('queueEmptyTrash', () => {
    it('should queue the trash job', async () => {
      await sut.queueRemoveOffline(libraryStub.externalLibrary1.id);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_REMOVE_OFFLINE,
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
      libraryMock.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

      await expect(sut.handleQueueAllScan({})).resolves.toBe(JobStatus.SUCCESS);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_QUEUE_CLEANUP,
            data: {},
          },
        ],
      ]);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SCAN,
          data: {
            id: libraryStub.externalLibrary1.id,
            refreshModifiedFiles: true,
            refreshAllFiles: false,
          },
        },
      ]);
    });

    it('should queue the force refresh job', async () => {
      libraryMock.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

      await expect(sut.handleQueueAllScan({ force: true })).resolves.toBe(JobStatus.SUCCESS);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_QUEUE_CLEANUP,
        data: {},
      });

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.LIBRARY_SCAN,
          data: {
            id: libraryStub.externalLibrary1.id,
            refreshModifiedFiles: false,
            refreshAllFiles: true,
          },
        },
      ]);
    });
  });

  describe('handleRemoveOfflineFiles', () => {
    it('should queue trash deletion jobs', async () => {
      assetMock.getWith.mockResolvedValue({ items: [assetStub.image1], hasNextPage: false });
      assetMock.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleOfflineRemoval({ id: libraryStub.externalLibrary1.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(jobMock.queueAll).toHaveBeenCalledWith([
        { name: JobName.ASSET_DELETION, data: { id: assetStub.image1.id } },
      ]);
    });
  });

  describe('validate', () => {
    it('should validate directory', async () => {
      storageMock.stat.mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      storageMock.checkFileExists.mockResolvedValue(true);

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
      storageMock.stat.mockImplementation(() => {
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
      storageMock.stat.mockResolvedValue({
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
      storageMock.stat.mockImplementation(() => {
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
      storageMock.stat.mockResolvedValue({
        isDirectory: () => true,
      } as Stats);

      storageMock.checkFileExists.mockResolvedValue(false);

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

    it('should detect when import path is in immich media folder', async () => {
      storageMock.stat.mockResolvedValue({ isDirectory: () => true } as Stats);
      const validImport = libraryStub.hasImmichPaths.importPaths[1];
      storageMock.checkFileExists.mockImplementation((importPath) => Promise.resolve(importPath === validImport));

      await expect(
        sut.validate('library-id', { importPaths: libraryStub.hasImmichPaths.importPaths }),
      ).resolves.toEqual({
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
