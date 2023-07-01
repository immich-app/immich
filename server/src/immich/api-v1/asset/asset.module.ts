import { AssetEntity, ExifEntity } from '@app/infra/entities/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetRepository, IAssetRepository } from './asset-repository.js';
import { AssetController } from './asset.controller.js';
import { AssetService } from './asset.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, ExifEntity])],
  controllers: [AssetController],
  providers: [AssetService, { provide: IAssetRepository, useClass: AssetRepository }],
})
export class AssetModule {}
