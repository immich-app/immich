import { UserEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
} from '@test';
import { when } from 'jest-when';
import { IAlbumRepository } from '../album';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserRepository } from './user.repository';
import { UserService } from './user.service';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

const adminUserAuth: AuthUserDto = Object.freeze({
  id: 'admin_id',
  email: 'admin@test.com',
  isAdmin: true,
});

const immichUserAuth: AuthUserDto = Object.freeze({
  id: 'user-id',
  email: 'immich@test.com',
  isAdmin: false,
});

const adminUser: UserEntity = Object.freeze({
  id: adminUserAuth.id,
  email: 'admin@test.com',
  password: 'admin_password',
  firstName: 'admin_first_name',
  lastName: 'admin_last_name',
  isAdmin: true,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: new Date('2021-01-01'),
  deletedAt: null,
  updatedAt: new Date('2021-01-01'),
  tags: [],
  assets: [],
  storageLabel: 'admin',
});

const immichUser: UserEntity = Object.freeze({
  id: immichUserAuth.id,
  email: 'immich@test.com',
  password: 'immich_password',
  firstName: 'immich_first_name',
  lastName: 'immich_last_name',
  isAdmin: false,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: new Date('2021-01-01'),
  deletedAt: null,
  updatedAt: new Date('2021-01-01'),
  tags: [],
  assets: [],
  storageLabel: null,
});

const updatedImmichUser: UserEntity = Object.freeze({
  id: immichUserAuth.id,
  email: 'immich@test.com',
  password: 'immich_password',
  firstName: 'updated_immich_first_name',
  lastName: 'updated_immich_last_name',
  isAdmin: false,
  oauthId: '',
  shouldChangePassword: true,
  profileImagePath: '',
  createdAt: new Date('2021-01-01'),
  deletedAt: null,
  updatedAt: new Date('2021-01-01'),
  tags: [],
  assets: [],
  storageLabel: null,
});

const adminUserResponse = Object.freeze({
  id: adminUserAuth.id,
  email: 'admin@test.com',
  firstName: 'admin_first_name',
  lastName: 'admin_last_name',
  isAdmin: true,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: new Date('2021-01-01'),
  deletedAt: null,
  updatedAt: new Date('2021-01-01'),
  storageLabel: 'admin',
});

