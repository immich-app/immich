import { BadRequestException, Injectable } from '@nestjs/common';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceService } from 'src/services/maintenance.service';
import { getConfig } from 'src/utils/config';

/**
 * This service is available inside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceWorkerService {
  // protected storageCore: StorageCore;

  // nestApplication: INestApplication | undefined;

  //

  constructor(
    protected logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private maintenanceRepository: MaintenanceWorkerRepository,
  ) {
    this.logger.setContext(this.constructor.name);
    // this.storageCore = StorageCore.create(
    //   assetRepository,
    //   configRepository,
    //   cryptoRepository,
    //   moveRepository,
    //   personRepository,
    //   storageRepository,
    //   systemMetadataRepository,
    //   this.logger,
    // );
  }

  private get configRepos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  getConfig(options: { withCache: boolean }) {
    return getConfig(this.configRepos, options);
  }

  async getSystemConfig() {
    const config = await this.getConfig({ withCache: false });

    return {
      loginPageMessage: config.server.loginPageMessage,
      trashDays: config.trash.days,
      userDeleteDelay: config.user.deleteDelay,
      oauthButtonText: config.oauth.buttonText,
      isInitialized: true,
      isOnboarded: true,
      externalDomain: config.server.externalDomain,
      publicUsers: config.server.publicUsers,
      mapDarkStyleUrl: config.map.darkStyle,
      mapLightStyleUrl: config.map.lightStyle,
      maintenanceMode: true,
    };
  }

  getMaintenanceMode(): Promise<MaintenanceModeResponseDto> {
    return MaintenanceService.getMaintenanceModeWith(this.systemMetadataRepository);
  }

  private async setMaintenanceMode(isMaintenanceMode: boolean) {
    // const state = { isMaintenanceMode };
    // todo:
    // await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    // this.websocketRepository.clientBroadcast('on_server_restart', state);
    // this.websocketRepository.serverSend('AppRestart');
    // await this.eventRepository.emit('AppRestart');
  }

  async startMaintenance(): Promise<void> {
    throw new BadRequestException('Already in maintenance mode');
  }

  async endMaintenance(): Promise<void> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (!isMaintenanceMode) {
      throw new BadRequestException('Not in maintenance mode');
    }

    await this.setMaintenanceMode(false);
  }

  // todo: restart works differently
}
