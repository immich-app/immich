import { BadRequestException } from '@nestjs/common';
import { DownloadResponseDto } from 'src/dtos/download.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { DownloadService } from 'src/services/download.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { IAccessRepositoryMock } from 'test/repositories/access.repository.mock';
import { newTestService } from 'test/utils';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import { Mocked, vitest } from 'vitest';

const downloadResponse: DownloadResponseDto = {
  totalSize: 105_000,
  archives: [
    {
      assetIds: ['asset-id', 'asset-id'],
      size: 105_000,
    },
  ],
};

describe(DownloadService.name, () => {
  let sut: DownloadService;
  let accessMock: IAccessRepositoryMock;
  let assetMock: Mocked<IAssetRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let storageMock: Mocked<IStorageRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, accessMock, assetMock, loggerMock, storageMock } = newTestService(DownloadService));
  });

  describe('downloadArchive', () => {
    it('should skip asset ids that could not be found', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      assetMock.getByIds.mockResolvedValue([{ ...assetStub.noResizePath, id: 'asset-1' }]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledTimes(1);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
    });

    it('should log a warning if the original path could not be resolved', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      storageMock.realpath.mockRejectedValue(new Error('Could not read file'));
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noWebpPath, id: 'asset-2' },
      ]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(loggerMock.warn).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(2, 'upload/library/IMG_456.jpg', 'IMG_456.jpg');
    });

    it('should download an archive', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noWebpPath, id: 'asset-2' },
      ]);
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
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noResizePath, id: 'asset-2' },
      ]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(2, 'upload/library/IMG_123.jpg', 'IMG_123+1.jpg');
    });

    it('should be deterministic', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-2' },
        { ...assetStub.noResizePath, id: 'asset-1' },
      ]);
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledTimes(2);
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(1, 'upload/library/IMG_123.jpg', 'IMG_123.jpg');
      expect(archiveMock.addFile).toHaveBeenNthCalledWith(2, 'upload/library/IMG_123.jpg', 'IMG_123+1.jpg');
    });

    it('should resolve symlinks', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1', originalPath: '/path/to/symlink.jpg' },
      ]);
      storageMock.realpath.mockResolvedValue('/path/to/realpath.jpg');
      storageMock.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(archiveMock.addFile).toHaveBeenCalledWith('/path/to/realpath.jpg', 'IMG_123.jpg');
    });
  });

  describe('getDownloadInfo', () => {
    it('should throw an error for an invalid dto', async () => {
      await expect(sut.getDownloadInfo(authStub.admin, {})).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should return a list of archives (assetIds)', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      assetMock.getByIds.mockResolvedValue([assetStub.image, assetStub.video]);

      const assetIds = ['asset-1', 'asset-2'];
      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual(downloadResponse);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1', 'asset-2'], { exifInfo: true });
    });

    it('should return a list of archives (albumId)', async () => {
      accessMock.album.checkOwnerAccess.mockResolvedValue(new Set(['album-1']));
      assetMock.getByAlbumId.mockResolvedValue({
        items: [assetStub.image, assetStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { albumId: 'album-1' })).resolves.toEqual(downloadResponse);

      expect(accessMock.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-1']));
      expect(assetMock.getByAlbumId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, 'album-1');
    });

    it('should return a list of archives (userId)', async () => {
      assetMock.getByUserId.mockResolvedValue({
        items: [assetStub.image, assetStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { userId: authStub.admin.user.id })).resolves.toEqual(
        downloadResponse,
      );

      expect(assetMock.getByUserId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, authStub.admin.user.id, {
        isVisible: true,
      });
    });

    it('should split archives by size', async () => {
      assetMock.getByUserId.mockResolvedValue({
        items: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.video, id: 'asset-2' },
          { ...assetStub.withLocation, id: 'asset-3' },
          { ...assetStub.noWebpPath, id: 'asset-4' },
        ],
        hasNextPage: false,
      });

      await expect(
        sut.getDownloadInfo(authStub.admin, {
          userId: authStub.admin.user.id,
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
      const assetIds = [assetStub.livePhotoStillAsset.id];
      const assets = [assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset];

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      assetMock.getByIds.mockImplementation(
        (ids) =>
          Promise.resolve(
            ids.map((id) => assets.find((asset) => asset.id === id)).filter((asset) => !!asset),
          ) as Promise<AssetEntity[]>,
      );

      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual({
        totalSize: 125_000,
        archives: [
          {
            assetIds: [assetStub.livePhotoStillAsset.id, assetStub.livePhotoMotionAsset.id],
            size: 125_000,
          },
        ],
      });
    });

    it('should skip the video portion of an android live photo by default', async () => {
      const assetIds = [assetStub.livePhotoStillAsset.id];
      const assets = [
        assetStub.livePhotoStillAsset,
        { ...assetStub.livePhotoMotionAsset, originalPath: 'upload/encoded-video/uuid-MP.mp4' },
      ];

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      assetMock.getByIds.mockImplementation(
        (ids) =>
          Promise.resolve(
            ids.map((id) => assets.find((asset) => asset.id === id)).filter((asset) => !!asset),
          ) as Promise<AssetEntity[]>,
      );

      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual({
        totalSize: 25_000,
        archives: [
          {
            assetIds: [assetStub.livePhotoStillAsset.id],
            size: 25_000,
          },
        ],
      });
    });
  });
});
