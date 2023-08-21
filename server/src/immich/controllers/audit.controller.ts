import { AuthUserDto } from '@app/domain';
import { AuditService } from '@app/domain/audit';
import { AuditResponseDto } from '@app/domain/audit/audit-response.dto';
import { AuditQueryDto } from '@app/domain/audit/audit.dto';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated, AuthUser } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Audit')
@Controller('audit')
@Authenticated()
@UseValidation()
export class AuditController {
  constructor(private service: AuditService) {}

  @Get('records')
  getAuditRecords(@AuthUser() authUser: AuthUserDto, @Query() dto: AuditQueryDto): Promise<AuditResponseDto[] | null> {
    return this.service.getNewestRecordsForOwnerSince(authUser, dto.lastTime);
  }
}
