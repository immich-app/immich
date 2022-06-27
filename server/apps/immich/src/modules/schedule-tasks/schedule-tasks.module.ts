import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity]),
    BullModule.registerQueue({
      name: 'video-conversion-queue',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generator-queue',
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
