import {
  IAccessRepository,
  ICryptoRepository,
  IJobRepository,
  ISharedLinkRepository,
  IStorageRepository,
  JobName,
} from '@app/domain';
import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assetEntityStub,
  authStub,
  fileStub,
  newAccessRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newSharedLinkRepositoryMock,
  newStorageRepositoryMock,
  sharedLinkResponseStub,
  sharedLinkStub,
} from '@test';
import { when } from 'jest-when';
import { QueryFailedError, Repository } from 'typeorm';
import { DownloadService } from '../../modules/download/download.service';
import { IAssetRepository } from './asset-repository';
import { AssetService } from './asset.service';
import { CreateAssetsShareLinkDto } from './dto/create-asset-shared-link.dto';
import { CreateAssetDto } from './dto/create-asset.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { AssetRejectReason, AssetUploadAction } from './response-dto/asset-check-response.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';

const _getCreateAssetDto = (): CreateAssetDto => {
  const createAssetDto = new CreateAssetDto();
  createAssetDto.deviceAssetId = 'deviceAssetId';
  createAssetDto.deviceId = 'deviceId';
  createAssetDto.assetType = AssetType.OTHER;
  createAssetDto.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  createAssetDto.isFavorite = false;
  createAssetDto.isArchived = false;
  createAssetDto.duration = '0:00:00.000000';

  return createAssetDto;
};

const _getAsset_1 = () => {
  const asset_1 = new AssetEntity();

  asset_1.id = 'id_1';
  asset_1.ownerId = 'user_id_1';
  asset_1.deviceAssetId = 'device_asset_id_1';
  asset_1.deviceId = 'device_id_1';
  asset_1.type = AssetType.VIDEO;
  asset_1.originalPath = 'fake_path/asset_1.jpeg';
  asset_1.resizePath = '';
  asset_1.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.updatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_1.isFavorite = false;
  asset_1.isArchived = false;
  asset_1.mimeType = 'image/jpeg';
  asset_1.webpPath = '';
  asset_1.encodedVideoPath = '';
  asset_1.duration = '0:00:00.000000';
  asset_1.exifInfo = new ExifEntity();
  asset_1.exifInfo.latitude = 49.533547;
  asset_1.exifInfo.longitude = 10.703075;
  return asset_1;
};

const _getAsset_2 = () => {
  const asset_2 = new AssetEntity();

  asset_2.id = 'id_2';
  asset_2.ownerId = 'user_id_1';
  asset_2.deviceAssetId = 'device_asset_id_2';
  asset_2.deviceId = 'device_id_1';
  asset_2.type = AssetType.VIDEO;
  asset_2.originalPath = 'fake_path/asset_2.jpeg';
  asset_2.resizePath = '';
  asset_2.fileModifiedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.fileCreatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.updatedAt = new Date('2022-06-19T23:41:36.910Z');
  asset_2.isFavorite = false;
  asset_2.isArchived = false;
  asset_2.mimeType = 'image/jpeg';
  asset_2.webpPath = '';
  asset_2.encodedVideoPath = '';
  asset_2.duration = '0:00:00.000000';

  return asset_2;
};

const _getAssets = () => {
  return [_getAsset_1(), _getAsset_2()];
};

const _getAssetCountByTimeBucket = (): AssetCountByTimeBucket[] => {
  const result1 = new AssetCountByTimeBucket();
  result1.count = 2;
  result1.timeBucket = '2022-06-01T00:00:00.000Z';

  const result2 = new AssetCountByTimeBucket();
  result1.count = 5;
  result1.timeBucket = '2022-07-01T00:00:00.000Z';

  return [result1, result2];
};

const _getAssetCountByUserId = (): AssetCountByUserIdResponseDto => {
  const result = new AssetCountByUserIdResponseDto();

  result.videos = 2;
  result.photos = 2;

  return result;
};

const _getArchivedAssetsCountByUserId = (): AssetCountByUserIdResponseDto => {
  const result = new AssetCountByUserIdResponseDto();

  result.videos = 1;
  result.photos = 2;

  return result;
};

