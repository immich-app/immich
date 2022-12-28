import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { SharedLinkEntity } from '@app/database/entities/shared-link.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SharedLinkEntity])],
  controllers: [ShareController],
  providers: [ShareService],
})
export class ShareModule {}
