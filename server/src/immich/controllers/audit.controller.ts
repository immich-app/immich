import { AuditDeletesDto, AuditDeletesResponseDto, AuditService, AuthUserDto } from '@app/domain';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthUser, Authenticated } from '../app.guard';
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
}
