import { AssetType, LibraryType, UserEntity } from '@app/infra/entities';
import { BadRequestException } from '@nestjs/common';

import {
  assetStub,
  authStub,
  IAccessRepositoryMock,
  libraryStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newLibraryRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
  userStub,
} from '@test';
import { Stats } from 'fs';
import { IJobRepository, ILibraryFileJob, ILibraryRefreshJob, IOfflineLibraryFileJob, JobName } from '../job';

import { IAssetRepository, ICryptoRepository, IStorageRepository, IUserRepository } from '..';
import { ILibraryRepository } from './library.repository';
import { LibraryService } from './library.service';

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let accessMock: IAccessRepositoryMock;
  let assetMock: jest.Mocked<IAssetRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    userMock = newUserRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    storageMock = newStorageRepositoryMock();

    storageMock.stat.mockResolvedValue({
      size: 100,
      mtime: new Date('2023-01-01'),
      ctime: new Date('2023-01-01'),
    } as Stats);

    accessMock.library.hasOwnerAccess.mockResolvedValue(true);

    sut = new LibraryService(accessMock, assetMock, cryptoMock, jobMock, libraryMock, storageMock, userMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueAssetRefresh', () => {
    it("should not queue assets outside of user's external path", async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      storageMock.crawl.mockResolvedValue(['/data/user2/photo.jpg']);
      assetMock.getByLibraryId.mockResolvedValue([]);
      libraryMock.getOnlineAssetPaths.mockResolvedValue([]);
      userMock.get.mockResolvedValue(userStub.externalPath1);

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(jobMock.queue.mock.calls).toEqual([]);
    });

    it('should queue new assets', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      storageMock.crawl.mockResolvedValue(['/data/user1/photo.jpg']);
      assetMock.getByLibraryId.mockResolvedValue([]);
      libraryMock.getOnlineAssetPaths.mockResolvedValue([]);
      userMock.get.mockResolvedValue(userStub.externalPath1);

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_SCAN_ASSET,
            data: {
              id: libraryStub.externalLibrary1.id,
              ownerId: libraryStub.externalLibrary1.owner.id,
              assetPath: '/data/user1/photo.jpg',
              forceRefresh: false,
            },
          },
        ],
      ]);
    });

    it("should mark assets outside of the user's external path as offline", async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);
      storageMock.crawl.mockResolvedValue(['/data/user1/photo.jpg']);
      assetMock.getByLibraryId.mockResolvedValue([assetStub.external]);
      libraryMock.getOnlineAssetPaths.mockResolvedValue([]);
      userMock.get.mockResolvedValue(userStub.externalPath2);

      await sut.handleQueueAssetRefresh(mockLibraryJob);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_MARK_ASSET_OFFLINE,
            data: {
              id: libraryStub.externalLibrary1.id,
              assetPath: '/data/user1/photo.jpg',
            },
          },
        ],
      ]);
    });

    it('should not scan libraries owned by user without external path', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      userMock.get.mockResolvedValue(userStub.user1);

      expect(sut.handleQueueAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });

    it('should not scan upload libraries', async () => {
      const mockLibraryJob: ILibraryRefreshJob = {
        id: libraryStub.externalLibrary1.id,
        refreshModifiedFiles: false,
        refreshAllFiles: false,
      };

      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);

      expect(sut.handleQueueAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });
  });

  describe('handleAssetRefresh', () => {
    let mockUser: UserEntity;

    beforeEach(() => {
      mockUser = userStub.externalPath1;
      userMock.get.mockResolvedValue(mockUser);
    });

    it('should reject an unknown file extension', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject an unknown file type', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        forceRefresh: false,
      };

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should add a new image', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

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
            originalFileName: 'photo',
            sidecarPath: null,
            isReadOnly: true,
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
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);
      storageMock.checkFileExists.mockResolvedValue(true);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

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
            originalFileName: 'photo',
            sidecarPath: '/data/user1/photo.jpg.xmp',
            isReadOnly: true,
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
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.video);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

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
            originalFileName: 'video',
            sidecarPath: null,
            isReadOnly: true,
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
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);
      libraryMock.get.mockResolvedValue({ ...libraryStub.externalLibrary1, deletedAt: new Date() });

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(false);

      expect(assetMock.create.mock.calls).toEqual([]);
    });

    it('should not import an asset when mtime matches db asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: assetStub.image.fileModifiedAt,
        ctime: new Date('2023-01-01'),
      } as Stats);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should import an asset when mtime differs from db asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

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

    it('should skip an asset if the user cannot be found', async () => {
      userMock.get.mockResolvedValue(null);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });

    it('should skip an asset if external path is not set', async () => {
      mockUser = userStub.admin;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });

    it("should skip an asset if it isn't in the external path", async () => {
      mockUser = userStub.externalPath1;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/etc/rootpassword.jpg',
        forceRefresh: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });

    it('should skip an asset if directory traversal is attempted', async () => {
      mockUser = userStub.externalPath1;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/../../etc/rootpassword.jpg',
        forceRefresh: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(false);
    });

    it('should set a missing asset to offline', async () => {
      storageMock.stat.mockRejectedValue(new Error());

      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.image.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.image.id, isOffline: true });
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should online a previously-offline asset', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.offline.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.offline);
      assetMock.create.mockResolvedValue(assetStub.offline);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.offline.id, isOffline: false });

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
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      expect(assetMock.save).not.toHaveBeenCalled();

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);
    });

    it('should refresh an existing asset if forced', async () => {
      const mockLibraryJob: ILibraryFileJob = {
        id: assetStub.image.id,
        ownerId: assetStub.image.ownerId,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: true,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.updateAll).toHaveBeenCalledWith([assetStub.image.id], {
        fileCreatedAt: new Date('2023-01-01'),
        fileModifiedAt: new Date('2023-01-01'),
      });
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetStub.image.fileModifiedAt.getSeconds() + 10);

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: filemtime,
        ctime: new Date('2023-01-01'),
      } as Stats);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.create).toHaveBeenCalled();
      const createdAsset = assetMock.create.mock.calls[0][0];

      expect(createdAsset.fileModifiedAt).toEqual(filemtime);
    });

    it('should error when asset does not exist', async () => {
      storageMock.stat.mockRejectedValue(new Error("ENOENT, no such file or directory '/data/user1/photo.jpg'"));

      const mockLibraryJob: ILibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        forceRefresh: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('handleOfflineAsset', () => {
    it('should mark an asset as offline', async () => {
      const offlineJob: IOfflineLibraryFileJob = {
        id: libraryStub.externalLibrary1.id,
        assetPath: '/data/user1/photo.jpg',
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);

      await expect(sut.handleOfflineAsset(offlineJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        isOffline: true,
      });
    });
  });

  describe('delete', () => {
    it('should delete a library', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(2);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(authStub.admin, libraryStub.externalLibrary1.id);

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

      await expect(sut.delete(authStub.admin, libraryStub.uploadLibrary1.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(libraryMock.softDelete).not.toHaveBeenCalled();
    });

    it('should allow an external library to be deleted', async () => {
      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      libraryMock.getUploadLibraryCount.mockResolvedValue(1);
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.delete(authStub.admin, libraryStub.externalLibrary1.id);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.LIBRARY_DELETE,
        data: { id: libraryStub.externalLibrary1.id },
      });

      expect(libraryMock.softDelete).toHaveBeenCalledWith(libraryStub.externalLibrary1.id);
    });
  });

  describe('getCount', () => {
    it('should call the repository', async () => {
      libraryMock.getCountForUser.mockResolvedValue(17);

      await expect(sut.getCount(authStub.admin)).resolves.toBe(17);

      expect(libraryMock.getCountForUser).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('get', () => {
    it('can return a library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      await expect(sut.get(authStub.admin, libraryStub.uploadLibrary1.id)).resolves.toEqual(
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
      await expect(sut.get(authStub.admin, libraryStub.uploadLibrary1.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.uploadLibrary1.id);
    });
  });

  describe('getAllForUser', () => {
    it('can return all libraries for user', async () => {
      libraryMock.getAllByUserId.mockResolvedValue([libraryStub.uploadLibrary1, libraryStub.externalLibrary1]);
      await expect(sut.getAllForUser(authStub.admin)).resolves.toEqual([
        expect.objectContaining({
          id: libraryStub.uploadLibrary1.id,
          name: libraryStub.uploadLibrary1.name,
          ownerId: libraryStub.uploadLibrary1.ownerId,
        }),
        expect.objectContaining({
          id: libraryStub.externalLibrary1.id,
          name: libraryStub.externalLibrary1.name,
          ownerId: libraryStub.externalLibrary1.ownerId,
        }),
      ]);

      expect(libraryMock.getAllByUserId).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('getStatistics', () => {
    it('can return library statistics', async () => {
      libraryMock.getStatistics.mockResolvedValue({ photos: 10, videos: 0, total: 10, usage: 1337 });
      await expect(sut.getStatistics(authStub.admin, libraryStub.uploadLibrary1.id)).resolves.toEqual({
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
      it('can create with default settings', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.EXTERNAL,
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
            name: 'New External Library',
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: [],
            isVisible: true,
          }),
        );
      });

      it('can create with name', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.EXTERNAL,
            name: 'My Awesome Library',
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
            name: 'My Awesome Library',
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: [],
            isVisible: true,
          }),
        );
      });

      it('can create invisible', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.EXTERNAL,
            isVisible: false,
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
            name: 'New External Library',
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: [],
            isVisible: false,
          }),
        );
      });

      it('can create with import paths', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create(authStub.admin, {
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
            name: 'New External Library',
            type: LibraryType.EXTERNAL,
            importPaths: ['/data/images', '/data/videos'],
            exclusionPatterns: [],
            isVisible: true,
          }),
        );
      });

      it('can create with exclusion patterns', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
        await expect(
          sut.create(authStub.admin, {
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
            name: 'New External Library',
            type: LibraryType.EXTERNAL,
            importPaths: [],
            exclusionPatterns: ['*.tmp', '*.bak'],
            isVisible: true,
          }),
        );
      });
    });

    describe('upload library', () => {
      it('can create with default settings', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.uploadLibrary1);
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.UPLOAD,
          }),
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
            name: 'New Upload Library',
            type: LibraryType.UPLOAD,
            importPaths: [],
            exclusionPatterns: [],
            isVisible: true,
          }),
        );
      });

      it('can create with name', async () => {
        libraryMock.create.mockResolvedValue(libraryStub.uploadLibrary1);
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.UPLOAD,
            name: 'My Awesome Library',
          }),
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
            isVisible: true,
          }),
        );
      });

      it('can not create with import paths', async () => {
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.UPLOAD,
            importPaths: ['/data/images', '/data/videos'],
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(libraryMock.create).not.toHaveBeenCalled();
      });

      it('can not create with exclusion patterns', async () => {
        await expect(
          sut.create(authStub.admin, {
            type: LibraryType.UPLOAD,
            exclusionPatterns: ['*.tmp', '*.bak'],
          }),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(libraryMock.create).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleQueueCleanup', () => {
    it('can queue cleanup jobs', async () => {
      libraryMock.getAllDeleted.mockResolvedValue([libraryStub.uploadLibrary1, libraryStub.externalLibrary1]);
      await expect(sut.handleQueueCleanup()).resolves.toBe(true);

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.LIBRARY_DELETE, data: { id: libraryStub.uploadLibrary1.id } }],
        [{ name: JobName.LIBRARY_DELETE, data: { id: libraryStub.externalLibrary1.id } }],
      ]);
    });
  });

  describe('update', () => {
    it('can update library ', async () => {
      libraryMock.update.mockResolvedValue(libraryStub.uploadLibrary1);
      await expect(sut.update(authStub.admin, authStub.admin.id, {})).resolves.toBeTruthy();
      expect(libraryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: authStub.admin.id,
        }),
      );
    });
  });

  describe('handleDeleteLibrary', () => {
    it('can not delete a nonexistent library', async () => {
      libraryMock.get.mockImplementation(async () => {
        return null;
      });
      libraryMock.getAssetIds.mockResolvedValue([]);
      libraryMock.delete.mockImplementation(async () => {});

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(false);
    });

    it('can delete an empty library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.getAssetIds.mockResolvedValue([]);
      libraryMock.delete.mockImplementation(async () => {});

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(true);
    });

    it('can delete a library with assets', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);
      libraryMock.getAssetIds.mockResolvedValue([assetStub.image1.id]);
      libraryMock.delete.mockImplementation(async () => {});

      assetMock.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleDeleteLibrary({ id: libraryStub.uploadLibrary1.id })).resolves.toBe(true);
    });
  });

  describe('queueScan', () => {
    it('can queue a library scan of external library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(authStub.admin, libraryStub.externalLibrary1.id, {});

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

    it('can not queue a library scan of upload library', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary1);

      await expect(sut.queueScan(authStub.admin, libraryStub.uploadLibrary1.id, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(jobMock.queue).not.toBeCalled();
    });

    it('can queue a library scan of all modified assets', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(authStub.admin, libraryStub.externalLibrary1.id, { refreshModifiedFiles: true });

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

    it('can queue a forced library scan', async () => {
      libraryMock.get.mockResolvedValue(libraryStub.externalLibrary1);

      await sut.queueScan(authStub.admin, libraryStub.externalLibrary1.id, { refreshAllFiles: true });

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
    it('can queue the trash job', async () => {
      await sut.queueRemoveOffline(authStub.admin, libraryStub.externalLibrary1.id);

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
    it('can queue the refresh job', async () => {
      libraryMock.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

      await expect(sut.handleQueueAllScan({})).resolves.toBe(true);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_QUEUE_CLEANUP,
            data: {},
          },
        ],
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

    it('can queue the force refresh job', async () => {
      libraryMock.getAll.mockResolvedValue([libraryStub.externalLibrary1]);

      await expect(sut.handleQueueAllScan({ force: true })).resolves.toBe(true);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.LIBRARY_QUEUE_CLEANUP,
            data: {},
          },
        ],
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

  describe('handleEmptyTrash', () => {
    it('can queue trash deletion jobs', async () => {
      assetMock.getWith.mockResolvedValue({ items: [assetStub.image1], hasNextPage: false });
      assetMock.getById.mockResolvedValue(assetStub.image1);

      await expect(sut.handleOfflineRemoval({ id: libraryStub.externalLibrary1.id })).resolves.toBe(true);

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.ASSET_DELETION,
            data: { id: assetStub.image1.id, fromExternal: true },
          },
        ],
      ]);
    });
  });
});
