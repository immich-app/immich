import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from './entities/asset.entity';
import { ImageOptimizeModule } from '../../modules/image-optimize/image-optimize.module';
import { AssetOptimizeService } from '../../modules/image-optimize/image-optimize.service';
import { BullModule } from '@nestjs/bull';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';

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
    BullModule.registerQueue({
      name: 'background-task',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    TypeOrmModule.forFeature([AssetEntity]),
    ImageOptimizeModule,
    BackgroundTaskModule,
  ],
  controllers: [AssetController],
  providers: [AssetService, AssetOptimizeService, BackgroundTaskService],
  exports: [],
})
export class AssetModule {}
