import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AssetModule } from '../../api-v1/asset/asset.module';
import { AssetService } from '../../api-v1/asset/asset.service';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ImageOptimizeProcessor } from './image-optimize.processor';
import { ImageOptimizeService } from './image-optimize.service';
// import { MachineLearningProcessor } from './machine-learning.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'image',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: 'machine-learning',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

    TypeOrmModule.forFeature([AssetEntity]),
  ],
  providers: [ImageOptimizeService, ImageOptimizeProcessor],
  exports: [ImageOptimizeService],
})
export class ImageOptimizeModule {}
