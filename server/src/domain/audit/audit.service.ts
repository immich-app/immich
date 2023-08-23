import { Inject, Injectable } from '@nestjs/common';
import { DateTime, Duration } from 'luxon';
import { IAuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(@Inject(IAuditRepository) private repository: IAuditRepository) {}

  async handleCleanup(): Promise<boolean> {
    const date = DateTime.now().minus(Duration.fromObject({ days: 100 }));
    await this.repository.deleteBefore(date.toJSDate());
    return true;
  }
}
