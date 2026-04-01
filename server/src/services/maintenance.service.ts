import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import {
  MaintenanceAuthDto,
  MaintenanceDetectInstallResponseDto,
  MaintenanceStatusResponseDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { MaintenanceAction, SystemMetadataKey } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { MaintenanceModeState } from 'src/types';
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

  detectPriorInstall(): Promise<MaintenanceDetectInstallResponseDto> {
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
        action: MaintenanceAction.SelectDatabaseRestore,
      },
      'admin',
    );
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart(event: ArgOf<'AppRestart'>, ack?: (ok: 'ok') => void): void {
    this.logger.log(`Restarting due to event... ${JSON.stringify(event)}`);

    ack?.('ok');
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
}
