import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ServerPingResponse } from 'src/dtos/server.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance')
@Controller('maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Get('ping')
  @Authenticated()
  getPing(): ServerPingResponse {
    return this.service.ping();
  }
}
