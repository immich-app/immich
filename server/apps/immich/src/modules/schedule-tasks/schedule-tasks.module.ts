import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';
import { QueueNameEnum } from '@app/job/constants/queue-name.constant';
import { ExifEntity } from '@app/database/entities/exif.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, ExifEntity]),
    BullModule.registerQueue({
      name: QueueNameEnum.VIDEO_CONVERSION,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: QueueNameEnum.THUMBNAIL_GENERATION,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

    BullModule.registerQueue({
      name: QueueNameEnum.METADATA_EXTRACTION,
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
