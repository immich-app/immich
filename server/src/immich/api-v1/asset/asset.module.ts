import { AssetEntity, ExifEntity } from '@app/infra/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadModule } from '../../modules/download/download.module';
import { AssetRepository, IAssetRepository } from './asset-repository';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

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
