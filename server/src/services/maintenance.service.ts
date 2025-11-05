import { BadRequestException, INestApplication, Injectable } from '@nestjs/common';
import { PostgresError } from 'postgres';
import { OnEvent } from 'src/decorators';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ExitCode, SystemMetadataKey } from 'src/enum';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { BaseService } from 'src/services/base.service';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  nestApplication: INestApplication | undefined;

  static async getMaintenanceModeWith(
    systemMetadataRepository: SystemMetadataRepository,
  ): Promise<{ isMaintenanceMode: boolean }> {
    try {
      const value = await systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);

      return {
        isMaintenanceMode: false,
        ...value,
      };
    } catch (error) {
      // Table doesn't exist (migrations haven't run yet)
      if (error instanceof PostgresError && error.code === '42P01') {
        return { isMaintenanceMode: false };
      }

      throw error;
    }
  }

  getMaintenanceMode(): Promise<MaintenanceModeResponseDto> {
    return MaintenanceService.getMaintenanceModeWith(this.systemMetadataRepository);
  }

  private async setMaintenanceMode(isMaintenanceMode: boolean) {
    const state = { isMaintenanceMode };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    await this.eventRepository.emit('AppRestart', state);
  }

  async startMaintenance(): Promise<void> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (isMaintenanceMode) {
      throw new BadRequestException('Already in maintenance mode');
    }

    await this.setMaintenanceMode(true);
  }

  async endMaintenance(): Promise<void> {
    throw new BadRequestException('Not in maintenance mode');
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart() {
    /* eslint-disable unicorn/no-process-exit */
    // we need to specify the exact exit code
    void this.nestApplication
      ?.close() // attempt graceful shutdown
      .then(() => process.exit(ExitCode.AppRestart)); // then signal restart

    // in some exceptional circumstances, close() may hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 5000);
    /* eslint-enable unicorn/no-process-exit */
  }
}
