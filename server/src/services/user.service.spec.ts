import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserEntity } from 'src/entities/user.entity';
import { CacheControl, JobName, UserMetadataKey } from 'src/enum';
import { UserService } from 'src/services/user.service';
import { ImmichFileResponse } from 'src/utils/file';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService, ServiceMocks } from 'test/utils';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

describe(UserService.name, () => {
  let sut: UserService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserService));

    mocks.user.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? undefined),
    );
  });

  describe('getAll', () => {
    it('admin should get all users', async () => {
      mocks.user.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.search(authStub.admin)).resolves.toEqual([
        expect.objectContaining({
          id: authStub.admin.user.id,
          email: authStub.admin.user.email,
        }),
      ]);
      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
    });

    it('non-admin should get all users when publicUsers enabled', async () => {
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      await expect(sut.search(authStub.user1)).resolves.toEqual([
        expect.objectContaining({
          id: authStub.user1.user.id,
          email: authStub.user1.user.email,
        }),
      ]);
      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
    });

    it('non-admin user should only receive itself when publicUsers is disabled', async () => {
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.publicUsersDisabled);
      await expect(sut.search(authStub.user1)).resolves.toEqual([
        expect.objectContaining({
          id: authStub.user1.user.id,
          email: authStub.user1.user.email,
        }),
      ]);
      expect(mocks.user.getList).not.toHaveBeenCalledWith({ withDeleted: false });
    });
  });

  describe('get', () => {
    it('should get a user by id', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);
      await sut.get(authStub.admin.user.id);
      expect(mocks.user.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
    });

    it('should throw an error if a user is not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(sut.get(authStub.admin.user.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
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
      mocks.user.get.mockResolvedValue(void 0);
      mocks.user.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(BadRequestException);
    });

    it('should throw an error if the user profile could not be updated with the new image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      mocks.user.get.mockResolvedValue(userStub.profilePath);
      mocks.user.update.mockRejectedValue(new InternalServerErrorException('mocked error'));

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(InternalServerErrorException);
    });

    it('should delete the previous profile image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      mocks.user.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];
      mocks.user.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(mocks.job.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });

    it('should not delete the profile image if it has not been set', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.user.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteProfileImage', () => {
    it('should send an http error has no profile image', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);

      await expect(sut.deleteProfileImage(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should delete the profile image if user has one', async () => {
      mocks.user.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];

      await sut.deleteProfileImage(authStub.admin);
      expect(mocks.job.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.get).toHaveBeenCalledWith(userStub.admin.id, {});
    });

    it('should throw an error if the user does not have a picture', async () => {
      mocks.user.get.mockResolvedValue(userStub.admin);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(mocks.user.get).toHaveBeenCalledWith(userStub.admin.id, {});
    });

    it('should return the profile picture', async () => {
      mocks.user.get.mockResolvedValue(userStub.profilePath);

      await expect(sut.getProfileImage(userStub.profilePath.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/profile.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.NONE,
        }),
      );

      expect(mocks.user.get).toHaveBeenCalledWith(userStub.profilePath.id, {});
    });
  });

  describe('handleQueueUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      mocks.user.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(5) },
      ] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedUsers).toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });

    it('should skip users not ready for deletion - deleteDelay30', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.deleteDelay30);
      mocks.user.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(15) },
      ] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedUsers).toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });

    it('should queue user ready for deletion', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) };
      mocks.user.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedUsers).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.USER_DELETION, data: { id: user.id } }]);
    });

    it('should queue user ready for deletion - deleteDelay30', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(31) };
      mocks.user.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedUsers).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.USER_DELETION, data: { id: user.id } }]);
    });
  });

  describe('handleUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      const user = { id: 'user-1', deletedAt: makeDeletedAt(5) } as UserEntity;
      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      expect(mocks.storage.unlinkDir).not.toHaveBeenCalled();
      expect(mocks.user.delete).not.toHaveBeenCalled();
    });

    it('should delete the user and associated assets', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;
      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      const options = { force: true, recursive: true };

      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/library/deleted-user', options);
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/upload/deleted-user', options);
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/profile/deleted-user', options);
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/thumbs/deleted-user', options);
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/encoded-video/deleted-user', options);
      expect(mocks.album.deleteAll).toHaveBeenCalledWith(user.id);
      expect(mocks.user.delete).toHaveBeenCalledWith(user, true);
    });

    it('should delete the library path for a storage label', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10), storageLabel: 'admin' } as UserEntity;
      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      const options = { force: true, recursive: true };

      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith('upload/library/admin', options);
    });
  });

  describe('setLicense', () => {
    it('should save client license if valid', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };
      await sut.setLicense(authStub.user1, license);

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.LICENSE,
        value: expect.any(Object),
      });
    });

    it('should save server license as client if valid', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'IMSV-license-key', activationKey: 'activation-key' };
      await sut.setLicense(authStub.user1, license);

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.LICENSE,
        value: expect.any(Object),
      });
    });

    it('should not save license if invalid', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const license = { licenseKey: 'license-key', activationKey: 'activation-key' };
      const call = sut.setLicense(authStub.admin, license);
      await expect(call).rejects.toThrowError('Invalid license key');
      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('deleteLicense', () => {
    it('should delete license', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.deleteLicense(authStub.admin);
      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });
  });

  describe('handleUserSyncUsage', () => {
    it('should sync usage', async () => {
      await sut.handleUserSyncUsage();
      expect(mocks.user.syncUsage).toHaveBeenCalledTimes(1);
    });
  });
});
