import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UserAdmin } from 'src/database';
import { CacheControl, JobName, JobStatus, UserMetadataKey } from 'src/enum';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
import { UserService } from 'src/services/user.service';
import { ImmichFileResponse } from 'src/utils/file';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

describe(UserService.name, () => {
  let sut: UserService;
  let mocks: ServiceMocks;

  beforeAll(() => {
    (StorageService as any).diskBackend = new DiskStorageBackend('/data');
  });

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserService));
    mocks.user.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? undefined),
    );
  });

  describe('getAll', () => {
    it('admin should get all users', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });

      mocks.user.getList.mockResolvedValue([user]);

      await expect(sut.search(auth)).resolves.toEqual([expect.objectContaining({ id: user.id, email: user.email })]);

      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
    });

    it('non-admin should get all users when publicUsers enabled', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });

      mocks.user.getList.mockResolvedValue([user]);

      await expect(sut.search(auth)).resolves.toEqual([expect.objectContaining({ id: user.id, email: user.email })]);

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

    it('should return empty list when publicUsers is disabled and user not found', async () => {
      const unknownId = newUuid();
      const auth = factory.auth({ user: { id: unknownId, isAdmin: false } });
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.publicUsersDisabled);
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.search(auth)).resolves.toEqual([]);
    });

    it('admin should get all users even when publicUsers is disabled', async () => {
      const adminUser = factory.userAdmin({ isAdmin: true });
      const auth = factory.auth({ user: adminUser });
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.publicUsersDisabled);
      mocks.user.getList.mockResolvedValue([adminUser]);

      await expect(sut.search(auth)).resolves.toEqual([
        expect.objectContaining({ id: adminUser.id, email: adminUser.email }),
      ]);

      expect(mocks.user.getList).toHaveBeenCalledWith({ withDeleted: false });
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
    it("should get the auth user's info", async () => {
      const user = authStub.admin.user;

      await expect(sut.getMe(authStub.admin)).resolves.toMatchObject({
        id: user.id,
        email: user.email,
      });
    });

    it('should throw BadRequestException if user is not found', async () => {
      const unknownId = newUuid();
      const auth = factory.auth({ user: { id: unknownId } });
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.getMe(auth)).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.get).toHaveBeenCalledWith(unknownId, {});
    });
  });

  describe('updateMe', () => {
    it('should update user name', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      const updatedUser = { ...user, name: 'New Name' };
      mocks.user.update.mockResolvedValue(updatedUser);

      const result = await sut.updateMe(auth, { name: 'New Name' });

      expect(result).toMatchObject({ name: 'New Name' });
      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        email: undefined,
        name: 'New Name',
        avatarColor: undefined,
      });
    });

    it('should update email when not a duplicate', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      const updatedUser = { ...user, email: 'new@test.com' };
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.update.mockResolvedValue(updatedUser);

      const result = await sut.updateMe(auth, { email: 'new@test.com' });

      expect(result).toMatchObject({ email: 'new@test.com' });
      expect(mocks.user.getByEmail).toHaveBeenCalledWith('new@test.com');
    });

    it('should allow updating to own email', async () => {
      const user = factory.userAdmin({ email: 'existing@test.com' });
      const auth = factory.auth({ user });
      mocks.user.getByEmail.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);

      await expect(sut.updateMe(auth, { email: 'existing@test.com' })).resolves.toBeDefined();
    });

    it('should throw error when email is already in use by another account', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      const otherUser = factory.userAdmin({ email: 'other@test.com' });
      mocks.user.getByEmail.mockResolvedValue(otherUser);

      await expect(sut.updateMe(auth, { email: 'other@test.com' })).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should hash and update password', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      mocks.user.update.mockResolvedValue({ ...user, shouldChangePassword: false });

      await sut.updateMe(auth, { password: 'new-password' });

      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('new-password', expect.any(Number));
      expect(mocks.user.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          password: expect.any(String),
          shouldChangePassword: false,
        }),
      );
    });

    it('should update avatarColor', async () => {
      const user = factory.userAdmin();
      const auth = factory.auth({ user });
      mocks.user.update.mockResolvedValue(user);

      await sut.updateMe(auth, { avatarColor: 'primary' as any });

      expect(mocks.user.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ avatarColor: 'primary' }),
      );
    });
  });

  describe('getMyPreferences', () => {
    it('should get user preferences', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);

      const result = await sut.getMyPreferences(authStub.user1);

      expect(result).toBeDefined();
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(authStub.user1.user.id);
    });
  });

  describe('updateMyPreferences', () => {
    it('should update user preferences', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);

      const result = await sut.updateMyPreferences(authStub.user1, { memories: { enabled: false } });

      expect(result).toBeDefined();
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(authStub.user1.user.id);
      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.Preferences,
        value: expect.any(Object),
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
      const user = factory.userAdmin({ profileImagePath: '/path/to/profile.jpg' });
      mocks.user.get.mockResolvedValue(user);
      mocks.user.update.mockRejectedValue(new InternalServerErrorException('mocked error'));

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(InternalServerErrorException);
    });

    it('should delete the previous profile image', async () => {
      const user = factory.userAdmin({ profileImagePath: '/path/to/profile.jpg' });
      const file = { path: '/profile/path' } as Express.Multer.File;
      const files = [user.profileImagePath];

      mocks.user.get.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);

      expect(mocks.job.queue.mock.calls).toEqual([[{ name: JobName.FileDelete, data: { files } }]]);
    });

    it('should not delete the profile image if it has not been set', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;

      mocks.user.get.mockResolvedValue(userStub.admin);
      mocks.user.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
    });

    it('should return the new profile image info', async () => {
      const user = factory.userAdmin({ profileImagePath: '' });
      const file = { path: '/profile/new-path' } as Express.Multer.File;
      const updatedUser = { ...user, profileImagePath: file.path, profileChangedAt: new Date() };
      mocks.user.get.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(updatedUser);

      const result = await sut.createProfileImage(factory.auth({ user }), file);

      expect(result).toEqual({
        userId: updatedUser.id,
        profileImagePath: updatedUser.profileImagePath,
        profileChangedAt: updatedUser.profileChangedAt,
      });
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
      const user = factory.userAdmin({ profileImagePath: '/path/to/profile.jpg' });
      const files = [user.profileImagePath];

      mocks.user.get.mockResolvedValue(user);

      await sut.deleteProfileImage(authStub.admin);

      expect(mocks.job.queue.mock.calls).toEqual([[{ name: JobName.FileDelete, data: { files } }]]);
    });

    it('should update user to remove profile image path', async () => {
      const user = factory.userAdmin({ profileImagePath: '/path/to/profile.jpg' });
      mocks.user.get.mockResolvedValue(user);

      await sut.deleteProfileImage(factory.auth({ user }));

      expect(mocks.user.update).toHaveBeenCalledWith(user.id, {
        profileImagePath: '',
        profileChangedAt: expect.any(Date),
      });
    });

    it('should throw if user is not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.deleteProfileImage(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
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
      const user = factory.userAdmin({ profileImagePath: '/path/to/profile.jpg' });
      mocks.user.get.mockResolvedValue(user);

      await expect(sut.getProfileImage(user.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/profile.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.None,
        }),
      );

      expect(mocks.user.get).toHaveBeenCalledWith(user.id, {});
    });
  });

  describe('getLicense', () => {
    it('should return the license when it exists', async () => {
      const activatedAt = new Date().toISOString();
      mocks.user.getMetadata.mockResolvedValue([
        {
          key: UserMetadataKey.License,
          value: {
            licenseKey: 'IMCL-license-key',
            activationKey: 'activation-key',
            activatedAt,
          },
        },
      ]);

      const result = await sut.getLicense(authStub.user1);

      expect(result).toEqual({
        licenseKey: 'IMCL-license-key',
        activationKey: 'activation-key',
        activatedAt: new Date(activatedAt),
      });
    });

    it('should throw NotFoundException when no license exists', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);

      await expect(sut.getLicense(authStub.user1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should ignore non-license metadata entries', async () => {
      mocks.user.getMetadata.mockResolvedValue([
        { key: UserMetadataKey.Preferences, value: {} },
      ] as any);

      await expect(sut.getLicense(authStub.user1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getOnboarding', () => {
    it('should return isOnboarded false when no onboarding metadata exists', async () => {
      mocks.user.getMetadata.mockResolvedValue([]);

      const result = await sut.getOnboarding(authStub.user1);

      expect(result).toEqual({ isOnboarded: false });
    });

    it('should return onboarding status when metadata exists', async () => {
      mocks.user.getMetadata.mockResolvedValue([
        { key: UserMetadataKey.Onboarding, value: { isOnboarded: true } },
      ] as any);

      const result = await sut.getOnboarding(authStub.user1);

      expect(result).toEqual({ isOnboarded: true });
    });
  });

  describe('setOnboarding', () => {
    it('should set onboarding status', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const result = await sut.setOnboarding(authStub.user1, { isOnboarded: true });

      expect(result).toEqual({ isOnboarded: true });
      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.Onboarding,
        value: { isOnboarded: true },
      });
    });

    it('should set onboarding to false', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      const result = await sut.setOnboarding(authStub.user1, { isOnboarded: false });

      expect(result).toEqual({ isOnboarded: false });
    });
  });

  describe('deleteOnboarding', () => {
    it('should delete onboarding metadata', async () => {
      await sut.deleteOnboarding(authStub.admin);

      expect(mocks.user.deleteMetadata).toHaveBeenCalledWith(authStub.admin.user.id, UserMetadataKey.Onboarding);
    });
  });

  describe('handleQueueUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      mocks.user.getDeletedAfter.mockResolvedValue([]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedAfter).toHaveBeenCalled();
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });

    it('should queue user ready for deletion', async () => {
      const user = factory.user();
      mocks.user.getDeletedAfter.mockResolvedValue([{ id: user.id }]);

      await sut.handleUserDeleteCheck();

      expect(mocks.user.getDeletedAfter).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.UserDelete, data: { id: user.id } }]);
    });

    it('should queue multiple users for deletion', async () => {
      const user1 = factory.user();
      const user2 = factory.user();
      mocks.user.getDeletedAfter.mockResolvedValue([{ id: user1.id }, { id: user2.id }]);

      await sut.handleUserDeleteCheck();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.UserDelete, data: { id: user1.id } },
        { name: JobName.UserDelete, data: { id: user2.id } },
      ]);
    });

    it('should return JobStatus.Success', async () => {
      mocks.user.getDeletedAfter.mockResolvedValue([]);

      const result = await sut.handleUserDeleteCheck();

      expect(result).toBe(JobStatus.Success);
    });
  });

  describe('handleUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      const user = { id: 'user-1', deletedAt: makeDeletedAt(5) } as UserAdmin;

      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      expect(mocks.storage.unlinkDir).not.toHaveBeenCalled();
      expect(mocks.user.delete).not.toHaveBeenCalled();
    });

    it('should delete the user and associated assets', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserAdmin;
      const options = { force: true, recursive: true };

      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(
        expect.stringContaining('/data/library/deleted-user'),
        options,
      );
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(
        expect.stringContaining('/data/upload/deleted-user'),
        options,
      );
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(
        expect.stringContaining('/data/profile/deleted-user'),
        options,
      );
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(
        expect.stringContaining('/data/thumbs/deleted-user'),
        options,
      );
      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(
        expect.stringContaining('/data/encoded-video/deleted-user'),
        options,
      );
      expect(mocks.album.deleteAll).toHaveBeenCalledWith(user.id);
      expect(mocks.user.delete).toHaveBeenCalledWith(user, true);
    });

    it('should delete the library path for a storage label', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10), storageLabel: 'admin' } as UserAdmin;

      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      const options = { force: true, recursive: true };

      expect(mocks.storage.unlinkDir).toHaveBeenCalledWith(expect.stringContaining('data/library/admin'), options);
    });

    it('should return early if user is not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await sut.handleUserDelete({ id: 'non-existent' });

      expect(mocks.storage.unlinkDir).not.toHaveBeenCalled();
      expect(mocks.user.delete).not.toHaveBeenCalled();
      expect(mocks.album.deleteAll).not.toHaveBeenCalled();
    });

    it('should force delete user even if not ready for deletion', async () => {
      const user = { id: 'force-delete-user', deletedAt: makeDeletedAt(1) } as UserAdmin;

      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id, force: true });

      expect(mocks.storage.unlinkDir).toHaveBeenCalledTimes(5);
      expect(mocks.album.deleteAll).toHaveBeenCalledWith(user.id);
      expect(mocks.user.delete).toHaveBeenCalledWith(user, true);
    });

    it('should emit UserDelete event after deletion', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserAdmin;
      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id });

      expect(mocks.event.emit).toHaveBeenCalledWith('UserDelete', user);
    });

    it('should force delete user without deletedAt set', async () => {
      const user = { id: 'force-user', deletedAt: null } as UserAdmin;

      mocks.user.get.mockResolvedValue(user);

      await sut.handleUserDelete({ id: user.id, force: true });

      expect(mocks.storage.unlinkDir).toHaveBeenCalledTimes(5);
      expect(mocks.user.delete).toHaveBeenCalledWith(user, true);
    });
  });

  describe('handleUserSyncUsage', () => {
    it('should sync usage', async () => {
      await sut.handleUserSyncUsage();

      expect(mocks.user.syncUsage).toHaveBeenCalledTimes(1);
    });

    it('should return JobStatus.Success', async () => {
      const result = await sut.handleUserSyncUsage();

      expect(result).toBe(JobStatus.Success);
    });
  });

  describe('setLicense', () => {
    it('should save client license if valid', async () => {
      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };

      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.setLicense(authStub.user1, license);

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.License,
        value: expect.any(Object),
      });
    });

    it('should save server license as client if valid', async () => {
      const license = { licenseKey: 'IMSV-license-key', activationKey: 'activation-key' };

      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.setLicense(authStub.user1, license);

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.License,
        value: expect.any(Object),
      });
    });

    it('should not save license if invalid', async () => {
      const license = { licenseKey: 'license-key', activationKey: 'activation-key' };
      const call = sut.setLicense(authStub.admin, license);

      mocks.user.upsertMetadata.mockResolvedValue();

      await expect(call).rejects.toThrowError('Invalid license key');

      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });

    it('should throw error when both client and server license verification fail', async () => {
      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };
      mocks.crypto.verifySha256.mockReturnValue(false);

      await expect(sut.setLicense(authStub.user1, license)).rejects.toThrowError('Invalid license key');
      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });

    it('should return the activated license with activatedAt date', async () => {
      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };
      mocks.user.upsertMetadata.mockResolvedValue();

      const result = await sut.setLicense(authStub.user1, license);

      expect(result).toEqual({
        licenseKey: 'IMCL-license-key',
        activationKey: 'activation-key',
        activatedAt: expect.any(Date),
      });
    });

    it('should store activatedAt as ISO string in metadata', async () => {
      const license = { licenseKey: 'IMCL-license-key', activationKey: 'activation-key' };
      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.setLicense(authStub.user1, license);

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(authStub.user1.user.id, {
        key: UserMetadataKey.License,
        value: {
          licenseKey: 'IMCL-license-key',
          activationKey: 'activation-key',
          activatedAt: expect.any(String),
        },
      });
    });
  });

  describe('deleteLicense', () => {
    it('should delete license', async () => {
      mocks.user.upsertMetadata.mockResolvedValue();

      await sut.deleteLicense(authStub.admin);

      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
    });

    it('should call deleteMetadata with the correct key', async () => {
      await sut.deleteLicense(authStub.admin);

      expect(mocks.user.deleteMetadata).toHaveBeenCalledWith(authStub.admin.user.id, UserMetadataKey.License);
    });
  });
});
