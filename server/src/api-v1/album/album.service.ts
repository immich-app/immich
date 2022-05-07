import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetEntity } from '../asset/entities/asset.entity';
import { UserEntity } from '../user/entities/user.entity';
import { AddAssetsDto } from './dto/add-assets.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AssetAlbumEntity } from './entities/asset-album.entity';
import { AlbumEntity } from './entities/album.entity';
import { UserAlbumEntity } from './entities/user-album.entity';
import _ from 'lodash';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AlbumEntity)
    private sharedAlbumRepository: Repository<AlbumEntity>,

    @InjectRepository(AssetAlbumEntity)
    private assetSharedAlbumRepository: Repository<AssetAlbumEntity>,

    @InjectRepository(UserAlbumEntity)
    private userSharedAlbumRepository: Repository<UserAlbumEntity>,
  ) {}

  async create(authUser: AuthUserDto, createSharedAlbumDto: CreateAlbumDto) {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      // Create album entity
      const newSharedAlbum = new AlbumEntity();
      newSharedAlbum.ownerId = authUser.id;
      newSharedAlbum.albumName = createSharedAlbumDto.albumName;

      const sharedAlbum = await transactionalEntityManager.save(newSharedAlbum);

      // Add shared users
      for (const sharedUserId of createSharedAlbumDto.sharedWithUserIds) {
        const newSharedUser = new UserAlbumEntity();
        newSharedUser.albumId = sharedAlbum.id;
        newSharedUser.sharedUserId = sharedUserId;

        await transactionalEntityManager.save(newSharedUser);
      }

      // Add shared assets
      const newRecords: AssetAlbumEntity[] = [];

      for (const assetId of createSharedAlbumDto.assetIds) {
        const newAssetSharedAlbum = new AssetAlbumEntity();
        newAssetSharedAlbum.assetId = assetId;
        newAssetSharedAlbum.albumId = sharedAlbum.id;

        newRecords.push(newAssetSharedAlbum);
      }

      if (!sharedAlbum.albumThumbnailAssetId && newRecords.length > 0) {
        sharedAlbum.albumThumbnailAssetId = newRecords[0].assetId;
        await transactionalEntityManager.save(sharedAlbum);
      }

      await transactionalEntityManager.save([...newRecords]);

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

    return [...ownedAlbums, ...isSharedWithAlbums.map((o) => o.albumInfo)].sort(
      (a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf(),
    );
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
    const sortedSharedAsset = albumInfo.sharedAssets.sort(
      (a, b) => new Date(a.assetInfo.createdAt).valueOf() - new Date(b.assetInfo.createdAt).valueOf(),
    );

    albumInfo.sharedAssets = sortedSharedAsset;

    return albumInfo;
  }

  async addUsersToAlbum(addUsersDto: AddUsersDto, albumId: string) {
    const newRecords: UserAlbumEntity[] = [];

    for (const sharedUserId of addUsersDto.sharedUserIds) {
      const newEntity = new UserAlbumEntity();
      newEntity.albumId = albumId;
      newEntity.sharedUserId = sharedUserId;

      newRecords.push(newEntity);
    }

    return await this.userSharedAlbumRepository.save([...newRecords]);
  }

  async deleteAlbum(authUser: AuthUserDto, albumId: string) {
    return await this.sharedAlbumRepository.delete({ id: albumId, ownerId: authUser.id });
  }

  async leaveAlbum(authUser: AuthUserDto, albumId: string) {
    return await this.userSharedAlbumRepository.delete({ albumId: albumId, sharedUserId: authUser.id });
  }

  async removeUsersFromAlbum() {}

  async removeAssetsFromAlbum(authUser: AuthUserDto, removeAssetsDto: RemoveAssetsDto, albumId: string) {
    let deleteAssetCount = 0;
    const album = await this.sharedAlbumRepository.findOne({ id: albumId });

    if (album.ownerId != authUser.id) {
      throw new BadRequestException("You don't have permission to remove assets in this album");
    }

    for (const assetId of removeAssetsDto.assetIds) {
      const res = await this.assetSharedAlbumRepository.delete({ albumId: albumId, assetId: assetId });
      if (res.affected == 1) deleteAssetCount++;
    }

    return deleteAssetCount == removeAssetsDto.assetIds.length;
  }

  async addAssetsToAlbum(addAssetsDto: AddAssetsDto, albumId: string) {
    const newRecords: AssetAlbumEntity[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      const newAssetSharedAlbum = new AssetAlbumEntity();
      newAssetSharedAlbum.assetId = assetId;
      newAssetSharedAlbum.albumId = albumId;

      newRecords.push(newAssetSharedAlbum);
    }

    // Add album thumbnail if not exist.
    const album = await this.sharedAlbumRepository.findOne({ id: albumId });

    if (!album.albumThumbnailAssetId && newRecords.length > 0) {
      album.albumThumbnailAssetId = newRecords[0].assetId;
      await this.sharedAlbumRepository.save(album);
    }

    return await this.assetSharedAlbumRepository.save([...newRecords]);
  }

  async updateAlbumTitle(authUser: AuthUserDto, updateShareAlbumDto: UpdateAlbumDto, albumId: string) {
    if (authUser.id != updateShareAlbumDto.ownerId) {
      throw new BadRequestException('Unauthorized to change album info');
    }

    const sharedAlbum = await this.sharedAlbumRepository.findOne({ where: { id: albumId } });
    sharedAlbum.albumName = updateShareAlbumDto.albumName;

    return await this.sharedAlbumRepository.save(sharedAlbum);
  }
}
