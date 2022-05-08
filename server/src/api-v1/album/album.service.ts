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
import { GetAlbumsDto } from './dto/get-albums.dto';

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AlbumEntity)
    private albumRepository: Repository<AlbumEntity>,

    @InjectRepository(AssetAlbumEntity)
    private assetAlbumRepository: Repository<AssetAlbumEntity>,

    @InjectRepository(UserAlbumEntity)
    private userAlbumRepository: Repository<UserAlbumEntity>,
  ) {}

  async create(authUser: AuthUserDto, createAlbumDto: CreateAlbumDto) {
    return await getConnection().transaction(async (transactionalEntityManager) => {
      // Create album entity
      const newAlbum = new AlbumEntity();
      newAlbum.ownerId = authUser.id;
      newAlbum.albumName = createAlbumDto.albumName;

      const album = await transactionalEntityManager.save(newAlbum);

      // Add shared users
      for (const sharedUserId of createAlbumDto.sharedWithUserIds) {
        const newSharedUser = new UserAlbumEntity();
        newSharedUser.albumId = album.id;
        newSharedUser.sharedUserId = sharedUserId;

        await transactionalEntityManager.save(newSharedUser);
      }

      // Add shared assets
      const newRecords: AssetAlbumEntity[] = [];

      for (const assetId of createAlbumDto.assetIds) {
        const newAssetAlbum = new AssetAlbumEntity();
        newAssetAlbum.assetId = assetId;
        newAssetAlbum.albumId = album.id;

        newRecords.push(newAssetAlbum);
      }

      if (!album.albumThumbnailAssetId && newRecords.length > 0) {
        album.albumThumbnailAssetId = newRecords[0].assetId;
        await transactionalEntityManager.save(album);
      }

      await transactionalEntityManager.save([...newRecords]);

      return album;
    });
  }

  private async getOwnedAlbums(ownerId: string) {
    return this.albumRepository.find({
      where: { ownerId },
      relations: ['sharedUsers', 'sharedUsers.userInfo'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async getSharedAlbums(sharedWithId: string) {
    const albums = await this.userAlbumRepository.find({
      where: {
        sharedUserId: sharedWithId,
      },
      relations: ['albumInfo', 'albumInfo.sharedUsers', 'albumInfo.sharedUsers.userInfo'],
      select: ['albumInfo'],
    });
    // TODO: do "order by" in query
    return albums
      .map((o) => o.albumInfo)
      .sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());
  }

  /**
   * Get all shared album, including owned and shared one.
   * @param authUser AuthUserDto
   * @returns All Shared Album And Its Members
   */
  async getAllAlbums(authUser: AuthUserDto, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]> {
    const ownerFilter = getAlbumsDto.owner;
    const myAlbums = !ownerFilter || ownerFilter == 'mine' ? await this.getOwnedAlbums(authUser.id) : [];
    const sharedAlbums = !ownerFilter || ownerFilter == 'theirs' ? await this.getSharedAlbums(authUser.id) : [];

    return [...myAlbums, ...sharedAlbums];
  }

  async getAlbumInfo(authUser: AuthUserDto, albumId: string) {
    const albumOwner = await this.albumRepository.findOne({ where: { ownerId: authUser.id } });
    const personShared = await this.userAlbumRepository.findOne({
      where: { albumId: albumId, sharedUserId: authUser.id },
    });

    if (!(albumOwner || personShared)) {
      throw new UnauthorizedException('Unauthorized Album Access');
    }

    const albumInfo = await this.albumRepository.findOne({
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

    return await this.userAlbumRepository.save([...newRecords]);
  }

  async deleteAlbum(authUser: AuthUserDto, albumId: string) {
    return await this.albumRepository.delete({ id: albumId, ownerId: authUser.id });
  }

  async removeUserFromAlbum(authUser: AuthUserDto, albumId: string, userId: string | 'me') {
    const sharedUserId = userId == 'me' ? authUser.id : userId;
    return await this.userAlbumRepository.delete({ albumId: albumId, sharedUserId });
  }

  async removeUsersFromAlbum() {}

  async removeAssetsFromAlbum(authUser: AuthUserDto, removeAssetsDto: RemoveAssetsDto, albumId: string) {
    let deleteAssetCount = 0;
    const album = await this.albumRepository.findOne({ id: albumId });

    if (album.ownerId != authUser.id) {
      throw new BadRequestException("You don't have permission to remove assets in this album");
    }

    for (const assetId of removeAssetsDto.assetIds) {
      const res = await this.assetAlbumRepository.delete({ albumId: albumId, assetId: assetId });
      if (res.affected == 1) deleteAssetCount++;
    }

    return deleteAssetCount == removeAssetsDto.assetIds.length;
  }

  async addAssetsToAlbum(addAssetsDto: AddAssetsDto, albumId: string) {
    const newRecords: AssetAlbumEntity[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      const newAssetAlbum = new AssetAlbumEntity();
      newAssetAlbum.assetId = assetId;
      newAssetAlbum.albumId = albumId;

      newRecords.push(newAssetAlbum);
    }

    // Add album thumbnail if not exist.
    const album = await this.albumRepository.findOne({ id: albumId });

    if (!album.albumThumbnailAssetId && newRecords.length > 0) {
      album.albumThumbnailAssetId = newRecords[0].assetId;
      await this.albumRepository.save(album);
    }

    return await this.assetAlbumRepository.save([...newRecords]);
  }

  async updateAlbumTitle(authUser: AuthUserDto, updateShareAlbumDto: UpdateAlbumDto, albumId: string) {
    if (authUser.id != updateShareAlbumDto.ownerId) {
      throw new BadRequestException('Unauthorized to change album info');
    }

    const album = await this.albumRepository.findOne({ where: { id: albumId } });
    album.albumName = updateShareAlbumDto.albumName;

    return await this.albumRepository.save(album);
  }
}
