import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumEntity } from '@app/database/entities/album.entity';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { GetAlbumsDto } from './dto/get-albums.dto';
import { AlbumResponseDto, mapAlbum, mapAlbumExcludeAssetInfo } from './response-dto/album-response.dto';
import { ALBUM_REPOSITORY, IAlbumRepository } from './album-repository';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { ASSET_REPOSITORY, IAssetRepository } from '../asset/asset-repository';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';
import { AddAssetsDto } from './dto/add-assets.dto';
import { DownloadService } from '../../modules/download/download.service';
import { DownloadDto } from '../asset/dto/download-library.dto';

@Injectable()
export class AlbumService {
  constructor(
    @Inject(ALBUM_REPOSITORY) private _albumRepository: IAlbumRepository,
    @Inject(ASSET_REPOSITORY) private _assetRepository: IAssetRepository,
    private downloadService: DownloadService,
  ) {}

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
      throw new ForbiddenException('Unauthorized Album Access');
    } else if (!isOwner && !album.sharedUsers?.some((user) => user.sharedUserId == authUser.id)) {
      throw new ForbiddenException('Unauthorized Album Access');
    }
    return album;
  }

  async create(authUser: AuthUserDto, createAlbumDto: CreateAlbumDto): Promise<AlbumResponseDto> {
    const albumEntity = await this._albumRepository.create(authUser.id, createAlbumDto);
    return mapAlbum(albumEntity);
  }

  /**
   * Get all shared album, including owned and shared one.
   * @param authUser AuthUserDto
   * @returns All Shared Album And Its Members
   */
  async getAllAlbums(authUser: AuthUserDto, getAlbumsDto: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    let albums: AlbumEntity[];

    if (typeof getAlbumsDto.assetId === 'string') {
      albums = await this._albumRepository.getListByAssetId(authUser.id, getAlbumsDto.assetId);
    } else {
      albums = await this._albumRepository.getList(authUser.id, getAlbumsDto);
    }

    for (const album of albums) {
      await this._checkValidThumbnail(album);
    }

    return albums.map((album) => mapAlbumExcludeAssetInfo(album));
  }

  async getAlbumInfo(authUser: AuthUserDto, albumId: string): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    return mapAlbum(album);
  }

  async addUsersToAlbum(authUser: AuthUserDto, addUsersDto: AddUsersDto, albumId: string): Promise<AlbumResponseDto> {
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
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    if (album.ownerId != authUser.id && authUser.id != sharedUserId) {
      throw new ForbiddenException('Cannot remove a user from a album that is not owned');
    }
    if (album.ownerId == sharedUserId) {
      throw new BadRequestException('The owner of the album cannot be removed');
    }
    await this._albumRepository.removeUser(album, sharedUserId);
  }

  async removeAssetsFromAlbum(
    authUser: AuthUserDto,
    removeAssetsDto: RemoveAssetsDto,
    albumId: string,
  ): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId });
    const deletedCount = await this._albumRepository.removeAssets(album, removeAssetsDto);
    const newAlbum = await this._getAlbum({ authUser, albumId });

    if (newAlbum) {
      await this._checkValidThumbnail(newAlbum);
    }

    if (deletedCount !== removeAssetsDto.assetIds.length) {
      throw new BadRequestException('Some assets were not found in the album');
    }

    return mapAlbum(newAlbum);
  }

  async addAssetsToAlbum(
    authUser: AuthUserDto,
    addAssetsDto: AddAssetsDto,
    albumId: string,
  ): Promise<AddAssetsResponseDto> {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const result = await this._albumRepository.addAssets(album, addAssetsDto);
    const newAlbum = await this._getAlbum({ authUser, albumId, validateIsOwner: false });

    return {
      ...result,
      album: mapAlbum(newAlbum),
    };
  }

  async updateAlbumInfo(
    authUser: AuthUserDto,
    updateAlbumDto: UpdateAlbumDto,
    albumId: string,
  ): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId });

    if (authUser.id != album.ownerId) {
      throw new BadRequestException('Unauthorized to change album info');
    }

    const updatedAlbum = await this._albumRepository.updateAlbum(album, updateAlbumDto);
    return mapAlbum(updatedAlbum);
  }

  async getAlbumCountByUserId(authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this._albumRepository.getCountByUserId(authUser.id);
  }

  async downloadArchive(authUser: AuthUserDto, albumId: string, dto: DownloadDto) {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const assets = (album.assets || []).map((asset) => asset.assetInfo).slice(dto.skip || 0);

    return this.downloadService.downloadArchive(album.albumName, assets);
  }

  async _checkValidThumbnail(album: AlbumEntity) {
    const assets = album.assets || [];
    const valid = assets.some((asset) => asset.assetId === album.albumThumbnailAssetId);
    if (!valid) {
      let dto: UpdateAlbumDto = {};
      if (assets.length > 0) {
        const albumThumbnailAssetId = assets[0].assetId;
        dto = { albumThumbnailAssetId };
      }
      await this._albumRepository.updateAlbum(album, dto);
      album.albumThumbnailAssetId = dto.albumThumbnailAssetId || null;
    }
  }
}
