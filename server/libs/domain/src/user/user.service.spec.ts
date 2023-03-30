import { UserEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { when } from 'jest-when';
import {
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newKeyRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
  newUserTokenRepositoryMock,
} from '../../test';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { IUserTokenRepository } from '../user-token';
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
  id: 'immich_id',
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
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
  tags: [],
  assets: [],
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
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
  tags: [],
  assets: [],
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
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
  tags: [],
  assets: [],
});

const adminUserResponse = Object.freeze({
  id: adminUserAuth.id,
  email: 'admin@test.com',
  deletedAt: undefined,
  firstName: 'admin_first_name',
  lastName: 'admin_last_name',
  isAdmin: true,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: '2021-01-01',
  updatedAt: '2021-01-01',
});

describe(UserService.name, () => {
  let sut: UserService;
  let userRepositoryMock: jest.Mocked<IUserRepository>;
  let cryptoRepositoryMock: jest.Mocked<ICryptoRepository>;

  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let keyMock: jest.Mocked<IKeyRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let tokenMock: jest.Mocked<IUserTokenRepository>;

  beforeEach(async () => {
    userRepositoryMock = newUserRepositoryMock();
    cryptoRepositoryMock = newCryptoRepositoryMock();

    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    jobMock = newJobRepositoryMock();
    keyMock = newKeyRepositoryMock();
    storageMock = newStorageRepositoryMock();
    tokenMock = newUserTokenRepositoryMock();
    userRepositoryMock = newUserRepositoryMock();

    sut = new UserService(
      userRepositoryMock,
      cryptoRepositoryMock,
      albumMock,
      assetMock,
      jobMock,
      keyMock,
      storageMock,
      tokenMock,
    );

    when(userRepositoryMock.get).calledWith(adminUser.id).mockResolvedValue(adminUser);
    when(userRepositoryMock.get).calledWith(adminUser.id, undefined).mockResolvedValue(adminUser);
    when(userRepositoryMock.get).calledWith(immichUser.id).mockResolvedValue(immichUser);
    when(userRepositoryMock.get).calledWith(immichUser.id, undefined).mockResolvedValue(immichUser);
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      userRepositoryMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getAllUsers(adminUserAuth, false);

      expect(userRepositoryMock.getList).toHaveBeenCalledWith({ excludeId: adminUser.id });
      expect(response).toEqual([
        {
          id: adminUserAuth.id,
          email: 'admin@test.com',
          deletedAt: undefined,
          firstName: 'admin_first_name',
          lastName: 'admin_last_name',
          isAdmin: true,
          oauthId: '',
          shouldChangePassword: false,
          profileImagePath: '',
          createdAt: '2021-01-01',
          updatedAt: '2021-01-01',
        },
      ]);
    });
  });

  describe('getUserById', () => {
    it('should get a user by id', async () => {
      userRepositoryMock.get.mockResolvedValue(adminUser);

      const response = await sut.getUserById(adminUser.id);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUser.id, false);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userRepositoryMock.get.mockResolvedValue(null);

      await expect(sut.getUserById(adminUser.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUser.id, false);
    });
  });

  describe('getUserInfo', () => {
    it("should get the auth user's info", async () => {
      userRepositoryMock.get.mockResolvedValue(adminUser);

      const response = await sut.getUserInfo(adminUser);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userRepositoryMock.get.mockResolvedValue(null);

      await expect(sut.getUserInfo(adminUser)).rejects.toBeInstanceOf(BadRequestException);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
    });
  });

  describe('getUserCount', () => {
    it('should get the user count', async () => {
      userRepositoryMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getUserCount({});

      expect(userRepositoryMock.getList).toHaveBeenCalled();
      expect(response).toEqual({ userCount: 1 });
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
      };

      when(userRepositoryMock.update).calledWith(update.id, update).mockResolvedValueOnce(updatedImmichUser);

      const updatedUser = await sut.updateUser(immichUserAuth, update);
      expect(updatedUser.shouldChangePassword).toEqual(true);
    });

    it('user can only update its information', async () => {
      when(userRepositoryMock.get)
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

      userRepositoryMock.get.mockResolvedValue(immichUser);
      userRepositoryMock.update.mockResolvedValue(immichUser);

      await sut.updateUser(immichUser, dto);

      expect(userRepositoryMock.update).toHaveBeenCalledWith(immichUser.id, {
        id: 'immich_id',
        email: 'updated@test.com',
      });
    });

    it('should not let a user change their email to one already in use', async () => {
      const dto = { id: immichUser.id, email: 'updated@test.com' };

      userRepositoryMock.get.mockResolvedValue(immichUser);
      userRepositoryMock.getByEmail.mockResolvedValue(adminUser);

      await expect(sut.updateUser(immichUser, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userRepositoryMock.update).not.toHaveBeenCalled();
    });

    it('admin can update any user information', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
      };

      when(userRepositoryMock.update).calledWith(immichUser.id, update).mockResolvedValueOnce(updatedImmichUser);

      const result = await sut.updateUser(adminUserAuth, update);

      expect(result).toBeDefined();
      expect(result.id).toEqual(updatedImmichUser.id);
      expect(result.shouldChangePassword).toEqual(updatedImmichUser.shouldChangePassword);
    });

    it('update user information should throw error if user not found', async () => {
      when(userRepositoryMock.get).calledWith(immichUser.id, undefined).mockResolvedValueOnce(null);

      const result = sut.updateUser(adminUser, {
        id: immichUser.id,
        shouldChangePassword: true,
      });

      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should let the admin update himself', async () => {
      const dto = { id: adminUser.id, shouldChangePassword: true, isAdmin: true };

      when(userRepositoryMock.get).calledWith(adminUser.id).mockResolvedValueOnce(null);
      when(userRepositoryMock.update).calledWith(adminUser.id, dto).mockResolvedValueOnce(adminUser);

      await sut.updateUser(adminUser, dto);

      expect(userRepositoryMock.update).toHaveBeenCalledWith(adminUser.id, dto);
    });

    it('should not let the another user become an admin', async () => {
      const dto = { id: immichUser.id, shouldChangePassword: true, isAdmin: true };

      when(userRepositoryMock.get).calledWith(immichUser.id).mockResolvedValueOnce(immichUser);

      await expect(sut.updateUser(adminUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('restoreUser', () => {
    it('should require an admin', async () => {
      when(userRepositoryMock.get).calledWith(adminUser.id, true).mockResolvedValue(adminUser);
      await expect(sut.restoreUser(immichUserAuth, adminUser.id)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUser.id, true);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.deleteUser(immichUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('cannot delete admin user', async () => {
      await expect(sut.deleteUser(adminUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.deleteUser(immichUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should not create a user if there is no local admin account', async () => {
      when(userRepositoryMock.getAdmin).calledWith().mockResolvedValueOnce(null);

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
      userRepositoryMock.update.mockResolvedValue({ ...adminUser, profileImagePath: file.path });

      await sut.createProfileImage(adminUserAuth, file);

      expect(userRepositoryMock.update).toHaveBeenCalledWith(adminUserAuth.id, { profileImagePath: file.path });
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userRepositoryMock.get.mockResolvedValue(null);

      await expect(sut.getUserProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUserAuth.id, undefined);
    });

    it('should throw an error if the user does not have a picture', async () => {
      userRepositoryMock.get.mockResolvedValue(adminUser);

      await expect(sut.getUserProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userRepositoryMock.get).toHaveBeenCalledWith(adminUserAuth.id, undefined);
    });
  });

  describe('resetAdminPassword', () => {
    it('should only work when there is an admin account', async () => {
      userRepositoryMock.getAdmin.mockResolvedValue(null);
      const ask = jest.fn().mockResolvedValue('new-password');

      await expect(sut.resetAdminPassword(ask)).rejects.toBeInstanceOf(BadRequestException);

      expect(ask).not.toHaveBeenCalled();
    });

    it('should default to a random password', async () => {
      userRepositoryMock.getAdmin.mockResolvedValue(adminUser);
      const ask = jest.fn().mockResolvedValue(undefined);

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userRepositoryMock.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(adminUser.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      userRepositoryMock.getAdmin.mockResolvedValue(adminUser);
      const ask = jest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userRepositoryMock.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(adminUser.id);
      expect(update.password).toBeDefined();
    });
  });

  describe('handleQueueUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      userRepositoryMock.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(5) },
      ] as UserEntity[]);

      await sut.handleQueueUserDelete();

      expect(userRepositoryMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).not.toHaveBeenCalled();
    });

    it('should queue user ready for deletion', async () => {
      const user = { deletedAt: makeDeletedAt(10) };
      userRepositoryMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleQueueUserDelete();

      expect(userRepositoryMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queue).toHaveBeenCalledWith({ name: JobName.USER_DELETION, data: { user } });
    });
  });

  describe('handleUserDelete', () => {
    it('should skip users not ready for deletion', async () => {
      const user = { deletedAt: makeDeletedAt(5) } as UserEntity;

      await sut.handleUserDelete({ user });

      expect(storageMock.unlinkDir).not.toHaveBeenCalled();
      expect(userRepositoryMock.delete).not.toHaveBeenCalled();
    });

    it('should delete the user and associated assets', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;

      await sut.handleUserDelete({ user });

      const options = { force: true, recursive: true };

      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/library/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/upload/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/profile/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/thumbs/deleted-user', options);
      expect(storageMock.unlinkDir).toHaveBeenCalledWith('upload/encoded-video/deleted-user', options);
      expect(tokenMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(keyMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(albumMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(assetMock.deleteAll).toHaveBeenCalledWith(user.id);
      expect(userRepositoryMock.delete).toHaveBeenCalledWith(user, true);
    });

    it('should handle an error', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) } as UserEntity;

      storageMock.unlinkDir.mockRejectedValue(new Error('Read only filesystem'));

      await sut.handleUserDelete({ user });

      expect(userRepositoryMock.delete).not.toHaveBeenCalled();
    });
  });
});
