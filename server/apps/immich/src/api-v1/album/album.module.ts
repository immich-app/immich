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
import { TagEntity } from '@app/database/entities/tag.entity';
import { TagRepository, TAG_REPOSITORY } from '../tag/tag.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, UserEntity, AlbumEntity, AssetAlbumEntity, UserAlbumEntity, TagEntity]),
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
    {
      provide: TAG_REPOSITORY,
      useClass: TagRepository,
    },
  ],
})
export class AlbumModule {}
