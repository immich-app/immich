import { forwardRef, Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumEntity } from '../../../../../libs/database/src/entities/album.entity';
import { AssetAlbumEntity } from '@app/database/entities/asset-album.entity';
import { UserAlbumEntity } from '@app/database/entities/user-album.entity';
import { AlbumRepository, ALBUM_REPOSITORY } from './album-repository';
import { DownloadModule } from '../../modules/download/download.module';
import { AssetModule } from '../asset/asset.module';
import { UserModule } from '../user/user.module';

const ALBUM_REPOSITORY_PROVIDER = {
  provide: ALBUM_REPOSITORY,
  useClass: AlbumRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([AlbumEntity, AssetAlbumEntity, UserAlbumEntity]),
    DownloadModule,
    UserModule,
    forwardRef(() => AssetModule),
  ],
  controllers: [AlbumController],
  providers: [AlbumService, ALBUM_REPOSITORY_PROVIDER],
  exports: [ALBUM_REPOSITORY_PROVIDER],
})
export class AlbumModule {}
