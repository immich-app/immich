import { AssetEntity } from '@app/database/entities/asset.entity';
import { QueueNameEnum } from '@app/job/constants/queue-name.constant';
import { BullModule } from '@nestjs/bull';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { DownloadModule } from '../../modules/download/download.module';
import { AlbumModule } from '../album/album.module';
import { CommunicationModule } from '../communication/communication.module';
import { AssetRepository, ASSET_REPOSITORY } from './asset-repository';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

const ASSET_REPOSITORY_PROVIDER = {
  provide: ASSET_REPOSITORY,
  useClass: AssetRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity]),
    CommunicationModule,
    BackgroundTaskModule,
    DownloadModule,
    forwardRef(() => AlbumModule),
    BullModule.registerQueue({
      name: QueueNameEnum.ASSET_UPLOADED,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    BullModule.registerQueue({
      name: QueueNameEnum.VIDEO_CONVERSION,
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [AssetController],
  providers: [AssetService, BackgroundTaskService, ASSET_REPOSITORY_PROVIDER],
  exports: [ASSET_REPOSITORY_PROVIDER],
})
export class AssetModule {}
