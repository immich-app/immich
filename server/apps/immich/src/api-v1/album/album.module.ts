import { forwardRef, Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumEntity, AssetAlbumEntity, UserAlbumEntity } from '@app/database';
import { AlbumRepository, IAlbumRepository } from './album-repository';
import { DownloadModule } from '../../modules/download/download.module';
import { AssetModule } from '../asset/asset.module';
import { UserModule } from '../user/user.module';
import { ShareModule } from '../share/share.module';

const ALBUM_REPOSITORY_PROVIDER = {
  provide: IAlbumRepository,
  useClass: AlbumRepository,
};

@Module({
  imports: [
    TypeOrmModule.forFeature([AlbumEntity, AssetAlbumEntity, UserAlbumEntity]),
    DownloadModule,
    UserModule,
    forwardRef(() => AssetModule),
    ShareModule,
  ],
  controllers: [AlbumController],
  providers: [AlbumService, ALBUM_REPOSITORY_PROVIDER],
  exports: [ALBUM_REPOSITORY_PROVIDER],
})
export class AlbumModule {}
