import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, ExifEntity, SmartInfoEntity } from '@app/infra';
import { BackgroundTaskProcessor } from './background-task.processor';
import { BackgroundTaskService } from './background-task.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'background-task',
    }),
    TypeOrmModule.forFeature([AssetEntity, ExifEntity, SmartInfoEntity]),
  ],
  providers: [BackgroundTaskService, BackgroundTaskProcessor],
  exports: [BackgroundTaskService, BullModule],
})
export class BackgroundTaskModule {}
