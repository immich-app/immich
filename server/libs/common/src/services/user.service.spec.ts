import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { User } from '../models';
import { IUserRepository, UserService } from './user.service';

const adminAuthUser = Object.freeze({
  id: 'admin_id',
  email: 'admin@test.com',
});

const immichAuthUser = Object.freeze({
  id: 'immich_id',
  email: 'immich@test.com',
});

const adminUser = Object.freeze({
  id: 'admin_id',
  email: 'admin@test.com',
  firstName: 'admin_first_name',
  lastName: 'admin_last_name',
  isAdmin: true,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: '2021-01-01',
  tags: [],
});

const immichUser: User = Object.freeze({
  id: 'immich_id',
  email: 'immich@test.com',
  firstName: 'immich_first_name',
  lastName: 'immich_last_name',
  isAdmin: false,
  oauthId: '',
  shouldChangePassword: false,
  profileImagePath: '',
  createdAt: '2021-01-01',
  tags: [],
});

const updatedImmichUser: User = Object.freeze({
  id: 'immich_id',
  email: 'immich@test.com',
  firstName: 'updated_immich_first_name',
  lastName: 'updated_immich_last_name',
  isAdmin: false,
  oauthId: '',
  shouldChangePassword: true,
  profileImagePath: '',
  createdAt: '2021-01-01',
  tags: [],
});

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('new-password-hash'),
  genSalt: jest.fn().mockResolvedValue('new-salt'),
}));

