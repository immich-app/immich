import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { CacheControl, UserMetadataKey } from 'src/enum';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { UserService } from 'src/services/user.service';
import { ImmichFileResponse } from 'src/utils/file';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

describe(UserService.name, () => {
  let sut: UserService;

  let albumMock: Mocked<IAlbumRepository>;
  let jobMock: Mocked<IJobRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, albumMock, jobMock, storageMock, systemMock, userMock } = newTestService(UserService));

    userMock.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? null),
    );
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.search()).resolves.toEqual([
        expect.objectContaining({
          id: authStub.admin.user.id,
          email: authStub.admin.user.email,
        }),
      ]);
      expect(userMock.getList).toHaveBeenCalledWith({ withDeleted: false });
    });
  });

  describe('get', () => {
    it('should get a user by id', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      await sut.get(authStub.admin.user.id);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.admin.user.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
    });
  });

  describe('getMe', () => {
    it("should get the auth user's info", () => {
      const user = authStub.admin.user;
      expect(sut.getMe(authStub.admin)).toMatchObject({
        id: user.id,
        email: user.email,
      });
    });
  });

  describe('createProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(null);
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(BadRequestException);
    });

    it('should throw an error if the user profile could not be updated with the new image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.profilePath);
      userMock.update.mockRejectedValue(new InternalServerErrorException('mocked error'));

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(InternalServerErrorException);
    });

    it('should delete the previous profile image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(jobMock.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });

    it('should not delete the profile image if it has not been set', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.admin);
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteProfileImage', () => {
    it('should send an http error has no profile image', async () => {
      userMock.get.mockResolvedValue(userStub.admin);

      await expect(sut.deleteProfileImage(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should delete the profile image if user has one', async () => {
      userMock.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];

      await sut.deleteProfileImage(authStub.admin);
      expect(jobMock.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, {});
    });

    it('should throw an error if the user does not have a picture', async () => {
      userMock.get.mockResolvedValue(userStub.admin);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, {});
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

      expect(userMock.get).toHaveBeenCalledWith(userStub.profilePath.id, {});
    });
  });

  describe('handleQueueUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      userMock.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(5) },
      ] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([]);
    });

    it('should skip users not ready for deletion - deleteDelay30', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.deleteDelay30);
      userMock.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(15) },
      ] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([]);
    });

    it('should queue user ready for deletion', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) };
      userMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.USER_DELETION, data: { id: user.id } }]);
    });

    it('should queue user ready for deletion - deleteDelay30', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(31) };
      userMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.USER_DELETION, data: { id: user.id } }]);
    });
  });

  describe('handleUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      const user = { id: 'user-1', deletedAt: makeDeletedAt(5) } as UserEntity;
      userMock.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      expect(storageMock.unlinkDir).not.toHaveBeenCalled();
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should delete the user and associated assets', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;
      userMock.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      const options = { force: true, recursive: true };

      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/library/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/upload/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/profile/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/thumbs/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/encoded-video/deleted-user', options);
      expect(albumMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(userMock.delete).toHaveBeenCalledWith(user, true);
    });

    it('should delete the library path for a storage label', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10), storageLabel: 'admin' } as UserEntity;
      userMock.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      const options = { force: true, recursive: true };

      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/library/admin', options);
    });
  });

  describe('setLicense', () => {
    it('should save client license if valid', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };
      await sut.setLicense(authStub.user1, license);

      expect(userMock.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.LICENSE,
        value: expect.any(Object),
      });
    });

    it('should save server license as client if valid', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'IMSV-license-key', activationKey: 'activation-key' };
      await sut.setLicense(authStub.user1, license);

      expect(userMock.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.LICENSE,
        value: expect.any(Object),
      });
    });

    it('should not save license if invalid', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'license-key', activationKey: 'activation-key' };
      const call = sut.setLicense(authStub.admin, license);
      await expect(call).rejects.toThrowError('Invalid license key');
      expect(userMock.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('deleteLicense', () => {
    it('should delete license', async () => {
      userMock.upsertMetadata.mockResolvedValue();

      await sut.deleteLicense(authStub.admin);
      expect(userMock.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('handleUserSyncUsage', () => {
    it('should sync usage', async () => {
      await sut.handleUserSyncUsage();
      expect(userMock.syncUsage).toHaveBeenCalledTimes(1);
    });
  });
});
