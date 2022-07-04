import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';
import { thumbnailGeneratorQueueName, videoConversionQueueName } from '@app/job/constants/queue-name.constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity]),
    BullModule.registerQueue({
      name: videoConversionQueueName,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: thumbnailGeneratorQueueName,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
