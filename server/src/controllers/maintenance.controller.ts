import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { MaintenanceLoginDto, MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceRepository } from 'src/repositories/maintenance.repository';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('login')
  async maintenanceLogin(@Body() _dto: MaintenanceLoginDto): Promise<void> {
    throw new BadRequestException('Not in maintenance mode');
  }

  @Post('start')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async startMaintenance(
    @Auth() auth: AuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MaintenanceModeResponseDto> {
    const { secret } = await this.service.startMaintenance();
    const jwt = MaintenanceRepository.createJwt(secret, {
      username: auth.user.name,
    });

    response.cookie(ImmichCookie.MaintenanceToken, jwt);
    return { isMaintenanceMode: true };
  }

  @Post('end')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  endMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Not in maintenance mode');
  }
}
