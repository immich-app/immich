import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { authStub, newSharedLinkRepositoryMock, sharedLinkResponseStub, sharedLinkStub } from '@test';
import { ISharedLinkRepository } from './shared-link.repository';
import { SharedLinkService } from './shared-link.service';

describe(SharedLinkService.name, () => {
  let sut: SharedLinkService;
  let shareMock: jest.Mocked<ISharedLinkRepository>;

  beforeEach(async () => {
    shareMock = newSharedLinkRepositoryMock();

    sut = new SharedLinkService(shareMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getAll', () => {
    it('should return all shared links for a user', async () => {
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

    it('should return the shared link for the public user', async () => {
      const authDto = authStub.adminSharedLink;
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.getMine(authDto)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
    });

    it('should return not return exif', async () => {
      const authDto = authStub.adminSharedLinkNoExif;
      shareMock.get.mockResolvedValue(sharedLinkStub.readonlyNoExif);
      await expect(sut.getMine(authDto)).resolves.toEqual(sharedLinkResponseStub.readonlyNoExif);
      expect(shareMock.get).toHaveBeenCalledWith(authDto.id, authDto.sharedLinkId);
    });
  });

  describe('get', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should get a shared link by id', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await expect(sut.get(authStub.user1, sharedLinkStub.valid.id)).resolves.toEqual(sharedLinkResponseStub.valid);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
    });
  });

  describe('update', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.update(authStub.user1, 'missing-id', {})).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should update a shared link', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      shareMock.update.mockResolvedValue(sharedLinkStub.valid);
      await sut.update(authStub.user1, sharedLinkStub.valid.id, { allowDownload: false });
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.update).toHaveBeenCalledWith({
        id: sharedLinkStub.valid.id,
        userId: authStub.user1.id,
        allowDownload: false,
      });
    });
  });

  describe('remove', () => {
    it('should throw an error for an invalid shared link', async () => {
      shareMock.get.mockResolvedValue(null);
      await expect(sut.remove(authStub.user1, 'missing-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, 'missing-id');
      expect(shareMock.update).not.toHaveBeenCalled();
    });

    it('should remove a key', async () => {
      shareMock.get.mockResolvedValue(sharedLinkStub.valid);
      await sut.remove(authStub.user1, sharedLinkStub.valid.id);
      expect(shareMock.get).toHaveBeenCalledWith(authStub.user1.id, sharedLinkStub.valid.id);
      expect(shareMock.remove).toHaveBeenCalledWith(sharedLinkStub.valid);
    });
  });
});
