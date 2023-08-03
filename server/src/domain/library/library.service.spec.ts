import {
  assetStub,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newLibraryRepositoryMock,
  userStub,
} from '@test';
import { libraryStub } from '@test/fixtures/library.stub';
import mock from 'mock-fs';
import { IAssetRepository } from '../asset';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { ILibraryRepository, LibraryService } from './index';

describe(LibraryService.name, () => {
  let libraryService: LibraryService;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;

  it('should work', () => {
    expect(libraryService).toBeDefined();
  });

  beforeEach(async () => {
    libraryMock = newLibraryRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();

    libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);
  });

  describe('handleRefreshAsset', () => {
    afterEach(() => {
      mock.restore();
    });

    beforeEach(() => {
      jest.resetModules();
    });

    it('should reject an unknown mime type', async () => {
      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue(null),
      }));

      mock({
        '/import/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await libraryService.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError('Cannot determine mime type of asset: /import/photo.jpg');
    });

    it('should reject an invalid mime type', async () => {
      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/potato'),
      }));

      mock({
        '/import/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await libraryService.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError('Unsupported file type image/potato');
    });

    it('should add a new image', async () => {
      mock({
        '/import/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

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
      mock({
        '/import/video.mp4': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('video/mp4'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/video.mp4',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.video);

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

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

    it('should offline a missing asset', async () => {
      mock({});

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.image.id, isOffline: true });

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should online a previously-offline asset', async () => {
      mock({
        '/import/photo.jpg': mock.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: new Date(1),
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.offlineImage.libraryId,
        ownerId: assetStub.offlineImage.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.offlineImage);
      assetMock.create.mockResolvedValue(assetStub.offlineImage);

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.offlineImage.id, isOffline: false });

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
      mock({
        '/import/photo.jpg': mock.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: assetStub.image.fileModifiedAt,
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetStub.image.libraryId,
        ownerId: assetStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetStub.image.fileModifiedAt.getSeconds() + 10);
      mock({
        '/import/photo.jpg': mock.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: filemtime,
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetStub.image);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(libraryService.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.create).toHaveBeenCalled();
      const createdAsset = assetMock.create.mock.calls[0][0];

      expect(createdAsset.fileModifiedAt).toEqual(filemtime);
    });

    it('should error when asset does not exist', async () => {
      mock({});

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LibraryService } = require('./library.service');
      libraryService = new LibraryService(libraryMock, assetMock, jobMock, cryptoMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryStub.importLibrary.id,
        ownerId: userStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetStub.image);

      await expect(async () => {
        await libraryService.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError("ENOENT, no such file or directory '/import/photo.jpg'");
    });
  });
});
