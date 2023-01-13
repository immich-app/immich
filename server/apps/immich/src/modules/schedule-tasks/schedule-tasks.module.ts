import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, ExifEntity, UserEntity } from '@app/infra';
import { ScheduleTasksService } from './schedule-tasks.service';
import { immichSharedQueues } from '@app/job/constants/bull-queue-registration.constant';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, ExifEntity, UserEntity]),
    BullModule.registerQueue(...immichSharedQueues),
  ],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
