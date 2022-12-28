import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { SharedLinkEntity } from '@app/database/entities/shared-link.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { AssetEntity } from '@app/database/entities/asset.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SharedLinkEntity, AlbumEntity, AssetEntity])],
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
