import { type ImmichDatabaseDumpConfig, YuccaService as OrchestratorService } from '@futo-org/backups-orchestrator-api';
import { Injectable, Optional } from '@nestjs/common';
import type { SystemConfig } from 'src/dtos/config.dto.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import { StorageCore } from 'src/cores/storage.core.js';
import { OnEvent } from 'src/decorators.js';
import { DatabaseLock, ImmichWorker, MaintenanceAction, StorageFolder } from 'src/enum.js';
import { DatabaseRepository } from 'src/repositories/database.repository.js';
import { LibraryRepository } from 'src/repositories/library.repository.js';
import { DatabaseBackupService } from 'src/services/database-backup.service.js';
import { MaintenanceService } from 'src/services/maintenance.service.js';
import { SystemConfigService } from 'src/services/system-config.service.js';
import { getExternalDomain } from 'src/utils/misc.js';

@Injectable()
export class FutoBackupsService {
  constructor(
    private readonly databaseRepository: DatabaseRepository,
    private readonly libraryRepository: LibraryRepository,
    private readonly databaseBackupService: DatabaseBackupService,
    private readonly systemConfigService: SystemConfigService,
    @Optional() private readonly maintenanceService: MaintenanceService,
    @Optional() private readonly orchestratorService: OrchestratorService,
  ) {}

  private updateSystemConfig({ server }: SystemConfig) {
    this.orchestratorService.setExternalBaseUrl(getExternalDomain(server));
  }

  private async updateLibraryConfig() {
    const libraries = await this.libraryRepository.getAll();

    this.orchestratorService.setImmichIntegration({
      dataPath: StorageCore.getMediaLocation(),
      dataFolders: Object.values(StorageFolder),
      libraries: libraries
        .filter((library) => !library.deletedAt)
        .map(({ id, name, importPaths, exclusionPatterns }) => ({ id, name, importPaths, exclusionPatterns })),
      hooks: {
        createDatabaseBackup: (signal) => this.databaseBackupService.createDatabaseBackup('', signal),
        cleanupDatabaseBackups: () => this.databaseBackupService.cleanupDatabaseBackups(),
        getImmichDatabaseDumpConfig: () => this.getImmichDatabaseDumpConfig(),
        configureImmichDatabaseDump: (databaseDump) => this.configureImmichDatabaseDump(databaseDump),
        enterMaintenanceRollback: (repositoryId, snapshotId) => this.enterMaintenanceRollback(repositoryId, snapshotId),
      },
    });
  }

  private async getImmichDatabaseDumpConfig(): Promise<ImmichDatabaseDumpConfig> {
    const { backup } = await this.systemConfigService.getAdminConfig();
    return { enabled: backup.database.enabled, keepLastAmount: backup.database.keepLastAmount };
  }

  private async configureImmichDatabaseDump(databaseDump: Partial<ImmichDatabaseDumpConfig>) {
    const config = await this.systemConfigService.getAdminConfig();
    await this.systemConfigService.updateAdminConfig({
      ...config,
      backup: { ...config.backup, database: { ...config.backup.database, ...databaseDump } },
    });
  }

  private enterMaintenanceRollback(repositoryId: string, snapshotId: string) {
    return this.maintenanceService.startMaintenance(
      {
        action: MaintenanceAction.Rollback,
        rollbackRepositoryId: repositoryId,
        rollbackSnapshotId: snapshotId,
      },
      'futo-backups-rollback',
    );
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Api] })
  async onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    this.updateSystemConfig(newConfig);
    void this.updateLibraryConfig();

    if (await this.databaseRepository.tryLock(DatabaseLock.FutoBackupsModuleConfig)) {
      this.orchestratorService.acquireLock();
    }
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Api], server: true })
  onConfigUpdate({ newConfig }: ArgOf<'ConfigUpdate'>) {
    this.updateSystemConfig(newConfig);
  }

  @OnEvent({ name: 'LibraryCreate', workers: [ImmichWorker.Api], server: true })
  onLibraryCreate() {
    void this.updateLibraryConfig();
  }

  @OnEvent({ name: 'LibraryUpdate', workers: [ImmichWorker.Api], server: true })
  onLibraryUpdate() {
    void this.updateLibraryConfig();
  }

  @OnEvent({ name: 'LibraryDelete', workers: [ImmichWorker.Api], server: true })
  onLibraryDelete() {
    void this.updateLibraryConfig();
  }
}
