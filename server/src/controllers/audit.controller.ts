import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditDeletesDto, AuditDeletesResponseDto } from 'src/dtos/audit.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { AuditService } from 'src/services/audit.service';

@ApiTags('Audit')
@Controller('audit')
export class AuditController {
  constructor(private service: AuditService) {}

  @Get('deletes')
  @Authenticated()
  getAuditDeletes(@Auth() auth: AuthDto, @Query() dto: AuditDeletesDto): Promise<AuditDeletesResponseDto> {
    return this.service.getDeletes(auth, dto);
  }
}
