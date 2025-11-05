import { BadRequestException, Injectable } from '@nestjs/common';
import { OnEvent } from 'src/decorators';
import { BaseService } from 'src/services/base.service';

/**
 * This service is available outside of maintenance mode to manage maintenance mode
 */
@Injectable()
export class MaintenanceService extends BaseService {
  async startMaintenance(): Promise<{ secret: Uint8Array }> {
    const { isMaintenanceMode } = await this.maintenanceRepository.getMaintenanceMode();
    if (isMaintenanceMode) {
      throw new BadRequestException('Already in maintenance mode');
    }

    return await this.maintenanceRepository.enterMaintenanceMode();
  }

  @OnEvent({ name: 'AppRestart', server: true })
  onRestart() {
    this.maintenanceRepository.exitApp();
  }
}
