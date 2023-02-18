import { JobName, JobService } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleTasksService {
  constructor(private jobService: JobService) {}
  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async onUserDeleteCheck() {
    await this.jobService.handle({ name: JobName.USER_DELETE_CHECK });
  }
}
