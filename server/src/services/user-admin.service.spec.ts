import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mapUserAdmin } from 'src/dtos/user.dto';
import { JobName, UserMetadataKey, UserStatus } from 'src/enum';
import { UserAdminService } from 'src/services/user-admin.service';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';
import { factory, newUuid } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';
import { describe } from 'vitest';

describe(UserAdminService.name, () => {
  let sut: UserAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserAdminService));

    mocks.user.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? undefined),
    );
  });

  describe('search', () => {
    it('should return a list of users', async () => {
      mocks.user.getList.mockResolvedValue([userStub.admin, userStub.user1]);

      const result = await sut.search(authStub.admin, { withDeleted: false });

      expect(result).toHaveLength(2);
      expect(mocks.user.getList).toHaveBeenCalledWith({ id: undefined, withDeleted: false });
    });

    it('should filter by id', async () => {
      const userId = userStub.user1.id;
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      const result = await sut.search(authStub.admin, { withDeleted: false, id: userId });

      expect(result).toHaveLength(1);
      expect(mocks.user.getList).toHaveBeenCalledWith({ id: userId, withDeleted: false });
    });

    it('should include deleted users when withDeleted is true', async () => {
      const deletedUser = factory.userAdmin({ status: UserStatus.Deleted, deletedAt: new Date() });
      mocks.user.getList.mockResolvedValue([userStub.admin, deletedUser]);

      const result = await sut.search(authStub.admin, { withDeleted: true });

      expect(result).toHaveLength(2);
      expect(mocks.user.getList).toHaveBeenCalledWith({ id: undefined, withDeleted: true });
    });
  });

  describe('create', () => {
    it('should not create a user if there is no local admin account', async () => {
      mocks.user.getAdmin.mockResolvedValueOnce(void 0);

      await expect(
        sut.create({
          email: 'john_smith@email.com',
          name: 'John Smith',
          password: 'password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create user', async () => {
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.create.mockResolvedValue(userStub.user1);

      await expect(
        sut.create({
          email: userStub.user1.email,
          name: userStub.user1.name,
          password: 'password',
          storageLabel: 'label',
        }),
      ).resolves.toEqual(mapUserAdmin(userStub.user1));

      expect(mocks.user.getAdmin).toBeCalled();
      expect(mocks.user.create).toBeCalledWith({
        email: userStub.user1.email,
        name: userStub.user1.name,
        storageLabel: 'label',
        password: expect.anything(),
      });
    });

    it('should throw error when password is missing and oauth is disabled', async () => {
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);

      await expect(
        sut.create({
          email: 'test@test.com',
          name: 'Test User',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should emit UserSignup event with notify flag', async () => {
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.create.mockResolvedValue(userStub.user1);

      await sut.create({
        email: userStub.user1.email,
        name: userStub.user1.name,
        password: 'password',
        notify: true,
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('UserSignup', {
        notify: true,
        id: userStub.user1.id,
        password: 'password',
      });
    });

    it('should emit UserSignup event with notify false by default', async () => {
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.create.mockResolvedValue(userStub.user1);

      await sut.create({
        email: userStub.user1.email,
        name: userStub.user1.name,
        password: 'password',
      });

      expect(mocks.event.emit).toHaveBeenCalledWith('UserSignup', {
        notify: false,
        id: userStub.user1.id,
        password: 'password',
      });
    });
  });

  describe('get', () => {
    it('should get a user by id', async () => {
      const result = await sut.get(authStub.admin, userStub.admin.id);

      expect(result).toEqual(mapUserAdmin(userStub.admin));
      expect(mocks.user.get).toHaveBeenCalledWith(userStub.admin.id, { withDeleted: true });
    });

    it('should throw if user not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.get(authStub.admin, 'non-existent')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('should update the user', async () => {
      const update = {
        shouldChangePassword: true,
        email: 'immich@test.com',
        storageLabel: 'storage_label',
      };
      mocks.user.getByEmail.mockResolvedValue(void 0);
      mocks.user.getByStorageLabel.mockResolvedValue(void 0);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.user1, userStub.user1.id, update);

      expect(mocks.user.getByEmail).toHaveBeenCalledWith(update.email);
      expect(mocks.user.getByStorageLabel).toHaveBeenCalledWith(update.storageLabel);
    });

    it('should not set an empty string for storage label', async () => {
      mocks.user.update.mockResolvedValue(userStub.user1);
      await sut.update(authStub.admin, userStub.user1.id, { storageLabel: '' });
      expect(mocks.user.update).toHaveBeenCalledWith(userStub.user1.id, {
        storageLabel: null,
        updatedAt: expect.any(Date),
      });
    });

    it('should not change an email to one already in use', async () => {
      const dto = { id: userStub.user1.id, email: 'updated@test.com' };

      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getByEmail.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: userStub.user1.id, storageLabel: 'admin' };

      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getByStorageLabel.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('update user information should throw error if user not found', async () => {
      mocks.user.get.mockResolvedValueOnce(void 0);

      await expect(
        sut.update(authStub.admin, userStub.user1.id, { shouldChangePassword: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should throw error when admin tries to change own admin status', async () => {
      await expect(
        sut.update(authStub.admin, userStub.admin.id, { isAdmin: false }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should allow admin to change another user admin status', async () => {
      mocks.user.update.mockResolvedValue({ ...userStub.user1, isAdmin: true } as any);

      await sut.update(authStub.admin, userStub.user1.id, { isAdmin: true });

      expect(mocks.user.update).toHaveBeenCalled();
    });

    it('should sync usage when quota size changes', async () => {
      mocks.user.update.mockResolvedValue({ ...userStub.user1, quotaSizeInBytes: 1024 } as any);

      await sut.update(authStub.admin, userStub.user1.id, { quotaSizeInBytes: 1024 });

      expect(mocks.user.syncUsage).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should not sync usage when quota size does not change', async () => {
      const user = factory.userAdmin({ quotaSizeInBytes: 1024 });
      mocks.user.get.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);

      await sut.update(authStub.admin, user.id, { quotaSizeInBytes: 1024 });

      expect(mocks.user.syncUsage).not.toHaveBeenCalled();
    });

    it('should hash password when provided', async () => {
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.admin, userStub.user1.id, { password: 'new-password' });

      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('new-password', expect.any(Number));
      expect(mocks.user.update).toHaveBeenCalledWith(
        userStub.user1.id,
        expect.objectContaining({ password: expect.any(String) }),
      );
    });

    it('should hash pinCode when provided', async () => {
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.admin, userStub.user1.id, { pinCode: '123456' });

      expect(mocks.crypto.hashBcrypt).toHaveBeenCalledWith('123456', expect.any(Number));
      expect(mocks.user.update).toHaveBeenCalledWith(
        userStub.user1.id,
        expect.objectContaining({ pinCode: expect.any(String) }),
      );
    });

    it('should allow updating email to same email owned by same user', async () => {
      mocks.user.getByEmail.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await expect(
        sut.update(authStub.admin, userStub.user1.id, { email: userStub.user1.email }),
      ).resolves.toBeDefined();
    });

    it('should allow updating storage label to same label owned by same user', async () => {
      const user = factory.userAdmin({ storageLabel: 'my-label' });
      mocks.user.get.mockResolvedValue(user);
      mocks.user.getByStorageLabel.mockResolvedValue(user);
      mocks.user.update.mockResolvedValue(user);

      await expect(sut.update(authStub.admin, user.id, { storageLabel: 'my-label' })).resolves.toBeDefined();
    });

    it('should set updatedAt on every update call', async () => {
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.admin, userStub.user1.id, { name: 'Updated Name' });

      expect(mocks.user.update).toHaveBeenCalledWith(
        userStub.user1.id,
        expect.objectContaining({ updatedAt: expect.any(Date) }),
      );
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.delete(authStub.admin, 'not-found', {})).rejects.toThrowError(BadRequestException);
      expect(mocks.user.delete).not.toHaveBeenCalled();
    });

    it('cannot delete admin user', async () => {
      await expect(sut.delete(authStub.admin, userStub.admin.id, {})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should not allow deleting own account', async () => {
      const user = factory.userAdmin({ isAdmin: false });
      const auth = factory.auth({ user });
      mocks.user.get.mockResolvedValue(user);
      await expect(sut.delete(auth, user.id, {})).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.user.delete).not.toHaveBeenCalled();
    });

    it('should delete user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, {})).resolves.toEqual(mapUserAdmin(userStub.user1));
      expect(mocks.user.update).toHaveBeenCalledWith(userStub.user1.id, {
        status: UserStatus.Deleted,
        deletedAt: expect.any(Date),
      });
    });

    it('should force delete user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, { force: true })).resolves.toEqual(
        mapUserAdmin(userStub.user1),
      );

      expect(mocks.user.update).toHaveBeenCalledWith(userStub.user1.id, {
        status: UserStatus.Removing,
        deletedAt: expect.any(Date),
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.UserDelete,
        data: { id: userStub.user1.id, force: true },
      });
    });

    it('should soft delete all albums when deleting user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.delete(authStub.admin, userStub.user1.id, {});

      expect(mocks.album.softDeleteAll).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should emit UserTrash event', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.delete(authStub.admin, userStub.user1.id, {});

      expect(mocks.event.emit).toHaveBeenCalledWith('UserTrash', userStub.user1);
    });

    it('should not queue UserDelete job when not force deleting', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.update.mockResolvedValue(userStub.user1);

      await sut.delete(authStub.admin, userStub.user1.id, {});

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(sut.restore(authStub.admin, userStub.admin.id)).rejects.toThrowError(BadRequestException);
      expect(mocks.user.update).not.toHaveBeenCalled();
    });

    it('should restore an user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.restore.mockResolvedValue(userStub.user1);
      await expect(sut.restore(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUserAdmin(userStub.user1));
      expect(mocks.user.restore).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should restore all albums for the user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.restore.mockResolvedValue(userStub.user1);

      await sut.restore(authStub.admin, userStub.user1.id);

      expect(mocks.album.restoreAll).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should emit UserRestore event', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.restore.mockResolvedValue(userStub.user1);

      await sut.restore(authStub.admin, userStub.user1.id);

      expect(mocks.event.emit).toHaveBeenCalledWith('UserRestore', userStub.user1);
    });
  });

  describe('getSessions', () => {
    it('should return sessions for a user', async () => {
      const session = factory.session({ userId: userStub.user1.id });
      mocks.session.getByUserId.mockResolvedValue([session]);

      const result = await sut.getSessions(authStub.admin, userStub.user1.id);

      expect(result).toHaveLength(1);
      expect(mocks.session.getByUserId).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should return empty array when no sessions exist', async () => {
      mocks.session.getByUserId.mockResolvedValue([]);

      const result = await sut.getSessions(authStub.admin, userStub.user1.id);

      expect(result).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return user asset statistics', async () => {
      mocks.asset.getStatistics.mockResolvedValue({ IMAGE: 10, VIDEO: 5 } as any);

      const result = await sut.getStatistics(authStub.admin, userStub.user1.id, {});

      expect(result).toBeDefined();
      expect(mocks.asset.getStatistics).toHaveBeenCalledWith(userStub.user1.id, {});
    });
  });

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getMetadata.mockResolvedValue([]);

      const result = await sut.getPreferences(authStub.admin, userStub.user1.id);

      expect(result).toBeDefined();
      expect(mocks.user.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: true });
      expect(mocks.user.getMetadata).toHaveBeenCalledWith(userStub.user1.id);
    });

    it('should throw if user not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.getPreferences(authStub.admin, 'non-existent')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getMetadata.mockResolvedValue([]);

      const result = await sut.updatePreferences(authStub.admin, userStub.user1.id, {
        memories: { enabled: false },
      });

      expect(result).toBeDefined();
      expect(mocks.user.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: false });
      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(userStub.user1.id, {
        key: UserMetadataKey.Preferences,
        value: expect.any(Object),
      });
    });

    it('should throw if user not found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(
        sut.updatePreferences(authStub.admin, 'non-existent', { memories: { enabled: false } }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should merge new preferences with existing ones', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getMetadata.mockResolvedValue([
        {
          key: UserMetadataKey.Preferences,
          value: { memories: { enabled: true } },
        },
      ] as any);

      await sut.updatePreferences(authStub.admin, userStub.user1.id, {
        memories: { enabled: false },
      });

      expect(mocks.user.upsertMetadata).toHaveBeenCalledWith(userStub.user1.id, {
        key: UserMetadataKey.Preferences,
        value: expect.objectContaining({ memories: expect.objectContaining({ enabled: false }) }),
      });
    });
  });
});
