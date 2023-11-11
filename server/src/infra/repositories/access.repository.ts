import { IAccessRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    hasOwnerAccess: (userId: string, libraryId: string): Promise<boolean> => {
      return this.libraryRepository.exist({
        where: {
          id: libraryId,
          ownerId: userId,
        },
      });
    },
    hasPartnerAccess: (userId: string, partnerId: string): Promise<boolean> => {
      return this.partnerRepository.exist({
        where: {
          sharedWithId: userId,
          sharedById: partnerId,
        },
      });
    },
  };

  timeline = {
    hasPartnerAccess: (userId: string, partnerId: string): Promise<boolean> => {
      return this.partnerRepository.exist({
        where: {
          sharedWithId: userId,
          sharedById: partnerId,
        },
      });
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
    hasOwnerAccess: (userId: string, deviceId: string): Promise<boolean> => {
      return this.tokenRepository.exist({
        where: {
          userId,
          id: deviceId,
        },
      });
    },
  };

  album = {
    hasOwnerAccess: (userId: string, albumId: string): Promise<boolean> => {
      return this.albumRepository.exist({
        where: {
          id: albumId,
          ownerId: userId,
        },
      });
    },

    hasSharedAlbumAccess: (userId: string, albumId: string): Promise<boolean> => {
      return this.albumRepository.exist({
        where: {
          id: albumId,
          sharedUsers: {
            id: userId,
          },
        },
      });
    },

    hasSharedLinkAccess: (sharedLinkId: string, albumId: string): Promise<boolean> => {
      return this.sharedLinkRepository.exist({
        where: {
          id: sharedLinkId,
          albumId,
        },
      });
    },
  };

  person = {
    hasOwnerAccess: (userId: string, personId: string): Promise<boolean> => {
      return this.personRepository.exist({
        where: {
          id: personId,
          ownerId: userId,
        },
      });
    },
  };

  partner = {
    hasUpdateAccess: (userId: string, partnerId: string): Promise<boolean> => {
      return this.partnerRepository.exist({
        where: {
          sharedById: partnerId,
          sharedWithId: userId,
        },
      });
    },
  };
}
