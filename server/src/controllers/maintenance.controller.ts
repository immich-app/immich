import { BadRequestException, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, Permission } from 'src/enum';
import { Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('start')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async startMaintenance(@Res({ passthrough: true }) response: Response): Promise<MaintenanceModeResponseDto> {
    await this.service.startMaintenance();
    response.cookie(ImmichCookie.MaintenanceToken, 'my-token');
    return { isMaintenanceMode: true };
  }

  @Post('end')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  endMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Not in maintenance mode');
  }
}
