import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Next, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NextFunction, Response } from 'express';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  IntegrityGetReportDto,
  IntegrityReportResponseDto,
  IntegrityReportSummaryResponseDto,
} from 'src/dtos/integrity.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated, FileResponse } from 'src/middleware/auth.guard';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { IntegrityService } from 'src/services/integrity.service';
import { sendFile } from 'src/utils/file';
import { IntegrityReportTypeParamDto, UUIDv7ParamDto } from 'src/validation';

@ApiTags(ApiTag.Maintenance)
@Controller('admin/integrity')
export class IntegrityController {
  constructor(
    private logger: LoggingRepository,
    private service: IntegrityService,
  ) {}

  @Get('summary')
  @Endpoint({
    summary: 'Get integrity report summary',
    description: 'Get a count of the items flagged in each integrity report',
    history: new HistoryBuilder().added('v2.6.0').alpha('v2.6.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReportSummary(): Promise<IntegrityReportSummaryResponseDto> {
    return this.service.getIntegrityReportSummary();
  }

  @Post('report')
  @HttpCode(HttpStatus.OK)
  @Endpoint({
    summary: 'Get integrity report by type',
    description: 'Get all flagged items by integrity report type',
    history: new HistoryBuilder().added('v2.6.0').alpha('v2.6.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReport(@Body() dto: IntegrityGetReportDto): Promise<IntegrityReportResponseDto> {
    return this.service.getIntegrityReport(dto);
  }

  @Delete('report/:id')
  @Endpoint({
    summary: 'Delete integrity report item',
    description: 'Delete a given report item and perform corresponding deletion (e.g. trash asset, delete file)',
    history: new HistoryBuilder().added('v2.6.0').alpha('v2.6.0'),
  })
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async deleteIntegrityReport(@Auth() auth: AuthDto, @Param() { id }: UUIDv7ParamDto): Promise<void> {
    await this.service.deleteIntegrityReport(auth, id);
  }

  @Get('report/:type/csv')
  @Endpoint({
    summary: 'Export integrity report by type as CSV',
    description: 'Get all integrity report entries for a given type as a CSV',
    history: new HistoryBuilder().added('v2.6.0').alpha('v2.6.0'),
  })
  @FileResponse()
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  getIntegrityReportCsv(@Param() { type }: IntegrityReportTypeParamDto, @Res() res: Response): void {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Cache-Control', 'private, no-cache, no-transform');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(`${Date.now()}-${type}.csv`)}"`);

    this.service.getIntegrityReportCsv(type).pipe(res);
  }

  @Get('report/:id/file')
  @Endpoint({
    summary: 'Download flagged file',
    description: 'Download the untracked/broken file if one exists',
    history: new HistoryBuilder().added('v2.6.0').alpha('v2.6.0'),
  })
  @FileResponse()
  @Authenticated({ permission: Permission.Maintenance, admin: true })
  async getIntegrityReportFile(
    @Param() { id }: UUIDv7ParamDto,
    @Res() res: Response,
    @Next() next: NextFunction,
  ): Promise<void> {
    await sendFile(res, next, () => this.service.getIntegrityReportFile(id), this.logger);
  }
}
