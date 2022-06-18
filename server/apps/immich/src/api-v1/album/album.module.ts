import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { AlbumEntity } from '../../../../../libs/database/src/entities/album.entity';
import { AssetAlbumEntity } from '@app/database/entities/asset-album.entity';
import { UserAlbumEntity } from '@app/database/entities/user-album.entity';
import { AlbumRepository, ALBUM_REPOSITORY } from './album-repository';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, UserEntity, AlbumEntity, AssetAlbumEntity, UserAlbumEntity])],
  controllers: [AlbumController],
  providers: [
    AlbumService,
    {
      provide: ALBUM_REPOSITORY,
      useClass: AlbumRepository,
    },
  ],
})
export class AlbumModule {}
