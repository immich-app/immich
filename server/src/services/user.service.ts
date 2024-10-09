import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { AuthDto } from 'src/dtos/auth.dto';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { UserPreferencesResponseDto, UserPreferencesUpdateDto, mapPreferences } from 'src/dtos/user-preferences.dto';
import { CreateProfileImageResponseDto } from 'src/dtos/user-profile.dto';
import { UserAdminResponseDto, UserResponseDto, UserUpdateMeDto, mapUser, mapUserAdmin } from 'src/dtos/user.dto';
import { UserMetadataEntity } from 'src/entities/user-metadata.entity';
import { UserEntity } from 'src/entities/user.entity';
import { CacheControl, StorageFolder, UserMetadataKey } from 'src/enum';
import { IEntityJob, JobName, JobStatus } from 'src/interfaces/job.interface';
import { UserFindOptions } from 'src/interfaces/user.interface';
import { BaseService } from 'src/services/base.service';
import { ImmichFileResponse } from 'src/utils/file';
import { getPreferences, getPreferencesPartial, mergePreferences } from 'src/utils/preferences';

@Injectable()
export class UserService extends BaseService {
  async search(): Promise<UserResponseDto[]> {
    const users = await this.userRepository.getList({ withDeleted: false });
    return users.map((user) => mapUser(user));
  }

  getMe(auth: AuthDto): UserAdminResponseDto {
    return mapUserAdmin(auth.user);
  }

  async updateMe({ user }: AuthDto, dto: UserUpdateMeDto): Promise<UserAdminResponseDto> {
    if (dto.email) {
      const duplicate = await this.userRepository.getByEmail(dto.email);
      if (duplicate && duplicate.id !== user.id) {
        throw new BadRequestException('Email already in use by another account');
      }
    }

    const update: Partial<UserEntity> = {
      email: dto.email,
      name: dto.name,
    };

    if (dto.password) {
      const hashedPassword = await this.cryptoRepository.hashBcrypt(dto.password, SALT_ROUNDS);
      update.password = hashedPassword;
      update.shouldChangePassword = false;
    }

    const updatedUser = await this.userRepository.update(user.id, update);

    return mapUserAdmin(updatedUser);
  }

  getMyPreferences({ user }: AuthDto): UserPreferencesResponseDto {
    const preferences = getPreferences(user);
    return mapPreferences(preferences);
  }

  async updateMyPreferences({ user }: AuthDto, dto: UserPreferencesUpdateDto) {
    const preferences = mergePreferences(user, dto);

    await this.userRepository.upsertMetadata(user.id, {
      key: UserMetadataKey.PREFERENCES,
      value: getPreferencesPartial(user, preferences),
    });

    return mapPreferences(preferences);
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

  getLicense({ user }: AuthDto): LicenseResponseDto {
    const license = user.metadata.find(
      (item): item is UserMetadataEntity<UserMetadataKey.LICENSE> => item.key === UserMetadataKey.LICENSE,
    );
    if (!license) {
      throw new NotFoundException();
    }
    return license.value;
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

    const licenseData = {
      ...license,
      activatedAt: new Date(),
    };

    await this.userRepository.upsertMetadata(auth.user.id, {
      key: UserMetadataKey.LICENSE,
      value: licenseData,
    });

    return licenseData;
  }

  async handleUserSyncUsage(): Promise<JobStatus> {
    await this.userRepository.syncUsage();
    return JobStatus.SUCCESS;
  }

  async handleUserDeleteCheck(): Promise<JobStatus> {
    const users = await this.userRepository.getDeletedUsers();
    const config = await this.getConfig({ withCache: false });
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
