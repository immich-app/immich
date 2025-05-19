import { Injectable } from '@nestjs/common';
import { OnJob } from 'src/decorators';
import { JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class IntegrityService extends BaseService {
  @OnJob({ name: JobName.DATABASE_INTEGRITY_CHECK, queue: QueueName.DATABASE_INTEGRITY_CHECK })
  async handleDatabaseIntegrityCheck(): Promise<JobStatus> {
    console.log(JSON.stringify(await this.assetRepository.integrityCheckExif()));
    return JobStatus.SUCCESS;
  }
}
