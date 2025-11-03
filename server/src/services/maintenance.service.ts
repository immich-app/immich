import { BadRequestException, INestApplication, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { SystemMetadataKey } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class MaintenanceService extends BaseService {
  nestApplication: INestApplication | undefined;

  async getMaintenanceMode(): Promise<MaintenanceModeResponseDto> {
    const value = await this.systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);
    return { isMaintenanceMode: false, ...value };
  }

  private async setMaintenanceMode(isMaintenanceMode: boolean) {
    const state = { isMaintenanceMode };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    this.websocketRepository.clientBroadcast('on_server_restart', state);
    this.websocketRepository.serverSend('AppRestart');
    this.eventRepository.emit('AppRestart');
  }

  async startMaintenance(): Promise<void> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (isMaintenanceMode) {
      throw new BadRequestException('Already in maintenance mode');
    }

    this.setMaintenanceMode(true);
  }

  async endMaintenance(): Promise<void> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (!isMaintenanceMode) {
      throw new BadRequestException('Not in maintenance mode');
    }

    this.setMaintenanceMode(false);
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart() {
    this.nestApplication
      ?.close() // attempt graceful shutdown
      .then(() => process.exit(7)); // then signal restart

    // issue: close() seems to hang for API worker, so timeout after 1s
    setTimeout(() => process.exit(7), 1000);
  }
}
