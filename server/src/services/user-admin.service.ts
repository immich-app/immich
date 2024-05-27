import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { SALT_ROUNDS } from 'src/constants';
import { UserCore } from 'src/cores/user.core';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  UserAdminCreateDto,
  UserAdminDeleteDto,
  UserAdminResponseDto,
  UserAdminSearchDto,
  UserAdminUpdateDto,
  mapUserAdmin,
} from 'src/dtos/user.dto';
import { UserMetadataKey } from 'src/entities/user-metadata.entity';
import { UserStatus } from 'src/entities/user.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IUserRepository, UserFindOptions } from 'src/interfaces/user.interface';
import { getPreferences, getPreferencesPartial } from 'src/utils/preferences';

@Injectable()
export class UserAdminService {
  private userCore: UserCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.userCore = UserCore.create(cryptoRepository, userRepository);
    this.logger.setContext(UserAdminService.name);
  }

  async search(auth: AuthDto, dto: UserAdminSearchDto): Promise<UserAdminResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: dto.withDeleted });
    return users.map((user) => mapUserAdmin(user));
  }

  async create(dto: UserAdminCreateDto): Promise<UserAdminResponseDto> {
    const { memoriesEnabled, notify, ...rest } = dto;
    let user = await this.userCore.createUser(rest);

    // TODO remove and replace with entire dto.preferences config
    if (memoriesEnabled === false) {
      await this.userRepository.upsertMetadata(user.id, {
        key: UserMetadataKey.PREFERENCES,
        value: { memories: { enabled: false } },
      });

      user = await this.findOrFail(user.id, {});
    }

    const tempPassword = user.shouldChangePassword ? rest.password : undefined;
    if (notify) {
      await this.jobRepository.queue({ name: JobName.NOTIFY_SIGNUP, data: { id: user.id, tempPassword } });
    }
    return mapUserAdmin(user);
  }

  async get(auth: AuthDto, id: string): Promise<UserAdminResponseDto> {
    const user = await this.findOrFail(id, { withDeleted: true });
    return mapUserAdmin(user);
  }

  async update(auth: AuthDto, id: string, dto: UserAdminUpdateDto): Promise<UserAdminResponseDto> {
    const user = await this.findOrFail(id, {});

    if (dto.quotaSizeInBytes && user.quotaSizeInBytes !== dto.quotaSizeInBytes) {
      await this.userRepository.syncUsage(id);
    }

    // TODO replace with entire preferences object
    if (dto.memoriesEnabled !== undefined || dto.avatarColor) {
      const newPreferences = getPreferences(user);
      if (dto.memoriesEnabled !== undefined) {
        newPreferences.memories.enabled = dto.memoriesEnabled;
        delete dto.memoriesEnabled;
      }

      if (dto.avatarColor) {
        newPreferences.avatar.color = dto.avatarColor;
        delete dto.avatarColor;
      }

      await this.userRepository.upsertMetadata(id, {
        key: UserMetadataKey.PREFERENCES,
        value: getPreferencesPartial(user, newPreferences),
      });
    }

    if (dto.email) {
      const duplicate = await this.userRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    if (dto.storageLabel) {
      const duplicate = await this.userRepository.getByStorageLabel(dto.storageLabel);
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('Storage label already in use by another account');
      }
    }

    if (dto.password) {
      dto.password = await this.cryptoRepository.hashBcrypt(dto.password, SALT_ROUNDS);
    }

    if (dto.storageLabel === '') {
      dto.storageLabel = null;
    }

    const updatedUser = await this.userRepository.update(id, { ...dto, updatedAt: new Date() });

    return mapUserAdmin(updatedUser);
  }

  async delete(auth: AuthDto, id: string, dto: UserAdminDeleteDto): Promise<UserAdminResponseDto> {
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

    return mapUserAdmin(user);
  }

  async restore(auth: AuthDto, id: string): Promise<UserAdminResponseDto> {
    await this.findOrFail(id, { withDeleted: true });
    await this.albumRepository.restoreAll(id);
    const user = await this.userRepository.update(id, { deletedAt: null, status: UserStatus.ACTIVE });
    return mapUserAdmin(user);
  }

  private async findOrFail(id: string, options: UserFindOptions) {
    const user = await this.userRepository.get(id, options);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
