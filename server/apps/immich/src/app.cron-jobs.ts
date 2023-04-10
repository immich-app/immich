import { AssetService, UserService } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppCronJobs {
  constructor(private userService: UserService, private assetService: AssetService) {}

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async onQueueUserDeleteCheck() {
    await this.userService.handleQueueUserDelete();
  }
}
