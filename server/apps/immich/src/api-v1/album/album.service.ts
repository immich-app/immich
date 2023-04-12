import { BadRequestException, Inject, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { AuthUserDto } from '../../decorators/auth-user.decorator';
import { CreateAlbumDto } from './dto/create-album.dto';
import { AlbumEntity, SharedLinkType } from '@app/infra/entities';
import { AddUsersDto } from './dto/add-users.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AlbumResponseDto, IJobRepository, JobName, mapAlbum } from '@app/domain';
import { IAlbumRepository } from './album-repository';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';
import { AddAssetsDto } from './dto/add-assets.dto';
import { DownloadService } from '../../modules/download/download.service';
import { DownloadDto } from '../asset/dto/download-library.dto';
import { ShareCore, ISharedLinkRepository, mapSharedLink, SharedLinkResponseDto, ICryptoRepository } from '@app/domain';
import { CreateAlbumShareLinkDto } from './dto/create-album-shared-link.dto';

@Injectable()
export class AlbumService {
  readonly logger = new Logger(AlbumService.name);
  private shareCore: ShareCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(ISharedLinkRepository) sharedLinkRepository: ISharedLinkRepository,
    private downloadService: DownloadService,
    @Inject(ICryptoRepository) cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.shareCore = new ShareCore(sharedLinkRepository, cryptoRepository);
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
    await this.albumRepository.updateThumbnails();

    const album = await this.albumRepository.get(albumId);
    if (!album) {
      throw new NotFoundException('Album Not Found');
    }
    const isOwner = album.ownerId == authUser.id;

    if (validateIsOwner && !isOwner) {
      throw new ForbiddenException('Unauthorized Album Access');
    } else if (!isOwner && !album.sharedUsers?.some((user) => user.id == authUser.id)) {
      throw new ForbiddenException('Unauthorized Album Access');
    }
    return album;
  }

  async create(authUser: AuthUserDto, createAlbumDto: CreateAlbumDto): Promise<AlbumResponseDto> {
    const albumEntity = await this.albumRepository.create(authUser.id, createAlbumDto);
    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [albumEntity.id] } });
    return mapAlbum(albumEntity);
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
    await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ALBUM, data: { ids: [albumId] } });
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

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [updatedAlbum.id] } });

    return mapAlbum(updatedAlbum);
  }

  async getAlbumCountByUserId(authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    return this.albumRepository.getCountByUserId(authUser.id);
  }

  async downloadArchive(authUser: AuthUserDto, albumId: string, dto: DownloadDto) {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const assets = (album.assets || []).map((asset) => asset).slice(dto.skip || 0);

    return this.downloadService.downloadArchive(album.albumName, assets);
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
