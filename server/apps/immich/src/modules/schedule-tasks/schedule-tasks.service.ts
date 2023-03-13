import { UserService } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduleTasksService {
  constructor(private userService: UserService) {}

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async onUserDeleteCheck() {
    await this.userService.handleUserDeleteCheck();
  }
}
