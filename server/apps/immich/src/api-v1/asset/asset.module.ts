import { forwardRef, Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/infra';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { CommunicationModule } from '../communication/communication.module';
import { AssetRepository, IAssetRepository } from './asset-repository';
import { DownloadModule } from '../../modules/download/download.module';
import { TagModule } from '../tag/tag.module';
import { AlbumModule } from '../album/album.module';
import { StorageModule } from '@app/storage';
import { ShareModule } from '../share/share.module';

const ASSET_REPOSITORY_PROVIDER = {
  provide: IAssetRepository,
  useClass: AssetRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity]),
    CommunicationModule,
    BackgroundTaskModule,
    DownloadModule,
    TagModule,
    StorageModule,
    forwardRef(() => AlbumModule),
    ShareModule,
  ],
  controllers: [AssetController],
  providers: [AssetService, BackgroundTaskService, ASSET_REPOSITORY_PROVIDER],
  exports: [ASSET_REPOSITORY_PROVIDER],
})
export class AssetModule {}
