import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('start')
  @Authenticated({ permission: Permission.SystemMetadataUpdate, admin: true })
  startMaintenance() {
    return this.service.startMaintenance();
  }

  @Post('end')
  @Authenticated({ permission: Permission.SystemMetadataUpdate, admin: true })
  endMaintenance() {
    return this.service.endMaintenance();
  }
}
