import { forwardRef, Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { BullModule } from '@nestjs/bull';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { CommunicationModule } from '../communication/communication.module';
import { QueueNameEnum } from '@app/job/constants/queue-name.constant';
import { AssetRepository, ASSET_REPOSITORY } from './asset-repository';
import { DownloadModule } from '../../modules/download/download.module';
import { TagModule } from '../tag/tag.module';
import { AlbumModule } from '../album/album.module';
import { UserModule } from '../user/user.module';

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
    UserModule,
    AlbumModule,
    TagModule,
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
