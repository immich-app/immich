import { AlbumEntity, AssetEntity, dataSource, SharedLinkEntity, UserEntity } from '@app/infra';
import { AlbumResponseDto } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, Brackets } from 'typeorm';
import { AddAssetsDto } from './dto/add-assets.dto';
import { AddUsersDto } from './dto/add-users.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
import { GetAlbumsDto } from './dto/get-albums.dto';
import { RemoveAssetsDto } from './dto/remove-assets.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { AlbumCountResponseDto } from './response-dto/album-count-response.dto';
import { AddAssetsResponseDto } from './response-dto/add-assets-response.dto';

export interface IAlbumRepository {
  create(ownerId: string, createAlbumDto: CreateAlbumDto): Promise<AlbumEntity>;
  getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumResponseDto[]>;
  getPublicSharingList(ownerId: string): Promise<AlbumEntity[]>;
  get(albumId: string): Promise<AlbumEntity | null>;
  delete(album: AlbumEntity): Promise<void>;
  addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity>;
  removeUser(album: AlbumEntity, userId: string): Promise<void>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity>;
  updateThumbnails(): Promise<number | undefined>;
  getCountByUserId(userId: string): Promise<AlbumCountResponseDto>;
  getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number>;
}

export const IAlbumRepository = 'IAlbumRepository';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AlbumEntity)
    private albumRepository: Repository<AlbumEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(SharedLinkEntity)
    private sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  async getPublicSharingList(ownerId: string): Promise<AlbumEntity[]> {
    return this.albumRepository.find({
      relations: {
        sharedLinks: true,
        assets: true,
        owner: true,
      },
      where: {
        ownerId,
        sharedLinks: {
          id: Not(IsNull()),
        },
      },
    });
  }

  async getCountByUserId(userId: string): Promise<AlbumCountResponseDto> {
    const ownedAlbums = await this.albumRepository.find({ where: { ownerId: userId }, relations: ['sharedUsers'] });
    const sharedAlbums = await this.albumRepository.count({ where: { sharedUsers: { id: userId } } });
    const sharedAlbumCount = ownedAlbums.filter((album) => album.sharedUsers?.length > 0).length;

    return new AlbumCountResponseDto(ownedAlbums.length, sharedAlbums, sharedAlbumCount);
  }

  async create(ownerId: string, dto: CreateAlbumDto): Promise<AlbumEntity> {
    const album = await this.albumRepository.save({
      ownerId,
      albumName: dto.albumName,
      sharedUsers: dto.sharedWithUserIds?.map((value) => ({ id: value } as UserEntity)) ?? [],
      assets: dto.assetIds?.map((value) => ({ id: value } as AssetEntity)) ?? [],
      albumThumbnailAssetId: dto.assetIds?.[0] || null,
    });

    // need to re-load the relations
    return this.get(album.id) as Promise<AlbumEntity>;
  }

  async getList(ownerId: string, { shared, assetId }: GetAlbumsDto): Promise<AlbumResponseDto[]> {
    const sharedWithUser = dataSource
      .createQueryBuilder()
      .select('1')
      .from('albums_shared_users_users', 'albums_shared_users')
      .where('"albums_shared_users"."albumsId" = "albums"."id"'); // Reference to albums.id outside this query

    const sharedWithLink = this.sharedLinkRepository
      .createQueryBuilder('sharedLinks')
      .select('1')
      .where('sharedLinks.albumId = "albums"."id"'); // Reference to albums.id outside this query

    const assetCountByAlbum = this.albumRepository
      .createQueryBuilder('albums')
      .select('albums.id', 'albumId')
      .addSelect('COUNT(*)', 'assetCount')
      .leftJoin('albums_assets_assets', 'albums_assets', 'albums_assets.albumsId = albums.id')
      .where('albums.ownerId = :ownerId', { ownerId })
      .groupBy('albums.id');

    /**
     * If assetId is specified, the shared parameter is ignored.
     *
     * `shared` boolean usage
     * true = shared with me, and my albums that are shared
     * false = my albums that are not shared
     * undefined = all my albums
     */
    if (assetId !== undefined) {
      // Only get albums that have this assetId.
      assetCountByAlbum.innerJoin(
        'albums_assets_assets',
        'albums_assets2',
        'albums_assets2.albumsId = albums_assets.albumsId',
      );
      assetCountByAlbum.andWhere('albums_assets.assetsId = :assetId', { assetId });
    } else if (shared === true) {
      // Albums of owner that are either
      // - shared with other users
      // - shared with link
      assetCountByAlbum.where(
        new Brackets((qb) => {
          qb.where('albums.ownerId = :ownerId', { ownerId });
          qb.andWhere(
            new Brackets((qb) => {
              qb.where(`EXISTS (${sharedWithUser.getQuery()})`);
              qb.orWhere(`EXISTS (${sharedWithLink.getQuery()})`);
            }),
          );
        }),
      );

      // Albums of others that are shared with owner.
      assetCountByAlbum.orWhereExists(
        sharedWithUser.clone().andWhere('"albums_shared_users"."usersId" = :ownerId', { ownerId }),
      );
    } else if (shared === false) {
      // Albums of owner that are not shared with users or with a link.
      assetCountByAlbum.andWhere(`NOT EXISTS (${sharedWithUser.getQuery()})`);
      assetCountByAlbum.andWhere(`NOT EXISTS (${sharedWithLink.getQuery()})`);
    }

    const albumQuery = this.albumRepository
      .createQueryBuilder('albums')
      .addSelect('"result"."assetCount"', 'assetCount')
      .innerJoin('(' + assetCountByAlbum.getQuery() + ')', 'result', '"result"."albumId" = albums.id')
      .innerJoinAndSelect('albums.owner', 'owner')
      .leftJoinAndSelect('albums.sharedUsers', 'sharedUsers')
      .leftJoinAndSelect('albums.sharedLinks', 'sharedLinks')
      .setParameters(assetCountByAlbum.getParameters())
      .orderBy('albums.createdAt', 'ASC');

    const albums = await albumQuery.getRawAndEntities();

    // Create object with album ID as key and asset count as value.
    const albumAssetCount = albums.raw.reduce<Record<string, number>>((albumAssetCount, raw) => {
      if (raw.albums_id && raw.assetCount) {
        albumAssetCount[raw.albums_id] = Number(raw.assetCount);
      }
      return albumAssetCount;
    }, {});

    return albums.entities.map((entity) => {
      return {
        ...entity,
        sharedLinks: undefined, // Don't return shared links
        shared: entity.sharedUsers?.length > 0 || entity.sharedLinks?.length > 0,
        assetCount: albumAssetCount[entity.id] || 0,
      } as AlbumResponseDto;
    });
  }

  async get(albumId: string): Promise<AlbumEntity | null> {
    return this.albumRepository.findOne({
      where: { id: albumId },
      relations: {
        owner: true,
        sharedUsers: true,
        assets: {
          exifInfo: true,
        },
        sharedLinks: true,
      },
      order: {
        assets: {
          fileCreatedAt: 'ASC',
        },
      },
    });
  }

  async delete(album: AlbumEntity): Promise<void> {
    await this.albumRepository.delete({ id: album.id, ownerId: album.ownerId });
  }

  async addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity> {
    album.sharedUsers.push(...addUsersDto.sharedUserIds.map((id) => ({ id } as UserEntity)));

    await this.albumRepository.save(album);

    // need to re-load the shared user relation
    return this.get(album.id) as Promise<AlbumEntity>;
  }

  async removeUser(album: AlbumEntity, userId: string): Promise<void> {
    album.sharedUsers = album.sharedUsers.filter((user) => user.id !== userId);
    await this.albumRepository.save(album);
  }

  async removeAssets(album: AlbumEntity, removeAssetsDto: RemoveAssetsDto): Promise<number> {
    const assetCount = album.assets.length;

    album.assets = album.assets.filter((asset) => {
      return !removeAssetsDto.assetIds.includes(asset.id);
    });

    await this.albumRepository.save(album, {});

    return assetCount - album.assets.length;
  }

  async addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto> {
    const alreadyExisting: string[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      // Album already contains that asset
      if (album.assets?.some((a) => a.id === assetId)) {
        alreadyExisting.push(assetId);
        continue;
      }

      album.assets.push({ id: assetId } as AssetEntity);
    }

    // Add album thumbnail if not exist.
    if (!album.albumThumbnailAssetId && album.assets.length > 0) {
      album.albumThumbnailAssetId = album.assets[0].id;
    }

    await this.albumRepository.save(album);

    return {
      successfullyAdded: addAssetsDto.assetIds.length - alreadyExisting.length,
      alreadyInAlbum: alreadyExisting,
    };
  }

  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity> {
    album.albumName = updateAlbumDto.albumName || album.albumName;
    album.albumThumbnailAssetId = updateAlbumDto.albumThumbnailAssetId || album.albumThumbnailAssetId;

    return this.albumRepository.save(album);
  }

  /**
   * Makes sure all thumbnails for albums are updated by:
   * - Removing thumbnails from albums without assets
   * - Removing references of thumbnails to assets outside the album
   * - Setting a thumbnail when none is set and the album contains assets
   *
   * @returns Amount of updated album thumbnails or undefined when unknown
   */
  async updateThumbnails(): Promise<number | undefined> {
    // Subquery for getting a new thumbnail.
    const newThumbnail = this.assetRepository
      .createQueryBuilder('assets')
      .select('albums_assets2.assetsId')
      .addFrom('albums_assets_assets', 'albums_assets2')
      .where('albums_assets2.assetsId = assets.id')
      .andWhere('albums_assets2.albumsId = "albums"."id"') // Reference to albums.id outside this query
      .orderBy('assets.fileCreatedAt', 'DESC')
      .limit(1);

    // Using dataSource, because there is no direct access to albums_assets_assets.
    const albumHasAssets = dataSource
      .createQueryBuilder()
      .select('1')
      .from('albums_assets_assets', 'albums_assets')
      .where('"albums"."id" = "albums_assets"."albumsId"');

    const albumContainsThumbnail = albumHasAssets
      .clone()
      .andWhere('"albums"."albumThumbnailAssetId" = "albums_assets"."assetsId"');

    const updateAlbums = this.albumRepository
      .createQueryBuilder('albums')
      .update(AlbumEntity)
      .set({ albumThumbnailAssetId: () => `(${newThumbnail.getQuery()})` })
      .where(`"albums"."albumThumbnailAssetId" IS NULL AND EXISTS (${albumHasAssets.getQuery()})`)
      .orWhere(`"albums"."albumThumbnailAssetId" IS NOT NULL AND NOT EXISTS (${albumContainsThumbnail.getQuery()})`);

    const result = await updateAlbums.execute();

    return result.affected;
  }

  async getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number> {
    return this.albumRepository.count({
      where: [
        {
          ownerId: userId,
          assets: {
            id: assetId,
          },
        },
        {
          sharedUsers: {
            id: userId,
          },
          assets: {
            id: assetId,
          },
        },
      ],
    });
  }
}
