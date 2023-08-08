import { AuditService } from '@app/domain/audit';
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authenticated } from '../app.guard';
import { UseValidation } from '../app.utils';

@ApiTags('Audit')
@Controller('audit')
@Authenticated({ admin: true })
@UseValidation()
export class AuditController {
  constructor(private service: AuditService) {}

  @Get()
  getAuditRecords(): Promise<any> {
    return this.service.getAuditRecords();
  }
}
