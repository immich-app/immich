import { BadRequestException } from '@nestjs/common';
import { DownloadResponseDto } from 'src/dtos/download.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { DownloadService } from 'src/services/download.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import { vitest } from 'vitest';

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
  let mocks: ServiceMocks;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DownloadService));
  });

  describe('downloadArchive', () => {
    it('should skip asset ids that could not be found', async () => {
      const archiveMock = {
        addFile: vitest.fn(),
        finalize: vitest.fn(),
        stream: new Readable(),
      };

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.asset.getByIds.mockResolvedValue([{ ...assetStub.noResizePath, id: 'asset-1' }]);
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.storage.realpath.mockRejectedValue(new Error('Could not read file'));
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noWebpPath, id: 'asset-2' },
      ]);
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

      await expect(sut.downloadArchive(authStub.admin, { assetIds: ['asset-1', 'asset-2'] })).resolves.toEqual({
        stream: archiveMock.stream,
      });

      expect(mocks.logger.warn).toHaveBeenCalledTimes(2);
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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noWebpPath, id: 'asset-2' },
      ]);
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1' },
        { ...assetStub.noResizePath, id: 'asset-2' },
      ]);
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-2' },
        { ...assetStub.noResizePath, id: 'asset-1' },
      ]);
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      mocks.asset.getByIds.mockResolvedValue([
        { ...assetStub.noResizePath, id: 'asset-1', originalPath: '/path/to/symlink.jpg' },
      ]);
      mocks.storage.realpath.mockResolvedValue('/path/to/realpath.jpg');
      mocks.storage.createZipStream.mockReturnValue(archiveMock);

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
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1', 'asset-2']));
      mocks.asset.getByIds.mockResolvedValue([assetStub.image, assetStub.video]);

      const assetIds = ['asset-1', 'asset-2'];
      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual(downloadResponse);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith(['asset-1', 'asset-2'], { exifInfo: true });
    });

    it('should return a list of archives (albumId)', async () => {
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-1']));
      mocks.asset.getByAlbumId.mockResolvedValue({
        items: [assetStub.image, assetStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { albumId: 'album-1' })).resolves.toEqual(downloadResponse);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-1']));
      expect(mocks.asset.getByAlbumId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, 'album-1');
    });

    it('should return a list of archives (userId)', async () => {
      mocks.asset.getByUserId.mockResolvedValue({
        items: [assetStub.image, assetStub.video],
        hasNextPage: false,
      });

      await expect(sut.getDownloadInfo(authStub.admin, { userId: authStub.admin.user.id })).resolves.toEqual(
        downloadResponse,
      );

      expect(mocks.asset.getByUserId).toHaveBeenCalledWith({ take: 2500, skip: 0 }, authStub.admin.user.id, {
        isVisible: true,
      });
    });

    it('should split archives by size', async () => {
      mocks.asset.getByUserId.mockResolvedValue({
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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      mocks.asset.getByIds.mockImplementation(
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

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      mocks.asset.getByIds.mockImplementation(
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
