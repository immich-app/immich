import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AUDIT_LOG_MAX_DURATION } from 'src/constants';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class AuditService extends BaseService {
  @OnJob({ name: JobName.AuditLogCleanup, queue: QueueName.BackgroundTask })
  async handleCleanup(): Promise<JobStatus> {
    await this.auditRepository.removeBefore(DateTime.now().minus(AUDIT_LOG_MAX_DURATION).toJSDate());
    return JobStatus.Success;
  }
}
