import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import {
  authStub,
  entityStub,
  newCryptoRepositoryMock,
  newSharedLinkRepositoryMock,
  newUserRepositoryMock,
  sharedLinkResponseStub,
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
    it('should not accept a non-existant key', async () => {
      shareMock.getByKey.mockResolvedValue(null);
      await expect(sut.validate('key')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept an expired key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      await expect(sut.validate('key')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should not accept a key without a user', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.expired);
      userMock.get.mockResolvedValue(null);
      await expect(sut.validate('key')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should accept a valid key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      userMock.get.mockResolvedValue(entityStub.admin);
      await expect(sut.validate('key')).resolves.toEqual(authStub.adminSharedLink);
    });
  });

  describe('getAll', () => {
    it('should return all keys for a user', async () => {
      shareMock.getAll.mockResolvedValue([sharedLinkStub.expired, sharedLinkStub.valid]);
      await expect(sut.getAll(authStub.user1)).resolves.toEqual([
        sharedLinkResponseStub.expired,
        sharedLinkResponseStub.valid,
      ]);
      expect(shareMock.getAll).toHaveBeenCalledWith(authStub.user1.id);
    });
  });

  describe('getMine', () => {
    it('should only work for a public user', async () => {
      await expect(sut.getMine(authStub.admin)).rejects.toBeInstanceOf(ForbiddenException);
      expect(shareMock.get).not.toHaveBeenCalled();
    });

    it('should return the key for the public user (auth dto)', async () => {
      const authDto = authStub.adminSharedLink;
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
    });
  });

  describe('get', () => {
    it('should not work on a missing key', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.getById(authStub.user1, sharedLinkStub.valid.id, true)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.remove).not.toHaveBeenCalled();
    });

    it('should get a key by id', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getById(authStub.user1, sharedLinkStub.valid.id, false)).resolves.toEqual(
        sharedLinkResponseStub.valid,
      );
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
    });

    it('should include exif', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.readonly);
      await expect(sut.getById(authStub.user1, sharedLinkStub.readonly.id, true)).resolves.toEqual(
        sharedLinkResponseStub.readonly,
      );
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.readonly.id);
    });

    it('should exclude exif', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.readonly);
      await expect(sut.getById(authStub.user1, sharedLinkStub.readonly.id, false)).resolves.toEqual(
        sharedLinkResponseStub.readonlyNoExif,
      );
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.readonly.id);
    });
  });

  describe('remove', () => {
    it('should not work on a missing key', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.remove(authStub.user1, sharedLinkStub.valid.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.remove).not.toHaveBeenCalled();
    });

    it('should remove a key', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await sut.remove(authStub.user1, sharedLinkStub.valid.id);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.remove).toHaveBeenCalledWith(sharedLinkStub.valid);
    });
  });

  describe('getByKey', () => {
    it('should not work on a missing key', async () => {
      shareMock.getByKey.mockResolvedValue(null);
      await expect(sut.getByKey('secret-key')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.getByKey).toHaveBeenCalledWith('secret-key');
    });

    it('should find a key', async () => {
      shareMock.getByKey.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getByKey('secret-key')).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.getByKey).toHaveBeenCalledWith('secret-key');
    });
  });

  describe('edit', () => {
    it('should not work on a missing key', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.edit(authStub.user1, sharedLinkStub.valid.id, {})).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.save).not.toHaveBeenCalled();
    });

    it('should edit a key', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      shareMock.save.mockResolvedValue(sharedLinkStub.valid);
      const dto = { allowDownload: false };
      await sut.edit(authStub.user1, sharedLinkStub.valid.id, dto);
      // await expect(sut.edit(authStub.user1, sharedLinkStub.valid.id, dto)).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.save).toHaveBeenCalledWith({
        id: sharedLinkStub.valid.id,
        userId: authStub.user1.id,
        allowDownload: false,
      });
    });
  });
});
