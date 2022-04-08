import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetEntity } from '../asset/entities/asset.entity';
import { UserEntity } from '../user/entities/user.entity';
import { AddAssetsDto } from './dto/add-assets.dto';
import { CreateSharedAlbumDto } from './dto/create-shared-album.dto';
import { AssetSharedAlbumEntity } from './entities/asset-shared-album.entity';
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

    @InjectRepository(AssetSharedAlbumEntity)
    private assetSharedAlbumRepository: Repository<AssetSharedAlbumEntity>,

    @InjectRepository(UserSharedAlbumEntity)
    private userSharedAlbumRepository: Repository<UserSharedAlbumEntity>,
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

  /**
   * Get all shared album, including owned and shared one.
   * @param authUser AuthUserDto
   * @returns All Shared Album And Its Members
   */
  async getAllSharedAlbums(authUser: AuthUserDto) {
    const ownedAlbums = await this.sharedAlbumRepository.find({
      where: { ownerId: authUser.id },
      relations: ['sharedUsers', 'sharedUsers.userInfo'],
    });

    const isSharedWithAlbums = await this.userSharedAlbumRepository.find({
      where: {
        sharedUserId: authUser.id,
      },
      relations: ['albumInfo', 'albumInfo.sharedUsers', 'albumInfo.sharedUsers.userInfo'],
      select: ['albumInfo'],
    });

    return [...ownedAlbums, ...isSharedWithAlbums.map((o) => o.albumInfo)];
  }

  async getAlbumInfo(authUser: AuthUserDto, albumId: string) {
    const albumOwner = await this.sharedAlbumRepository.findOne({ where: { ownerId: authUser.id } });
    const personShared = await this.userSharedAlbumRepository.findOne({
      where: { albumId: albumId, sharedUserId: authUser.id },
    });

    if (!(albumOwner || personShared)) {
      throw new UnauthorizedException('Unauthorized Album Access');
    }

    const albumInfo = await this.sharedAlbumRepository.findOne({
      where: { id: albumId },
      relations: ['sharedUsers', 'sharedUsers.userInfo', 'sharedAssets', 'sharedAssets.assetInfo'],
    });

    if (!albumInfo) {
      throw new NotFoundException('Album Not Found');
    }

    return albumInfo;
  }

  async addUser() {}

  async deleteAlbum() {}

  async deleteUserFromAlbum() {}

  async addAssetsToAlbum(addAssetsDto: AddAssetsDto) {
    const newRecords: AssetSharedAlbumEntity[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      const newAssetSharedAlbum = new AssetSharedAlbumEntity();
      newAssetSharedAlbum.assetId = assetId;
      newAssetSharedAlbum.albumId = addAssetsDto.albumId;

      newRecords.push(newAssetSharedAlbum);
    }

    // Add album thumbnail if not exist.
    const album = await this.sharedAlbumRepository.findOne({ id: addAssetsDto.albumId });

    if (!album.albumThumbnailAssetId && newRecords.length > 0) {
      console.log('adding asset to album');
      album.albumThumbnailAssetId = newRecords[0].assetId;
      await this.sharedAlbumRepository.save(album);
    }

    return await this.assetSharedAlbumRepository.save([...newRecords]);
  }
}
