import { BadRequestException } from '@nestjs/common';
import {
  IAccessRepositoryMock,
  assetStub,
  authStub,
  newAccessRepositoryMock,
  newAssetRepositoryMock,
  newStorageRepositoryMock,
} from '@test';
import { when } from 'jest-when';
import { Readable } from 'typeorm/platform/PlatformTools.js';
import { CacheControl, ImmichFileResponse } from '../domain.util';
import { IAssetRepository, IStorageRepository } from '../repositories';
import { DownloadResponseDto } from './download.dto';
import { DownloadService } from './download.service';

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
  let assetMock: jest.Mocked<IAssetRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    accessMock = newAccessRepositoryMock();
    assetMock = newAssetRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new DownloadService(accessMock, assetMock, storageMock);
  });

  describe('downloadFile', () => {
    it('should require the asset.download permission', async () => {
      await expect(sut.downloadFile(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(accessMock.asset.checkOwnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(accessMock.asset.checkAlbumAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
      expect(accessMock.asset.checkPartnerAccess).toHaveBeenCalledWith(authStub.admin.user.id, new Set(['asset-1']));
    });

    it('should throw an error if the asset is not found', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getByIds.mockResolvedValue([]);

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1']);
    });

    it('should throw an error if the asset is offline', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getByIds.mockResolvedValue([assetStub.offline]);

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).rejects.toBeInstanceOf(BadRequestException);

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1']);
    });

    it('should download a file', async () => {
      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-1']));
      assetMock.getByIds.mockResolvedValue([assetStub.image]);

      await expect(sut.downloadFile(authStub.admin, 'asset-1')).resolves.toEqual(
        new ImmichFileResponse({
          path: '/original/path.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.NONE,
        }),
      );
    });

    it('should download an archive', async () => {
      const archiveMock = {
        addFile: jest.fn(),
        finalize: jest.fn(),
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
        addFile: jest.fn(),
        finalize: jest.fn(),
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
        addFile: jest.fn(),
        finalize: jest.fn(),
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

      expect(assetMock.getByIds).toHaveBeenCalledWith(['asset-1', 'asset-2']);
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
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([authStub.admin.user.id]));
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
      accessMock.library.checkOwnerAccess.mockResolvedValue(new Set([authStub.admin.user.id]));

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

      accessMock.asset.checkOwnerAccess.mockResolvedValue(new Set(assetIds));
      when(assetMock.getByIds)
        .calledWith([assetStub.livePhotoStillAsset.id])
        .mockResolvedValue([assetStub.livePhotoStillAsset]);
      when(assetMock.getByIds)
        .calledWith([assetStub.livePhotoMotionAsset.id])
        .mockResolvedValue([assetStub.livePhotoMotionAsset]);

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
  });
});
