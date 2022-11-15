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
import { AssetRepository, ASSET_REPOSITORY } from '../asset/asset-repository';
import { DownloadModule } from '../../modules/download/download.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, UserEntity, AlbumEntity, AssetAlbumEntity, UserAlbumEntity]),
    DownloadModule,
  ],
  controllers: [AlbumController],
  providers: [
    AlbumService,
    {
      provide: ALBUM_REPOSITORY,
      useClass: AlbumRepository,
    },
    {
      provide: ASSET_REPOSITORY,
      useClass: AssetRepository,
    },
  ],
})
export class AlbumModule {}
