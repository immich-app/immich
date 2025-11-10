import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { MaintenanceAuthDto, MaintenanceLoginDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('login')
  maintenanceLogin(@Body() _dto: MaintenanceLoginDto): MaintenanceAuthDto {
    return this.service.login();
  }

  @Post('start')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async startMaintenance(@Auth() auth: AuthDto, @Res({ passthrough: true }) response: Response): Promise<void> {
    const { jwt } = await this.service.startMaintenance(auth.user.name);
    response.cookie(ImmichCookie.MaintenanceToken, jwt);
  }

  @Post('end')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  endMaintenance(): void {
    this.service.endMaintenance();
  }
}
