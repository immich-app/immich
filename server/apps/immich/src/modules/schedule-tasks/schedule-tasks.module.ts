import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { immichSharedQueues } from '@app/job/constants/bull-queue-registration.constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, ExifEntity, UserEntity]),
    BullModule.registerQueue(...immichSharedQueues),
  ],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
