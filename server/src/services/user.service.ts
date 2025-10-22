import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Updateable } from 'kysely';
import { DateTime } from 'luxon';
import { SALT_ROUNDS } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnJob } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import { OnboardingDto, OnboardingResponseDto } from 'src/dtos/onboarding.dto';
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
      key: UserMetadataKey.Preferences,
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
      await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [oldpath] } });
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
    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [user.profileImagePath] } });
  }

  async getProfileImage(id: string): Promise<ImmichFileResponse> {
    const user = await this.findOrFail(id, {});
    if (!user.profileImagePath) {
      throw new NotFoundException('User does not have a profile image');
    }

    return new ImmichFileResponse({
      path: user.profileImagePath,
      contentType: 'image/jpeg',
      cacheControl: CacheControl.None,
    });
  }

  async getLicense(auth: AuthDto): Promise<LicenseResponseDto> {
    const metadata = await this.userRepository.getMetadata(auth.user.id);

    const license = metadata.find(
      (item): item is UserMetadataItem<UserMetadataKey.License> => item.key === UserMetadataKey.License,
    );
    if (!license) {
      throw new NotFoundException();
    }
    return { ...license.value, activatedAt: new Date(license.value.activatedAt) };
  }

  async deleteLicense({ user }: AuthDto): Promise<void> {
    await this.userRepository.deleteMetadata(user.id, UserMetadataKey.License);
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
      key: UserMetadataKey.License,
      value: { ...license, activatedAt: activatedAt.toISOString() },
    });

    return { ...license, activatedAt };
  }

  async getOnboarding(auth: AuthDto): Promise<OnboardingResponseDto> {
    const metadata = await this.userRepository.getMetadata(auth.user.id);

    const onboardingData = metadata.find(
      (item): item is UserMetadataItem<UserMetadataKey.Onboarding> => item.key === UserMetadataKey.Onboarding,
    )?.value;

    if (!onboardingData) {
      return { isOnboarded: false };
    }

    return {
      isOnboarded: onboardingData.isOnboarded,
    };
  }

  async deleteOnboarding({ user }: AuthDto): Promise<void> {
    await this.userRepository.deleteMetadata(user.id, UserMetadataKey.Onboarding);
  }

  async setOnboarding(auth: AuthDto, onboarding: OnboardingDto): Promise<OnboardingResponseDto> {
    await this.userRepository.upsertMetadata(auth.user.id, {
      key: UserMetadataKey.Onboarding,
      value: {
        isOnboarded: onboarding.isOnboarded,
      },
    });

    return {
      isOnboarded: onboarding.isOnboarded,
    };
  }

  @OnJob({ name: JobName.UserSyncUsage, queue: QueueName.BackgroundTask })
  async handleUserSyncUsage(): Promise<JobStatus> {
    await this.userRepository.syncUsage();
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.UserDeleteCheck, queue: QueueName.BackgroundTask })
  async handleUserDeleteCheck(): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const users = await this.userRepository.getDeletedAfter(DateTime.now().minus({ days: config.user.deleteDelay }));
    await this.jobRepository.queueAll(users.map((user) => ({ name: JobName.UserDelete, data: { id: user.id } })));
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.UserDelete, queue: QueueName.BackgroundTask })
  async handleUserDelete({ id, force }: JobOf<JobName.UserDelete>): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: false });
    const user = await this.userRepository.get(id, { withDeleted: true });
    if (!user) {
      return JobStatus.Failed;
    }

    // just for extra protection here
    if (!force && !this.isReadyForDeletion(user, config.user.deleteDelay)) {
      this.logger.warn(`Skipped user that was not ready for deletion: id=${id}`);
      return JobStatus.Skipped;
    }

    this.logger.log(`Deleting user: ${user.id}`);

    const folders = [
      StorageCore.getLibraryFolder(user),
      StorageCore.getFolderLocation(StorageFolder.Upload, user.id),
      StorageCore.getFolderLocation(StorageFolder.Profile, user.id),
      StorageCore.getFolderLocation(StorageFolder.Thumbnails, user.id),
      StorageCore.getFolderLocation(StorageFolder.EncodedVideo, user.id),
    ];

    for (const folder of folders) {
      this.logger.warn(`Removing user from filesystem: ${folder}`);
      await this.storageRepository.unlinkDir(folder, { recursive: true, force: true });
    }

    this.logger.warn(`Removing user from database: ${user.id}`);
    await this.albumRepository.deleteAll(user.id);
    await this.userRepository.delete(user, true);

    return JobStatus.Success;
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
