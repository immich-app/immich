import { BadRequestException, Injectable } from '@nestjs/common';
import { basename, join } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import {
  MaintenanceAuthDto,
  MaintenanceIntegrityResponseDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { CacheControl, MaintenanceAction, StorageFolder, SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { MaintenanceModeState } from 'src/types';
import { deleteBackup, isValidBackupName, listBackups, uploadBackup } from 'src/utils/backups';
import { ImmichFileResponse } from 'src/utils/file';
import {
  createMaintenanceLoginUrl,
  detectPriorInstall,
  generateMaintenanceSecret,
  signMaintenanceJwt,
} from 'src/utils/maintenance';
import { getExternalDomain } from 'src/utils/misc';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  getMaintenanceMode(): Promise<MaintenanceModeState> {
    return this.systemMetadataRepository
      .get(SystemMetadataKey.MaintenanceMode)
      .then((state) => state ?? { isMaintenanceMode: false });
  }

  getMaintenanceStatus(): MaintenanceStatusResponseDto {
    return {
      active: false,
      action: MaintenanceAction.End,
    };
  }

  detectPriorInstall(): Promise<MaintenanceIntegrityResponseDto> {
    return detectPriorInstall(this.storageRepository);
  }

  async startMaintenance(action: SetMaintenanceModeDto, username: string): Promise<{ jwt: string }> {
    const secret = generateMaintenanceSecret();
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, {
      isMaintenanceMode: true,
      secret,
      action,
    });

    await this.eventRepository.emit('AppRestart', { isMaintenanceMode: true });

    return {
      jwt: await signMaintenanceJwt(secret, {
        username,
      }),
    };
  }

  async startRestoreFlow(): Promise<{ jwt: string }> {
    const adminUser = await this.userRepository.getAdmin();
    if (adminUser) {
      throw new BadRequestException('The server already has an admin');
    }

    return this.startMaintenance(
      {
        action: MaintenanceAction.RestoreDatabase,
      },
      'admin',
    );
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart(): void {
    this.appRepository.exitApp();
  }

  async createLoginUrl(auth: MaintenanceAuthDto, secret?: string): Promise<string> {
    const { server } = await this.getConfig({ withCache: true });
    const baseUrl = getExternalDomain(server);

    if (!secret) {
      const state = await this.getMaintenanceMode();
      if (!state.isMaintenanceMode) {
        throw new Error('Not in maintenance mode');
      }

      secret = state.secret;
    }

    return await createMaintenanceLoginUrl(baseUrl, auth, secret);
  }

  /**
   * Backups
   */

  async listBackups(): Promise<{ backups: string[] }> {
    return { backups: await listBackups(this.backupRepos) };
  }

  async deleteBackup(filename: string): Promise<void> {
    return deleteBackup(this.backupRepos, basename(filename));
  }

  async uploadBackup(file: Express.Multer.File): Promise<void> {
    return uploadBackup(this.backupRepos, file);
  }

  downloadBackup(fileName: string): ImmichFileResponse {
    return {
      fileName,
      cacheControl: CacheControl.PrivateWithoutCache,
      contentType: fileName.endsWith('.gz') ? 'application/gzip' : 'application/sql',
      path: this.getBackupPath(fileName),
    };
  }

  getBackupPath(filename: string): string {
    if (!isValidBackupName(filename)) {
      throw new BadRequestException('Invalid backup name!');
    }

    return join(StorageCore.getBaseFolder(StorageFolder.Backups), basename(filename));
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
