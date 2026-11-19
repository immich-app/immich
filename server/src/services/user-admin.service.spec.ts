import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { describe } from 'vitest';
import { mapUserAdmin } from 'src/dtos/user.dto.js';
import { AlbumUserRole, JobName, UserStatus } from 'src/enum.js';
import { Resource } from 'src/resource-paths.js';
import { UserAdminService } from 'src/services/user-admin.service.js';
import { AlbumFactory } from 'test/factories/album.factory.js';
import { AuthFactory } from 'test/factories/auth.factory.js';
import { UserFactory } from 'test/factories/user.factory.js';
import { authStub } from 'test/fixtures/auth.stub.js';
import { userStub } from 'test/fixtures/user.stub.js';
import { getForAlbum } from 'test/mappers.js';
import { mockAdmins } from 'test/repositories/user.repository.mock.js';
import { ServiceMocks, expectResourceEvents, newTestService } from 'test/utils.js';

describe(UserAdminService.name, () => {
  let sut: UserAdminService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(UserAdminService));

    mocks.user.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? undefined),
    );
    mocks.user.getAdminIds.mockResolvedValue([]);
    mocks.album.getAll.mockResolvedValue([]);
  });

  const setup = (user = UserFactory.create()) => {
    mocks.user.get.mockResolvedValue(user);
    return { auth: authStub.admin, adminIds: mockAdmins(mocks.user), user };
  };

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
        clusterGroupId: expect.any(String),
      });
    });

    it('should tell every admin about the new user', async () => {
      const { adminIds, user } = setup();
      mocks.user.getAdmin.mockResolvedValue(userStub.admin);
      mocks.user.create.mockResolvedValue(user);

      await sut.create({ email: user.email, name: user.name, password: 'password' });

      expectResourceEvents(mocks, { userIds: adminIds, changed: [Resource.adminUsers()] });
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

    it('should tell every admin and the changed user', async () => {
      const { auth, adminIds, user } = setup();
      mocks.user.update.mockResolvedValue(user);

      await sut.update(auth, user.id, { name: 'New Name' });

      expectResourceEvents(
        mocks,
        { userIds: adminIds, changed: [Resource.adminUser(user)] },
        { userIds: [user.id], changed: [Resource.myUser()] },
      );
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
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: userStub.user1.id, storageLabel: 'admin' };

      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.getByStorageLabel.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('update user information should throw error if user not found', async () => {
      mocks.user.get.mockResolvedValueOnce(void 0);

      await expect(
        sut.update(authStub.admin, userStub.user1.id, { shouldChangePassword: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.delete(authStub.admin, 'not-found', {})).rejects.toThrowError(BadRequestException);
      expect(mocks.user.delete).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('cannot delete admin user', async () => {
      await expect(sut.delete(authStub.admin, userStub.admin.id, {})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should not allow deleting own account', async () => {
      const user = UserFactory.create({ isAdmin: false });
      const auth = AuthFactory.create(user);
      mocks.user.get.mockResolvedValue(user);
      await expect(sut.delete(auth, user.id, {})).rejects.toBeInstanceOf(ForbiddenException);

      expect(mocks.user.delete).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell every admin, the deleted user and the users of their albums', async () => {
      const sharedUser = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: sharedUser.id, role: AlbumUserRole.Editor }).build();
      const { user: owner } = album.albumUsers.find(({ role }) => role === AlbumUserRole.Owner)!;
      const { auth, adminIds, user } = setup(owner);
      mocks.album.getAll.mockResolvedValue([getForAlbum(album)]);
      mocks.user.update.mockResolvedValue(user);

      await sut.delete(auth, user.id, {});

      expectResourceEvents(
        mocks,
        { userIds: adminIds, changed: [Resource.adminUser(user)] },
        { userIds: [user.id], changed: [Resource.myUser()] },
        { userIds: [user.id, sharedUser.id], changed: [Resource.albums()] },
      );
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
  });

  describe('restore', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);
      await expect(sut.restore(authStub.admin, userStub.admin.id)).rejects.toThrowError(BadRequestException);
      expect(mocks.user.update).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell every admin, the restored user and the users of their albums', async () => {
      const sharedUser = UserFactory.create();
      const album = AlbumFactory.from().albumUser({ userId: sharedUser.id, role: AlbumUserRole.Viewer }).build();
      const { user: owner } = album.albumUsers.find(({ role }) => role === AlbumUserRole.Owner)!;
      const { auth, adminIds, user } = setup(owner);
      mocks.album.getAll.mockResolvedValue([getForAlbum(album)]);
      mocks.user.restore.mockResolvedValue(user);

      await sut.restore(auth, user.id);

      expectResourceEvents(
        mocks,
        { userIds: adminIds, changed: [Resource.adminUser(user)] },
        { userIds: [user.id], changed: [Resource.myUser()] },
        { userIds: [user.id, sharedUser.id], changed: [Resource.albums()] },
      );
    });

    it('should restore an user', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      mocks.user.restore.mockResolvedValue(userStub.user1);
      await expect(sut.restore(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUserAdmin(userStub.user1));
      expect(mocks.user.restore).toHaveBeenCalledWith(userStub.user1.id);
    });
  });

  describe('updatePreferences', () => {
    it('should throw error if user could not be found', async () => {
      mocks.user.get.mockResolvedValue(void 0);

      await expect(sut.updatePreferences(authStub.admin, 'not-found', {})).rejects.toThrowError(BadRequestException);

      expect(mocks.user.upsertMetadata).not.toHaveBeenCalled();
      expect(mocks.resource.send).not.toHaveBeenCalled();
    });

    it('should tell every admin and the changed user', async () => {
      const { auth, adminIds, user } = setup();
      mocks.user.getMetadata.mockResolvedValue([]);

      await sut.updatePreferences(auth, user.id, { memories: { enabled: false } });

      expectResourceEvents(
        mocks,
        { userIds: adminIds, changed: [Resource.adminUserPreferences(user)] },
        { userIds: [user.id], changed: [Resource.myPreferences()] },
      );
    });
  });
});
