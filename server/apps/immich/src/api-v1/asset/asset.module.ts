import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, ExifEntity } from '@app/infra/entities';
import { AssetRepository, IAssetRepository } from './asset-repository';
import { DownloadModule } from '../../modules/download/download.module';
import { TagModule } from '../tag/tag.module';
import { AlbumModule } from '../album/album.module';

const ASSET_REPOSITORY_PROVIDER = {
  provide: IAssetRepository,
  useClass: AssetRepository,
};

@Module({
  imports: [
    //
    TypeOrmModule.forFeature([AssetEntity, ExifEntity]),
    DownloadModule,
    TagModule,
    AlbumModule,
  ],
  controllers: [AssetController],
  providers: [AssetService, ASSET_REPOSITORY_PROVIDER],
  exports: [ASSET_REPOSITORY_PROVIDER],
})
export class AssetModule {}
