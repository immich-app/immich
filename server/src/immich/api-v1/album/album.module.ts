import { AlbumEntity, AssetEntity } from '@app/infra/entities/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlbumRepository, IAlbumRepository } from './album-repository.js';
import { AlbumController } from './album.controller.js';
import { AlbumService } from './album.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AlbumEntity, AssetEntity])],
  controllers: [AlbumController],
  providers: [AlbumService, { provide: IAlbumRepository, useClass: AlbumRepository }],
})
export class AlbumModule {}
