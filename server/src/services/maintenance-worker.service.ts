import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { parse } from 'cookie';
import { jwtVerify } from 'jose';
import { IncomingHttpHeaders } from 'node:http';
import { MaintenanceAuthDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, SystemMetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceService } from 'src/services/maintenance.service';
import { MaintenanceModeState } from 'src/types';
import { getConfig } from 'src/utils/config';
import { getExternalDomain } from 'src/utils/misc';

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

  private async secret(): Promise<string> {
    const state = await this.systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);
    if (!state?.isMaintenanceMode) {
      throw new Error('Unreachable: not in maintenance mode');
    }
    return state.secret;
  }

  async logSecret(): Promise<void> {
    const { server } = await this.getConfig({ withCache: true });

    const baseUrl = getExternalDomain(server);
    const url = await MaintenanceService.createLoginUrl(
      baseUrl,
      {
        username: 'immich-admin',
      },
      await this.secret(),
    );

    this.logger.log(`\n\n🚧 Immich is in maintenance mode, you can log in using the following URL:\n${url}\n`);
  }

  async authenticate(headers: IncomingHttpHeaders): Promise<MaintenanceAuthDto> {
    const jwtToken = parse(headers.cookie || '')[ImmichCookie.MaintenanceToken];
    return this.login(jwtToken);
  }

  async login(jwt?: string): Promise<MaintenanceAuthDto> {
    if (!jwt) {
      throw new UnauthorizedException('Missing JWT Token');
    }

    try {
      const secret = await this.secret();
      const result = await jwtVerify<MaintenanceAuthDto>(jwt, new TextEncoder().encode(secret));
      return result.payload;
    } catch {
      throw new UnauthorizedException('Invalid JWT Token');
    }
  }

  startMaintenance(): void {
    throw new BadRequestException('Already in maintenance mode');
  }

  async endMaintenance(): Promise<void> {
    const state: MaintenanceModeState = { isMaintenanceMode: false as const };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    this.maintenanceRepository.restartApp(state);
  }
}
