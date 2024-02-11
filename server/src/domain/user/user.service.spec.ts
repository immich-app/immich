import { UserEntity } from '@app/infra/entities';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  authStub,
  newAlbumRepositoryMock,
  newAssetRepositoryMock,
  newCryptoRepositoryMock,
  newJobRepositoryMock,
  newLibraryRepositoryMock,
  newStorageRepositoryMock,
  newUserRepositoryMock,
  userStub,
} from '@test';
import { when } from 'jest-when';
import { CacheControl, ImmichFileResponse } from '../domain.util';
import { JobName } from '../job';
import {
  IAlbumRepository,
  IAssetRepository,
  ICryptoRepository,
  IJobRepository,
  ILibraryRepository,
  IStorageRepository,
  IUserRepository,
} from '../repositories';
import { UpdateUserDto } from './dto/update-user.dto';
import { mapUser } from './response-dto';
import { UserService } from './user.service';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

describe(UserService.name, () => {
  let sut: UserService;
  let userMock: jest.Mocked<IUserRepository>;
  let cryptoRepositoryMock: jest.Mocked<ICryptoRepository>;

  let albumMock: jest.Mocked<IAlbumRepository>;
  let assetMock: jest.Mocked<IAssetRepository>;
  let jobMock: jest.Mocked<IJobRepository>;
  let libraryMock: jest.Mocked<ILibraryRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(async () => {
    albumMock = newAlbumRepositoryMock();
    assetMock = newAssetRepositoryMock();
    cryptoRepositoryMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new UserService(albumMock, assetMock, cryptoRepositoryMock, jobMock, libraryMock, storageMock, userMock);

    when(userMock.get).calledWith(authStub.admin.user.id, {}).mockResolvedValue(userStub.admin);
    when(userMock.get).calledWith(authStub.admin.user.id, { withDeleted: true }).mockResolvedValue(userStub.admin);
    when(userMock.get).calledWith(authStub.user1.user.id, {}).mockResolvedValue(userStub.user1);
    when(userMock.get).calledWith(authStub.user1.user.id, { withDeleted: true }).mockResolvedValue(userStub.user1);
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.getAll(authStub.admin, false)).resolves.toEqual([
        expect.objectContaining({
          id: authStub.admin.user.id,
          email: authStub.admin.user.email,
        }),
      ]);
      expect(userMock.getList).toHaveBeenCalledWith({ withDeleted: true });
    });
  });

  describe('get', () => {
    it('should get a user by id', async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      await sut.get(authStub.admin.user.id);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.get(authStub.admin.user.id)).rejects.toBeInstanceOf(NotFoundException);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, { withDeleted: false });
    });
  });

  describe('getMe', () => {
    it("should get the auth user's info", async () => {
      userMock.get.mockResolvedValue(userStub.admin);
      await sut.getMe(authStub.admin);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, {});
    });

    it('should throw an error if a user is not found', async () => {
      userMock.get.mockResolvedValue(null);
      await expect(sut.getMe(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(userMock.get).toHaveBeenCalledWith(authStub.admin.user.id, {});
    });
  });

  describe('update', () => {
    it('should update user', async () => {
      const update: UpdateUserDto = {
        id: userStub.user1.id,
        shouldChangePassword: true,
        email: 'immich@test.com',
        storageLabel: 'storage_label',
      };
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getByStorageLabel.mockResolvedValue(null);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.update({ user: { ...authStub.user1.user, isAdmin: true } }, update);

      expect(userMock.getByEmail).toHaveBeenCalledWith(update.email);
      expect(userMock.getByStorageLabel).toHaveBeenCalledWith(update.storageLabel);
    });

    it('should not set an empty string for storage label', async () => {
      userMock.update.mockResolvedValue(userStub.user1);
      await sut.update(authStub.admin, { id: userStub.user1.id, storageLabel: '' });
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        id: userStub.user1.id,
        storageLabel: null,
      });
    });

    it('should omit a storage label set by non-admin users', async () => {
      userMock.update.mockResolvedValue(userStub.user1);
      await sut.update({ user: userStub.user1 }, { id: userStub.user1.id, storageLabel: 'admin' });
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { id: userStub.user1.id });
    });

    it('user can only update its information', async () => {
      when(userMock.get)
        .calledWith('not_immich_auth_user_id', {})
        .mockResolvedValueOnce({
          ...userStub.user1,
          id: 'not_immich_auth_user_id',
        });

      const result = sut.update(
        { user: userStub.user1 },
        {
          id: 'not_immich_auth_user_id',
          password: 'I take over your account now',
        },
      );
      await expect(result).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should let a user change their email', async () => {
      const dto = { id: userStub.user1.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.update({ user: userStub.user1 }, dto);

      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        id: 'user-id',
        email: 'updated@test.com',
      });
    });

    it('should not let a user change their email to one already in use', async () => {
      const dto = { id: userStub.user1.id, email: 'updated@test.com' };

      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByEmail.mockResolvedValue(userStub.admin);

      await expect(sut.update({ user: userStub.user1 }, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should not let the admin change the storage label to one already in use', async () => {
      const dto = { id: userStub.user1.id, storageLabel: 'admin' };

      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByStorageLabel.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, dto)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('admin can update any user information', async () => {
      const update: UpdateUserDto = {
        id: userStub.user1.id,
        shouldChangePassword: true,
      };

      when(userMock.update).calledWith(userStub.user1.id, update).mockResolvedValueOnce(userStub.user1);
      await sut.update(authStub.admin, update);
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        id: 'user-id',
        shouldChangePassword: true,
      });
    });

    it('update user information should throw error if user not found', async () => {
      when(userMock.get).calledWith(userStub.user1.id, {}).mockResolvedValueOnce(null);

      const result = sut.update(authStub.admin, {
        id: userStub.user1.id,
        shouldChangePassword: true,
      });

      await expect(result).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should let the admin update himself', async () => {
      const dto = { id: userStub.admin.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.update).calledWith(userStub.admin.id, dto).mockResolvedValueOnce(userStub.admin);

      await sut.update(authStub.admin, dto);

      expect(userMock.update).toHaveBeenCalledWith(userStub.admin.id, dto);
    });

    it('should not let the another user become an admin', async () => {
      const dto = { id: userStub.user1.id, shouldChangePassword: true, isAdmin: true };

      when(userMock.get).calledWith(userStub.user1.id, {}).mockResolvedValueOnce(userStub.user1);

      await expect(sut.update(authStub.admin, dto)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('restore', () => {
    it('should throw error if user could not be found', async () => {
      when(userMock.get).calledWith(userStub.admin.id, { withDeleted: true }).mockResolvedValue(null);
      await expect(sut.restore(authStub.admin, userStub.admin.id)).rejects.toThrowError(BadRequestException);
      expect(userMock.restore).not.toHaveBeenCalled();
    });

    it('should restore an user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.restore.mockResolvedValue(userStub.user1);

      await expect(sut.restore(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUser(userStub.user1));
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, { withDeleted: true });
      expect(userMock.restore).toHaveBeenCalledWith(userStub.user1);
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.delete(authStub.admin, userStub.admin.id)).rejects.toThrowError(BadRequestException);
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('cannot delete admin user', async () => {
      await expect(sut.delete(authStub.admin, userStub.admin.id)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should require the auth user be an admin', async () => {
      await expect(sut.delete(authStub.user1, authStub.admin.user.id)).rejects.toBeInstanceOf(ForbiddenException);

      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should delete user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.delete.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUser(userStub.user1));
      expect(userMock.get).toHaveBeenCalledWith(userStub.user1.id, {});
      expect(userMock.delete).toHaveBeenCalledWith(userStub.user1);
    });
  });

  describe('create', () => {
    it('should not create a user if there is no local admin account', async () => {
      when(userMock.getAdmin).calledWith().mockResolvedValueOnce(null);

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
      ).resolves.toEqual(mapUser(userStub.user1));

      expect(userMock.getAdmin).toBeCalled();
      expect(userMock.create).toBeCalledWith({
        email: userStub.user1.email,
        name: userStub.user1.name,
        storageLabel: 'label',
        password: expect.anything(),
      });
    });
  });

  describe('createProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(BadRequestException);
    });

    it('should throw an error if the user profile could not be updated with the new image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.profilePath);
      userMock.update.mockRejectedValue(new InternalServerErrorException('mocked error'));

      await expect(sut.createProfileImage(authStub.admin, file)).rejects.toThrowError(InternalServerErrorException);
    });

    it('should delete the previous profile image', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(jobMock.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });

    it('should not delete the profile image if it has not been set', async () => {
      const file = { path: '/profile/path' } as Express.Multer.File;
      userMock.get.mockResolvedValue(userStub.admin);
      userMock.update.mockResolvedValue({ ...userStub.admin, profileImagePath: file.path });

      await sut.createProfileImage(authStub.admin, file);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteProfileImage', () => {
    it('should send an http error has no profile image', async () => {
      userMock.get.mockResolvedValue(userStub.admin);

      await expect(sut.deleteProfileImage(authStub.admin)).rejects.toBeInstanceOf(BadRequestException);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
    });

    it('should delete the profile image if user has one', async () => {
      userMock.get.mockResolvedValue(userStub.profilePath);
      const files = [userStub.profilePath.profileImagePath];

      await sut.deleteProfileImage(authStub.admin);
      expect(jobMock.queue.mock.calls).toEqual([[{ name: JobName.DELETE_FILES, data: { files } }]]);
    });
  });

  describe('getUserProfileImage', () => {
    it('should throw an error if the user does not exist', async () => {
      userMock.get.mockResolvedValue(null);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, {});
    });

    it('should throw an error if the user does not have a picture', async () => {
      userMock.get.mockResolvedValue(userStub.admin);

      await expect(sut.getProfileImage(userStub.admin.id)).rejects.toBeInstanceOf(NotFoundException);

      expect(userMock.get).toHaveBeenCalledWith(userStub.admin.id, {});
    });

    it('should return the profile picture', async () => {
      userMock.get.mockResolvedValue(userStub.profilePath);

      await expect(sut.getProfileImage(userStub.profilePath.id)).resolves.toEqual(
        new ImmichFileResponse({
          path: '/path/to/profile.jpg',
          contentType: 'image/jpeg',
          cacheControl: CacheControl.NONE,
        }),
      );

      expect(userMock.get).toHaveBeenCalledWith(userStub.profilePath.id, {});
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
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = jest.fn().mockImplementation(() => {});

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = jest.fn().mockResolvedValue('new-password');

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(true);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
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
      expect(jobMock.queueAll).toHaveBeenCalledWith([]);
    });

    it('should queue user ready for deletion', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(10) };
      userMock.getDeletedUsers.mockResolvedValue([user] as UserEntity[]);

      await sut.handleUserDeleteCheck();

      expect(userMock.getDeletedUsers).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.USER_DELETION, data: { id: user.id } }]);
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

  describe('handleUserSyncUsage', () => {
    it('should sync usage', async () => {
      await sut.handleUserSyncUsage();
      expect(userMock.syncUsage).toHaveBeenCalledTimes(1);
    });
  });
});
