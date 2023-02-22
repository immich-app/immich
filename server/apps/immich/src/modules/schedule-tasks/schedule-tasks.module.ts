import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, ExifEntity, UserEntity } from '@app/infra';
import { ScheduleTasksService } from './schedule-tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, ExifEntity, UserEntity])],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
