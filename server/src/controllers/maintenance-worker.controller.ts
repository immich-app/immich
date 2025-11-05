import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  startMaintenance() {
    return this.service.startMaintenance();
  }

  @Post('admin/maintenance/end')
  endMaintenance() {
    return this.service.endMaintenance();
  }
}