describe('UserService', () => {
  let sut: UserService;
  let repositoryMock: jest.Mocked<IUserRepository>;

  beforeAll(() => {
    repositoryMock = {
      get: jest.fn(),
      getAdmin: jest.fn(),
      getByEmail: jest.fn(),
      getByOAuthId: jest.fn(),
      getList: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      restore: jest.fn(),
    };

    sut = new UserService(repositoryMock);
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('getAllUsers', () => {
    it('should get all users', async () => {
      repositoryMock.getList.mockResolvedValue([]);

      await expect(sut.getAllUsers('user-1', true)).resolves.toEqual([]);
      expect(repositoryMock.getList).toHaveBeenCalledWith();
    });

    it('should get all users except one', async () => {
      repositoryMock.getList.mockResolvedValue([]);

      await expect(sut.getAllUsers('user-1', false)).resolves.toEqual([]);
      expect(repositoryMock.getList).toHaveBeenCalledWith({ excludeId: 'user-1' });
    });
  });

  describe('getUserById', () => {
    it('should return a user', async () => {
      repositoryMock.get.mockResolvedValue(adminUser);
      await expect(sut.getUserById('user-1', true)).resolves.toEqual(adminUser);
      expect(repositoryMock.get).toHaveBeenCalledWith('user-1', true);
    });

    it('should return a deleted user', async () => {
      repositoryMock.get.mockResolvedValue(adminUser);
      await expect(sut.getUserById('user-1')).resolves.toEqual(adminUser);
      expect(repositoryMock.get).toHaveBeenCalledWith('user-1', false);
    });
  });

  describe('getUserCount', () => {
    it('should return the count', async () => {
      repositoryMock.getList.mockResolvedValue([]);
      await expect(sut.getUserCount({})).resolves.toEqual(0);
      expect(repositoryMock.getList).toHaveBeenCalled();
    });
  });

  describe('getAdmin', () => {
    it('should return the admin account', async () => {
      repositoryMock.getAdmin.mockResolvedValue(adminUser);
      await expect(sut.getAdmin()).resolves.toEqual(adminUser);
      expect(repositoryMock.getAdmin).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should not crete a duplicate user', async () => {
      repositoryMock.getByEmail.mockResolvedValue(adminUser);
      await expect(sut.create(adminUser)).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.getByEmail).toHaveBeenCalledWith(adminUser.email);
    });

    it('should generate a new password', async () => {
      repositoryMock.getByEmail.mockResolvedValue(null);
      repositoryMock.create.mockResolvedValue(adminUser);

      await expect(
        sut.create({
          email: 'new-user@immich.app',
          password: 'new-password',
        }),
      ).resolves.toEqual(adminUser);
      expect(repositoryMock.create).toHaveBeenCalledWith({
        email: 'new-user@immich.app',
        password: 'new-password-hash',
        salt: 'new-salt',
      });
    });

    it('should not create a user if there is no local admin account', async () => {
      repositoryMock.getAdmin.mockResolvedValue(null);
      await expect(sut.create({ isAdmin: false, email: '' })).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.getAdmin).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should require a valid requestor', async () => {
      repositoryMock.get.mockResolvedValue(null);
      await expect(sut.update('invalid-id', adminUser)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repositoryMock.get).toHaveBeenCalledWith('invalid-id');
    });

    it('should update user', async () => {
      const requestor = immichAuthUser;
      const userToUpdate = immichUser;

      repositoryMock.get.mockResolvedValueOnce(immichUser);
      repositoryMock.get.mockResolvedValueOnce({ ...userToUpdate });
      repositoryMock.update.mockResolvedValueOnce(updatedImmichUser);

      const request = { id: userToUpdate.id, firstName: 'New name' };

      await expect(sut.update(requestor.id, request)).resolves.toEqual(updatedImmichUser);
    });

    it('should not be able to update another user', async () => {
      repositoryMock.get.mockResolvedValue(immichUser);

      const result = sut.update('user-1', {
        id: 'not_immich_auth_user_id',
        password: 'I take over your account now',
      });
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
      expect(repositoryMock.get).toHaveBeenCalled();
    });

    it('should let the admin update another account', async () => {
      const userToUpdate = immichUser;
      const request = {
        id: userToUpdate.id,
        shouldChangePassword: false,
        email: 'New email',
        firstName: 'New first name',
        lastName: 'New last name',
        oauthId: 'New oauth id',
        profileImagePath: 'New profile image',
      };

      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce({ ...userToUpdate });
      repositoryMock.update.mockResolvedValueOnce(updatedImmichUser);

      await expect(sut.update(adminUser.id, request)).resolves.toEqual(updatedImmichUser);
      expect(repositoryMock.update).toHaveBeenCalledWith({
        createdAt: '2021-01-01',
        email: 'New email',
        firstName: 'New first name',
        id: 'immich_id',
        isAdmin: false,
        lastName: 'New last name',
        oauthId: 'New oauth id',
        profileImagePath: 'New profile image',
        shouldChangePassword: false,
        tags: [],
      });
    });

    it('should not allow multiple admin accounts', async () => {
      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce({ ...immichUser });
      repositoryMock.getAdmin.mockResolvedValueOnce(adminUser);
      const request = { id: 'user-1', isAdmin: true };

      await expect(sut.update('user-1', request)).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.get).toHaveBeenCalled();
    });

    it('should allow one admin account', async () => {
      repositoryMock.get.mockResolvedValueOnce({ ...immichUser });
      repositoryMock.get.mockResolvedValueOnce({ ...immichUser });
      repositoryMock.getAdmin.mockResolvedValueOnce(null);
      repositoryMock.update.mockResolvedValueOnce({ ...immichUser, isAdmin: true });
      const request = { id: immichUser.id, isAdmin: true };

      await expect(sut.update(immichUser.id, request)).resolves.toEqual({ ...immichUser, isAdmin: true });
      expect(repositoryMock.getAdmin).toHaveBeenCalled();
      expect(repositoryMock.update).toHaveBeenCalledWith({ ...immichUser, isAdmin: true });
    });

    it('update user information should throw error if user not found', async () => {
      const requestor = adminAuthUser;
      const userToUpdate = immichUser;

      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce(null);

      const result = sut.update(requestor.id, {
        id: userToUpdate.id,
        shouldChangePassword: true,
      });
      await expect(result).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should update user', async () => {
      const requestor = immichAuthUser;
      const userToUpdate = immichUser;

      repositoryMock.get.mockResolvedValueOnce(immichUser);
      repositoryMock.get.mockResolvedValueOnce({ ...userToUpdate });
      repositoryMock.update.mockResolvedValueOnce(updatedImmichUser);

      const request = { id: userToUpdate.id, shouldChangePassword: true };

      await expect(sut.update(requestor.id, request)).resolves.toBeDefined();
    });
  });

  describe('remove', () => {
    it('should require a valid requestor', async () => {
      repositoryMock.get.mockResolvedValue(null);
      await expect(sut.remove('invalid-id', 'user-1')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repositoryMock.get).toHaveBeenCalledWith('invalid-id');
    });

    it('should require an admin', async () => {
      repositoryMock.get.mockResolvedValue(immichUser);
      await expect(sut.remove(immichUser.id, 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repositoryMock.get).toHaveBeenCalledWith(immichUser.id);
    });

    it('should require a valid user id', async () => {
      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce(null);
      await expect(sut.remove(adminUser.id, 'invalid-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.get).toHaveBeenCalledWith('invalid-id');
    });

    it('should not allow the admin user to be deleted', async () => {
      repositoryMock.get.mockResolvedValue(adminUser);
      await expect(sut.remove(adminAuthUser.id, adminAuthUser.id)).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.get).toHaveBeenCalledWith(adminUser.id);
    });

    it('should remove the user', async () => {
      const response = { ...immichUser, deletedAt: new Date(2000, 1, 2) };
      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce(immichUser);
      repositoryMock.remove.mockResolvedValue(response);
      await expect(sut.remove(adminAuthUser.id, immichUser.id)).resolves.toEqual(response);
      expect(repositoryMock.get).toHaveBeenLastCalledWith(immichUser.id);
    });
  });

  describe('restore', () => {
    it('should require a valid requestor', async () => {
      repositoryMock.get.mockResolvedValue(null);
      await expect(sut.restore('invalid-id', 'user-1')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repositoryMock.get).toHaveBeenCalledWith('invalid-id');
    });

    it('should require an admin', async () => {
      repositoryMock.get.mockResolvedValue(immichUser);
      await expect(sut.restore(immichUser.id, 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repositoryMock.get).toHaveBeenCalledWith(immichUser.id);
    });

    it('should require a valid user id', async () => {
      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce(null);
      await expect(sut.restore(adminUser.id, 'invalid-id')).rejects.toBeInstanceOf(BadRequestException);
      expect(repositoryMock.get).toHaveBeenCalledWith('invalid-id', true);
    });

    it('should restore the user', async () => {
      const response = { ...immichUser, deletedAt: new Date(2000, 1, 2) };
      repositoryMock.get.mockResolvedValueOnce(adminUser);
      repositoryMock.get.mockResolvedValueOnce(response);
      repositoryMock.restore.mockResolvedValue(immichUser);
      await expect(sut.restore(adminAuthUser.id, immichUser.id)).resolves.toEqual(immichUser);
      expect(repositoryMock.get).toHaveBeenLastCalledWith(immichUser.id, true);
    });
  });
});
