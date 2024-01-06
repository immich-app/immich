import { IAccessRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { chunks, setUnion } from '../../domain/domain.util';
import {
  ActivityEntity,
  AlbumEntity,
  AssetEntity,
  AssetFaceEntity,
  LibraryEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  UserTokenEntity,
} from '../entities';
import { DATABASE_PARAMETER_CHUNK_SIZE } from '../infra.util';

export class AccessRepository implements IAccessRepository {
  constructor(
    @InjectRepository(ActivityEntity) private activityRepository: Repository<ActivityEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
    @InjectRepository(LibraryEntity) private libraryRepository: Repository<LibraryEntity>,
    @InjectRepository(PartnerEntity) private partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(SharedLinkEntity) private sharedLinkRepository: Repository<SharedLinkEntity>,
    @InjectRepository(UserTokenEntity) private tokenRepository: Repository<UserTokenEntity>,
  ) {}

  activity = {
    checkOwnerAccess: async (userId: string, activityIds: Set<string>): Promise<Set<string>> => {
      if (activityIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(activityIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.activityRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                userId,
              },
            })
            .then((activities) => new Set(activities.map((activity) => activity.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkAlbumOwnerAccess: async (userId: string, activityIds: Set<string>): Promise<Set<string>> => {
      if (activityIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(activityIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.activityRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                album: {
                  ownerId: userId,
                },
              },
            })
            .then((activities) => new Set(activities.map((activity) => activity.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkCreateAccess: async (userId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.albumRepository
            .createQueryBuilder('album')
            .select('album.id')
            .leftJoin('album.sharedUsers', 'sharedUsers')
            .where('album.id IN (:...albumIds)', { albumIds: idChunk })
            .andWhere('album.isActivityEnabled = true')
            .andWhere(
              new Brackets((qb) => {
                qb.where('album.ownerId = :userId', { userId }).orWhere('sharedUsers.id = :userId', { userId });
              }),
            )
            .getMany()
            .then((albums) => new Set(albums.map((album) => album.id))),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  library = {
    checkOwnerAccess: async (userId: string, libraryIds: Set<string>): Promise<Set<string>> => {
      if (libraryIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(libraryIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.libraryRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                ownerId: userId,
              },
            })
            .then((libraries) => new Set(libraries.map((library) => library.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkPartnerAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.partnerRepository
            .createQueryBuilder('partner')
            .select('partner.sharedById')
            .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
            .andWhere('partner.sharedWithId = :userId', { userId })
            .getMany()
            .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  timeline = {
    checkPartnerAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.partnerRepository
            .createQueryBuilder('partner')
            .select('partner.sharedById')
            .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
            .andWhere('partner.sharedWithId = :userId', { userId })
            .getMany()
            .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  asset = {
    checkAlbumAccess: async (userId: string, assetIds: Set<string>): Promise<Set<string>> => {
      if (assetIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.albumRepository
            .createQueryBuilder('album')
            .innerJoin('album.assets', 'asset')
            .leftJoin('album.sharedUsers', 'sharedUsers')
            .select('asset.id', 'assetId')
            .addSelect('asset.livePhotoVideoId', 'livePhotoVideoId')
            .where('array["asset"."id", "asset"."livePhotoVideoId"] && array[:...assetIds]::uuid[]', {
              assetIds: idChunk,
            })
            .andWhere(
              new Brackets((qb) => {
                qb.where('album.ownerId = :userId', { userId }).orWhere('sharedUsers.id = :userId', { userId });
              }),
            )
            .getRawMany()
            .then((rows) => {
              const allowedIds = new Set<string>();
              for (const row of rows) {
                if (row.assetId && assetIds.has(row.assetId)) {
                  allowedIds.add(row.assetId);
                }
                if (row.livePhotoVideoId && assetIds.has(row.livePhotoVideoId)) {
                  allowedIds.add(row.livePhotoVideoId);
                }
              }
              return allowedIds;
            }),
        ),
      ).then((results) => setUnion(...results));
    },

    checkOwnerAccess: async (userId: string, assetIds: Set<string>): Promise<Set<string>> => {
      if (assetIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.assetRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                ownerId: userId,
              },
              withDeleted: true,
            })
            .then((assets) => new Set(assets.map((asset) => asset.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkPartnerAccess: async (userId: string, assetIds: Set<string>): Promise<Set<string>> => {
      if (assetIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.partnerRepository
            .createQueryBuilder('partner')
            .innerJoin('partner.sharedBy', 'sharedBy')
            .innerJoin('sharedBy.assets', 'asset')
            .select('asset.id', 'assetId')
            .where('partner.sharedWithId = :userId', { userId })
            .andWhere('asset.id IN (:...assetIds)', { assetIds: idChunk })
            .getRawMany()
            .then((rows) => new Set(rows.map((row) => row.assetId))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkSharedLinkAccess: async (sharedLinkId: string, assetIds: Set<string>): Promise<Set<string>> => {
      if (assetIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(assetIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.sharedLinkRepository
            .createQueryBuilder('sharedLink')
            .leftJoin('sharedLink.album', 'album')
            .leftJoin('sharedLink.assets', 'assets')
            .leftJoin('album.assets', 'albumAssets')
            .select('assets.id', 'assetId')
            .addSelect('albumAssets.id', 'albumAssetId')
            .addSelect('assets.livePhotoVideoId', 'assetLivePhotoVideoId')
            .addSelect('albumAssets.livePhotoVideoId', 'albumAssetLivePhotoVideoId')
            .where('sharedLink.id = :sharedLinkId', { sharedLinkId })
            .andWhere(
              'array["assets"."id", "assets"."livePhotoVideoId", "albumAssets"."id", "albumAssets"."livePhotoVideoId"] && array[:...assetIds]::uuid[]',
              {
                assetIds: idChunk,
              },
            )
            .getRawMany()
            .then((rows) => {
              const allowedIds = new Set<string>();
              for (const row of rows) {
                if (row.assetId && assetIds.has(row.assetId)) {
                  allowedIds.add(row.assetId);
                }
                if (row.assetLivePhotoVideoId && assetIds.has(row.assetLivePhotoVideoId)) {
                  allowedIds.add(row.assetLivePhotoVideoId);
                }
                if (row.albumAssetId && assetIds.has(row.albumAssetId)) {
                  allowedIds.add(row.albumAssetId);
                }
                if (row.albumAssetLivePhotoVideoId && assetIds.has(row.albumAssetLivePhotoVideoId)) {
                  allowedIds.add(row.albumAssetLivePhotoVideoId);
                }
              }
              return allowedIds;
            }),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  authDevice = {
    checkOwnerAccess: async (userId: string, deviceIds: Set<string>): Promise<Set<string>> => {
      if (deviceIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(deviceIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.tokenRepository
            .find({
              select: { id: true },
              where: {
                userId,
                id: In(idChunk),
              },
            })
            .then((tokens) => new Set(tokens.map((token) => token.id))),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  album = {
    checkOwnerAccess: async (userId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.albumRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                ownerId: userId,
              },
            })
            .then((albums) => new Set(albums.map((album) => album.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkSharedAlbumAccess: async (userId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.albumRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                sharedUsers: {
                  id: userId,
                },
              },
            })
            .then((albums) => new Set(albums.map((album) => album.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkSharedLinkAccess: async (sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(albumIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.sharedLinkRepository
            .find({
              select: { albumId: true },
              where: {
                id: sharedLinkId,
                albumId: In(idChunk),
              },
            })
            .then(
              (sharedLinks) =>
                new Set(sharedLinks.flatMap((sharedLink) => (!!sharedLink.albumId ? [sharedLink.albumId] : []))),
            ),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  person = {
    checkOwnerAccess: async (userId: string, personIds: Set<string>): Promise<Set<string>> => {
      if (personIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(personIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.personRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                ownerId: userId,
              },
            })
            .then((persons) => new Set(persons.map((person) => person.id))),
        ),
      ).then((results) => setUnion(...results));
    },

    checkFaceOwnerAccess: async (userId: string, assetFaceIds: Set<string>): Promise<Set<string>> => {
      if (assetFaceIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(assetFaceIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.assetFaceRepository
            .find({
              select: { id: true },
              where: {
                id: In(idChunk),
                asset: {
                  ownerId: userId,
                },
              },
            })
            .then((faces) => new Set(faces.map((face) => face.id))),
        ),
      ).then((results) => setUnion(...results));
    },
  };

  partner = {
    checkUpdateAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return Promise.all(
        chunks(partnerIds, DATABASE_PARAMETER_CHUNK_SIZE).map((idChunk) =>
          this.partnerRepository
            .createQueryBuilder('partner')
            .select('partner.sharedById')
            .where('partner.sharedById IN (:...partnerIds)', { partnerIds: idChunk })
            .andWhere('partner.sharedWithId = :userId', { userId })
            .getMany()
            .then((partners) => new Set(partners.map((partner) => partner.sharedById))),
        ),
      ).then((results) => setUnion(...results));
    },
  };
}
