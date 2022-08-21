import { AssetRepository, IAssetRepository } from './asset-repository';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetService } from './asset.service';
import { Repository } from 'typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';

describe('AssetService', () => {
  let sui: AssetService;
  let a: Repository<AssetEntity>; // TO BE DELETED AFTER FINISHED REFACTORING
  let assetRepositoryMock: jest.Mocked<IAssetRepository>;
  const authUser: AuthUserDto = Object.freeze({
    id: '1111',
    email: 'auth@test.com',
  });

  beforeAll(() => {
    assetRepositoryMock = {
      create: jest.fn(),
      getByDeviceId: jest.fn(),
      getCountByTimeGroup: jest.fn(),
    };

    sui = new AssetService(assetRepositoryMock, a);
  });
});
