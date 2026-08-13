import { GatewayEvent, YuccaService as YuccaOrchestratorService } from '@futo-org/backups-orchestrator-api';
import { Injectable, Optional } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { DatabaseLock, ImmichWorker, MaintenanceAction, StorageFolder } from 'src/enum';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { LibraryRepository } from 'src/repositories/library.repository';
import { DatabaseBackupService } from 'src/services/database-backup.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { getExternalDomain } from 'src/utils/misc';

@Injectable()
export class YuccaService {
  constructor(
    private readonly databaseRepository: DatabaseRepository,
    private readonly libraryRepository: LibraryRepository,
    private readonly databaseBackupService: DatabaseBackupService,
    @Optional() private readonly maintenanceService: MaintenanceService,
    @Optional() private readonly yuccaService: YuccaOrchestratorService,
  ) {
    this.createDatabaseBackup = this.createDatabaseBackup.bind(this);
    this.enterMaintenanceRollback = this.enterMaintenanceRollback.bind(this);
  }

  private updateSystemConfig({ server }: SystemConfig) {
    this.yuccaService.setExternalBaseUrl(getExternalDomain(server));
  }

  private async updateLibraryConfig() {
    const libraries = await this.libraryRepository.getAll();

    this.yuccaService.setImmichIntegration({
      dataPath: StorageCore.getMediaLocation(),
      dataFolders: Object.values(StorageFolder),
      libraries: libraries
        .filter((library) => !library.deletedAt)
        .map(({ id, name, importPaths, exclusionPatterns }) => ({ id, name, importPaths, exclusionPatterns })),
      hooks: {
        createDatabaseBackup: this.createDatabaseBackup,
        enterMaintenanceRollback: this.enterMaintenanceRollback,
      },
    });
  }

  private createDatabaseBackup() {
    return this.databaseBackupService.createDatabaseBackup();
  }

  private enterMaintenanceRollback(repositoryId: string, snapshotId: string) {
    return this.maintenanceService.startMaintenance(
      {
        action: MaintenanceAction.Rollback,
        rollbackRepositoryId: repositoryId,
        rollbackSnapshotId: snapshotId,
      },
      'yucca-rollback',
    );
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Api] })
  async onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    this.updateSystemConfig(newConfig);
    void this.updateLibraryConfig();

    if (await this.databaseRepository.tryLock(DatabaseLock.YuccaModuleConfig)) {
      this.yuccaService.acquireLock();
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

  @OnEvent({ name: 'YuccaEvent', workers: [ImmichWorker.Api], server: true })
  onYuccaEvent(event: GatewayEvent) {
    this.yuccaService.emit(event);
  }
}