describe('AssetService', () => {
  let sut: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let accessMock: jest.Mocked<IAccessRepository>;
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;
  let downloadServiceMock: jest.Mocked<Partial<DownloadService>>;
  let sharedLinkRepositoryMock: jest.Mocked<ISharedLinkRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(() => {
    assetRepositoryMock = {
      get: jest.fn(),
      create: jest.fn(),
      remove: jest.fn(),

      update: jest.fn(),
      getAllByUserId: jest.fn(),
      getAllByDeviceId: jest.fn(),
      getAssetCountByTimeBucket: jest.fn(),
      getById: jest.fn(),
      getDetectedObjectsByUserId: jest.fn(),
      getLocationsByUserId: jest.fn(),
      getSearchPropertiesByUserId: jest.fn(),
      getAssetByTimeBucket: jest.fn(),
      getAssetsByChecksums: jest.fn(),
      getAssetCountByUserId: jest.fn(),
      getArchivedAssetCountByUserId: jest.fn(),
      getExistingAssets: jest.fn(),
    };

    downloadServiceMock = {
      downloadArchive: jest.fn(),
    };

    accessMock = newAccessRepositoryMock();
    sharedLinkRepositoryMock = newSharedLinkRepositoryMock();
    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    storageMock = newStorageRepositoryMock();

    sut = new AssetService(
      accessMock,
      assetRepositoryMock,
      a,
      downloadServiceMock as DownloadService,
      sharedLinkRepositoryMock,
      jobMock,
      cryptoMock,
      storageMock,
    );

    when(assetRepositoryMock.get)
      .calledWith(assetEntityStub.livePhotoStillAsset.id)
      .mockResolvedValue(assetEntityStub.livePhotoStillAsset);
    when(assetRepositoryMock.get)
      .calledWith(assetEntityStub.livePhotoMotionAsset.id)
      .mockResolvedValue(assetEntityStub.livePhotoMotionAsset);
  });

  describe('createAssetsSharedLink', () => {
    it('should create an individual share link', async () => {
      const asset1 = _getAsset_1();
      const dto: CreateAssetsShareLinkDto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);
      sharedLinkRepositoryMock.create.mockResolvedValue(sharedLinkStub.valid);

      await expect(sut.createAssetsSharedLink(authStub.user1, dto)).resolves.toEqual(sharedLinkResponseStub.valid);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(accessMock.hasOwnerAssetAccess).toHaveBeenCalledWith(authStub.user1.id, asset1.id);
    });
  });

  describe('updateAssetsInSharedLink', () => {
    it('should require a valid shared link', async () => {
      const asset1 = _getAsset_1();

      const authDto = authStub.adminSharedLink;
      const dto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      sharedLinkRepositoryMock.get.mockResolvedValue(null);
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(true);

      await expect(sut.addAssetsToSharedLink(authDto, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(sharedLinkRepositoryMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
      expect(sharedLinkRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('should add assets to a shared link', async () => {
      const asset1 = _getAsset_1();

      const authDto = authStub.adminSharedLink;
      const dto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      sharedLinkRepositoryMock.get.mockResolvedValue(sharedLinkStub.valid);
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(true);
      sharedLinkRepositoryMock.update.mockResolvedValue(sharedLinkStub.valid);

      await expect(sut.addAssetsToSharedLink(authDto, dto)).resolves.toEqual(sharedLinkResponseStub.valid);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(sharedLinkRepositoryMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
      expect(sharedLinkRepositoryMock.update).toHaveBeenCalled();
    });

    it('should remove assets from a shared link', async () => {
      const asset1 = _getAsset_1();

      const authDto = authStub.adminSharedLink;
      const dto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      sharedLinkRepositoryMock.get.mockResolvedValue(sharedLinkStub.valid);
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(true);
      sharedLinkRepositoryMock.update.mockResolvedValue(sharedLinkStub.valid);

      await expect(sut.removeAssetsFromSharedLink(authDto, dto)).resolves.toEqual(sharedLinkResponseStub.valid);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(sharedLinkRepositoryMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
      expect(sharedLinkRepositoryMock.update).toHaveBeenCalled();
    });
  });

  describe('uploadFile', () => {
    it('should handle a file upload', async () => {
      const assetEntity = _getAsset_1();
      const file = {
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
      };
      const dto = _getCreateAssetDto();

      assetRepositoryMock.create.mockResolvedValue(assetEntity);

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: false, id: 'id_1' });

      expect(assetRepositoryMock.create).toHaveBeenCalled();
    });

    it('should handle a duplicate', async () => {
      const file = {
        originalPath: 'fake_path/asset_1.jpeg',
        mimeType: 'image/jpeg',
        checksum: Buffer.from('file hash', 'utf8'),
        originalName: 'asset_1.jpeg',
      };
      const dto = _getCreateAssetDto();
      const error = new QueryFailedError('', [], '');
      (error as any).constraint = 'UQ_userid_checksum';

      assetRepositoryMock.create.mockRejectedValue(error);
      assetRepositoryMock.getAssetsByChecksums.mockResolvedValue([_getAsset_1()]);

      await expect(sut.uploadFile(authStub.user1, dto, file)).resolves.toEqual({ duplicate: true, id: 'id_1' });

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: { files: ['fake_path/asset_1.jpeg', undefined, undefined] },
      });
      expect(storageMock.moveFile).not.toHaveBeenCalled();
    });

    it('should handle a live photo', async () => {
      const dto = _getCreateAssetDto();
      const error = new QueryFailedError('', [], '');
      (error as any).constraint = 'UQ_userid_checksum';

      assetRepositoryMock.create.mockResolvedValueOnce(assetEntityStub.livePhotoMotionAsset);
      assetRepositoryMock.create.mockResolvedValueOnce(assetEntityStub.livePhotoStillAsset);

      await expect(
        sut.uploadFile(authStub.user1, dto, fileStub.livePhotoStill, fileStub.livePhotoMotion),
      ).resolves.toEqual({
        duplicate: false,
        id: 'live-photo-still-asset',
      });

      expect(jobMock.queue.mock.calls).toEqual([
        [
          {
            name: JobName.METADATA_EXTRACTION,
            data: { id: assetEntityStub.livePhotoMotionAsset.id, source: 'upload' },
          },
        ],
        [{ name: JobName.VIDEO_CONVERSION, data: { id: assetEntityStub.livePhotoMotionAsset.id } }],
        [{ name: JobName.METADATA_EXTRACTION, data: { id: assetEntityStub.livePhotoStillAsset.id, source: 'upload' } }],
      ]);
    });
  });

  it('get assets by device id', async () => {
    const assets = _getAssets();

    assetRepositoryMock.getAllByDeviceId.mockImplementation(() =>
      Promise.resolve<string[]>(Array.from(assets.map((asset) => asset.deviceAssetId))),
    );

    const deviceId = 'device_id_1';
    const result = await sut.getUserAssetsByDeviceId(authStub.user1, deviceId);

    expect(result.length).toEqual(2);
    expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
  });

  it('get assets count by time bucket', async () => {
    const assetCountByTimeBucket = _getAssetCountByTimeBucket();

    assetRepositoryMock.getAssetCountByTimeBucket.mockImplementation(() =>
      Promise.resolve<AssetCountByTimeBucket[]>(assetCountByTimeBucket),
    );

    const result = await sut.getAssetCountByTimeBucket(authStub.user1, {
      timeGroup: TimeGroupEnum.Month,
    });

    expect(result.totalCount).toEqual(assetCountByTimeBucket.reduce((a, b) => a + b.count, 0));
    expect(result.buckets.length).toEqual(2);
  });

  it('get asset count by user id', async () => {
    const assetCount = _getAssetCountByUserId();
    assetRepositoryMock.getAssetCountByUserId.mockResolvedValue(assetCount);

    await expect(sut.getAssetCountByUserId(authStub.user1)).resolves.toEqual(assetCount);
  });

  it('get archived asset count by user id', async () => {
    const assetCount = _getArchivedAssetsCountByUserId();
    assetRepositoryMock.getArchivedAssetCountByUserId.mockResolvedValue(assetCount);

    await expect(sut.getArchivedAssetCountByUserId(authStub.user1)).resolves.toEqual(assetCount);
  });

  describe('deleteAll', () => {
    it('should return failed status when an asset is missing', async () => {
      assetRepositoryMock.get.mockResolvedValue(null);
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', status: 'FAILED' },
      ]);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should return failed status a delete fails', async () => {
      assetRepositoryMock.get.mockResolvedValue({ id: 'asset1' } as AssetEntity);
      assetRepositoryMock.remove.mockRejectedValue('delete failed');
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1'] })).resolves.toEqual([
        { id: 'asset1', status: 'FAILED' },
      ]);

      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should delete a live photo', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: [assetEntityStub.livePhotoStillAsset.id] })).resolves.toEqual([
        { id: assetEntityStub.livePhotoStillAsset.id, status: 'SUCCESS' },
        { id: assetEntityStub.livePhotoMotionAsset.id, status: 'SUCCESS' },
      ]);

      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.DELETE_FILES,
        data: {
          files: [
            'fake_path/asset_1.jpeg',
            undefined,
            undefined,
            undefined,
            undefined,
            'fake_path/asset_1.mp4',
            undefined,
            undefined,
            undefined,
            undefined,
          ],
        },
      });
    });

    it('should delete a batch of assets', async () => {
      const asset1 = {
        id: 'asset1',
        originalPath: 'original-path-1',
        resizePath: 'resize-path-1',
        webpPath: 'web-path-1',
      };

      const asset2 = {
        id: 'asset2',
        originalPath: 'original-path-2',
        resizePath: 'resize-path-2',
        webpPath: 'web-path-2',
        encodedVideoPath: 'encoded-video-path-2',
      };

      when(assetRepositoryMock.get)
        .calledWith(asset1.id)
        .mockResolvedValue(asset1 as AssetEntity);
      when(assetRepositoryMock.get)
        .calledWith(asset2.id)
        .mockResolvedValue(asset2 as AssetEntity);

      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);

      await expect(sut.deleteAll(authStub.user1, { ids: ['asset1', 'asset2'] })).resolves.toEqual([
        { id: 'asset1', status: 'SUCCESS' },
        { id: 'asset2', status: 'SUCCESS' },
      ]);

      expect(jobMock.queue.mock.calls).toEqual([
        [{ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: ['asset1'] } }],
        [{ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: ['asset2'] } }],
        [
          {
            name: JobName.DELETE_FILES,
            data: {
              files: [
                'original-path-1',
                'web-path-1',
                'resize-path-1',
                undefined,
                undefined,
                'original-path-2',
                'web-path-2',
                'resize-path-2',
                'encoded-video-path-2',
                undefined,
              ],
            },
          },
        ],
      ]);
    });
  });

  // describe('checkDownloadAccess', () => {
  //   it('should validate download access', async () => {
  //     await sut.checkDownloadAccess(authStub.adminSharedLink);
  //   });

  //   it('should not allow when user is not allowed to download', async () => {
  //     expect(() => sut.checkDownloadAccess(authStub.readonlySharedLink)).toThrow(ForbiddenException);
  //   });
  // });

  describe('downloadFile', () => {
    it('should download a single file', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);
      assetRepositoryMock.get.mockResolvedValue(_getAsset_1());

      await sut.downloadFile(authStub.admin, 'id_1');

      expect(storageMock.createReadStream).toHaveBeenCalledWith('fake_path/asset_1.jpeg', 'image/jpeg');
    });
  });

  describe('bulkUploadCheck', () => {
    it('should accept hex and base64 checksums', async () => {
      const file1 = Buffer.from('d2947b871a706081be194569951b7db246907957', 'hex');
      const file2 = Buffer.from('53be335e99f18a66ff12e9a901c7a6171dd76573', 'hex');

      assetRepositoryMock.getAssetsByChecksums.mockResolvedValue([
        { id: 'asset-1', checksum: file1 },
        { id: 'asset-2', checksum: file2 },
      ]);

      await expect(
        sut.bulkUploadCheck(authStub.admin, {
          assets: [
            { id: '1', checksum: file1.toString('hex') },
            { id: '2', checksum: file2.toString('base64') },
          ],
        }),
      ).resolves.toEqual({
        results: [
          { id: '1', assetId: 'asset-1', action: AssetUploadAction.REJECT, reason: AssetRejectReason.DUPLICATE },
          { id: '2', assetId: 'asset-2', action: AssetUploadAction.REJECT, reason: AssetRejectReason.DUPLICATE },
        ],
      });

      expect(assetRepositoryMock.getAssetsByChecksums).toHaveBeenCalledWith(authStub.admin.id, [file1, file2]);
    });
  });

  describe('getAssetById', () => {
    it('should allow owner access', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.hasOwnerAssetAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should allow shared link access', async () => {
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.adminSharedLink, assetEntityStub.image.id);
      expect(accessMock.hasSharedLinkAssetAccess).toHaveBeenCalledWith(
        authStub.adminSharedLink.sharedLinkId,
        assetEntityStub.image.id,
      );
    });

    it('should allow partner sharing access', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(false);
      accessMock.hasPartnerAssetAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.hasPartnerAssetAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should allow shared album access', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(false);
      accessMock.hasPartnerAssetAccess.mockResolvedValue(false);
      accessMock.hasAlbumAssetAccess.mockResolvedValue(true);
      assetRepositoryMock.getById.mockResolvedValue(assetEntityStub.image);
      await sut.getAssetById(authStub.admin, assetEntityStub.image.id);
      expect(accessMock.hasAlbumAssetAccess).toHaveBeenCalledWith(authStub.admin.id, assetEntityStub.image.id);
    });

    it('should throw an error for no access', async () => {
      accessMock.hasOwnerAssetAccess.mockResolvedValue(false);
      accessMock.hasPartnerAssetAccess.mockResolvedValue(false);
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(false);
      accessMock.hasAlbumAssetAccess.mockResolvedValue(false);
      await expect(sut.getAssetById(authStub.admin, assetEntityStub.image.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(assetRepositoryMock.getById).not.toHaveBeenCalled();
    });

    it('should throw an error for an invalid shared link', async () => {
      accessMock.hasSharedLinkAssetAccess.mockResolvedValue(false);
      await expect(sut.getAssetById(authStub.adminSharedLink, assetEntityStub.image.id)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(accessMock.hasOwnerAssetAccess).not.toHaveBeenCalled();
      expect(assetRepositoryMock.getById).not.toHaveBeenCalled();
    });
  });
});
