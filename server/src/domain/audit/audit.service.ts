import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAuditRepository } from '.';

@Injectable()
export class AuditService {
  private logger = new Logger(AuditService.name);

  constructor(@Inject(IAuditRepository) private repository: IAuditRepository) {}

  async getAuditRecords(): Promise<any> {
    return this.repository.get();
  }
}
