import { BadRequestException, Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MaintenanceAuthDto, MaintenanceLoginDto, MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ServerConfigDto } from 'src/dtos/server.dto';
import { ImmichCookie } from 'src/enum';
import { MaintenanceRoute } from 'src/middleware/maintenance-auth.guard';
import { MaintenanceWorkerRepository } from 'src/repositories/maintenance-worker.repository';
import { MaintenanceWorkerService } from 'src/services/maintenance-worker.service';

@ApiTags('Maintenance (admin)')
@Controller('')
export class MaintenanceWorkerController {
  constructor(
    private repository: MaintenanceWorkerRepository,
    private service: MaintenanceWorkerService,
  ) {}

  @Get('server/config')
  getServerConfig(): Promise<ServerConfigDto> {
    return this.service.getSystemConfig();
  }

  @Post('admin/maintenance/start')
  @MaintenanceRoute()
  startMaintenance(): Promise<MaintenanceModeResponseDto> {
    throw new BadRequestException('Already in maintenance mode');
  }

  @Post('admin/maintenance/login')
  async maintenanceLogin(
    @Body() dto: MaintenanceLoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MaintenanceAuthDto> {
    const auth = await this.repository.decodeToken(dto.token);
    response.cookie(ImmichCookie.MaintenanceToken, dto.token);
    return auth;
  }

  @Post('admin/maintenance/end')
  @MaintenanceRoute()
  async endMaintenance(): Promise<MaintenanceModeResponseDto> {
    await this.service.endMaintenance();
    return { isMaintenanceMode: false };
  }
}
