import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AssetModule } from '../../api-v1/asset/asset.module';
import { AssetService } from '../../api-v1/asset/asset.service';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ImageOptimizeProcessor } from './image-optimize.processor';
import { AssetOptimizeService } from './image-optimize.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'optimize',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),

    TypeOrmModule.forFeature([AssetEntity]),
  ],
  providers: [AssetOptimizeService, ImageOptimizeProcessor],
  exports: [AssetOptimizeService],
})
export class ImageOptimizeModule {}
