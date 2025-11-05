import { BadRequestException, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ServerConfigDto } from 'src/dtos/server.dto';
import { MaintenanceWorkerService } from 'src/services/maintenance-worker.service';

@ApiTags('Maintenance (admin)')
@Controller('api')
export class MaintenanceWorkerController {
  constructor(private service: MaintenanceWorkerService) {}

  @Get('server/config')
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }

  @Post('admin/maintenance/start')
  startMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Already in maintenance mode');
  }

  @Post('admin/maintenance/end')
  async endMaintenance(): Promise<MaintenanceModeResponseDto> {
    await this.service.endMaintenance();
    return { isMaintenanceMode: false };
  }
}
