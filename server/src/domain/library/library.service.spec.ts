import { UserEntity } from '@app/infra/entities';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  assetStub,
  authStub,
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
import { IAccessRepository } from '../access';
import { IAssetRepository } from '../asset';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, ILibraryFileJob, IOfflineLibraryFileJob, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import { ILibraryRepository, LibraryService } from './index';

const mockRequirePermission = jest.fn().mockResolvedValue(true);
const mockIsImage = jest.fn();
const mockIsVideo = jest.fn();
const mockIsAsset = jest.fn();

jest.mock('../access', () => {
  return {
    AccessCore: jest.fn().mockImplementation(() => {
      return {
        requirePermission: mockRequirePermission,
      };
    }),
    Permission: jest.requireActual('../access'),
  };
});

jest.doMock('../domain.constant', () => ({
  mimeTypes: {
    isImage: mockIsImage,
    isVideo: mockIsVideo,
    isAsset: mockIsAsset,
  },
}));

describe(LibraryService.name, () => {
  let sut: LibraryService;

  let accessMock: jest.Mocked<IAccessRepository>;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let userMock: jest.Mocked<IUserRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  const createLibraryService = () => {
    // We can't import library service the normal way due to some mocking load order issues

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { LibraryService } = require('./library.service');

    sut = new LibraryService(accessMock, userMock, libraryMock, assetMock, jobMock, cryptoMock, storageMock);
  };

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

    mockIsImage.mockReturnValue(true);
    mockIsVideo.mockReturnValue(false);
    mockIsAsset.mockReturnValue(true);

    mockRequirePermission.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should work', () => {
    createLibraryService();

    expect(sut).toBeDefined();
  });

  describe('handleRefreshAsset', () => {
    let mockUser: UserEntity;

    beforeEach(() => {
      jest.resetModules();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);
    });

    it('should reject an unknown file extension', async () => {
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        analyze: false,
        emptyTrash: false,
      };

      mockIsImage.mockReturnValue(false);
      mockIsVideo.mockReturnValue(false);
      mockIsAsset.mockReturnValue(false);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);

      await expect(async () => {
        await sut.handleAssetRefresh(mockLibraryJob);
      }).rejects.toThrowError('Unsupported file type /data/user1/file.xyz');
    });

    it('should reject an unknown file type', async () => {
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/file.xyz',
        analyze: false,
        emptyTrash: false,
      };

      mockIsImage.mockReturnValue(false);
      mockIsVideo.mockReturnValue(false);
      mockIsAsset.mockReturnValue(true);

      await expect(async () => {
        await sut.handleAssetRefresh(mockLibraryJob);
      }).rejects.toThrowError('Unknown error when checking file type of /data/user1/file.xyz');
    });

    it('should add a new image', async () => {
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
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
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/video.mp4',
        analyze: false,
        emptyTrash: false,
      };

      mockIsImage.mockReturnValue(false);
      mockIsVideo.mockReturnValue(true);
      mockIsAsset.mockReturnValue(true);

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
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
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
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
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

    it('should reject an asset if the user cannot be found', async () => {
      createLibraryService();

      userMock.get.mockResolvedValue(null);

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("User has no external path set, can't import asset"),
      );
    });

    it('should reject an asset if external path is not set', async () => {
      createLibraryService();

      mockUser = userStub.admin;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("User has no external path set, can't import asset"),
      );
    });

    it("should reject an asset if it isn't in the external path", async () => {
      createLibraryService();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/etc/rootpassword.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("Asset must be within the user's external path"),
      );
    });

    it('should reject an asset if directory traversal is attempted', async () => {
      createLibraryService();

      mockUser = userStub.externalPath;
      userMock.get.mockResolvedValue(mockUser);

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: mockUser.id,
        assetPath: '/data/user1/../../etc/rootpassword.jpg',
        analyze: false,
        emptyTrash: false,
      };

      expect(sut.handleAssetRefresh(mockLibraryJob)).rejects.toThrow(
        new BadRequestException("Asset must be within the user's external path"),
      );
    });

    it('should offline a missing asset', async () => {
      storageMock.stat.mockImplementation(() => {
        throw new Error();
      });

      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.image.id, isOffline: true });

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should online a previously-offline asset', async () => {
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: assetStub.offlineImage.libraryId,
        ownerId: mockUser.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.offlineImage);
      assetMock.create.mockResolvedValue(assetStub.offlineImage);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({ id: assetStub.offlineImage.id, isOffline: false });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetStub.offlineImage.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetStub.offlineImage.id,
        },
      });
    });

    it('should do nothing when mtime matches existing asset', async () => {
      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      expect(assetMock.save).not.toHaveBeenCalled();

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetStub.image.fileModifiedAt.getSeconds() + 10);

      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      storageMock.stat.mockResolvedValue({
        size: 100,
        mtime: filemtime,
        ctime: new Date('2023-01-01'),
      } as Stats);

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(sut.handleAssetRefresh(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.create).toHaveBeenCalled();
      const createdAsset = assetMock.create.mock.calls[0][0];

      expect(createdAsset.fileModifiedAt).toEqual(filemtime);
    });

    it('should error when asset does not exist', async () => {
      storageMock.stat.mockImplementation(() => {
        throw new Error("ENOENT, no such file or directory '/data/user1/photo.jpg'");
      });

      createLibraryService();

      const mockLibraryJob: ILibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        ownerId: userStub.admin.id,
        assetPath: '/data/user1/photo.jpg',
        analyze: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(async () => {
        await sut.handleAssetRefresh(mockLibraryJob);
      }).rejects.toThrowError("ENOENT, no such file or directory '/data/user1/photo.jpg'");
    });
  });

  describe('handleOfflineAsset', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should mark an asset as offline', async () => {
      createLibraryService();

      const offlineJob: IOfflineLibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        assetPath: '/data/user1/photo.jpg',
        assetId: assetStub.image.id,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);

      await expect(sut.handleOfflineAsset(offlineJob)).resolves.toBe(true);

      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetStub.image.id,
        isOffline: true,
      });
    });

    it('should delete a missing asset when emptying trash', async () => {
      createLibraryService();

      const offlineJob: IOfflineLibraryFileJob = {
        libraryId: libraryStub.externalLibrary1.id,
        assetPath: '/data/user1/photo.jpg',
        assetId: assetStub.image.id,
        emptyTrash: true,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.getById.mockResolvedValue(assetStub.image);

      await expect(sut.handleOfflineAsset(offlineJob)).resolves.toBe(true);

      expect(assetMock.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should delete a library', async () => {
      createLibraryService();

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);

      await sut.delete(authStub.admin, libraryStub.externalLibrary1.id);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_LIBRARY,
        data: { libraryId: libraryStub.externalLibrary1.id },
      });
    });
  });

  describe('getCount', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should call the repository', async () => {
      createLibraryService();

      libraryMock.getCountForUser.mockResolvedValue(17);

      await expect(sut.getCount(authStub.admin)).resolves.toBe(17);

      expect(libraryMock.getCountForUser).toHaveBeenCalledWith(authStub.admin.id);
    });
  });

  describe('get', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('can return a library', async () => {
      createLibraryService();

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

    it('can error when library is not found', async () => {
      createLibraryService();

      libraryMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.admin, libraryStub.library1.id)).rejects.toThrowError(
        new NotFoundException('Library Not Found'),
      );

      expect(libraryMock.get).toHaveBeenCalledWith(libraryStub.library1.id);
    });
  });

  describe('getStatistics', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('can return library statistics', async () => {
      createLibraryService();

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
    beforeEach(() => {
      jest.resetModules();
    });

    it('can create a library', async () => {
      createLibraryService();

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
      createLibraryService();

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
