import {
  AuditDeletesDto,
  AuditDeletesResponseDto,
  AuditService,
  AuthUserDto,
  FileChecksumDto,
  FileChecksumResponseDto,
  FileReportDto,
  FileReportFixDto,
} from '@app/domain';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminRoute, AuthUser, Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Audit')
@Controller('audit')
@Authenticated()
@UseValidation()
export class AuditController {
  constructor(private service: AuditService) {}

  @Get('deletes')
  getAuditDeletes(@AuthUser() authUser: AuthUserDto, @Query() dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    return this.service.getDeletes(authUser, dto);
  }

  @AdminRoute()
  @Get('file-report')
  getAuditFiles(): Promise<FileReportDto> {
    return this.service.getFileReport();
  }

  @AdminRoute()
  @Post('file-report/checksum')
  getFileChecksums(@Body() dto: FileChecksumDto): Promise<FileChecksumResponseDto[]> {
    return this.service.getChecksums(dto);
  }

  @AdminRoute()
  @Post('file-report/fix')
  fixAuditFiles(@Body() dto: FileReportFixDto): Promise<void> {
    return this.service.fixItems(dto.items);
  }
}
