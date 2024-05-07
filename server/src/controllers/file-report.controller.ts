import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FileChecksumDto, FileChecksumResponseDto, FileReportDto, FileReportFixDto } from 'src/dtos/audit.dto';
import { AdminRoute, Authenticated } from 'src/middleware/auth.guard';
import { AuditService } from 'src/services/audit.service';

@ApiTags('File Report')
@Controller('report')
@Authenticated()
export class ReportController {
  constructor(private service: AuditService) {}

  @AdminRoute()
  @Get()
  getAuditFiles(): Promise<FileReportDto> {
    return this.service.getFileReport();
  }

  @AdminRoute()
  @Post('/checksum')
  getFileChecksums(@Body() dto: FileChecksumDto): Promise<FileChecksumResponseDto[]> {
    return this.service.getChecksums(dto);
  }

  @AdminRoute()
  @Post('/fix')
  fixAuditFiles(@Body() dto: FileReportFixDto): Promise<void> {
    return this.service.fixItems(dto.items);
  }
}
