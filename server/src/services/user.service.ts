import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Updateable } from 'kysely';
import { DateTime } from 'luxon';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto, mapPreferences } from 'src/dtos/user-preferences.dto';
import { CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto, mapUser, mapUserAdmin } from 'src/dtos/user.dto';
import { CacheControl, JobName, JobStatus, QueueName, StorageFolder, UserMetadataKey } from 'src/enum';
import { UserFindOptions } from 'src/repositories/user.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { BaseService } from 'src/services/base.service';
import { JobOf, UserMetadataItem } from 'src/types';
import { ImmichFileResponse } from 'src/utils/file';
import { getPreferences, getPreferencesPartial, mergePreferences } from 'src/utils/preferences';

@Injectable()
export class UserService extends BaseService {
  async search(auth: AuthDto): Promise<UserResponseDto[]> {
    const config = await this.getConfig({ withCache: false });

    let users;
    if (auth.user.isAdmin || config.server.publicUsers) {
      users = await this.userRepository.getList({ withDeleted: false });
    } else {
      const authUser = await this.userRepository.get(auth.user.id, {});
      users = authUser ? [authUser] : [];
    }

    return users.map((user) => mapUser(user));
  }

  async getMe(auth: AuthDto): Promise<UserAdminResponseDto> {
    const user = await this.userRepository.get(auth.user.id, {});
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return mapUserAdmin(user);
  }

  async updateMe({ user }: AuthDto, dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    if (dto.email) {
      const duplicate = await this.userRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== user.id) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    const update: Updateable<UserTable> = {
      email: dto.email,
      name: dto.name,
      avatarColor: dto.avatarColor,
    };

    if (dto.password) {
      const hashedPassword = await this.cryptoRepository.hashBcrypt(dto.password, SALT_ROUNDS);
      update.password = hashedPassword;
      update.shouldChangePassword = false;
    }

    const updatedUser = await this.userRepository.update(user.id, update);

    return mapUserAdmin(updatedUser);
  }

  async getMyPreferences(auth: AuthDto): Promise<UserPreferencesResponseDto> {
    const metadata = await this.userRepository.getMetadata(auth.user.id);
    return mapPreferences(getPreferences(metadata));
  }

  async updateMyPreferences(auth: AuthDto, dto: UserPreferencesUpdateDto) {
    const metadata = await this.userRepository.getMetadata(auth.user.id);
    const updated = mergePreferences(getPreferences(metadata), dto);

    await this.userRepository.upsertMetadata(auth.user.id, {
      key: UserMetadataKey.PREFERENCES,
      value: getPreferencesPartial(updated),
    });

    return mapPreferences(updated);
  }

  async get(id: string): Promise<UserResponseDto> {
    const user = await this.findOrFail(id, { withDeleted: false });
    return mapUser(user);
  }

  async createProfileImage(auth: AuthDto, file: Express.Multer.File): Promise<CreateProfileImageResponseDto> {
    const { profileImagePath: oldpath } = await this.findOrFail(auth.user.id, { withDeleted: false });

    const user = await this.userRepository.update(auth.user.id, {
      profileImagePath: file.path,
      profileChangedAt: new Date(),
    });

    if (oldpath !== '') {
      await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [oldpath] } });
    }

    return {
      userId: user.id,
      profileImagePath: user.profileImagePath,
      profileChangedAt: user.profileChangedAt,
    };
  }

  async deleteProfileImage(auth: AuthDto): Promise<void> {
    const user = await this.findOrFail(auth.user.id, { withDeleted: false });
    if (user.profileImagePath === '') {
      throw new BadRequestException("Can't delete a missing profile Image");
    }
    await this.userRepository.update(auth.user.id, { profileImagePath: '', profileChangedAt: new Date() });
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

  async getLicense(auth: AuthDto): Promise<LicenseResponseDto> {
    const metadata = await this.userRepository.getMetadata(auth.user.id);

    const license = metadata.find(
      (item): item is UserMetadataItem<UserMetadataKey.LICENSE> => item.key === UserMetadataKey.LICENSE,
    );
    if (!license) {
      throw new NotFoundException();
    }
    return { ...license.value, activatedAt: new Date(license.value.activatedAt) };
  }

  async deleteLicense({ user }: AuthDto): Promise<void> {
    await this.userRepository.deleteMetadata(user.id, UserMetadataKey.LICENSE);
  }

  async setLicense(auth: AuthDto, license: LicenseKeyDto): Promise<LicenseResponseDto> {
    if (!license.licenseKey.startsWith('IMCL-') && !license.licenseKey.startsWith('IMSV-')) {
      throw new BadRequestException('Invalid license key');
    }

    const { licensePublicKey } = this.configRepository.getEnv();

    const clientLicenseValid = this.cryptoRepository.verifySha256(
      license.licenseKey,
      license.activationKey,
      licensePublicKey.client,
    );

    const serverLicenseValid = this.cryptoRepository.verifySha256(
      license.licenseKey,
      license.activationKey,
      licensePublicKey.server,
    );

    if (!clientLicenseValid && !serverLicenseValid) {
      throw new BadRequestException('Invalid license key');
    }

    const activatedAt = new Date();

    await this.userRepository.upsertMetadata(auth.user.id, {
      key: UserMetadataKey.LICENSE,
      value: { ...license, activatedAt: activatedAt.toISOString() },
    });

    return { ...license, activatedAt };
  }

  @OnJob({ name: JobName.USER_SYNC_USAGE, queue: QueueName.BACKGROUND_TASK })
  async handleUserSyncUsage(): Promise<JobStatus> {
    await this.userRepository.syncUsage();
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.USER_DELETE_CHECK, queue: QueueName.BACKGROUND_TASK })
  async handleUserDeleteCheck(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const users = await this.userRepository.getDeletedAfter(DateTime.now().minus({ days: config.user.deleteDelay }));
    await this.jobRepository.queueAll(users.map((user) => ({ name: JobName.USER_DELETION, data: { id: user.id } })));
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.USER_DELETION, queue: QueueName.BACKGROUND_TASK })
  async handleUserDelete({ id, force }: JobOf<JobName.USER_DELETION>): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
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

  private isReadyForDeletion(user: { id: string; deletedAt?: Date | null }, deleteDelay: number): boolean {
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
