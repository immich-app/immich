import { IJobRepository, JobName } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppCronJobs {
  constructor(private jobRepository: IJobRepository) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async onNightlyJob() {
    await this.jobRepository.queue({ name: JobName.USER_DELETE_CHECK });
    await this.jobRepository.queue({ name: JobName.PERSON_CLEANUP });
  }
}
