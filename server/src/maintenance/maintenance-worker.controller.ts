import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { MaintenanceAuthDto, MaintenanceLoginDto, SetMaintenanceModeDto } from 'src/dtos/maintenance.dto';
import { ServerConfigDto } from 'src/dtos/server.dto';
import { ImmichCookie, MaintenanceAction } from 'src/enum';
import { MaintenanceRoute } from 'src/maintenance/maintenance-auth.guard';
import { MaintenanceWorkerService } from 'src/maintenance/maintenance-worker.service';
import { GetLoginDetails } from 'src/middleware/auth.guard';
import { LoginDetails } from 'src/services/auth.service';
import { respondWithCookie } from 'src/utils/response';

@Controller()
export class MaintenanceWorkerController {
  constructor(private service: MaintenanceWorkerService) {}

  @Get('server/config')
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }

  @Post('admin/maintenance/login')
  async maintenanceLogin(
    @Req() request: Request,
    @Body() dto: MaintenanceLoginDto,
    @GetLoginDetails() loginDetails: LoginDetails,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MaintenanceAuthDto> {
    const token = dto.token ?? request.cookies[ImmichCookie.MaintenanceToken];
    const auth = await this.service.login(token);
    return respondWithCookie(res, auth, {
      isSecure: loginDetails.isSecure,
      values: [{ key: ImmichCookie.MaintenanceToken, value: token }],
    });
  }

  @Post('admin/maintenance')
  @MaintenanceRoute()
  async setMaintenanceMode(@Body() dto: SetMaintenanceModeDto): Promise<void> {
    if (dto.action === MaintenanceAction.End) {
      await this.service.endMaintenance();
    }
  }
}
