import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  authStub,
  newCryptoRepositoryMock,
  newSharedLinkRepositoryMock,
  sharedLinkResponseStub,
  sharedLinkStub,
} from '../../test';
import { ICryptoRepository } from '../crypto';
import { ShareService } from './share.service';
import { ISharedLinkRepository } from './shared-link.repository';

describe(ShareService.name, () => {
  let sut: ShareService;
  let cryptoMock: jest.Mocked<ICryptoRepository>;
  let shareMock: jest.Mocked<ISharedLinkRepository>;

  beforeEach(async () => {
    cryptoMock = newCryptoRepositoryMock();
    shareMock = newSharedLinkRepositoryMock();

    sut = new ShareService(cryptoMock, shareMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
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
