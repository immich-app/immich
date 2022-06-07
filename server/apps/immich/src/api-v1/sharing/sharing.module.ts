import { Module } from '@nestjs/common';
import { SharingService } from './sharing.service';
import { SharingController } from './sharing.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { AssetSharedAlbumEntity } from '@app/database/entities/asset-shared-album.entity';
import { SharedAlbumEntity } from '@app/database/entities/shared-album.entity';
import { UserSharedAlbumEntity } from '@app/database/entities/user-shared-album.entity';

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
