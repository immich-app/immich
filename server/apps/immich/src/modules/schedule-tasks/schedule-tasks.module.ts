import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ScheduleTasksService } from './schedule-tasks.service';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { MicroservicesModule } from 'apps/microservices/src/microservices.module';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, ExifEntity, UserEntity]), MicroservicesModule],
  providers: [ScheduleTasksService],
})
export class ScheduleTasksModule {}
