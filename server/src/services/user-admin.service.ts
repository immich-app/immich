import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { SALT_ROUNDS } from 'src/constants';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto, mapPreferences } from 'src/dtos/user-preferences.dto';
import {
  UserAdminCreateDto,
  UserAdminDeleteDto,
  UserAdminResponseDto,
  UserAdminSearchDto,
  UserAdminUpdateDto,
  mapUserAdmin,
} from 'src/dtos/user.dto';
import { UserMetadataKey, UserStatus } from 'src/enum';
import { JobName } from 'src/interfaces/job.interface';
import { UserFindOptions } from 'src/interfaces/user.interface';
import { BaseService } from 'src/services/base.service';
import { getPreferences, getPreferencesPartial, mergePreferences } from 'src/utils/preferences';
import { createUser } from 'src/utils/user';

@Injectable()
export class UserAdminService extends BaseService {
  async search(auth: AuthDto, dto: UserAdminSearchDto): Promise<UserAdminResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: dto.withDeleted });
    return users.map((user) => mapUserAdmin(user));
  }

  async create(dto: UserAdminCreateDto): Promise<UserAdminResponseDto> {
    const { notify, ...rest } = dto;
    const user = await createUser({ userRepo: this.userRepository, cryptoRepo: this.cryptoRepository }, rest);

    await this.eventRepository.emit('user.signup', {
      notify: !!notify,
      id: user.id,
      tempPassword: user.shouldChangePassword ? rest.password : undefined,
    });

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

  async getPreferences(auth: AuthDto, id: string): Promise<UserPreferencesResponseDto> {
    const user = await this.findOrFail(id, { withDeleted: false });
    const preferences = getPreferences(user);
    return mapPreferences(preferences);
  }

  async updatePreferences(auth: AuthDto, id: string, dto: UserPreferencesUpdateDto) {
    const user = await this.findOrFail(id, { withDeleted: false });
    const preferences = mergePreferences(user, dto);

    await this.userRepository.upsertMetadata(user.id, {
      key: UserMetadataKey.PREFERENCES,
      value: getPreferencesPartial(user, preferences),
    });

    return mapPreferences(preferences);
  }

  private async findOrFail(id: string, options: UserFindOptions) {
    const user = await this.userRepository.get(id, options);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }
}
