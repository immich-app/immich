import { AlbumEntity, AssetAlbumEntity, UserAlbumEntity } from '@app/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder, DataSource, Brackets, Not, IsNull } from 'typeorm';
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
  getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]>;
  getPublicSharingList(ownerId: string): Promise<AlbumEntity[]>;
  get(albumId: string): Promise<AlbumEntity | undefined>;
  delete(album: AlbumEntity): Promise<void>;
  addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity>;
  removeUser(album: AlbumEntity, userId: string): Promise<void>;
  removeAssets(album: AlbumEntity, removeAssets: RemoveAssetsDto): Promise<number>;
  addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto>;
  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity>;
  getListByAssetId(userId: string, assetId: string): Promise<AlbumEntity[]>;
  getCountByUserId(userId: string): Promise<AlbumCountResponseDto>;
  getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number>;
}

export const IAlbumRepository = 'IAlbumRepository';

@Injectable()
export class AlbumRepository implements IAlbumRepository {
  constructor(
    @InjectRepository(AlbumEntity)
    private albumRepository: Repository<AlbumEntity>,

    @InjectRepository(AssetAlbumEntity)
    private assetAlbumRepository: Repository<AssetAlbumEntity>,

    @InjectRepository(UserAlbumEntity)
    private userAlbumRepository: Repository<UserAlbumEntity>,

    private dataSource: DataSource,
  ) {}

  async getPublicSharingList(ownerId: string): Promise<AlbumEntity[]> {
    return this.albumRepository.find({
      relations: {
        sharedLinks: true,
        assets: true,
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

    const sharedAlbums = await this.userAlbumRepository.count({
      where: { sharedUserId: userId },
    });

    let sharedAlbumCount = 0;
    ownedAlbums.map((album) => {
      if (album.sharedUsers?.length) {
        sharedAlbumCount += 1;
      }
    });

    return new AlbumCountResponseDto(ownedAlbums.length, sharedAlbums, sharedAlbumCount);
  }

  async create(ownerId: string, createAlbumDto: CreateAlbumDto): Promise<AlbumEntity> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Create album entity
      const newAlbum = new AlbumEntity();
      newAlbum.ownerId = ownerId;
      newAlbum.albumName = createAlbumDto.albumName;

      const album = await transactionalEntityManager.save(newAlbum);

      // Add shared users
      if (createAlbumDto.sharedWithUserIds?.length) {
        for (const sharedUserId of createAlbumDto.sharedWithUserIds) {
          const newSharedUser = new UserAlbumEntity();
          newSharedUser.albumId = album.id;
          newSharedUser.sharedUserId = sharedUserId;

          await transactionalEntityManager.save(newSharedUser);
        }
      }

      // Add shared assets
      const newRecords: AssetAlbumEntity[] = [];

      if (createAlbumDto.assetIds?.length) {
        for (const assetId of createAlbumDto.assetIds) {
          const newAssetAlbum = new AssetAlbumEntity();
          newAssetAlbum.assetId = assetId;
          newAssetAlbum.albumId = album.id;

          newRecords.push(newAssetAlbum);
        }
      }

      if (!album.albumThumbnailAssetId && newRecords.length > 0) {
        album.albumThumbnailAssetId = newRecords[0].assetId;
        await transactionalEntityManager.save(album);
      }

      await transactionalEntityManager.save([...newRecords]);

      return album;
    });
  }

  async getList(ownerId: string, getAlbumsDto: GetAlbumsDto): Promise<AlbumEntity[]> {
    const filteringByShared = typeof getAlbumsDto.shared == 'boolean';
    const userId = ownerId;
    let query = this.albumRepository.createQueryBuilder('album');

    const getSharedAlbumIdsSubQuery = (qb: SelectQueryBuilder<AlbumEntity>) => {
      return qb
        .subQuery()
        .select('albumSub.id')
        .from(AlbumEntity, 'albumSub')
        .innerJoin('albumSub.sharedUsers', 'userAlbumSub')
        .where('albumSub.ownerId = :ownerId', { ownerId: userId })
        .getQuery();
    };

    if (filteringByShared) {
      if (getAlbumsDto.shared) {
        // shared albums
        query = query
          .innerJoinAndSelect('album.sharedUsers', 'sharedUser')
          .innerJoinAndSelect('sharedUser.userInfo', 'userInfo')
          .where((qb) => {
            // owned and shared with other users
            const subQuery = getSharedAlbumIdsSubQuery(qb);
            return `album.id IN ${subQuery}`;
          })
          .orWhere((qb) => {
            // shared with userId
            const subQuery = qb
              .subQuery()
              .select('userAlbum.albumId')
              .from(UserAlbumEntity, 'userAlbum')
              .where('userAlbum.sharedUserId = :sharedUserId', { sharedUserId: userId })
              .getQuery();
            return `album.id IN ${subQuery}`;
          });
      } else {
        // owned, not shared albums
        query = query.where('album.ownerId = :ownerId', { ownerId: userId }).andWhere((qb) => {
          const subQuery = getSharedAlbumIdsSubQuery(qb);
          return `album.id NOT IN ${subQuery}`;
        });
      }
    } else {
      // owned and shared with userId
      query = query
        .leftJoinAndSelect('album.sharedUsers', 'sharedUser')
        .leftJoinAndSelect('sharedUser.userInfo', 'userInfo')
        .where('album.ownerId = :ownerId', { ownerId: userId });
    }

    // Get information of assets in albums
    query = query
      .leftJoinAndSelect('album.assets', 'assets')
      .leftJoinAndSelect('assets.assetInfo', 'assetInfo')
      .orderBy('"assetInfo"."createdAt"::timestamptz', 'ASC');

    // Get information of shared links in albums
    query = query.leftJoinAndSelect('album.sharedLinks', 'sharedLink');

    const albums = await query.getMany();

    albums.sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf());

