import { UserEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { randomBytes } from 'node:crypto';
import { AuthDto } from '../auth';
import { CacheControl, ImmichFileResponse } from '../domain.util';
import { IEntityJob, JobName } from '../job';
import {
  IAlbumRepository,
  IAssetRepository,
  ICryptoRepository,
  IJobRepository,
  ILibraryRepository,
  IStorageRepository,
  IUserRepository,
  UserFindOptions,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import { CreateUserDto, UpdateUserDto } from './dto';
import { CreateProfileImageResponseDto, UserResponseDto, mapCreateProfileImageResponse, mapUser } from './response-dto';
import { UserCore } from './user.core';

@Injectable()
export class UserService {
  private logger = new ImmichLogger(UserService.name);
  private userCore: UserCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) libraryRepository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.userCore = UserCore.create(cryptoRepository, libraryRepository, userRepository);
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

  create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userCore.createUser(createUserDto).then(mapUser);
  }

  async update(auth: AuthDto, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.findOrFail(dto.id, {});

    if (dto.quotaSizeInBytes && user.quotaSizeInBytes !== dto.quotaSizeInBytes) {
      await this.userRepository.syncUsage(dto.id);
    }

    return this.userCore.updateUser(auth.user, dto.id, dto).then(mapUser);
  }

  async delete(auth: AuthDto, id: string): Promise<UserResponseDto> {
    const user = await this.findOrFail(id, {});
    if (user.isAdmin) {
      throw new ForbiddenException('Cannot delete admin user');
    }

    await this.albumRepository.softDeleteAll(id);

    return this.userRepository.delete(user).then(mapUser);
  }

  async restore(auth: AuthDto, id: string): Promise<UserResponseDto> {
    let user = await this.findOrFail(id, { withDeleted: true });
    user = await this.userRepository.restore(user);
    await this.albumRepository.restoreAll(id);
    return mapUser(user);
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
    const password = providedPassword || randomBytes(24).toString('base64').replaceAll(/\W/g, '');

    await this.userCore.updateUser(admin, admin.id, { password });

    return { admin, password, provided: !!providedPassword };
  }

  async handleUserSyncUsage() {
    await this.userRepository.syncUsage();
    return true;
  }

  async handleUserDeleteCheck() {
    const users = await this.userRepository.getDeletedUsers();
    await this.jobRepository.queueAll(
      users.flatMap((user) =>
        this.isReadyForDeletion(user) ? [{ name: JobName.USER_DELETION, data: { id: user.id } }] : [],
      ),
    );
    return true;
  }

  async handleUserDelete({ id }: IEntityJob) {
    const user = await this.userRepository.get(id, { withDeleted: true });
    if (!user) {
      return false;
    }

    // just for extra protection here
    if (!this.isReadyForDeletion(user)) {
      this.logger.warn(`Skipped user that was not ready for deletion: id=${id}`);
      return false;
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
    await this.assetRepository.deleteAll(user.id);
    await this.userRepository.delete(user, true);

    return true;
  }

  private isReadyForDeletion(user: UserEntity): boolean {
    if (!user.deletedAt) {
      return false;
    }

    return DateTime.now().minus({ days: 7 }) > DateTime.fromJSDate(user.deletedAt);
  }

  private async findOrFail(id: string, options: UserFindOptions) {
    const user = await this.userRepository.get(id, options);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
