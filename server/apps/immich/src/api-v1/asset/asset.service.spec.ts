import { IAssetRepository } from './asset-repository';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetService } from './asset.service';
import { Repository } from 'typeorm';
import { AssetEntity, AssetType } from '@app/infra';
import { CreateAssetDto } from './dto/create-asset.dto';
import { AssetCountByTimeBucket } from './response-dto/asset-count-by-time-group-response.dto';
import { TimeGroupEnum } from './dto/get-asset-count-by-time-bucket.dto';
import { AssetCountByUserIdResponseDto } from './response-dto/asset-count-by-user-id-response.dto';
import { DownloadService } from '../../modules/download/download.service';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { AlbumRepository, IAlbumRepository } from '../album/album-repository';
import { StorageService } from '@app/storage';
import { ICryptoRepository, IJobRepository, ISharedLinkRepository } from '@app/domain';
import {
  authStub,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newSharedLinkRepositoryMock,
  sharedLinkResponseStub,
  sharedLinkStub,
} from '@app/domain/../test';
import { CreateAssetsShareLinkDto } from './dto/create-asset-shared-link.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AssetService', () => {
  let sui: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;
  let albumRepositoryMock: jest.Mocked<IAlbumRepository>;
  let downloadServiceMock: jest.Mocked<Partial<DownloadService>>;
  let backgroundTaskServiceMock: jest.Mocked<BackgroundTaskService>;
  let storageSeriveMock: jest.Mocked<StorageService>;
  let sharedLinkRepositoryMock: jest.Mocked<ISharedLinkRepository>;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  const authUser: AuthUserDto = Object.freeze({
    id: 'user_id_1',
    email: 'auth@test.com',
    isAdmin: false,
  });

  const _getCreateAssetDto = (): CreateAssetDto => {
    const createAssetDto = new CreateAssetDto();
    createAssetDto.deviceAssetId = 'deviceAssetId';
    createAssetDto.deviceId = 'deviceId';
    createAssetDto.assetType = AssetType.OTHER;
    createAssetDto.createdAt = '2022-06-19T23:41:36.910Z';
    createAssetDto.modifiedAt = '2022-06-19T23:41:36.910Z';
    createAssetDto.isFavorite = false;
    createAssetDto.duration = '0:00:00.000000';

    return createAssetDto;
  };

  const _getAsset_1 = () => {
    const asset_1 = new AssetEntity();

    asset_1.id = 'id_1';
    asset_1.userId = 'user_id_1';
    asset_1.deviceAssetId = 'device_asset_id_1';
    asset_1.deviceId = 'device_id_1';
    asset_1.type = AssetType.VIDEO;
    asset_1.originalPath = 'fake_path/asset_1.jpeg';
    asset_1.resizePath = '';
    asset_1.createdAt = '2022-06-19T23:41:36.910Z';
    asset_1.modifiedAt = '2022-06-19T23:41:36.910Z';
    asset_1.isFavorite = false;
    asset_1.mimeType = 'image/jpeg';
    asset_1.webpPath = '';
    asset_1.encodedVideoPath = '';
    asset_1.duration = '0:00:00.000000';
    return asset_1;
  };

  const _getAsset_2 = () => {
    const asset_2 = new AssetEntity();

    asset_2.id = 'id_2';
    asset_2.userId = 'user_id_1';
    asset_2.deviceAssetId = 'device_asset_id_2';
    asset_2.deviceId = 'device_id_1';
    asset_2.type = AssetType.VIDEO;
    asset_2.originalPath = 'fake_path/asset_2.jpeg';
    asset_2.resizePath = '';
    asset_2.createdAt = '2022-06-19T23:41:36.910Z';
    asset_2.modifiedAt = '2022-06-19T23:41:36.910Z';
    asset_2.isFavorite = false;
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

  beforeAll(() => {
    assetRepositoryMock = {
      create: jest.fn(),
      update: jest.fn(),
      getAllByUserId: jest.fn(),
      getAllByDeviceId: jest.fn(),
      getAssetCountByTimeBucket: jest.fn(),
      getById: jest.fn(),
      getDetectedObjectsByUserId: jest.fn(),
      getLocationsByUserId: jest.fn(),
      getSearchPropertiesByUserId: jest.fn(),
      getAssetByTimeBucket: jest.fn(),
      getAssetByChecksum: jest.fn(),
      getAssetCountByUserId: jest.fn(),
      getAssetWithNoEXIF: jest.fn(),
      getAssetWithNoThumbnail: jest.fn(),
      getAssetWithNoSmartInfo: jest.fn(),
      getAssetWithNoEncodedVideo: jest.fn(),
      getExistingAssets: jest.fn(),
      countByIdAndUser: jest.fn(),
    };

    albumRepositoryMock = {
      getSharedWithUserAlbumCount: jest.fn(),
    } as unknown as jest.Mocked<AlbumRepository>;

    downloadServiceMock = {
      downloadArchive: jest.fn(),
    };

    sharedLinkRepositoryMock = newSharedLinkRepositoryMock();

    jobMock = newJobRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();

    sui = new AssetService(
      assetRepositoryMock,
      albumRepositoryMock,
      a,
      backgroundTaskServiceMock,
      downloadServiceMock as DownloadService,
      storageSeriveMock,
      sharedLinkRepositoryMock,
      jobMock,
      cryptoMock,
    );
  });

  describe('createAssetsSharedLink', () => {
    it('should create an individual share link', async () => {
      const asset1 = _getAsset_1();
      const dto: CreateAssetsShareLinkDto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      assetRepositoryMock.countByIdAndUser.mockResolvedValue(1);
      sharedLinkRepositoryMock.create.mockResolvedValue(sharedLinkStub.valid);

      await expect(sui.createAssetsSharedLink(authStub.user1, dto)).resolves.toEqual(sharedLinkResponseStub.valid);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(assetRepositoryMock.countByIdAndUser).toHaveBeenCalledWith(asset1.id, authStub.user1.id);
    });
  });

  describe('updateAssetsInSharedLink', () => {
    it('should require a valid shared link', async () => {
      const asset1 = _getAsset_1();

      const authDto = authStub.adminSharedLink;
      const dto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      sharedLinkRepositoryMock.get.mockResolvedValue(null);
      sharedLinkRepositoryMock.hasAssetAccess.mockResolvedValue(true);

      await expect(sui.updateAssetsInSharedLink(authDto, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(sharedLinkRepositoryMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
      expect(sharedLinkRepositoryMock.hasAssetAccess).toHaveBeenCalledWith(authDto.sharedLinkId, asset1.id);
      expect(sharedLinkRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('should remove assets from a shared link', async () => {
      const asset1 = _getAsset_1();

      const authDto = authStub.adminSharedLink;
      const dto = { assetIds: [asset1.id] };

      assetRepositoryMock.getById.mockResolvedValue(asset1);
      sharedLinkRepositoryMock.get.mockResolvedValue(sharedLinkStub.valid);
      sharedLinkRepositoryMock.hasAssetAccess.mockResolvedValue(true);
      sharedLinkRepositoryMock.save.mockResolvedValue(sharedLinkStub.valid);

      await expect(sui.updateAssetsInSharedLink(authDto, dto)).resolves.toEqual(sharedLinkResponseStub.valid);

      expect(assetRepositoryMock.getById).toHaveBeenCalledWith(asset1.id);
      expect(sharedLinkRepositoryMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
      expect(sharedLinkRepositoryMock.hasAssetAccess).toHaveBeenCalledWith(authDto.sharedLinkId, asset1.id);
    });
  });

  // Currently failing due to calculate checksum from a file
  it('create an asset', async () => {
    const assetEntity = _getAsset_1();

    assetRepositoryMock.create.mockImplementation(() => Promise.resolve<AssetEntity>(assetEntity));

    const originalPath = 'fake_path/asset_1.jpeg';
    const mimeType = 'image/jpeg';
    const createAssetDto = _getCreateAssetDto();
    const result = await sui.createUserAsset(
      authUser,
      createAssetDto,
      originalPath,
      mimeType,
      Buffer.from('0x5041E6328F7DF8AFF650BEDAED9251897D9A6241', 'hex'),
      true,
    );

    expect(result.userId).toEqual(authUser.id);
    expect(result.resizePath).toEqual('');
    expect(result.webpPath).toEqual('');
  });

  it('get assets by device id', async () => {
    const assets = _getAssets();

    assetRepositoryMock.getAllByDeviceId.mockImplementation(() =>
      Promise.resolve<string[]>(Array.from(assets.map((asset) => asset.deviceAssetId))),
    );

    const deviceId = 'device_id_1';
    const result = await sui.getUserAssetsByDeviceId(authUser, deviceId);

    expect(result.length).toEqual(2);
    expect(result).toEqual(assets.map((asset) => asset.deviceAssetId));
  });

  it('get assets count by time bucket', async () => {
    const assetCountByTimeBucket = _getAssetCountByTimeBucket();

    assetRepositoryMock.getAssetCountByTimeBucket.mockImplementation(() =>
      Promise.resolve<AssetCountByTimeBucket[]>(assetCountByTimeBucket),
    );

    const result = await sui.getAssetCountByTimeBucket(authUser, {
      timeGroup: TimeGroupEnum.Month,
    });

    expect(result.totalCount).toEqual(assetCountByTimeBucket.reduce((a, b) => a + b.count, 0));
    expect(result.buckets.length).toEqual(2);
  });

  it('get asset count by user id', async () => {
    const assetCount = _getAssetCountByUserId();

    assetRepositoryMock.getAssetCountByUserId.mockImplementation(() =>
      Promise.resolve<AssetCountByUserIdResponseDto>(assetCount),
    );

    const result = await sui.getAssetCountByUserId(authUser);

    expect(result).toEqual(assetCount);
  });

  describe('checkDownloadAccess', () => {
    it('should validate download access', async () => {
      await sui.checkDownloadAccess(authStub.adminSharedLink);
    });

    it('should not allow when user is not allowed to download', async () => {
      expect(() => sui.checkDownloadAccess(authStub.readonlySharedLink)).toThrow(ForbiddenException);
    });
  });
});
