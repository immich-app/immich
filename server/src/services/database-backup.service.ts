import { Injectable } from '@nestjs/common';
import { DatabaseBackupListResponseDto } from 'src/dtos/database-backup.dto';
import { BaseService } from 'src/services/base.service';
import {
  deleteDatabaseBackup,
  downloadDatabaseBackup,
  listDatabaseBackups,
  uploadDatabaseBackup,
} from 'src/utils/database-backups';
import { ImmichFileResponse } from 'src/utils/file';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class DatabaseBackupService extends BaseService {
  async listBackups(): Promise<DatabaseBackupListResponseDto> {
    const backups = await listDatabaseBackups(this.backupRepos);
    return { backups };
  }

  deleteBackup(files: string[]): Promise<void> {
    return deleteDatabaseBackup(this.backupRepos, files);
  }

  async uploadBackup(file: Express.Multer.File): Promise<void> {
    return uploadDatabaseBackup(this.backupRepos, file);
  }

  downloadBackup(fileName: string): ImmichFileResponse {
    return downloadDatabaseBackup(fileName);
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
