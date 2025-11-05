import { BadRequestException, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('start')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async startMaintenance(): Promise<MaintenanceModeResponseDto> {
    await this.service.startMaintenance();
    return { isMaintenanceMode: true };
  }

  @Post('end')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  endMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Not in maintenance mode');
  }
}
