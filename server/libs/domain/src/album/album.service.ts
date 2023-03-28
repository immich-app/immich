import { AlbumEntity } from '@app/infra/db/entities';
import { Inject, Injectable } from '@nestjs/common';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { IAlbumRepository } from './album.repository';
import { GetAlbumsDto } from './dto/get-albums.dto';
import { AlbumResponseDto } from './response-dto';

@Injectable()
export class AlbumService {
  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
  ) {}

  async getAllAlbums({ id: ownerId }: AuthUserDto, { assetId, shared }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    await this.updateInvalidThumbnails();

    let albums: AlbumEntity[];
    if (assetId) {
      albums = await this.albumRepository.getByAssetId(ownerId, assetId);
    } else if (shared === true) {
      albums = await this.albumRepository.getShared(ownerId);
    } else if (shared === false) {
      albums = await this.albumRepository.getNotShared(ownerId);
    } else {
      albums = await this.albumRepository.getOwned(ownerId);
    }

    // Get asset count for each album. Then map the result to an object:
    // { [albumId]: assetCount }
    const albumsAssetCount = await this.albumRepository.getAssetCountForIds(albums.map((album) => album.id));
    const albumsAssetCountObj = albumsAssetCount.reduce((obj: Record<string, number>, { albumId, assetCount }) => {
      obj[albumId] = assetCount;
      return obj;
    }, {});

    return albums.map((album) => {
      return {
        ...album,
        sharedLinks: undefined, // Don't return shared links
        shared: album.sharedLinks?.length > 0 || album.sharedUsers?.length > 0,
        assetCount: albumsAssetCountObj[album.id],
      } as AlbumResponseDto;
    });
  }

  async updateInvalidThumbnails(): Promise<number> {
    const invalidAlbumIds = await this.albumRepository.getInvalidThumbnail();

    for (const albumId of invalidAlbumIds) {
      const newThumbnail = await this.assetRepository.getFirstAssetForAlbumId(albumId);
      await this.albumRepository.save({ id: albumId, albumThumbnailAsset: newThumbnail });
    }

    return invalidAlbumIds.length;
  }
}
