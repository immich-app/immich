import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { AddAssetsDto } from './dto/add-assets.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumEntity } from '../../../../../libs/database/src/entities/album.entity';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { GetAlbumsDto } from './dto/get-albums.dto';
import { Album, mapAlbum } from './response-dto/album';
import { ALBUM_REPOSITORY, IAlbumRepository } from './album-repository';

@Injectable()
export class AlbumService {
  constructor(@Inject(ALBUM_REPOSITORY) private _albumRepository: IAlbumRepository) {}

  private async _getAlbum({
    authUser,
    albumId,
    validateIsOwner = true,
  }: {
    authUser: AuthUserDto;
    albumId: string;
    validateIsOwner?: boolean;
  }): Promise<AlbumEntity> {
    const album = await this._albumRepository.get(albumId);
    if (!album) {
      throw new NotFoundException('Album Not Found');
    }
    const isOwner = album.ownerId == authUser.id;

    if (validateIsOwner && !isOwner) {
      throw new UnauthorizedException('Unauthorized Album Access');
    } else if (!isOwner && !album.sharedUsers.some((user) => user.sharedUserId == authUser.id)) {
      throw new UnauthorizedException('Unauthorized Album Access');
    }
    return album;
  }

  async create(authUser: AuthUserDto, createAlbumDto: CreateAlbumDto): Promise<Album> {
    const albumEntity = await this._albumRepository.create(authUser.id, createAlbumDto);
    return mapAlbum(albumEntity);
  }

  /**
   * Get all shared album, including owned and shared one.
   * @param authUser AuthUserDto
   * @returns All Shared Album And Its Members
   */
  async getAllAlbums(authUser: AuthUserDto, getAlbumsDto: GetAlbumsDto): Promise<Album[]> {
    const albums = await this._albumRepository.getList(authUser.id, getAlbumsDto);
    return albums.map((album) => mapAlbum(album));
  }

  async getAlbumInfo(authUser: AuthUserDto, albumId: string): Promise<Album> {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    return mapAlbum(album);
  }

  async addUsersToAlbum(authUser: AuthUserDto, addUsersDto: AddUsersDto, albumId: string): Promise<Album> {
    const album = await this._getAlbum({ authUser, albumId });
    const updatedAlbum = await this._albumRepository.addSharedUsers(album, addUsersDto);
    return mapAlbum(updatedAlbum);
  }

  async deleteAlbum(authUser: AuthUserDto, albumId: string): Promise<void> {
    const album = await this._getAlbum({ authUser, albumId });
    await this._albumRepository.delete(album);
  }

  async removeUserFromAlbum(authUser: AuthUserDto, albumId: string, userId: string | 'me'): Promise<void> {
    const sharedUserId = userId == 'me' ? authUser.id : userId;
    const album = await this._getAlbum({ authUser, albumId });
    await this._albumRepository.removeUser(album, sharedUserId);
  }

  // async removeUsersFromAlbum() {}

  async removeAssetsFromAlbum(
    authUser: AuthUserDto,
    removeAssetsDto: RemoveAssetsDto,
    albumId: string,
  ): Promise<boolean> {
    const album = await this._getAlbum({ authUser, albumId });
    return this._albumRepository.removeAssets(album, removeAssetsDto);
  }

  async addAssetsToAlbum(authUser: AuthUserDto, addAssetsDto: AddAssetsDto, albumId: string) {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    return this._albumRepository.addAssets(album, addAssetsDto);
  }

  async updateAlbumTitle(authUser: AuthUserDto, updateAlbumDto: UpdateAlbumDto, albumId: string): Promise<Album> {
    // TODO: this should not come from request DTO. To be removed from here and DTO
    // if (authUser.id != updateAlbumDto.ownerId) {
    //   throw new BadRequestException('Unauthorized to change album info');
    // }
    const album = await this._getAlbum({ authUser, albumId });
    const updatedAlbum = await this._albumRepository.updateAlbum(album, updateAlbumDto);
    return mapAlbum(updatedAlbum);
  }
}
