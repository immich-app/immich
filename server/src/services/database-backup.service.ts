import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';
import { deleteBackups, downloadBackup, listBackups, uploadBackup } from 'src/utils/backups';
import { ImmichFileResponse } from 'src/utils/file';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class DatabaseBackupService extends BaseService {
  async listBackups(): Promise<{ backups: string[] }> {
    return { backups: await listBackups(this.backupRepos) };
  }

  deleteBackup(files: string[]): Promise<void> {
    return deleteBackups(this.backupRepos, files);
  }

  async uploadBackup(file: Express.Multer.File): Promise<void> {
    return uploadBackup(this.backupRepos, file);
  }

  downloadBackup(fileName: string): ImmichFileResponse {
    return downloadBackup(fileName);
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
