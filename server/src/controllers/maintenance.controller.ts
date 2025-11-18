import { BadRequestException, Body, Controller, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { MaintenanceAuthDto, MaintenanceLoginDto, SetMaintenanceModeDto } from 'src/dtos/maintenance.dto';
import { ApiTag, ImmichCookie, MaintenanceAction, Permission } from 'src/enum';
import { Auth, Authenticated, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoginDetails } from 'src/services/auth.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { respondWithCookie } from 'src/utils/response';

@ApiTags(ApiTag.Maintenance)
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(private service: MaintenanceService) {}

  @Post('login')
  @Endpoint({
    summary: 'Log into maintenance mode',
    description: 'Login with maintenance token or cookie to receive current information and perform further actions.',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  maintenanceLogin(@Body() _dto: MaintenanceLoginDto): MaintenanceAuthDto {
    throw new BadRequestException('Not in maintenance mode');
  }

  @Post()
  @Endpoint({
    summary: 'Set maintenance mode',
    description: 'Put Immich into or take it out of maintenance mode',
    history: new HistoryBuilder().added('v2.3.0').alpha('v2.3.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async setMaintenanceMode(
    @Auth() auth: AuthDto,
    @Body() dto: SetMaintenanceModeDto,
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    if (dto.action === MaintenanceAction.Start) {
      const { jwt } = await this.service.startMaintenance(auth.user.name);
      return respondWithCookie(res, undefined, {
        isSecure: loginDetails.isSecure,
        values: [{ key: ImmichCookie.MaintenanceToken, value: jwt }],
      });
    }
  }
}
