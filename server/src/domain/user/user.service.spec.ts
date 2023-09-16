import { UserEntity } from '@app/infra/entities';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
  userStub,
} from '@test';
import { when } from 'jest-when';
import { IAlbumRepository } from '../album';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IJobRepository, JobName } from '../job';
import { IStorageRepository } from '../storage';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto, mapUser } from './response-dto';
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
  externalPath: null,
  memoriesEnabled: true,
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
  externalPath: null,
  memoriesEnabled: true,
});

const updatedImmichUser = Object.freeze<UserEntity>({
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
  externalPath: null,
  memoriesEnabled: true,
});

const adminUserResponse = Object.freeze<UserResponseDto>({
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
  externalPath: null,
  memoriesEnabled: true,
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

  describe('getAll', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getAll(adminUserAuth, false);

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
          externalPath: null,
          memoriesEnabled: true,
        },
      ]);
    });
  });

  describe('get', () => {
    it('should get a user by id', async () => {
      userMock.get.mockResolvedValue(adminUser);

      const response = await sut.get(adminUser.id);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, false);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.get(adminUser.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, false);
    });
  });

  describe('getMe', () => {
    it("should get the auth user's info", async () => {
      userMock.get.mockResolvedValue(adminUser);

      const response = await sut.getMe(adminUser);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
      expect(response).toEqual(adminUserResponse);
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getMe(adminUser)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, undefined);
    });
  });

  describe('getCount', () => {
    it('should get the user count', async () => {
      userMock.getList.mockResolvedValue([adminUser]);

      const response = await sut.getCount({});

      expect(userMock.getList).toHaveBeenCalled();
      expect(response).toEqual({ userCount: 1 });
    });

    it('should get the user count of all admin users', async () => {
      userMock.getList.mockResolvedValue([adminUser, immichUser]);

      await expect(sut.getCount({ admin: true })).resolves.toEqual({ userCount: 1 });
      expect(userMock.getList).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
        email: 'immich@test.com',
        storageLabel: 'storage_label',
      };
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getByStorageLabel.mockResolvedValue(null);
      userMock.update.mockResolvedValue({ ...updatedImmichUser, isAdmin: true, storageLabel: 'storage_label' });

      const updatedUser = await sut.update({ ...immichUserAuth, isAdmin: true }, update);
      expect(updatedUser.shouldChangePassword).toEqual(true);
      expect(userMock.getByEmail).toHaveBeenCalledWith(update.email);
      expect(userMock.getByStorageLabel).toHaveBeenCalledWith(update.storageLabel);
    });

    it('should not set an empty string for storage label', async () => {
      userMock.update.mockResolvedValue(updatedImmichUser);

      await sut.update(adminUserAuth, { id: immichUser.id, storageLabel: '' });

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, { id: immichUser.id, storageLabel: null });
    });

    it('should omit a storage label set by non-admin users', async () => {
      userMock.update.mockResolvedValue(updatedImmichUser);

      await sut.update(immichUserAuth, { id: immichUser.id, storageLabel: 'admin' });

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, { id: immichUser.id });
    });

    it('user can only update its information', async () => {
      when(userMock.get)
        .calledWith('not_immich_auth_user_id', undefined)
        .mockResolvedValueOnce({
          ...immichUser,
          id: 'not_immich_auth_user_id',
        });

      const result = sut.update(immichUserAuth, {
        id: 'not_immich_auth_user_id',
        password: 'I take over your account now',
      });
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should let a user change their email', async () => {
      const dto = { id: immichUser.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.update.mockResolvedValue(immichUser);

      await sut.update(immichUser, dto);

      expect(userMock.update).toHaveBeenCalledWith(immichUser.id, {
        id: 'user-id',
        email: 'updated@test.com',
      });
    });

    it('should not let a user change their email to one already in use', async () => {
      const dto = { id: immichUser.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.getByEmail.mockResolvedValue(adminUser);

      await expect(sut.update(immichUser, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: immichUser.id, storageLabel: 'admin' };

      userMock.get.mockResolvedValue(immichUser);
      userMock.getByStorageLabel.mockResolvedValue(adminUser);

      await expect(sut.update(adminUser, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('admin can update any user information', async () => {
      const update: UpdateUserDto = {
        id: immichUser.id,
        shouldChangePassword: true,
      };

      when(userMock.update).calledWith(immichUser.id, update).mockResolvedValueOnce(updatedImmichUser);

      const result = await sut.update(adminUserAuth, update);

      expect(result).toBeDefined();
      expect(result.id).toEqual(updatedImmichUser.id);
      expect(result.shouldChangePassword).toEqual(updatedImmichUser.shouldChangePassword);
    });

    it('update user information should throw error if user not found', async () => {
      when(userMock.get).calledWith(immichUser.id, undefined).mockResolvedValueOnce(null);

      const result = sut.update(adminUser, {
        id: immichUser.id,
        shouldChangePassword: true,
      });

      await expect(result).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should let the admin update himself', async () => {
      const dto = { id: adminUser.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.get).calledWith(adminUser.id).mockResolvedValueOnce(null);
      when(userMock.update).calledWith(adminUser.id, dto).mockResolvedValueOnce(adminUser);

      await sut.update(adminUser, dto);

      expect(userMock.update).toHaveBeenCalledWith(adminUser.id, dto);
    });

    it('should not let the another user become an admin', async () => {
      const dto = { id: immichUser.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.get).calledWith(immichUser.id).mockResolvedValueOnce(immichUser);

      await expect(sut.update(adminUser, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should throw error if user could not be found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.restore(immichUserAuth, adminUser.id)).rejects.toThrowError(BadRequestException);
      expect(userMock.restore).not.toHaveBeenCalled();
    });

    it('should require an admin', async () => {
      when(userMock.get).calledWith(adminUser.id, true).mockResolvedValue(adminUser);
      await expect(sut.restore(immichUserAuth, adminUser.id)).rejects.toBeInstanceOf(ForbiddenException);
      expect(userMock.get).toHaveBeenCalledWith(adminUser.id, true);
    });

    it('should restore an user', async () => {
      userMock.get.mockResolvedValue(immichUser);
      userMock.restore.mockResolvedValue(immichUser);

      await expect(sut.restore(adminUserAuth, immichUser.id)).resolves.toEqual(mapUser(immichUser));
      expect(userMock.get).toHaveBeenCalledWith(immichUser.id, true);
      expect(userMock.restore).toHaveBeenCalledWith(immichUser);
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.delete(immichUserAuth, adminUser.id)).rejects.toThrowError(BadRequestException);
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('cannot delete admin user', async () => {
      await expect(sut.delete(adminUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.delete(immichUserAuth, adminUserAuth.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should delete user', async () => {
      userMock.get.mockResolvedValue(immichUser);
      userMock.delete.mockResolvedValue(immichUser);

      await expect(sut.delete(adminUserAuth, immichUser.id)).resolves.toEqual(mapUser(immichUser));
      expect(userMock.get).toHaveBeenCalledWith(immichUser.id, undefined);
      expect(userMock.delete).toHaveBeenCalledWith(immichUser);
    });
  });

  describe('create', () => {
    it('should not create a user if there is no local admin account', async () => {
      when(userMock.getAdmin).calledWith().mockResolvedValueOnce(null);

      await expect(
        sut.create({
          email: 'john_smith@email.com',
          firstName: 'John',
          lastName: 'Smith',
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
          firstName: userStub.user1.firstName,
          lastName: userStub.user1.lastName,
          password: 'password',
          storageLabel: 'label',
        }),
      ).resolves.toEqual(mapUser(userStub.user1));

      expect(userMock.getAdmin).toBeCalled();
      expect(userMock.create).toBeCalledWith({
        email: userStub.user1.email,
        firstName: userStub.user1.firstName,
        lastName: userStub.user1.lastName,
        storageLabel: 'label',
        password: expect.anything(),
      });
    });
  });

  describe('createProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.update.mockResolvedValue({ ...adminUser, profileImagePath: file.path });

      await sut.createProfileImage(adminUserAuth, file);

      expect(userMock.update).toHaveBeenCalledWith(adminUserAuth.id, { profileImagePath: file.path });
    });

    it('should throw an error if the user profile could not be updated with the new image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.update.mockRejectedValue(new InternalServerErrorException('mocked error'));

      await expect(sut.createProfileImage(adminUserAuth, file)).rejects.toThrowError(InternalServerErrorException);
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(adminUserAuth.id, undefined);
    });

    it('should throw an error if the user does not have a picture', async () => {
      userMock.get.mockResolvedValue(adminUser);

      await expect(sut.getProfileImage(adminUserAuth.id)).rejects.toBeInstanceOf(NotFoundException);

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
