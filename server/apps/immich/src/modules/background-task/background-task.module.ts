import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QueueName } from '@app/domain';
import { BackgroundTaskProcessor } from './background-task.processor';
import { BackgroundTaskService } from './background-task.service';

@Module({
  imports: [BullModule.registerQueue({ name: QueueName.BACKGROUND_TASK })],
  providers: [BackgroundTaskService, BackgroundTaskProcessor],
  exports: [BackgroundTaskService, BullModule],
})
export class BackgroundTaskModule {}
