import { BadRequestException, Injectable } from '@nestjs/common';
import { basename, join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { CacheControl, StorageFolder } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { deleteBackup, isValidBackupName, listBackups, uploadBackup } from 'src/utils/backups';
import { ImmichFileResponse } from 'src/utils/file';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class DatabaseBackupService extends BaseService {
  async listBackups(): Promise<{ backups: string[] }> {
    return { backups: await listBackups(this.backupRepos) };
  }

  async deleteBackup(files: string[]): Promise<void> {
    if (files.some((filename) => !isValidBackupName(filename))) {
      throw new BadRequestException('Invalid backup name!');
    }

    await Promise.all(files.map((filename) => deleteBackup(this.backupRepos, basename(filename))));
  }

  async uploadBackup(file: Express.Multer.File): Promise<void> {
    return uploadBackup(this.backupRepos, file);
  }

  downloadBackup(fileName: string): ImmichFileResponse {
    if (!isValidBackupName(fileName)) {
      throw new BadRequestException('Invalid backup name!');
    }

    const path = join(StorageCore.getBaseFolder(StorageFolder.Backups), fileName);

    return {
      path,
      fileName,
      cacheControl: CacheControl.PrivateWithoutCache,
      contentType: fileName.endsWith('.gz') ? 'application/gzip' : 'application/sql',
    };
  }

  private get backupRepos() {
    return {
      logger: this.logger,
      storage: this.storageRepository,
      config: this.configRepository,
      process: this.processRepository,
      database: this.databaseRepository,
    };
  }
}
