import { Module } from '@nestjs/common';
import { RecycleBinService } from './recycle-bin.service';
import { RecycleBinController } from './recycle-bin.controller';
import { ShareModule } from '../share/share.module';
import { StorageModule } from '@app/storage';
import { BackgroundTaskModule } from '../../modules/background-task/background-task.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/infra';
import { BackgroundTaskService } from '../../modules/background-task/background-task.service';
import { AssetRepository, IAssetRepository } from '../asset/asset-repository';
import { TagModule } from '../tag/tag.module';

const ASSET_REPOSITORY_PROVIDER = {
  provide: IAssetRepository,
  useClass: AssetRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity]), BackgroundTaskModule, TagModule, StorageModule, ShareModule],
  providers: [RecycleBinService, BackgroundTaskService, ASSET_REPOSITORY_PROVIDER],
  controllers: [RecycleBinController],
})
export class RecycleBinModule {}
