import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';
import { MicroservicesModule } from '../../../../microservices/src/microservices.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity]), MicroservicesModule],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
