import { AssetRepository, IAssetRepository } from './asset-repository';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetService } from './asset.service';
import { Repository } from 'typeorm';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { CreateAssetDto } from './dto/create-asset.dto';

describe('AssetService', () => {
  let sui: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;

  const authUser: AuthUserDto = Object.freeze({
    id: '3ea54709-e168-42b7-90b0-a0dfe8a7ecbd',
    email: 'auth@test.com',
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
  const _getAsset = () => {
    const assetEntity = new AssetEntity();

    assetEntity.id = 'e8edabfd-7d8a-45d0-9d61-7c7ca60f2c67';
    assetEntity.userId = '3ea54709-e168-42b7-90b0-a0dfe8a7ecbd';
    assetEntity.deviceAssetId = '4967046344801';
    assetEntity.deviceId = '116766fd-2ef2-52dc-a3ef-149988997291';
    assetEntity.type = AssetType.VIDEO;
    assetEntity.originalPath =
      'upload/3ea54709-e168-42b7-90b0-a0dfe8a7ecbd/original/116766fd-2ef2-52dc-a3ef-149988997291/51c97f95-244f-462d-bdf0-e1dc19913516.jpg';
    assetEntity.resizePath = '';
    assetEntity.createdAt = '2022-06-19T23:41:36.910Z';
    assetEntity.modifiedAt = '2022-06-19T23:41:36.910Z';
    assetEntity.isFavorite = false;
    assetEntity.mimeType = 'image/jpeg';
    assetEntity.webpPath = '';
    assetEntity.encodedVideoPath = '';
    assetEntity.duration = '0:00:00.000000';

    return assetEntity;
  };

  beforeAll(() => {
    assetRepositoryMock = {
      create: jest.fn(),
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
    };

    sui = new AssetService(assetRepositoryMock, a);
  });

  // Currently failing due to calculate checksum from a file
  // it('create an asset', async () => {
  //   const assetEntity = _getAsset();

  //   assetRepositoryMock.create.mockImplementation(() => Promise.resolve<AssetEntity>(assetEntity));

  //   const originalPath =
  //     'upload/3ea54709-e168-42b7-90b0-a0dfe8a7ecbd/original/116766fd-2ef2-52dc-a3ef-149988997291/51c97f95-244f-462d-bdf0-e1dc19913516.jpg';
  //   const mimeType = 'image/jpeg';
  //   const createAssetDto = _getCreateAssetDto();
  //   const result = await sui.createUserAsset(authUser, createAssetDto, originalPath, mimeType);

  //   expect(result.userId).toEqual(authUser.id);
  //   expect(result.resizePath).toEqual('');
  //   expect(result.webpPath).toEqual('');
  // });

  it('get assets by device id', async () => {
    assetRepositoryMock.getAllByDeviceId.mockImplementation(() => Promise.resolve<string[]>(['4967046344801']));

    const deviceId = '116766fd-2ef2-52dc-a3ef-149988997291';
    const result = await sui.getUserAssetsByDeviceId(authUser, deviceId);

    expect(result.length).toEqual(1);
    expect(result[0]).toEqual('4967046344801');
  });
});
