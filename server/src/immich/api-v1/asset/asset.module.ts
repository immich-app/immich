import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity, ExifEntity } from '@app/infra/entities';
import { AssetRepository, IAssetRepository } from './asset-repository';
import { DownloadModule } from '../../modules/download/download.module';

@Module({
  imports: [
    //
    TypeOrmModule.forFeature([AssetEntity, ExifEntity]),
    DownloadModule,
  ],
  controllers: [AssetController],
  providers: [AssetService, { provide: IAssetRepository, useClass: AssetRepository }],
})
export class AssetModule {}
