import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateUserDto, mapUser } from 'src/dtos/user.dto';
import { UserEntity, UserStatus } from 'src/entities/user.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { UserService } from 'src/services/user.service';
import { authStub } from 'test/fixtures/auth.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newAlbumRepositoryMock } from 'test/repositories/album.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLibraryRepositoryMock } from 'test/repositories/library.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemConfigRepositoryMock } from 'test/repositories/system-config.repository.mock';
import { newUserRepositoryMock } from 'test/repositories/user.repository.mock';
import { Mocked, vitest } from 'vitest';

const makeDeletedAt = (daysAgo: number) => {
  const deletedAt = new Date();
  deletedAt.setDate(deletedAt.getDate() - daysAgo);
  return deletedAt;
};

describe(UserService.name, () => {
  let sut: UserService;
  let userMock: Mocked<IUserRepository>;
  let cryptoRepositoryMock: Mocked<ICryptoRepository>;

  let albumMock: Mocked<IAlbumRepository>;
  let jobMock: Mocked<IJobRepository>;
  let libraryMock: Mocked<ILibraryRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let configMock: Mocked<ISystemConfigRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    albumMock = newAlbumRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    cryptoRepositoryMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();
    libraryMock = newLibraryRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();
    loggerMock = newLoggerRepositoryMock();

    sut = new UserService(
      albumMock,
      cryptoRepositoryMock,
      jobMock,
      libraryMock,
      storageMock,
      configMock,
      userMock,
      loggerMock,
    );

    userMock.get.mockImplementation((userId) =>
      Promise.resolve([userStub.admin, userStub.user1].find((user) => user.id === userId) ?? null),
    );
  });

  describe('getAll', () => {
    it('should get all users', async () => {
      userMock.getList.mockResolvedValue([userStub.admin]);
      await expect(sut.getAll(false)).resolves.toEqual([
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

  describe('update', () => {
    it('should update user', async () => {
      const update: UpdateUserDto = {
        shouldChangePassword: true,
        email: 'immich@test.com',
        storageLabel: 'storage_label',
      };
      userMock.getByEmail.mockResolvedValue(null);
      userMock.getByStorageLabel.mockResolvedValue(null);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.update(authStub.admin, userStub.user1.id, update);

      expect(userMock.getByEmail).toHaveBeenCalledWith(update.email);
      expect(userMock.getByStorageLabel).toHaveBeenCalledWith(update.storageLabel);
    });

    it('should not set an empty string for storage label', async () => {
      userMock.update.mockResolvedValue(userStub.user1);
      await sut.update(authStub.admin, userStub.user1.id, { storageLabel: '' });
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { storageLabel: null });
    });

    it('should change the email', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await sut.update({ user: userStub.user1 }, userStub.user1.id, { email: 'updated@test.com' });

      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { email: 'updated@test.com' });
    });

    it('should change an email to one already in use', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByEmail.mockResolvedValue(userStub.admin);

      await expect(
        sut.update({ user: userStub.user1 }, userStub.user1.id, { email: 'updated@test.com' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should change the storage label to one already in use', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.getByStorageLabel.mockResolvedValue(userStub.admin);

      await expect(sut.update(authStub.admin, userStub.user1.id, { storageLabel: 'admin' })).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(userMock.update).not.toHaveBeenCalled();
    });

    it('should update should change password', async () => {
      userMock.update.mockResolvedValueOnce(userStub.user1);
      await sut.update(authStub.admin, userStub.user1.id, { shouldChangePassword: true });
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { shouldChangePassword: true });
    });

    it('should throw when user is not found', async () => {
      userMock.get.mockResolvedValueOnce(null);
      const result = sut.update(authStub.admin, userStub.user1.id, { shouldChangePassword: true });
      await expect(result).rejects.toBeInstanceOf(BadRequestException);
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
      await expect(sut.restore(authStub.admin, userStub.user1.id)).resolves.toEqual(mapUser(userStub.user1));
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, { status: UserStatus.ACTIVE, deletedAt: null });
    });
  });

  describe('delete', () => {
    it('should throw error if user could not be found', async () => {
      await expect(sut.delete(authStub.admin, 'not-found', {})).rejects.toThrowError(BadRequestException);
      expect(userMock.delete).not.toHaveBeenCalled();
    });

    it('should not let the admin be deleted', async () => {
      await expect(sut.delete(authStub.admin, userStub.admin.id, {})).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should delete user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, {})).resolves.toEqual(mapUser(userStub.user1));
      expect(userMock.update).toHaveBeenCalledWith(userStub.user1.id, {
        status: UserStatus.DELETED,
        deletedAt: expect.any(Date),
      });
    });

    it('should force delete user', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      userMock.update.mockResolvedValue(userStub.user1);

      await expect(sut.delete(authStub.admin, userStub.user1.id, { force: true })).resolves.toEqual(
        mapUser(userStub.user1),
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
      userMock.get.mockResolvedValue(null);
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

  describe('resetAdminPassword', () => {
    it('should only work when there is an admin account', async () => {
      userMock.getAdmin.mockResolvedValue(null);
      const ask = vitest.fn().mockResolvedValue('new-password');

      await expect(sut.resetAdminPassword(ask)).rejects.toBeInstanceOf(BadRequestException);

      expect(ask).not.toHaveBeenCalled();
    });

    it('should default to a random password', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = vitest.fn().mockImplementation(() => {});

      const response = await sut.resetAdminPassword(ask);

      const [id, update] = userMock.update.mock.calls[0];

      expect(response.provided).toBe(false);
      expect(ask).toHaveBeenCalled();
      expect(id).toEqual(userStub.admin.id);
      expect(update.password).toBeDefined();
    });

    it('should use the supplied password', async () => {
      userMock.getAdmin.mockResolvedValue(userStub.admin);
      const ask = vitest.fn().mockResolvedValue('new-password');

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

    it('should skip users not ready for deletion - deleteDelay30', async () => {
      configMock.load.mockResolvedValue(systemConfigStub.deleteDelay30);
      userMock.getDeletedUsers.mockResolvedValue([
        {},
        { deletedAt: undefined },
        { deletedAt: null },
        { deletedAt: makeDeletedAt(15) },
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

    it('should queue user ready for deletion - deleteDelay30', async () => {
      const user = { id: 'deleted-user', deletedAt: makeDeletedAt(31) };
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
