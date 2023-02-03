import { AlbumEntity, SharedLinkType, SystemConfig } from '@app/infra/db/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import _ from 'lodash';
import { DownloadDto, IAssetRepository } from '../asset';
import { AssetCore } from '../asset/asset.core';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { IJobRepository } from '../job';
import { ISharedLinkRepository, mapSharedLink, ShareCore, SharedLinkResponseDto } from '../share';
import { INITIAL_SYSTEM_CONFIG, ISystemConfigRepository } from '../system-config';
import { IAlbumRepository } from './album.repository';
import {
  AddAssetsDto,
  AddUsersDto,
  CreateAlbumDto,
  CreateAlbumShareLinkDto,
  GetAlbumsDto,
  RemoveAssetsDto,
  UpdateAlbumDto,
} from './dto';
import {
  AddAssetsResponseDto,
  AlbumCountResponseDto,
  AlbumResponseDto,
  mapAlbum,
  mapAlbumExcludeAssetInfo,
} from './response-dto';

@Injectable()
export class AlbumService {
  readonly logger = new Logger(AlbumService.name);
  private assetCore: AssetCore;
  private shareCore: ShareCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(ISharedLinkRepository) sharedRepository: ISharedLinkRepository,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) jobRepository: IJobRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(INITIAL_SYSTEM_CONFIG) config: SystemConfig,
  ) {
    this.shareCore = new ShareCore(sharedRepository, cryptoRepository);
    this.assetCore = new AssetCore(assetRepository, jobRepository, configRepository, config);
  }

  private async _getAlbum({
    authUser,
    albumId,
    validateIsOwner = true,
  }: {
    authUser: AuthUserDto;
    albumId: string;
    validateIsOwner?: boolean;
  }): Promise<AlbumEntity> {
    const album = await this.albumRepository.get(albumId);
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
    const albumEntity = await this.albumRepository.create(authUser.id, createAlbumDto);
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
      albums = await this.albumRepository.getListByAssetId(authUser.id, getAlbumsDto.assetId);
    } else {
      albums = await this.albumRepository.getList(authUser.id, getAlbumsDto);
      if (getAlbumsDto.shared) {
        const publicSharingAlbums = await this.albumRepository.getPublicSharingList(authUser.id);
        albums = [...albums, ...publicSharingAlbums];
      }
    }

    albums = _.uniqBy(albums, (album) => album.id);

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
    const updatedAlbum = await this.albumRepository.addSharedUsers(album, addUsersDto);
    return mapAlbum(updatedAlbum);
  }

  async deleteAlbum(authUser: AuthUserDto, albumId: string): Promise<void> {
    const album = await this._getAlbum({ authUser, albumId });

    for (const sharedLink of album.sharedLinks) {
      await this.shareCore.remove(authUser.id, sharedLink.id);
    }

    await this.albumRepository.delete(album);
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
    await this.albumRepository.removeUser(album, sharedUserId);
  }

  async removeAssetsFromAlbum(
    authUser: AuthUserDto,
    removeAssetsDto: RemoveAssetsDto,
    albumId: string,
  ): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId });
    const deletedCount = await this.albumRepository.removeAssets(album, removeAssetsDto);
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
    if (authUser.isPublicUser && !authUser.isAllowUpload) {
      this.logger.warn('Deny public user attempt to add asset to album');
      throw new ForbiddenException('Public user is not allowed to upload');
    }

    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const result = await this.albumRepository.addAssets(album, addAssetsDto);
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

    const updatedAlbum = await this.albumRepository.updateAlbum(album, updateAlbumDto);
    return mapAlbum(updatedAlbum);
  }

  async getAlbumCountByUserId(authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.albumRepository.getCountByUserId(authUser.id);
  }

  async downloadArchive(authUser: AuthUserDto, albumId: string, dto: DownloadDto) {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const assets = (album.assets || []).map((asset) => asset.assetInfo).slice(dto.skip || 0);

    return this.assetCore.downloadArchive(album.albumName, assets);
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
      await this.albumRepository.updateAlbum(album, dto);
      album.albumThumbnailAssetId = dto.albumThumbnailAssetId || null;
    }
  }

  async createAlbumSharedLink(authUser: AuthUserDto, dto: CreateAlbumShareLinkDto): Promise<SharedLinkResponseDto> {
    const album = await this._getAlbum({ authUser, albumId: dto.albumId });

    const sharedLink = await this.shareCore.create(authUser.id, {
      type: SharedLinkType.ALBUM,
      expiresAt: dto.expiresAt,
      allowUpload: dto.allowUpload,
      album,
      assets: [],
      description: dto.description,
      allowDownload: dto.allowDownload,
      showExif: dto.showExif,
    });

    return mapSharedLink(sharedLink);
  }

  checkDownloadAccess(authUser: AuthUserDto) {
    this.shareCore.checkDownloadAccess(authUser);
  }
}
