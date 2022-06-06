import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { CommunicationModule } from '../../api-v1/communication/communication.module';
import { BackgroundTaskModule } from '../background-task/background-task.module';
import { BackgroundTaskService } from '../background-task/background-task.service';
import { ImageOptimizeProcessor } from './image-optimize.processor';
import { AssetOptimizeService } from './image-optimize.service';

@Module({
  imports: [
    CommunicationModule,
    BackgroundTaskModule,
    BullModule.registerQueue({
      name: 'optimize',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'background-task',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([AssetEntity]),
  ],
  providers: [AssetOptimizeService, ImageOptimizeProcessor, BackgroundTaskService],
  exports: [AssetOptimizeService],
})
export class ImageOptimizeModule { }
