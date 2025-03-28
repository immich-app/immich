import { BadRequestException } from '@nestjs/common';
import { DownloadResponseDto } from 'src/dtos/download.dto';
import { DownloadService } from 'src/services/download.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import { vitest } from 'vitest';

const downloadResponse: DownloadResponseDto = {
  totalSize: 105_000,
  archives: [
    {
      assetIds: ['asset-1', 'asset-2'],
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
      const assetIds = ['asset-1', 'asset-2'];

      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      mocks.downloadRepository.downloadAssetIds.mockReturnValue(
        makeStream([
          { id: 'asset-1', livePhotoVideoId: null, size: 100_000 },
          { id: 'asset-2', livePhotoVideoId: null, size: 5000 },
        ]),
      );

      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual(downloadResponse);

      expect(mocks.downloadRepository.downloadAssetIds).toHaveBeenCalledWith(['asset-1', 'asset-2']);
    });

    it('should return a list of archives (albumId)', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.access.album.checkOwnerAccess.mockResolvedValue(new Set(['album-1']));
      mocks.downloadRepository.downloadAlbumId.mockReturnValue(
        makeStream([
          { id: 'asset-1', livePhotoVideoId: null, size: 100_000 },
          { id: 'asset-2', livePhotoVideoId: null, size: 5000 },
        ]),
      );

      await expect(sut.getDownloadInfo(authStub.admin, { albumId: 'album-1' })).resolves.toEqual(downloadResponse);

      expect(mocks.access.album.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['album-1']));
      expect(mocks.downloadRepository.downloadAlbumId).toHaveBeenCalledWith('album-1');
    });

    it('should return a list of archives (userId)', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.downloadRepository.downloadUserId.mockReturnValue(
        makeStream([
          { id: 'asset-1', livePhotoVideoId: null, size: 100_000 },
          { id: 'asset-2', livePhotoVideoId: null, size: 5000 },
        ]),
      );

      await expect(sut.getDownloadInfo(authStub.admin, { userId: authStub.admin.user.id })).resolves.toEqual(
        downloadResponse,
      );

      expect(mocks.downloadRepository.downloadUserId).toHaveBeenCalledWith(authStub.admin.user.id);
    });

    it('should split archives by size', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.downloadRepository.downloadUserId.mockReturnValue(
        makeStream([
          { id: 'asset-1', livePhotoVideoId: null, size: 5000 },
          { id: 'asset-2', livePhotoVideoId: null, size: 100_000 },
          { id: 'asset-3', livePhotoVideoId: null, size: 23_456 },
          { id: 'asset-4', livePhotoVideoId: null, size: 123_000 },
        ]),
      );

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
      const assetIds = ['asset-1', 'asset-2'];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.downloadRepository.downloadAssetIds.mockReturnValue(
        makeStream([
          { id: 'asset-1', livePhotoVideoId: 'asset-3', size: 5000 },
          { id: 'asset-2', livePhotoVideoId: 'asset-4', size: 100_000 },
        ]),
      );
      mocks.downloadRepository.downloadMotionAssetIds.mockReturnValue(
        makeStream([
          { id: 'asset-3', livePhotoVideoId: null, size: 23_456, originalPath: '/path/to/file.mp4' },
          { id: 'asset-4', livePhotoVideoId: null, size: 123_000, originalPath: '/path/to/file.mp4' },
        ]),
      );

      await expect(sut.getDownloadInfo(authStub.admin, { assetIds, archiveSize: 30_000 })).resolves.toEqual({
        totalSize: 251_456,
        archives: [
          { assetIds: ['asset-1', 'asset-2'], size: 105_000 },
          { assetIds: ['asset-3', 'asset-4'], size: 146_456 },
        ],
      });
    });

    it('should skip the video portion of an android live photo by default', async () => {
      const assetIds = ['asset-1'];

      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      mocks.user.getMetadata.mockResolvedValue([]);
      mocks.downloadRepository.downloadAssetIds.mockReturnValue(
        makeStream([{ id: 'asset-1', livePhotoVideoId: 'asset-3', size: 5000 }]),
      );
      mocks.downloadRepository.downloadMotionAssetIds.mockReturnValue(
        makeStream([
          { id: 'asset-2', livePhotoVideoId: null, size: 23_456, originalPath: 'upload/encoded-video/uuid-MP.mp4' },
        ]),
      );

      await expect(sut.getDownloadInfo(authStub.admin, { assetIds })).resolves.toEqual({
        totalSize: 5000,
        archives: [
          {
            assetIds: ['asset-1'],
            size: 5000,
          },
        ],
      });
    });
  });
});