    return albums;
  }

  async getListByAssetId(userId: string, assetId: string): Promise<AlbumEntity[]> {
    const query = this.albumRepository.createQueryBuilder('album');

    const albums = await query
      .where('album.ownerId = :ownerId', { ownerId: userId })
      .andWhere((qb) => {
        // shared with userId
        const subQuery = qb
          .subQuery()
          .select('assetAlbum.albumId')
          .from(AssetAlbumEntity, 'assetAlbum')
          .where('assetAlbum.assetId = :assetId', { assetId: assetId })
          .getQuery();
        return `album.id IN ${subQuery}`;
      })
      .leftJoinAndSelect('album.assets', 'assets')
      .leftJoinAndSelect('assets.assetInfo', 'assetInfo')
      .leftJoinAndSelect('album.sharedUsers', 'sharedUser')
      .leftJoinAndSelect('sharedUser.userInfo', 'userInfo')
      .orderBy('"assetInfo"."createdAt"::timestamptz', 'ASC')
      .getMany();

    return albums;
  }

  async get(albumId: string): Promise<AlbumEntity | undefined> {
    const query = this.albumRepository.createQueryBuilder('album');

    const album = await query
      .where('album.id = :albumId', { albumId })
      .leftJoinAndSelect('album.sharedUsers', 'sharedUser')
      .leftJoinAndSelect('sharedUser.userInfo', 'userInfo')
      .leftJoinAndSelect('album.assets', 'assets')
      .leftJoinAndSelect('assets.assetInfo', 'assetInfo')
      .leftJoinAndSelect('assetInfo.exifInfo', 'exifInfo')
      .leftJoinAndSelect('album.sharedLinks', 'sharedLinks')
      .orderBy('"assetInfo"."createdAt"::timestamptz', 'ASC')
      .getOne();

    if (!album) {
      return;
    }

    return album;
  }

  async delete(album: AlbumEntity): Promise<void> {
    await this.albumRepository.delete({ id: album.id, ownerId: album.ownerId });
  }

  async addSharedUsers(album: AlbumEntity, addUsersDto: AddUsersDto): Promise<AlbumEntity> {
    const newRecords: UserAlbumEntity[] = [];

    for (const sharedUserId of addUsersDto.sharedUserIds) {
      const newEntity = new UserAlbumEntity();
      newEntity.albumId = album.id;
      newEntity.sharedUserId = sharedUserId;

      newRecords.push(newEntity);
    }

    await this.userAlbumRepository.save([...newRecords]);
    return this.get(album.id) as Promise<AlbumEntity>; // There is an album for sure
  }

  async removeUser(album: AlbumEntity, userId: string): Promise<void> {
    await this.userAlbumRepository.delete({ albumId: album.id, sharedUserId: userId });
  }

  async removeAssets(album: AlbumEntity, removeAssetsDto: RemoveAssetsDto): Promise<number> {
    const res = await this.assetAlbumRepository.delete({
      albumId: album.id,
      assetId: In(removeAssetsDto.assetIds),
    });

    return res.affected || 0;
  }

  async addAssets(album: AlbumEntity, addAssetsDto: AddAssetsDto): Promise<AddAssetsResponseDto> {
    const newRecords: AssetAlbumEntity[] = [];
    const alreadyExisting: string[] = [];

    for (const assetId of addAssetsDto.assetIds) {
      // Album already contains that asset
      if (album.assets?.some((a) => a.assetId === assetId)) {
        alreadyExisting.push(assetId);
        continue;
      }
      const newAssetAlbum = new AssetAlbumEntity();
      newAssetAlbum.assetId = assetId;
      newAssetAlbum.albumId = album.id;

      newRecords.push(newAssetAlbum);
    }

    // Add album thumbnail if not exist.
    if (!album.albumThumbnailAssetId && newRecords.length > 0) {
      album.albumThumbnailAssetId = newRecords[0].assetId;
      await this.albumRepository.save(album);
    }

    await this.assetAlbumRepository.save([...newRecords]);

    return {
      successfullyAdded: newRecords.length,
      alreadyInAlbum: alreadyExisting,
    };
  }

  updateAlbum(album: AlbumEntity, updateAlbumDto: UpdateAlbumDto): Promise<AlbumEntity> {
    album.albumName = updateAlbumDto.albumName || album.albumName;
    album.albumThumbnailAssetId = updateAlbumDto.albumThumbnailAssetId || album.albumThumbnailAssetId;

    return this.albumRepository.save(album);
  }

  async getSharedWithUserAlbumCount(userId: string, assetId: string): Promise<number> {
    const result = await this.userAlbumRepository
      .createQueryBuilder('usa')
      .select('count(aa)', 'count')
      .innerJoin('asset_album', 'aa', 'aa.albumId = usa.albumId')
      .innerJoin('albums', 'a', 'a.id = usa.albumId')
      .where('aa.assetId = :assetId', { assetId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('a.ownerId = :userId', { userId }).orWhere('usa.sharedUserId = :userId', { userId });
        }),
      )
      .getRawOne();

    return result.count;
  }
}
