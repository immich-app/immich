import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { mapUserAdmin } from 'src/dtos/user.dto';
import { UserStatus } from 'src/enum';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { UserAdminService } from 'src/services/user-admin.service';
import { authStub } from 'test/fixtures/auth.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService } from 'test/utils';
import { Mocked, describe } from 'vitest';

describe(UserAdminService.name, () => {
  let sut: UserAdminService;

  let jobMock: Mocked<IJobRepository>;
  let userMock: Mocked<IUserRepository>;

  beforeEach(() => {
    ({ sut, jobMock, userMock } = newTestService(UserAdminService));

    userMock.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? null),
    );
  });

  describe('create', () => {
    it('should not create a user if there is no local admin account', async () => {
      userMock.getAdmin.mockResolvedValueOnce(null);

      await expect(
        sut.create({
          email: 'john_smith@email.com',
          name: 'John Smith',
          password: 'password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should create user', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      userMock.create.mockResolvedValue(userStub.user1);

      await expect(
        sut.create({
          email: userStub.user1.email,
          name: userStub.user1.name,
          password: 'password',
          storageLabel: 'label',
        }),
      ).resolves.toEqual(mapUserAdmin(userStub.user1));

      expect(userMock.getAdmin).toBeCalled();
      expect(userMock.create).toBeCalledWith({
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
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getByStorageLabel.mockResolvedValue(null);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.user1, userStub.user1.id, update);

      expect(userMock.getByEmail).toHaveBeenCalledWith(update.email);
      expect(userMock.getByStorageLabel).toHaveBeenCalledWith(update.storageLabel);
    });

    it('should not set an empty string for storage label', async () => {
      userMock.update.mockResolvedValue(userStub.user1);
      await sut.update(authStub.admin, userStub.user1.id, { storageLabel: '' });
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        storageLabel: null,
        updatedAt: expect.any(Date),
      });
    });

    it('should not change an email to one already in use', async () => {
      const dto = { id: userStub.user1.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByEmail.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: userStub.user1.id, storageLabel: 'admin' };

      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByStorageLabel.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('update user information should throw error if user not found', async () => {
      userMock.get.mockResolvedValueOnce(null);

      await expect(
        sut.update(authStub.admin, userStub.user1.id, { shouldChangePassword: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.delete(authStub.admin, userStub.admin.id, {})).rejects.toThrowError(BadRequestException);
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('cannot delete admin user', async () => {
      await expect(sut.delete(authStub.admin, userStub.admin.id, {})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.delete(authStub.user1, authStub.admin.user.id, {})).rejects.toBeInstanceOf(ForbiddenException);

      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should delete user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, {})).resolves.toEqual(mapUserAdmin(userStub.user1));
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        status: UserStatus.DELETED,
        deletedAt: expect.any(Date),
      });
    });

    it('should force delete user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, { force: true })).resolves.toEqual(
        mapUserAdmin(userStub.user1),
      );

      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        status: UserStatus.REMOVING,
        deletedAt: expect.any(Date),
      });
      expect(jobMock.queue).toHaveBeenCalledWith({
        name: JobName.USER_DELETION,
        data: { id: userStub.user1.id, force: true },
      });
    });
  });

  describe('restore', () => {
    it('should throw error if user could not be found', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.restore(authStub.admin, userStub.admin.id)).rejects.toThrowError(BadRequestException);
      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should restore an user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);
      await expect(sut.restore(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUserAdmin(userStub.user1));
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { status: UserStatus.ACTIVE, deletedAt: null });
    });
  });
});
