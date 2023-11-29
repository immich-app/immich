import { IAccessRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ActivityEntity,
  AlbumEntity,
  AssetEntity,
  LibraryEntity,
  PartnerEntity,
  PersonEntity,
  SharedLinkEntity,
  UserTokenEntity,
} from '../entities';

export class AccessRepository implements IAccessRepository {
  constructor(
    @InjectRepository(ActivityEntity) private activityRepository: Repository<ActivityEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
    @InjectRepository(LibraryEntity) private libraryRepository: Repository<LibraryEntity>,
    @InjectRepository(PartnerEntity) private partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(PersonEntity) private personRepository: Repository<PersonEntity>,
    @InjectRepository(SharedLinkEntity) private sharedLinkRepository: Repository<SharedLinkEntity>,
    @InjectRepository(UserTokenEntity) private tokenRepository: Repository<UserTokenEntity>,
  ) {}

  activity = {
    hasOwnerAccess: (userId: string, activityId: string): Promise<boolean> => {
      return this.activityRepository.exist({
        where: {
          id: activityId,
          userId,
        },
      });
    },
    hasAlbumOwnerAccess: (userId: string, activityId: string): Promise<boolean> => {
      return this.activityRepository.exist({
        where: {
          id: activityId,
          album: {
            ownerId: userId,
          },
        },
      });
    },
    hasCreateAccess: (userId: string, albumId: string): Promise<boolean> => {
      return this.albumRepository.exist({
        where: [
          {
            id: albumId,
            isActivityEnabled: true,
            sharedUsers: {
              id: userId,
            },
          },
          {
            id: albumId,
            isActivityEnabled: true,
            ownerId: userId,
          },
        ],
      });
    },
  };

  library = {
    checkOwnerAccess: async (userId: string, libraryIds: Set<string>): Promise<Set<string>> => {
      if (libraryIds.size === 0) {
        return new Set();
      }

      return this.libraryRepository
        .find({
          select: { id: true },
          where: {
            id: In([...libraryIds]),
            ownerId: userId,
          },
        })
        .then((libraries) => new Set(libraries.map((library) => library.id)));
    },

    checkPartnerAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return this.partnerRepository
        .createQueryBuilder('partner')
        .select('partner.sharedById')
        .where('partner.sharedById IN (:...partnerIds)', { partnerIds: [...partnerIds] })
        .andWhere('partner.sharedWithId = :userId', { userId })
        .getMany()
        .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
    },
  };

  timeline = {
    checkPartnerAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return this.partnerRepository
        .createQueryBuilder('partner')
        .select('partner.sharedById')
        .where('partner.sharedById IN (:...partnerIds)', { partnerIds: [...partnerIds] })
        .andWhere('partner.sharedWithId = :userId', { userId })
        .getMany()
        .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
    },
  };

  asset = {
    hasAlbumAccess: (userId: string, assetId: string): Promise<boolean> => {
      return this.albumRepository.exist({
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
          // still part of a live photo is in an album
          {
            ownerId: userId,
            assets: {
              livePhotoVideoId: assetId,
            },
          },
          {
            sharedUsers: {
              id: userId,
            },
            assets: {
              livePhotoVideoId: assetId,
            },
          },
        ],
      });
    },

    hasOwnerAccess: (userId: string, assetId: string): Promise<boolean> => {
      return this.assetRepository.exist({
        where: {
          id: assetId,
          ownerId: userId,
        },
        withDeleted: true,
      });
    },

    hasPartnerAccess: (userId: string, assetId: string): Promise<boolean> => {
      return this.partnerRepository.exist({
        where: {
          sharedWith: {
            id: userId,
          },
          sharedBy: {
            assets: {
              id: assetId,
            },
          },
        },
        relations: {
          sharedWith: true,
          sharedBy: {
            assets: true,
          },
        },
      });
    },

    hasSharedLinkAccess: async (sharedLinkId: string, assetId: string): Promise<boolean> => {
      return this.sharedLinkRepository.exist({
        where: [
          {
            id: sharedLinkId,
            album: {
              assets: {
                id: assetId,
              },
            },
          },
          {
            id: sharedLinkId,
            assets: {
              id: assetId,
            },
          },
          // still part of a live photo is in a shared link
          {
            id: sharedLinkId,
            album: {
              assets: {
                livePhotoVideoId: assetId,
              },
            },
          },
          {
            id: sharedLinkId,
            assets: {
              livePhotoVideoId: assetId,
            },
          },
        ],
      });
    },
  };

  authDevice = {
    checkOwnerAccess: async (userId: string, deviceIds: Set<string>): Promise<Set<string>> => {
      if (deviceIds.size === 0) {
        return new Set();
      }

      return this.tokenRepository
        .find({
          select: { id: true },
          where: {
            userId,
            id: In([...deviceIds]),
          },
        })
        .then((tokens) => new Set(tokens.map((token) => token.id)));
    },
  };

  album = {
    checkOwnerAccess: async (userId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return this.albumRepository
        .find({
          select: { id: true },
          where: {
            id: In([...albumIds]),
            ownerId: userId,
          },
        })
        .then((albums) => new Set(albums.map((album) => album.id)));
    },

    checkSharedAlbumAccess: async (userId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return this.albumRepository
        .find({
          select: { id: true },
          where: {
            id: In([...albumIds]),
            sharedUsers: {
              id: userId,
            },
          },
        })
        .then((albums) => new Set(albums.map((album) => album.id)));
    },

    checkSharedLinkAccess: async (sharedLinkId: string, albumIds: Set<string>): Promise<Set<string>> => {
      if (albumIds.size === 0) {
        return new Set();
      }

      return this.sharedLinkRepository
        .find({
          select: { albumId: true },
          where: {
            id: sharedLinkId,
            albumId: In([...albumIds]),
          },
        })
        .then(
          (sharedLinks) =>
            new Set(sharedLinks.flatMap((sharedLink) => (!!sharedLink.albumId ? [sharedLink.albumId] : []))),
        );
    },
  };

  person = {
    checkOwnerAccess: async (userId: string, personIds: Set<string>): Promise<Set<string>> => {
      if (personIds.size === 0) {
        return new Set();
      }

      return this.personRepository
        .find({
          select: { id: true },
          where: {
            id: In([...personIds]),
            ownerId: userId,
          },
        })
        .then((persons) => new Set(persons.map((person) => person.id)));
    },
  };

  partner = {
    checkUpdateAccess: async (userId: string, partnerIds: Set<string>): Promise<Set<string>> => {
      if (partnerIds.size === 0) {
        return new Set();
      }

      return this.partnerRepository
        .createQueryBuilder('partner')
        .select('partner.sharedById')
        .where('partner.sharedById IN (:...partnerIds)', { partnerIds: [...partnerIds] })
        .andWhere('partner.sharedWithId = :userId', { userId })
        .getMany()
        .then((partners) => new Set(partners.map((partner) => partner.sharedById)));
    },
  };
}
