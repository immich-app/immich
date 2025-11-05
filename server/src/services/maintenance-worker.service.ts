import { BadRequestException, Injectable } from '@nestjs/common';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { SystemMetadataKey } from 'src/enum';
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
  constructor(
    protected logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
    private maintenanceRepository: MaintenanceWorkerRepository,
  ) {
    this.logger.setContext(this.constructor.name);
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

  async endMaintenance(): Promise<void> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (!isMaintenanceMode) {
      throw new BadRequestException('Not in maintenance mode');
    }

    const state = { isMaintenanceMode: false };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    this.maintenanceRepository.restartApp(state);
  }
}