describe(UserService.name, () => {
  let sut: UserService;
  let userMock: jest.Mocked<IUserRepository>;
  let cryptoRepositoryMock: jest.Mocked<ICryptoRepository>;

  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    cryptoRepositoryMock = newCryptoRepositoryMock();
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new UserService(userMock, cryptoRepositoryMock, albumMock, assetMock, jobMock, storageMock);

    when(userMock.get).calledWith(adminUser.id).mockResolvedValue(adminUser);
    when(userMock.get).calledWith(adminUser.id, undefined).mockResolvedValue(adminUser);
    when(userMock.get).calledWith(immichUser.id).mockResolvedValue(immichUser);
    when(userMock.get).calledWith(immichUser.id, undefined).mockResolvedValue(immichUser);
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getAllUsers(adminUserAuth, false);

      expect(userMock.getList).toHaveBeenCalledWith({ withDeleted: true });
      expect(response).toEqual([
        {
          id: adminUserAuth.id,
          email: 'admin@test.com',
          firstName: 'admin_first_name',
          lastName: 'admin_last_name',
          isAdmin: true,
          oauthId: '',
          shouldChangePassword: false,
          profileImagePath: '',
          createdAt: new Date('2021-01-01'),
          deletedAt: null,
          updatedAt: new Date('2021-01-01'),
          storageLabel: 'admin',
        },
      ]);
    });
  });

  describe('getUserById', () => {
    it('should get a user by id', async () => {
      userMock.get.mockResolvedValue(adminUser);

      const response = await sut.getUserById(adminUser.id);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, false);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getUserById(adminUser.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, false);
    });
  });

  describe('getUserInfo', () => {
    it("should get the auth user's info", async () => {
      userMock.get.mockResolvedValue(adminUser);

      const response = await sut.getUserInfo(adminUser);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getUserInfo(adminUser)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
    });
  });

  describe('getUserCount', () => {
    it('should get the user count', async () => {
      userMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getUserCount({});

      expect(userMock.getList).toHaveBeenCalled();
      expect(response).toEqual({ userCount: 1 });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
      };

      when(userMock.update).calledWith(update.id, update).mockResolvedValueOnce(updatedImmichUser);

      const updatedUser = await sut.updateUser(immichUserAuth, update);
      expect(updatedUser.shouldChangePassword).toEqual(true);
    });

    it('should not set an empty string for storage label', async () => {
      userMock.update.mockResolvedValue(updatedImmichUser);

      await sut.updateUser(adminUserAuth, { id: immichUser.id, storageLabel: '' });

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, { id: immichUser.id, storageLabel: null });
    });

    it('should omit a storage label set by non-admin users', async () => {
      userMock.update.mockResolvedValue(updatedImmichUser);

      await sut.updateUser(immichUserAuth, { id: immichUser.id, storageLabel: 'admin' });

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, { id: immichUser.id });
    });

    it('user can only update its information', async () => {
      when(userMock.get)
        .calledWith('not_immich_auth_user_id', undefined)
        .mockResolvedValueOnce({
          ...immichUser,
          id: 'not_immich_auth_user_id',
        });

      const result = sut.updateUser(immichUserAuth, {
        id: 'not_immich_auth_user_id',
        password: 'I take over your account now',
      });
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should let a user change their email', async () => {
      const dto = { id: immichUser.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.update.mockResolvedValue(immichUser);

      await sut.updateUser(immichUser, dto);

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, {
        id: 'user-id',
        email: 'updated@test.com',
      });
    });

    it('should not let a user change their email to one already in use', async () => {
      const dto = { id: immichUser.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.getByEmail.mockResolvedValue(adminUser);

      await expect(sut.updateUser(immichUser, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: immichUser.id, storageLabel: 'admin' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.getByStorageLabel.mockResolvedValue(adminUser);

      await expect(sut.updateUser(adminUser, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('admin can update any user information', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
      };

      when(userMock.update).calledWith(immichUser.id, update).mockResolvedValueOnce(updatedImmichUser);

      const result = await sut.updateUser(adminUserAuth, update);

      expect(result).toBeDefined();
      expect(result.id).toEqual(updatedImmichUser.id);
      expect(result.shouldChangePassword).toEqual(updatedImmichUser.shouldChangePassword);
    });

    it('update user information should throw error if user not found', async () => {
      when(userMock.get).calledWith(immichUser.id, undefined).mockResolvedValueOnce(null);

      const result = sut.updateUser(adminUser, {
        id: immichUser.id,
        shouldChangePassword: true,
      });

      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should let the admin update himself', async () => {
      const dto = { id: adminUser.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.get).calledWith(adminUser.id).mockResolvedValueOnce(null);
      when(userMock.update).calledWith(adminUser.id, dto).mockResolvedValueOnce(adminUser);

      await sut.updateUser(adminUser, dto);

      expect(userMock.update).toHaveBeenCalledWith(adminUser.id, dto);
    });

    it('should not let the another user become an admin', async () => {
      const dto = { id: immichUser.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.get).calledWith(immichUser.id).mockResolvedValueOnce(immichUser);

      await expect(sut.updateUser(adminUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('restoreUser', () => {
    it('should require an admin', async () => {
      when(userMock.get).calledWith(adminUser.id, true).mockResolvedValue(adminUser);
      await expect(sut.restoreUser(immichUserAuth, adminUser.id)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, true);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.deleteUser(immichUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('cannot delete admin user', async () => {
      await expect(sut.deleteUser(adminUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.deleteUser(immichUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should not create a user if there is no local admin account', async () => {
      when(userMock.getAdmin).calledWith().mockResolvedValueOnce(null);

      await expect(
        sut.createUser({
          email: 'john_smith@email.com',
          firstName: 'John',
          lastName: 'Smith',
          password: 'password',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('createProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.update.mockResolvedValue({ ...adminUser, profileImagePath: file.path });

      await sut.createProfileImage(adminUserAuth, file);

      expect(userMock.update).toHaveBeenCalledWith(adminUserAuth.id, { profileImagePath: file.path });
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getUserProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(adminUserAuth.id, undefined);
    });

    it('should throw an error if the user does not have a picture', async () => {
      userMock.get.mockResolvedValue(adminUser);

      await expect(sut.getUserProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(adminUserAuth.id, undefined);
    });
  });

  describe('resetAdminPassword', () => {
    it('should only work when there is an admin account', async () => {
      userMock.getAdmin.mockResolvedValue(null);
      const ask = jest.fn().mockResolvedValue('new-password');

      await expect(sut.resetAdminPassword(ask)).rejects.toBeInstanceOf(BadRequestException);

      expect(ask).not.toHaveBeenCalled();
    });

    it('should default to a random password', async () => {
      userMock.getAdmin.mockResolvedValue(adminUser);
      const ask = jest.fn().mockResolvedValue(undefined);

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(adminUser.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      userMock.getAdmin.mockResolvedValue(adminUser);
      const ask = jest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(adminUser.id);
      expect(update.password).toBeDefined();
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
    });

    it('should queue user ready for deletion', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) };
      userMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.USER_DELETION, data: { id: user.id } });
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
      expect(assetMock.deleteAll).toHaveBeenCalledWith(user.id);
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
});
