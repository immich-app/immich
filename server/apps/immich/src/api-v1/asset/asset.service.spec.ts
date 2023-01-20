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
import { IAssetUploadedJob, IVideoTranscodeJob } from '@app/job';
import { Queue } from 'bull';
import { IAlbumRepository } from '../album/album-repository';
import { StorageService } from '@app/storage';
import { ISharedLinkRepository } from '../share/shared-link.repository';

describe('AssetService', () => {
  let sui: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;
  let albumRepositoryMock: jest.Mocked<IAlbumRepository>;
  let downloadServiceMock: jest.Mocked<Partial<DownloadService>>;
  let backgroundTaskServiceMock: jest.Mocked<BackgroundTaskService>;
  let assetUploadedQueueMock: jest.Mocked<Queue<IAssetUploadedJob>>;
  let videoConversionQueueMock: jest.Mocked<Queue<IVideoTranscodeJob>>;
  let storageSeriveMock: jest.Mocked<StorageService>;
  let sharedLinkRepositoryMock: jest.Mocked<ISharedLinkRepository>;
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
      getExistingAssets: jest.fn(),
      countByIdAndUser: jest.fn(),
    };

    downloadServiceMock = {
      downloadArchive: jest.fn(),
    };

    sharedLinkRepositoryMock = {
      create: jest.fn(),
      get: jest.fn(),
      getById: jest.fn(),
      getByKey: jest.fn(),
      remove: jest.fn(),
      save: jest.fn(),
      hasAssetAccess: jest.fn(),
      getByIdAndUserId: jest.fn(),
    };

    sui = new AssetService(
      assetRepositoryMock,
      albumRepositoryMock,
      a,
      backgroundTaskServiceMock,
      assetUploadedQueueMock,
      videoConversionQueueMock,
      downloadServiceMock as DownloadService,
      storageSeriveMock,
      sharedLinkRepositoryMock,
    );
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
});
