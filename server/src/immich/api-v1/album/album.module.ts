import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumEntity, AssetEntity } from '@app/infra/entities';
import { AlbumRepository, IAlbumRepository } from './album-repository';
import { DownloadModule } from '../../modules/download/download.module';

@Module({
  imports: [TypeOrmModule.forFeature([AlbumEntity, AssetEntity]), DownloadModule],
  controllers: [AlbumController],
  providers: [AlbumService, { provide: IAlbumRepository, useClass: AlbumRepository }],
})
export class AlbumModule {}
