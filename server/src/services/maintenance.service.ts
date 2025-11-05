import { BadRequestException, INestApplication, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ExitCode } from 'src/enum';
import { BaseService } from 'src/services/base.service';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  nestApplication: INestApplication | undefined;

  async getMaintenanceMode(): Promise<MaintenanceModeResponseDto> {
    return {
      isMaintenanceMode: await this.maintenanceRepository.isMaintenanceMode(),
    };
  }

  async startMaintenance(): Promise<{ token: string }> {
    const { isMaintenanceMode } = await this.getMaintenanceMode();
    if (isMaintenanceMode) {
      throw new BadRequestException('Already in maintenance mode');
    }

    return await this.maintenanceRepository.enterMaintenanceMode();
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
