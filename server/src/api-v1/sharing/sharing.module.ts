import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../asset/entities/asset.entity';
import { UserEntity } from '../user/entities/user.entity';
import { SharedAlbumEntity } from './entities/shared-album.entity';
import { AssetSharedAlbumEntity } from './entities/asset-shared-album.entity';
import { UserSharedAlbumEntity } from './entities/user-shared-album.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetEntity,
      UserEntity,
      SharedAlbumEntity,
      AssetSharedAlbumEntity,
      UserSharedAlbumEntity,
    ]),
  ],
  controllers: [SharingController],
  providers: [SharingService],
})
export class SharingModule {}
