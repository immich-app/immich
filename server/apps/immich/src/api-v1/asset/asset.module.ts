import { Module } from '@nestjs/common';
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
import { ALBUM_REPOSITORY, AlbumRepository } from '../album/album-repository';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { UserAlbumEntity } from '@app/database/entities/user-album.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { AssetAlbumEntity } from '@app/database/entities/asset-album.entity';

@Module({
  imports: [
    CommunicationModule,
    BackgroundTaskModule,
    DownloadModule,
    TypeOrmModule.forFeature([AssetEntity, AlbumEntity, UserAlbumEntity, UserEntity, AssetAlbumEntity]),
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
  providers: [
    AssetService,
    BackgroundTaskService,
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetRepository,
    },
    {
      provide: ALBUM_REPOSITORY,
      useClass: AlbumRepository,
    },
  ],
  exports: [AssetService],
})
export class AssetModule {}
