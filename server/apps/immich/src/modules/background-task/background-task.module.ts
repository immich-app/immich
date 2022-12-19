import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
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
