import { BadRequestException, INestApplication, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { ExitCode } from 'src/enum';
import { BaseService } from 'src/services/base.service';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  nestApplication: INestApplication | undefined;

  async startMaintenance(): Promise<{ secret: string }> {
    const { isMaintenanceMode } = await this.maintenanceRepository.getMaintenanceMode();
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
