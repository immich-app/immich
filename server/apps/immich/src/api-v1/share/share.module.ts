import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { SharedLinkEntity } from '@app/infra';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedLinkRepository, ISharedLinkRepository } from './shared-link.repository';

const SHARED_LINK_REPOSITORY_PROVIDER = {
  provide: ISharedLinkRepository,
  useClass: SharedLinkRepository,
};

@Module({
  imports: [TypeOrmModule.forFeature([SharedLinkEntity])],
  controllers: [ShareController],
  providers: [ShareService, SHARED_LINK_REPOSITORY_PROVIDER],
  exports: [SHARED_LINK_REPOSITORY_PROVIDER, ShareService],
})
export class ShareModule {}
