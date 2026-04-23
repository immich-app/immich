import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mapUserAdmin } from 'src/dtos/user.dto';
import { JobName, UserStatus } from 'src/enum';
import { UserAdminService } from 'src/services/user-admin.service';
import { AuthFactory } from 'test/factories/auth.factory';
import { UserFactory } from 'test/factories/user.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
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
      const user = UserFactory.create({ isAdmin: false });
      const auth = AuthFactory.create(user);
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
  });

  describe('createOAuthReLinkToken', () => {
    it('should throw when OAuth is not enabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.disabled);
      await expect(sut.createOAuthReLinkToken(authStub.admin, userStub.user1.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(mocks.oauthLinkToken.create).not.toHaveBeenCalled();
    });

    it('should throw when the target user is missing', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.user.get.mockResolvedValueOnce(void 0);
      await expect(sut.createOAuthReLinkToken(authStub.admin, 'missing')).rejects.toBeInstanceOf(BadRequestException);
      expect(mocks.oauthLinkToken.create).not.toHaveBeenCalled();
    });

    it('should create a token with null oauthSub and the target email', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.oauthEnabled);
      mocks.oauthLinkToken.create.mockResolvedValue({} as any);

      const result = await sut.createOAuthReLinkToken(authStub.admin, userStub.user1.id);

      expect(mocks.oauthLinkToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oauthSub: null,
          oauthSid: null,
          profile: null,
          email: userStub.user1.email,
        }),
      );
      expect(result.token).toEqual(expect.any(String));
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
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
  });
});
