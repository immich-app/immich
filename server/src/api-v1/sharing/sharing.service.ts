import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetEntity } from '../asset/entities/asset.entity';
import { UserEntity } from '../user/entities/user.entity';
import { CreateSharedAlbumDto } from './dto/create-shared-album.dto';
import { SharedAlbumEntity } from './entities/shared-album.entity';
import { UserSharedAlbumEntity } from './entities/user-shared-album.entity';

@Injectable()
export class SharingService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(SharedAlbumEntity)
    private sharedAlbumRepository: Repository<SharedAlbumEntity>,
  ) {}

  async create(authUser: AuthUserDto, createSharedAlbumDto: CreateSharedAlbumDto) {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      const newSharedAlbum = new SharedAlbumEntity();
      newSharedAlbum.ownerId = authUser.id;
      newSharedAlbum.albumName = createSharedAlbumDto.albumName;

      const sharedAlbum = await transactionalEntityManager.save(newSharedAlbum);

      for (const sharedUserId of createSharedAlbumDto.sharedWithUserIds) {
        const newSharedUser = new UserSharedAlbumEntity();
        newSharedUser.albumId = sharedAlbum.id;
        newSharedUser.sharedUserId = sharedUserId;

        await transactionalEntityManager.save(newSharedUser);
      }

      return sharedAlbum;
    });
  }

  async getAllSharedAlbums(authUser: AuthUserDto) {
    return await this.sharedAlbumRepository.find({
      where: { ownerId: authUser.id },
      relations: ['sharedUsers', 'sharedUsers.userInfo'],
    });
  }

  async addUser() {}

  async deleteAlbum() {}

  async deleteUserFromAlbum() {}
}
