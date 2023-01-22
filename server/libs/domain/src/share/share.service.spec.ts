import {
  authStub,
  entityStub,
  newCryptoRepositoryMock,
  newSharedLinkRepositoryMock,
  newUserRepositoryMock,
  sharedLinkStub,
} from '../../test';
import { ICryptoRepository } from '../auth';
import { IUserRepository } from '../user';
import { ShareService } from './share.service';
import { ISharedLinkRepository } from './shared-link.repository';

describe(ShareService.name, () => {
  let sut: ShareService;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let shareMock: jest.Mocked<ISharedLinkRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    cryptoMock = newCryptoRepositoryMock();
    shareMock = newSharedLinkRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new ShareService(cryptoMock, shareMock, userMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('validate', () => {
    it('should validate the key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(entityStub.admin);
      await expect(sut.validate('abc')).resolves.toEqual(authStub.adminSharedLink);
    });
  });
});
