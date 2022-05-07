import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetEntity } from '../asset/entities/asset.entity';
import { UserEntity } from '../user/entities/user.entity';
import { AlbumEntity } from './entities/album.entity';
import { AssetAlbumEntity } from './entities/asset-album.entity';
import { UserAlbumEntity } from './entities/user-album.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, UserEntity, AlbumEntity, AssetAlbumEntity, UserAlbumEntity])],
  controllers: [AlbumController],
  providers: [AlbumService],
})
export class AlbumModule {}
