import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { PublicUserService } from 'src/services/public-user.service';
import { CacheControl, ImmichFileResponse } from 'src/utils/file';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked } from 'vitest';

describe(PublicUserService.name, () => {
  let sut: PublicUserService;
  let userMock: Mocked<IUserRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    userMock = newUserRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new PublicUserService(userMock, loggerMock);

    userMock.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? null),
    );
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.getAll()).resolves.toEqual([
        expect.objectContaining({
          id: authStub.admin.user.id,
          email: authStub.admin.user.email,
        }),
      ]);
      expect(userMock.getList).toHaveBeenCalledWith({ withDeleted: false });
    });
  });

  describe('get', () => {
    it('should throw an error when user is not found', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.get(userStub.admin.id)).rejects.toThrow(BadRequestException);
      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, { withDeleted: false });
    });

    it('should get a user', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      await expect(sut.get(userStub.admin.id)).resolves.toEqual(
        expect.objectContaining({
          id: authStub.admin.user.id,
          email: authStub.admin.user.email,
        }),
      );
      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, { withDeleted: false });
    });
  });

  describe('getProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, { withDeleted: false });
    });

    it('should throw an error if the user does not have a picture', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(NotFoundException);
      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, { withDeleted: false });
    });

    it('should return the profile picture', async () => {
      userMock.get.mockResolvedValue(userStub.profilePath);
      await expect(sut.getProfileImage(userStub.profilePath.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/profile.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.NONE,
        }),
      );
      expect(userMock.get).toHaveBeenCalledWith(userStub.profilePath.id, { withDeleted: false });
    });
  });
});
