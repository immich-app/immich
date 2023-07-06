import { UserEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ReadStream } from 'fs';
import { IAlbumRepository } from '../album/album.repository';
import { IAssetRepository } from '../asset/asset.repository';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto/crypto.repository';
import { IEntityJob, IJobRepository, JobName } from '../job';
import { StorageCore, StorageFolder } from '../storage';
import { IStorageRepository } from '../storage/storage.repository';
import { CreateUserDto, UpdateUserDto, UserCountDto } from './dto';
import {
  CreateProfileImageResponseDto,
  mapCreateProfileImageResponse,
  mapUser,
  mapUserCountResponse,
  UserCountResponseDto,
  UserResponseDto,
} from './response-dto';
import { UserCore } from './user.core';
import { IUserRepository } from './user.repository';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  private userCore: UserCore;
  private storageCore = new StorageCore();

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,

    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {
    this.userCore = new UserCore(userRepository, cryptoRepository);
  }

  async getAllUsers(authUser: AuthUserDto, isAll: boolean): Promise<UserResponseDto[]> {
    const users = await this.userCore.getList({ withDeleted: !isAll });
    return users.map(mapUser);
  }

  async getUserById(userId: string, withDeleted = false): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId, withDeleted);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return mapUser(user);
  }

  async getUserInfo(authUser: AuthUserDto): Promise<UserResponseDto> {
    const user = await this.userCore.get(authUser.id);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return mapUser(user);
  }

  async getUserCount(dto: UserCountDto): Promise<UserCountResponseDto> {
    let users = await this.userCore.getList();

    if (dto.admin) {
      users = users.filter((user) => user.isAdmin);
    }

    return mapUserCountResponse(users.length);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const createdUser = await this.userCore.createUser(createUserDto);
    return mapUser(createdUser);
  }

  async updateUser(authUser: AuthUserDto, dto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userCore.get(dto.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.userCore.updateUser(authUser, dto.id, dto);
    return mapUser(updatedUser);
  }

  async deleteUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const deletedUser = await this.userCore.deleteUser(authUser, user);
    return mapUser(deletedUser);
  }

  async restoreUser(authUser: AuthUserDto, userId: string): Promise<UserResponseDto> {
    const user = await this.userCore.get(userId, true);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const updatedUser = await this.userCore.restoreUser(authUser, user);
    return mapUser(updatedUser);
  }

  async createProfileImage(
    authUser: AuthUserDto,
    fileInfo: Express.Multer.File,
  ): Promise<CreateProfileImageResponseDto> {
    const updatedUser = await this.userCore.createProfileImage(authUser, fileInfo.path);
    return mapCreateProfileImageResponse(updatedUser.id, updatedUser.profileImagePath);
  }

  async getUserProfileImage(userId: string): Promise<ReadStream> {
    const user = await this.userCore.get(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.userCore.getUserProfileImage(user);
  }

  async resetAdminPassword(ask: (admin: UserResponseDto) => Promise<string | undefined>) {
    const admin = await this.userCore.getAdmin();
    if (!admin) {
      throw new BadRequestException('Admin account does not exist');
    }

    const providedPassword = await ask(admin);
    const password = providedPassword || randomBytes(24).toString('base64').replace(/\W/g, '');

    await this.userCore.updateUser(admin, admin.id, { password });

    return { admin, password, provided: !!providedPassword };
  }

  async handleUserDeleteCheck() {
    const users = await this.userRepository.getDeletedUsers();
    for (const user of users) {
      if (this.isReadyForDeletion(user)) {
        await this.jobRepository.queue({ name: JobName.USER_DELETION, data: { id: user.id } });
      }
    }

    return true;
  }

  async handleUserDelete({ id }: IEntityJob) {
    const user = await this.userRepository.get(id, true);
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
      this.storageCore.getLibraryFolder(user),
      this.storageCore.getFolderLocation(StorageFolder.UPLOAD, user.id),
      this.storageCore.getFolderLocation(StorageFolder.PROFILE, user.id),
      this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, user.id),
      this.storageCore.getFolderLocation(StorageFolder.ENCODED_VIDEO, user.id),
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

    const msInDay = 86400000;
    const msDeleteWait = msInDay * 7;
    const msSinceDelete = new Date().getTime() - (Date.parse(user.deletedAt.toString()) || 0);

    return msSinceDelete >= msDeleteWait;
  }
}
