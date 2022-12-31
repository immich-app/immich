import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { SharedLinkEntity } from '@app/database/entities/shared-link.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedLinkRepository, ISharedLinkRepository } from './shared-link.repository';
import { AssetModule } from '../asset/asset.module';
import { AlbumModule } from '../album/album.module';

const SHARED_LINK_REPOSITORY_PROVIDER = {
  provide: ISharedLinkRepository,
  useClass: SharedLinkRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([SharedLinkEntity]), AssetModule, AlbumModule],
  controllers: [ShareController],
  providers: [ShareService, SHARED_LINK_REPOSITORY_PROVIDER],
  exports: [SHARED_LINK_REPOSITORY_PROVIDER],
})
export class ShareModule {}
