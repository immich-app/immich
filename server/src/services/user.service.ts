import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { UserCore } from 'src/cores/user.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { CreateProfileImageResponseDto, mapCreateProfileImageResponse } from 'src/dtos/user-profile.dto';
import { CreateUserDto, DeleteUserDto, UpdateUserDto, UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { UserEntity, UserStatus } from 'src/entities/user.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IEntityJob, IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository, UserFindOptions } from 'src/interfaces/user.interface';
import { CacheControl, ImmichFileResponse } from 'src/utils/file';

@Injectable()
export class UserService {
  private configCore: SystemConfigCore;
  private userCore: UserCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) libraryRepository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.userCore = UserCore.create(cryptoRepository, libraryRepository, userRepository);
    this.logger.setContext(UserService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: true });
    return users.map((user) => mapUser(user));
  }

  async getAll(auth: AuthDto, isAll: boolean): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: !isAll });
    return users.map((user) => mapUser(user));
  }

  async get(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.get(userId, { withDeleted: false });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return mapUser(user);
  }

  getMe(auth: AuthDto): Promise<UserResponseDto> {
    return this.findOrFail(auth.user.id, {}).then(mapUser);
  }

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const user = await this.userCore.createUser(dto);
    const tempPassword = user.shouldChangePassword ? dto.password : undefined;
    if (dto.notify) {
      await this.jobRepository.queue({ name: JobName.NOTIFY_SIGNUP, data: { id: user.id, tempPassword } });
    }
    return mapUser(user);
  }

  async update(auth: AuthDto, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(dto.id, {});

    if (dto.quotaSizeInBytes && user.quotaSizeInBytes !== dto.quotaSizeInBytes) {
      await this.userRepository.syncUsage(dto.id);
    }

    return this.userCore.updateUser(auth.user, dto.id, dto).then(mapUser);
  }

  async delete(auth: AuthDto, id: string, dto: DeleteUserDto): Promise<UserResponseDto> {
    const { force } = dto;
    const { isAdmin } = await this.findOrFail(id, {});
    if (isAdmin) {
      throw new ForbiddenException('Cannot delete admin user');
    }

    await this.albumRepository.softDeleteAll(id);

    const status = force ? UserStatus.REMOVING : UserStatus.DELETED;
    const user = await this.userRepository.update(id, { status, deletedAt: new Date() });

    if (force) {
      await this.jobRepository.queue({ name: JobName.USER_DELETION, data: { id: user.id, force } });
    }

    return mapUser(user);
  }

  async restore(auth: AuthDto, id: string): Promise<UserResponseDto> {
    await this.findOrFail(id, { withDeleted: true });
    await this.albumRepository.restoreAll(id);
    return this.userRepository.update(id, { deletedAt: null, status: UserStatus.ACTIVE }).then(mapUser);
  }

  async createProfileImage(auth: AuthDto, fileInfo: Express.Multer.File): Promise<CreateProfileImageResponseDto> {
    const { profileImagePath: oldpath } = await this.findOrFail(auth.user.id, { withDeleted: false });
    const updatedUser = await this.userRepository.update(auth.user.id, { profileImagePath: fileInfo.path });
    if (oldpath !== '') {
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [oldpath] } });
    }
    return mapCreateProfileImageResponse(updatedUser.id, updatedUser.profileImagePath);
  }

  async deleteProfileImage(auth: AuthDto): Promise<void> {
    const user = await this.findOrFail(auth.user.id, { withDeleted: false });
    if (user.profileImagePath === '') {
      throw new BadRequestException("Can't delete a missing profile Image");
    }
    await this.userRepository.update(auth.user.id, { profileImagePath: '' });
    await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [user.profileImagePath] } });
  }

  async getProfileImage(id: string): Promise<ImmichFileResponse> {
    const user = await this.findOrFail(id, {});
    if (!user.profileImagePath) {
      throw new NotFoundException('User does not have a profile image');
    }

    return new ImmichFileResponse({
      path: user.profileImagePath,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.NONE,
    });
  }

  async resetAdminPassword(ask: (admin: UserResponseDto) => Promise<string | undefined>) {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new BadRequestException('Admin account does not exist');
    }

    const providedPassword = await ask(mapUser(admin));
    const password = providedPassword || this.cryptoRepository.newPassword(24);

    await this.userCore.updateUser(admin, admin.id, { password });

    return { admin, password, provided: !!providedPassword };
  }

  async handleUserSyncUsage(): Promise<JobStatus> {
    await this.userRepository.syncUsage();
    return JobStatus.SUCCESS;
  }

  async handleUserDeleteCheck(): Promise<JobStatus> {
    const users = await this.userRepository.getDeletedUsers();
    const config = await this.configCore.getConfig();
    await this.jobRepository.queueAll(
      users.flatMap((user) =>
        this.isReadyForDeletion(user, config.user.deleteDelay)
          ? [{ name: JobName.USER_DELETION, data: { id: user.id } }]
          : [],
      ),
    );
    return JobStatus.SUCCESS;
  }

  async handleUserDelete({ id, force }: IEntityJob): Promise<JobStatus> {
    const config = await this.configCore.getConfig();
    const user = await this.userRepository.get(id, { withDeleted: true });
    if (!user) {
      return JobStatus.FAILED;
    }

    // just for extra protection here
    if (!force && !this.isReadyForDeletion(user, config.user.deleteDelay)) {
      this.logger.warn(`Skipped user that was not ready for deletion: id=${id}`);
      return JobStatus.SKIPPED;
    }

    this.logger.log(`Deleting user: ${user.id}`);

    const folders = [
      StorageCore.getLibraryFolder(user),
      StorageCore.getFolderLocation(StorageFolder.UPLOAD, user.id),
      StorageCore.getFolderLocation(StorageFolder.PROFILE, user.id),
      StorageCore.getFolderLocation(StorageFolder.THUMBNAILS, user.id),
      StorageCore.getFolderLocation(StorageFolder.ENCODED_VIDEO, user.id),
    ];

    for (const folder of folders) {
      this.logger.warn(`Removing user from filesystem: ${folder}`);
      await this.storageRepository.unlinkDir(folder, { recursive: true, force: true });
    }

    this.logger.warn(`Removing user from database: ${user.id}`);
    await this.albumRepository.deleteAll(user.id);
    await this.userRepository.delete(user, true);

    return JobStatus.SUCCESS;
  }

  private isReadyForDeletion(user: UserEntity, deleteDelay: number): boolean {
    if (!user.deletedAt) {
      return false;
    }

    return DateTime.now().minus({ days: deleteDelay }) > DateTime.fromJSDate(user.deletedAt);
  }

  private async findOrFail(id: string, options: UserFindOptions) {
    const user = await this.userRepository.get(id, options);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
