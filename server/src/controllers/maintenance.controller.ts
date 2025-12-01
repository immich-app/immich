import { BadRequestException, Body, Controller, Delete, Get, Next, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  MaintenanceAuthDto,
  MaintenanceGetIntegrityReportDto,
  MaintenanceIntegrityReportResponseDto,
  MaintenanceIntegrityReportSummaryResponseDto,
  MaintenanceLoginDto,
  SetMaintenanceModeDto,
} from 'src/dtos/maintenance.dto';
import { ApiTag, ImmichCookie, MaintenanceAction, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse, GetLoginDetails } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { LoginDetails } from 'src/services/auth.service';
import { MaintenanceService } from 'src/services/maintenance.service';
import { sendFile } from 'src/utils/file';
import { respondWithCookie } from 'src/utils/response';
import { IntegrityReportTypeParamDto, UUIDParamDto } from 'src/validation';

@ApiTags(ApiTag.Maintenance)
@Controller('admin/maintenance')
export class MaintenanceController {
  constructor(
    private logger: LoggingRepository,
    private service: MaintenanceService,
  ) {}

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

  @Get('integrity/summary')
  @Endpoint({
    summary: 'Get integrity report summary',
    description: '...',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReportSummary(): Promise<MaintenanceIntegrityReportSummaryResponseDto> {
    return this.service.getIntegrityReportSummary();
  }

  @Post('integrity/report')
  @Endpoint({
    summary: 'Get integrity report by type',
    description: '...',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReport(@Body() dto: MaintenanceGetIntegrityReportDto): Promise<MaintenanceIntegrityReportResponseDto> {
    return this.service.getIntegrityReport(dto);
  }

  @Get('integrity/report/:type/csv')
  @Endpoint({
    summary: 'Export integrity report by type as CSV',
    description: '...',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @FileResponse()
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReportCsv(@Param() { type }: IntegrityReportTypeParamDto, @Res() res: Response): void {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'private, no-cache, no-transform');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(`${Date.now()}-${type}.csv`)}"`);

    this.service.getIntegrityReportCsv(type).pipe(res);
  }

  @Get('integrity/report/:id/file')
  @Endpoint({
    summary: 'Download the orphan/broken file if one exists',
    description: '...',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @FileResponse()
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async getIntegrityReportFile(
    @Param() { id }: UUIDParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    await sendFile(res, next, () => this.service.getIntegrityReportFile(id), this.logger);
  }

  @Delete('integrity/report/:id/file')
  @Endpoint({
    summary: 'Delete associated file if it exists',
    description: '...',
    history: new HistoryBuilder().added('v9.9.9').alpha('v9.9.9'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async deleteIntegrityReportFile(@Param() { id }: UUIDParamDto): Promise<void> {
    await this.service.deleteIntegrityReportFile(id);
  }
}
