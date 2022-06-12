import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getConnection, Repository } from 'typeorm';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { UserEntity } from '@app/database/entities/user.entity';
import { AddAssetsDto } from './dto/add-assets.dto';
import { CreateSharedAlbumDto } from './dto/create-shared-album.dto';
import { AssetSharedAlbumEntity } from '@app/database/entities/asset-shared-album.entity';
import { SharedAlbumEntity } from '@app/database/entities/shared-album.entity';
import { UserSharedAlbumEntity } from '@app/database/entities/user-shared-album.entity';
import _ from 'lodash';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateShareAlbumDto } from './dto/update-shared-album.dto';

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
      // Create album entity
      const newSharedAlbum = new SharedAlbumEntity();
      newSharedAlbum.ownerId = authUser.id;
      newSharedAlbum.albumName = createSharedAlbumDto.albumName;

      const sharedAlbum = await transactionalEntityManager.save(newSharedAlbum);

      // Add shared users
      for (const sharedUserId of createSharedAlbumDto.sharedWithUserIds) {
        const newSharedUser = new UserSharedAlbumEntity();
        newSharedUser.albumId = sharedAlbum.id;
        newSharedUser.sharedUserId = sharedUserId;

        await transactionalEntityManager.save(newSharedUser);
      }

      // Add shared assets
      const newRecords: AssetSharedAlbumEntity[] = [];

      for (const assetId of createSharedAlbumDto.assetIds) {
        const newAssetSharedAlbum = new AssetSharedAlbumEntity();
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

  async addUsersToAlbum(addUsersDto: AddUsersDto) {
    const newRecords: UserSharedAlbumEntity[] = [];

    for (const sharedUserId of addUsersDto.sharedUserIds) {
      const newEntity = new UserSharedAlbumEntity();
      newEntity.albumId = addUsersDto.albumId;
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

  async removeAssetsFromAlbum(authUser: AuthUserDto, removeAssetsDto: RemoveAssetsDto) {
    let deleteAssetCount = 0;
    const album = await this.sharedAlbumRepository.findOne({ id: removeAssetsDto.albumId });

    if (album.ownerId != authUser.id) {
      throw new BadRequestException("You don't have permission to remove assets in this album");
    }

    for (const assetId of removeAssetsDto.assetIds) {
      const res = await this.assetSharedAlbumRepository.delete({ albumId: removeAssetsDto.albumId, assetId: assetId });
      if (res.affected == 1) deleteAssetCount++;
    }

    return deleteAssetCount == removeAssetsDto.assetIds.length;
  }

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
      album.albumThumbnailAssetId = newRecords[0].assetId;
      await this.sharedAlbumRepository.save(album);
    }

    return await this.assetSharedAlbumRepository.save([...newRecords]);
  }

  async updateAlbumTitle(authUser: AuthUserDto, updateShareAlbumDto: UpdateShareAlbumDto) {
    if (authUser.id != updateShareAlbumDto.ownerId) {
      throw new BadRequestException('Unauthorized to change album info');
    }

    const sharedAlbum = await this.sharedAlbumRepository.findOne({ where: { id: updateShareAlbumDto.albumId } });
    sharedAlbum.albumName = updateShareAlbumDto.albumName;

    return await this.sharedAlbumRepository.save(sharedAlbum);
  }
}
