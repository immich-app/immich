import { BadRequestException, Controller, Post, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthDto } from 'src/dtos/auth.dto';
import { MaintenanceAuthDto, MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ImmichCookie, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { MaintenanceService } from 'src/services/maintenance.service';

@ApiTags('Maintenance (admin)')
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(
    private service: MaintenanceService,
    private jwtService: JwtService,
  ) {}

  @Post('start')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async startMaintenance(
    @Auth() auth: AuthDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MaintenanceModeResponseDto> {
    const { token } = await this.service.startMaintenance();

    const jwt = await this.jwtService.signAsync(
      {
        data: {
          username: auth.user.name,
        } as MaintenanceAuthDto,
      },
      {
        secret: token,
      },
    );

    response.cookie(ImmichCookie.MaintenanceToken, jwt);

    return { isMaintenanceMode: true };
  }

  @Post('end')
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  endMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Not in maintenance mode');
  }
}
