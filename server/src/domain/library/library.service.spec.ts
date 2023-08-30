import { UserEntity } from '@app/infra/entities';
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

import { ILibraryRepository } from './library.repository';
import { LibraryService } from './library.service';
import { IAssetRepository, ICryptoRepository, IStorageRepository, IUserRepository } from '..';

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
            name: JobName.LIBRARY_REFRESH_ASSET,
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

      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary);

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

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.video.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.video.id,
        },
      });
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
      libraryMock.get.mockResolvedValue(libraryStub.uploadLibrary);

      await expect(sut.delete(authStub.admin, libraryStub.uploadLibrary.id)).rejects.toBeInstanceOf(
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
      libraryMock.get.mockResolvedValue(libraryStub.library1);
      await expect(sut.get(authStub.admin, libraryStub.library1.id)).resolves.toEqual(
        expect.objectContaining({
          id: libraryStub.library1.id,
          name: libraryStub.library1.name,
          ownerId: libraryStub.library1.ownerId,
        }),
      );

      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.library1.id);
    });

    it('should throw an error when a library is not found', async () => {
      libraryMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.admin, libraryStub.library1.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.library1.id);
    });
  });

  describe('getStatistics', () => {
    it('can return library statistics', async () => {
      libraryMock.getStatistics.mockResolvedValue({ photos: 10, videos: 0, total: 10, usage: 1337 });
      await expect(sut.getStatistics(authStub.admin, libraryStub.library1.id)).resolves.toEqual({
        photos: 10,
        videos: 0,
        total: 10,
        usage: 1337,
      });

      expect(libraryMock.getStatistics).toHaveBeenCalledWith(libraryStub.library1.id);
    });
  });

  describe('create', () => {
    it('can create a library', async () => {
      libraryMock.create.mockResolvedValue(libraryStub.externalLibrary1);
      await expect(
        sut.create(authStub.admin, {
          name: libraryStub.externalLibrary1.name,
          type: libraryStub.externalLibrary1.type,
          importPaths: [],
          exclusionPatterns: [],
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          id: libraryStub.externalLibrary1.id,
          name: libraryStub.externalLibrary1.name,
          ownerId: libraryStub.externalLibrary1.ownerId,
          assetCount: 0,
        }),
      );

      expect(libraryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: libraryStub.externalLibrary1.name,
          type: libraryStub.externalLibrary1.type,
          importPaths: [],
          exclusionPatterns: [],
          isVisible: true,
        }),
      );
    });

    it('can create a library with non-default parameters', async () => {
      const mockImportPaths = ['/data/user1', '/data/user2'];
      const mockExclusionPatterns = ['*.tmp', '*.bak'];

      const mockLibraryEntity = {
        ...libraryStub.externalLibrary1,
        importPaths: mockImportPaths,
        exclusionPatterns: mockExclusionPatterns,
        isVisible: false,
      };

      libraryMock.create.mockResolvedValue(mockLibraryEntity);
      await expect(
        sut.create(authStub.admin, {
          name: libraryStub.externalLibrary1.name,
          type: libraryStub.externalLibrary1.type,
          importPaths: mockImportPaths,
          exclusionPatterns: mockExclusionPatterns,
          isVisible: false,
        }),
      ).resolves.toEqual(
        expect.objectContaining({
          id: libraryStub.externalLibrary1.id,
          name: libraryStub.externalLibrary1.name,
          ownerId: libraryStub.externalLibrary1.ownerId,
          assetCount: 0,
          importPaths: mockImportPaths,
          exclusionPatterns: mockExclusionPatterns,
        }),
      );

      expect(libraryMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: libraryStub.externalLibrary1.name,
          type: libraryStub.externalLibrary1.type,
          importPaths: mockImportPaths,
          exclusionPatterns: mockExclusionPatterns,
          isVisible: false,
        }),
      );
    });
  });
});
