import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileChecksumDto, FileChecksumResponseDto, FileReportDto, FileReportFixDto } from 'src/dtos/audit.dto';
import { Permission } from 'src/dtos/auth.dto';
import { Authenticated } from 'src/middleware/auth.guard';
import { AuditService } from 'src/services/audit.service';

@ApiTags('File Report')
@Controller('report')
export class ReportController {
  constructor(private service: AuditService) {}

  @Get()
  @Authenticated(Permission.REPORT_READ)
  getAuditFiles(): Promise<FileReportDto> {
    return this.service.getFileReport();
  }

  @Post('/checksum')
  @Authenticated(Permission.REPORT_READ)
  getFileChecksums(@Body() dto: FileChecksumDto): Promise<FileChecksumResponseDto[]> {
    return this.service.getChecksums(dto);
  }

  @Post('/fix')
  @Authenticated(Permission.REPORT_UPDATE)
  fixAuditFiles(@Body() dto: FileReportFixDto): Promise<void> {
    return this.service.fixItems(dto.items);
  }
}
