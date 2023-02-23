import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetEntity, AssetType, SystemConfig, UserEntity } from '@app/infra/db/entities';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository, StorageCore } from '../storage';
import { ISystemConfigRepository } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { IAssetUploadedJob, IDeleteFilesJob, IUserDeletionJob } from './job.interface';
import { IJobRepository } from './job.repository';

export class JobCore {
  private logger = new Logger(JobCore.name);
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;

  constructor(
    private albumRepository: IAlbumRepository,
    private assetRepository: IAssetRepository,
    configRepository: ISystemConfigRepository,
    config: SystemConfig,
    private keyRepository: IKeyRepository,
    private jobRepository: IJobRepository,
    private storageRepository: IStorageRepository,
    private tokenRepository: IUserTokenRepository,
    private userRepository: IUserRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
    this.storageCore = new StorageCore(configRepository, config, storageRepository);
  }

  async handleAssetUpload(job: IAssetUploadedJob) {
    const { asset, fileName } = job;

    await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset } });

    if (asset.type == AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { asset } });
      await this.jobRepository.queue({ name: JobName.EXTRACT_VIDEO_METADATA, data: { asset, fileName } });
    } else {
      await this.jobRepository.queue({ name: JobName.EXIF_EXTRACTION, data: { asset, fileName } });
    }
  }

  async handleConfigChange() {
    await this.configCore.refreshConfig();
  }

  async handleUserDeleteCheck() {
    const users = await this.userRepository.getDeletedUsers();
    for (const user of users) {
      if (this.isReadyForDeletion(user)) {
        await this.jobRepository.queue({ name: JobName.USER_DELETION, data: { user } });
      }
    }
  }

  async handleUserDelete(job: IUserDeletionJob) {
    const { user } = job;

    // just for extra protection here
    if (!this.isReadyForDeletion(user)) {
      this.logger.warn(`Skipped user that was not ready for deletion: id=${user.id}`);
      return;
    }

    this.logger.log(`Deleting user: ${user.id}`);

    try {
      const userAssetDir = join(APP_UPLOAD_LOCATION, user.id);
      this.logger.warn(`Removing user from filesystem: ${userAssetDir}`);
      await this.storageRepository.unlinkDir(userAssetDir, { recursive: true, force: true });

      this.logger.warn(`Removing user from database: ${user.id}`);

      await this.tokenRepository.deleteAll(user.id);
      await this.keyRepository.deleteAll(user.id);
      await this.albumRepository.deleteAll(user.id);
      await this.assetRepository.deleteAll(user.id);
      await this.userRepository.delete(user, true);
    } catch (error: any) {
      this.logger.error(`Failed to remove user`, error, { id: user.id });
    }
  }

  async handleDeleteFiles(job: IDeleteFilesJob) {
    const { files } = job;

    for (const file of files) {
      if (!file) {
        continue;
      }

      try {
        await this.storageRepository.unlink(file);
      } catch (error: any) {
        this.logger.warn('Unable to remove file from disk', error);
      }
    }
  }

  async handleTemplateMigration() {
    try {
      console.time('migrating-time');
      const assets = await this.assetRepository.getAll();

      const livePhotoMap: Record<string, AssetEntity> = {};

      for (const asset of assets) {
        if (asset.livePhotoVideoId) {
          livePhotoMap[asset.livePhotoVideoId] = asset;
        }
      }

      for (const asset of assets) {
        const livePhotoParentAsset = livePhotoMap[asset.id];
        // TODO: remove livePhoto specific stuff once upload is fixed
        const filename = asset.exifInfo?.imageName || livePhotoParentAsset?.exifInfo?.imageName || asset.id;

        // TODO: use asset core (once in domain)
        const destination = await this.storageCore.getTemplatePath(asset, filename);
        if (asset.originalPath !== destination) {
          const source = asset.originalPath;

          try {
            await this.storageRepository.moveFile(asset.originalPath, destination);
            await this.assetRepository.save({ id: asset.id, originalPath: destination }).catch((error: any) => {
              this.logger.warn('Unable to save new originalPath to database, undoing move', error?.stack);
              return this.storageRepository.moveFile(destination, source);
            });
          } catch (error: any) {
            this.logger.error(`Problem applying storage template`, error?.stack, { id: asset.id, source, destination });
          }
        }
      }

      this.logger.debug('Cleaning up empty directories...');
      await this.storageRepository.removeEmptyDirs(APP_UPLOAD_LOCATION);
    } catch (error: any) {
      this.logger.error('Error running template migration', error);
    } finally {
      console.timeEnd('migrating-time');
    }
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
