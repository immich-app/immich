import { Module } from '@nestjs/common';
import { BackgroundTaskProcessor } from './background-task.processor';
import { BackgroundTaskService } from './background-task.service';

@Module({
  providers: [BackgroundTaskService, BackgroundTaskProcessor],
  exports: [BackgroundTaskService],
})
export class BackgroundTaskModule {}
