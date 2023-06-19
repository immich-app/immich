import { AlbumEntity, AssetEntity } from '@app/infra/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadModule } from '../../modules/download/download.module';
import { AlbumRepository, IAlbumRepository } from './album-repository';
import { AlbumController } from './album.controller';
import { AlbumService } from './album.service';

@Module({
  imports: [TypeOrmModule.forFeature([AlbumEntity, AssetEntity]), DownloadModule],
  controllers: [AlbumController],
  providers: [AlbumService, { provide: IAlbumRepository, useClass: AlbumRepository }],
})
export class AlbumModule {}
