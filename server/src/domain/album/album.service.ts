import { AlbumEntity, AssetEntity, UserEntity } from '@app/infra/entities';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { IAssetRepository, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { IJobRepository, JobName } from '../job';
import { IUserRepository } from '../user';
import { AlbumCountResponseDto, AlbumResponseDto, mapAlbum } from './album-response.dto';
import { IAlbumRepository } from './album.repository';
import { AddUsersDto, CreateAlbumDto, GetAlbumsDto, UpdateAlbumDto } from './dto';

@Injectable()
export class AlbumService {
  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {}

  async getCount(authUser: AuthUserDto): Promise<AlbumCountResponseDto> {
    const [owned, shared, notShared] = await Promise.all([
      this.albumRepository.getOwned(authUser.id),
      this.albumRepository.getShared(authUser.id),
      this.albumRepository.getNotShared(authUser.id),
    ]);

    return {
      owned: owned.length,
      shared: shared.length,
      notShared: notShared.length,
    };
  }

  async getAll({ id: ownerId }: AuthUserDto, { assetId, shared }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
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
        assets: album?.assets?.map(mapAsset),
        sharedLinks: undefined, // Don't return shared links
        shared: album.sharedLinks?.length > 0 || album.sharedUsers?.length > 0,
        assetCount: albumsAssetCountObj[album.id],
      } as AlbumResponseDto;
    });
  }

  private async updateInvalidThumbnails(): Promise<number> {
    const invalidAlbumIds = await this.albumRepository.getInvalidThumbnail();

    for (const albumId of invalidAlbumIds) {
      const newThumbnail = await this.assetRepository.getFirstAssetForAlbumId(albumId);
      await this.albumRepository.update({ id: albumId, albumThumbnailAsset: newThumbnail });
    }

    return invalidAlbumIds.length;
  }

  async create(authUser: AuthUserDto, dto: CreateAlbumDto): Promise<AlbumResponseDto> {
    for (const userId of dto.sharedWithUserIds || []) {
      const exists = await this.userRepository.get(userId);
      if (!exists) {
        throw new BadRequestException('User not found');
      }
    }

    const album = await this.albumRepository.create({
      ownerId: authUser.id,
      albumName: dto.albumName,
      sharedUsers: dto.sharedWithUserIds?.map((value) => ({ id: value } as UserEntity)) ?? [],
      assets: (dto.assetIds || []).map((id) => ({ id } as AssetEntity)),
      albumThumbnailAssetId: dto.assetIds?.[0] || null,
    });

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [album.id] } });
    return mapAlbum(album);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateAlbumDto): Promise<AlbumResponseDto> {
    const album = await this.get(id);
    this.assertOwner(authUser, album);

    if (dto.albumThumbnailAssetId) {
      const valid = await this.albumRepository.hasAsset(id, dto.albumThumbnailAssetId);
      if (!valid) {
        throw new BadRequestException('Invalid album thumbnail');
      }
    }

    const updatedAlbum = await this.albumRepository.update({
      id: album.id,
      albumName: dto.albumName,
      albumThumbnailAssetId: dto.albumThumbnailAssetId,
    });

    await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ALBUM, data: { ids: [updatedAlbum.id] } });

    return mapAlbum(updatedAlbum);
  }

  async delete(authUser: AuthUserDto, id: string): Promise<void> {
    const [album] = await this.albumRepository.getByIds([id]);
    if (!album) {
      throw new BadRequestException('Album not found');
    }

    if (album.ownerId !== authUser.id) {
      throw new ForbiddenException('Album not owned by user');
    }

    await this.albumRepository.delete(album);
    await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ALBUM, data: { ids: [id] } });
  }

  async addUsers(authUser: AuthUserDto, id: string, dto: AddUsersDto) {
    const album = await this.get(id);
    this.assertOwner(authUser, album);

    for (const userId of dto.sharedUserIds) {
      const exists = album.sharedUsers.find((user) => user.id === userId);
      if (exists) {
        throw new BadRequestException('User already added');
      }

      const user = await this.userRepository.get(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      album.sharedUsers.push({ id: userId } as UserEntity);
    }

    return this.albumRepository
      .update({
        id: album.id,
        updatedAt: new Date(),
        sharedUsers: album.sharedUsers,
      })
      .then(mapAlbum);
  }

  async removeUser(authUser: AuthUserDto, id: string, userId: string | 'me'): Promise<void> {
    if (userId === 'me') {
      userId = authUser.id;
    }

    const album = await this.get(id);

    if (album.ownerId === userId) {
      throw new BadRequestException('Cannot remove album owner');
    }

    const exists = album.sharedUsers.find((user) => user.id === userId);
    if (!exists) {
      throw new BadRequestException('Album not shared with user');
    }

    // non-admin can remove themselves
    if (authUser.id !== userId) {
      this.assertOwner(authUser, album);
    }

    await this.albumRepository.update({
      id: album.id,
      updatedAt: new Date(),
      sharedUsers: album.sharedUsers.filter((user) => user.id !== userId),
    });
  }

  private async get(id: string) {
    const [album] = await this.albumRepository.getByIds([id]);
    if (!album) {
      throw new BadRequestException('Album not found');
    }
    return album;
  }

  private assertOwner(authUser: AuthUserDto, album: AlbumEntity) {
    if (album.ownerId !== authUser.id) {
      throw new ForbiddenException('Album not owned by user');
    }
  }
}
