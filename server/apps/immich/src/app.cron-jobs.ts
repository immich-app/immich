import { UserService } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppCronJobs {
  constructor(private userService: UserService) {}

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async onQueueUserDeleteCheck() {
    await this.userService.handleQueueUserDelete();
  }
}
