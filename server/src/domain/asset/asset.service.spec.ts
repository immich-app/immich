import { BadRequestException } from '@nestjs/common';
import {
  assetEntityStub,
  authStub,
  IAccessRepositoryMock,
  libraryEntityStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newStorageRepositoryMock,
  userEntityStub,
} from '@test';
import { when } from 'jest-when';
import mock from 'mock-fs';
import { Readable } from 'stream';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { IAssetRepository } from './asset.repository';
import { AssetService } from './asset.service';
import { DownloadResponseDto } from './index';
import { mapAsset } from './response-dto';

const downloadResponse: DownloadResponseDto = {
  totalSize: 105_000,
  archives: [
    {
      assetIds: ['asset-id', 'asset-id'],
      size: 105_000,
    },
  ],
};

describe(AssetService.name, () => {
  let sut: AssetService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: jest.Mocked<IAssetRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    storageMock = newStorageRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);
  });

  describe('getMapMarkers', () => {
    it('should get geo information of assets', async () => {
      assetMock.getMapMarkers.mockResolvedValue(
        [assetEntityStub.withLocation].map((asset) => ({
          id: asset.id,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lat: asset.exifInfo!.latitude!,

          /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
          lon: asset.exifInfo!.longitude!,
        })),
      );

      const markers = await sut.getMapMarkers(authStub.user1, {});

      expect(markers).toHaveLength(1);
      expect(markers[0]).toEqual({
        id: assetEntityStub.withLocation.id,
        lat: 100,
        lon: 100,
      });
    });
  });

  describe('getMemoryLane', () => {
    it('should get pictures for each year', async () => {
      assetMock.getByDate.mockResolvedValue([]);

      await expect(sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15), years: 10 })).resolves.toEqual(
        [],
      );

      expect(assetMock.getByDate).toHaveBeenCalledTimes(10);
      expect(assetMock.getByDate.mock.calls).toEqual([
        [authStub.admin.id, new Date('2022-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2021-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2020-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2019-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2018-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2017-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2016-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2015-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2014-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2013-06-15T00:00:00.000Z')],
      ]);
    });

    it('should keep hours from the date', async () => {
      assetMock.getByDate.mockResolvedValue([]);

      await expect(
        sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15, 5), years: 2 }),
      ).resolves.toEqual([]);

      expect(assetMock.getByDate).toHaveBeenCalledTimes(2);
      expect(assetMock.getByDate.mock.calls).toEqual([
        [authStub.admin.id, new Date('2022-06-15T05:00:00.000Z')],
        [authStub.admin.id, new Date('2021-06-15T05:00:00.000Z')],
      ]);
    });

    it('should set the title correctly', async () => {
      when(assetMock.getByDate)
        .calledWith(authStub.admin.id, new Date('2022-06-15T00:00:00.000Z'))
        .mockResolvedValue([assetEntityStub.image]);
      when(assetMock.getByDate)
        .calledWith(authStub.admin.id, new Date('2021-06-15T00:00:00.000Z'))
        .mockResolvedValue([assetEntityStub.video]);

      await expect(sut.getMemoryLane(authStub.admin, { timestamp: new Date(2023, 5, 15), years: 2 })).resolves.toEqual([
        { title: '1 year since...', assets: [mapAsset(assetEntityStub.image)] },
        { title: '2 years since...', assets: [mapAsset(assetEntityStub.video)] },
      ]);

      expect(assetMock.getByDate).toHaveBeenCalledTimes(2);
      expect(assetMock.getByDate.mock.calls).toEqual([
        [authStub.admin.id, new Date('2022-06-15T00:00:00.000Z')],
        [authStub.admin.id, new Date('2021-06-15T00:00:00.000Z')],
      ]);
    });
  });

  describe('downloadFile', () => {
    it('should require the asset.download permission', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(false);
      accessMock.asset.hasAlbumAccess.mockResolvedValue(false);
      accessMock.asset.hasPartnerAccess.mockResolvedValue(false);

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
      expect(accessMock.asset.hasAlbumAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
      expect(accessMock.asset.hasPartnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'asset-1');
    });

    it('should throw an error if the asset is not found', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByIds.mockResolvedValue([]);

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1']);
    });

    it('should download a file', async () => {
      const stream = new Readable();

      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image]);
      storageMock.createReadStream.mockResolvedValue({ stream });

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).resolves.toEqual({ stream });

      expect(storageMock.createReadStream).toHaveBeenCalledWith(
        assetEntityStub.image.originalPath,
        assetEntityStub.image.mimeType,
      );
    });

    it('should download an archive', async () => {
      const archiveMock = {
        addFile: jest.fn(),
        finalize: jest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.noResizePath, assetEntityStub.noWebpPath]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(2, 'upload/library/IMG_456.jpg', 'IMG_456.jpg');
    });

    it('should handle duplicate file names', async () => {
      const archiveMock = {
        addFile: jest.fn(),
        finalize: jest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.noResizePath, assetEntityStub.noResizePath]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(2, 'upload/library/IMG_123.jpg', 'IMG_123+1.jpg');
    });
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
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryEntityStub.importLibrary.id,
        ownerId: userEntityStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
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
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryEntityStub.importLibrary.id,
        ownerId: userEntityStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError('Unsupported file type image/potato');
    });

    it('should add a new asset', async () => {
      mock({
        '/import/photo.jpg': Buffer.from([8, 6, 7, 5, 3, 0, 9]),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryEntityStub.importLibrary.id,
        ownerId: userEntityStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetEntityStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetEntityStub.image.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetEntityStub.image.id,
        },
      });
    });

    it('should offline a missing asset', async () => {
      mock({});

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetEntityStub.image.libraryId,
        ownerId: assetEntityStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetEntityStub.image);
      assetMock.create.mockResolvedValue(assetEntityStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetEntityStub.image.id, isOffline: true });

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
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetEntityStub.offlineImage.libraryId,
        ownerId: assetEntityStub.offlineImage.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetEntityStub.offlineImage);
      assetMock.create.mockResolvedValue(assetEntityStub.offlineImage);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

      expect(assetMock.update).toHaveBeenCalledWith({ id: assetEntityStub.offlineImage.id, isOffline: false });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.METADATA_EXTRACTION,
        data: {
          id: assetEntityStub.offlineImage.id,
          source: 'upload',
        },
      });

      expect(jobMock.queue).not.toHaveBeenCalledWith({
        name: JobName.VIDEO_CONVERSION,
        data: {
          id: assetEntityStub.offlineImage.id,
        },
      });
    });

    it('should do nothing when mtime matches existing asset', async () => {
      mock({
        '/import/photo.jpg': mock.file({
          content: Buffer.from([8, 6, 7, 5, 3, 0, 9]),
          ctime: new Date(1),
          mtime: assetEntityStub.image.fileModifiedAt,
        }),
      });

      jest.mock('mime', () => ({
        lookup: jest.fn().mockReturnValue('image/jpeg'),
      }));

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: assetEntityStub.image.libraryId,
        ownerId: assetEntityStub.image.ownerId,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetEntityStub.image);
      assetMock.create.mockResolvedValue(assetEntityStub.image);

      expect(assetMock.update).not.toHaveBeenCalled();
      expect(assetMock.save).not.toHaveBeenCalled();

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);
    });

    it('should refresh an existing asset with modified mtime', async () => {
      const filemtime = new Date();
      filemtime.setSeconds(assetEntityStub.image.fileModifiedAt.getSeconds() + 10);
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
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryEntityStub.importLibrary.id,
        ownerId: userEntityStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(assetEntityStub.image);
      assetMock.create.mockResolvedValue(assetEntityStub.image);

      await expect(sut.handleRefreshAsset(mockLibraryJob)).resolves.toBe(true);

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
      const { AssetService } = require('./asset.service');
      sut = new AssetService(accessMock, assetMock, storageMock, cryptoMock, jobMock);

      const mockLibraryJob: ILibraryJob = {
        libraryId: libraryEntityStub.importLibrary.id,
        ownerId: userEntityStub.admin.id,
        assetPath: '/import/photo.jpg',
        forceRefresh: false,
        emptyTrash: false,
      };

      assetMock.getByLibraryIdAndOriginalPath.mockResolvedValue(null);
      assetMock.create.mockResolvedValue(assetEntityStub.image);

      await expect(async () => {
        await sut.handleRefreshAsset(mockLibraryJob);
      }).rejects.toThrowError("ENOENT, no such file or directory '/import/photo.jpg'");
    });
  });

  describe('getDownloadInfo', () => {
    it('should throw an error for an invalid dto', async () => {
      await expect(sut.getDownloadInfo(authStub.admin, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return a list of archives (assetIds)', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByIds.mockResolvedValue([assetEntityStub.image, assetEntityStub.video]);

      const assetIds = ['asset-1', 'asset-2'];
      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual(downloadResponse);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1', 'asset-2']);
    });

    it('should return a list of archives (albumId)', async () => {
      accessMock.album.hasOwnerAccess.mockResolvedValue(true);
      assetMock.getByAlbumId.mockResolvedValue({
        items: [assetEntityStub.image, assetEntityStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { albumId: 'album-1' })).resolves.toEqual(downloadResponse);

      expect(accessMock.album.hasOwnerAccess).toHaveBeenCalledWith(authStub.admin.id, 'album-1');
      expect(assetMock.getByAlbumId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, 'album-1');
    });

    it('should return a list of archives (userId)', async () => {
      assetMock.getByUserId.mockResolvedValue({
        items: [assetEntityStub.image, assetEntityStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { userId: authStub.admin.id })).resolves.toEqual(
        downloadResponse,
      );

      expect(assetMock.getByUserId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, authStub.admin.id);
    });

    it('should split archives by size', async () => {
      assetMock.getByUserId.mockResolvedValue({
        items: [
          { ...assetEntityStub.image, id: 'asset-1' },
          { ...assetEntityStub.video, id: 'asset-2' },
          { ...assetEntityStub.withLocation, id: 'asset-3' },
          { ...assetEntityStub.noWebpPath, id: 'asset-4' },
        ],
        hasNextPage: false,
      });

      await expect(
        sut.getDownloadInfo(authStub.admin, {
          userId: authStub.admin.id,
          archiveSize: 30_000,
        }),
      ).resolves.toEqual({
        totalSize: 251_456,
        archives: [
          { assetIds: ['asset-1', 'asset-2'], size: 105_000 },
          { assetIds: ['asset-3', 'asset-4'], size: 146_456 },
        ],
      });
    });

    it('should include the video portion of a live photo', async () => {
      accessMock.asset.hasOwnerAccess.mockResolvedValue(true);
      when(assetMock.getByIds)
        .calledWith([assetEntityStub.livePhotoStillAsset.id])
        .mockResolvedValue([assetEntityStub.livePhotoStillAsset]);
      when(assetMock.getByIds)
        .calledWith([assetEntityStub.livePhotoMotionAsset.id])
        .mockResolvedValue([assetEntityStub.livePhotoMotionAsset]);

      const assetIds = [assetEntityStub.livePhotoStillAsset.id];
      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual({
        totalSize: 125_000,
        archives: [
          {
            assetIds: [assetEntityStub.livePhotoStillAsset.id, assetEntityStub.livePhotoMotionAsset.id],
            size: 125_000,
          },
        ],
      });
    });
  });
});
