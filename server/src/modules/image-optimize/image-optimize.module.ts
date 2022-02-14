import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { CommunicationModule } from '../../api-v1/communication/communication.module';
import { ImageOptimizeProcessor } from './image-optimize.processor';
import { AssetOptimizeService } from './image-optimize.service';

@Module({
  imports: [
    CommunicationModule,
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
