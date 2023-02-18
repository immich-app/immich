import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetType, UserEntity } from '@app/infra/db/entities';
import { Logger } from '@nestjs/common';
import { join } from 'path';
import { IAlbumRepository } from '../album';
import { IKeyRepository } from '../api-key';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import { IUserTokenRepository } from '../user-token';
import { JobName } from './job.constants';
import { IAssetUploadedJob, IDeleteFilesJob, IUserDeletionJob } from './job.interface';
import { IJobRepository } from './job.repository';

export class JobCore {
  private logger = new Logger(JobCore.name);

  constructor(
    private albumRepository: IAlbumRepository,
    private assetRepository: IAssetRepository,
    private keyRepository: IKeyRepository,
    private jobRepository: IJobRepository,
    private storageRepository: IStorageRepository,
    private tokenRepository: IUserTokenRepository,
    private userRepository: IUserRepository,
  ) {}

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
      const basePath = APP_UPLOAD_LOCATION;
      const userAssetDir = join(basePath, user.id);
      this.logger.warn(`Removing user from filesystem: ${userAssetDir}`);
      await this.storageRepository.unlinkDir(userAssetDir, { recursive: true, force: true });

      this.logger.warn(`Removing user from database: ${user.id}`);

      await this.tokenRepository.deleteAll(user.id);
      await this.keyRepository.deleteAll(user.id);
      await this.albumRepository.deleteAll(user.id);
      await this.assetRepository.deleteAll(user.id);
      await this.userRepository.delete(user, true);
    } catch (error: any) {
      this.logger.error(`Failed to remove user`);
      this.logger.error(error, error?.stack);
      throw error;
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
        this.logger.warn('Unable to remove file from disk', error?.stack);
      }
    }
  }

  private isReadyForDeletion(user: UserEntity): boolean {
    if (user.deletedAt == null) {
      return false;
    }

    const msInDay = 86400000;
    // get this number (7 days) from some configuration perhaps ?
    const msDeleteWait = msInDay * 7;

    const msSinceDelete = new Date().getTime() - (Date.parse(user.deletedAt.toString()) ?? 0);
    return msSinceDelete >= msDeleteWait;
  }
}
