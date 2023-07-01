import { AlbumResponseDto, AuthUserDto, mapAlbum } from '@app/domain';
import { AlbumEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IAlbumRepository } from './album-repository';
import { AddAssetsDto } from './dto/add-assets.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

@Injectable()
export class AlbumService {
  private logger = new Logger(AlbumService.name);

  constructor(@Inject(IAlbumRepository) private repository: IAlbumRepository) {}

  private async _getAlbum({
    authUser,
    albumId,
    validateIsOwner = true,
  }: {
    authUser: AuthUserDto;
    albumId: string;
    validateIsOwner?: boolean;
  }): Promise<AlbumEntity> {
    await this.repository.updateThumbnails();

    const album = await this.repository.get(albumId);
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

  async get(authUser: AuthUserDto, albumId: string): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    return mapAlbum(album);
  }

  async removeAssets(authUser: AuthUserDto, albumId: string, dto: RemoveAssetsDto): Promise<AlbumResponseDto> {
    const album = await this._getAlbum({ authUser, albumId });
    const deletedCount = await this.repository.removeAssets(album, dto);
    const newAlbum = await this._getAlbum({ authUser, albumId });

    if (deletedCount !== dto.assetIds.length) {
      throw new BadRequestException('Some assets were not found in the album');
    }

    return mapAlbum(newAlbum);
  }

  async addAssets(authUser: AuthUserDto, albumId: string, dto: AddAssetsDto): Promise<AddAssetsResponseDto> {
    if (authUser.isPublicUser && !authUser.isAllowUpload) {
      this.logger.warn('Deny public user attempt to add asset to album');
      throw new ForbiddenException('Public user is not allowed to upload');
    }

    const album = await this._getAlbum({ authUser, albumId, validateIsOwner: false });
    const result = await this.repository.addAssets(album, dto);
    const newAlbum = await this._getAlbum({ authUser, albumId, validateIsOwner: false });

    return {
      ...result,
      album: mapAlbum(newAlbum),
    };
  }
}
