import { AssetEntity } from '@app/database/entities/asset.entity';
import { assetUploadedQueueName } from '@app/job/constants/queue-name.constant';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { asyncAssetUploadOptions } from '../../config/asset-upload.config';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { CommunicationModule } from '../communication/communication.module';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

@Module({
  imports: [
    CommunicationModule,
    BackgroundTaskModule,
    TypeOrmModule.forFeature([AssetEntity]),
    BullModule.registerQueue({
      name: assetUploadedQueueName,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => asyncAssetUploadOptions(config),
      inject: [ConfigService],
    }),
  ],
  controllers: [AssetController],
  providers: [AssetService, BackgroundTaskService],
  exports: [AssetService],
})
export class AssetModule {}
