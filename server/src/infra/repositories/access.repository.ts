import { IAccessRepository } from '@app/domain';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlbumEntity, AssetEntity, PartnerEntity, SharedLinkEntity } from '../entities';

export class AccessRepository implements IAccessRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AlbumEntity) private albumRepository: Repository<AlbumEntity>,
    @InjectRepository(PartnerEntity) private partnerRepository: Repository<PartnerEntity>,
    @InjectRepository(SharedLinkEntity) private sharedLinkRepository: Repository<SharedLinkEntity>,
  ) {}

  library = {
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
        ],
      });
    },

    hasOwnerAccess: (userId: string, assetId: string): Promise<boolean> => {
      return this.assetRepository.exist({
        where: {
          id: assetId,
          ownerId: userId,
        },
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
      return (
        // album asset
        (await this.sharedLinkRepository.exist({
          where: {
            id: sharedLinkId,
            album: {
              assets: {
                id: assetId,
              },
            },
          },
        })) ||
        // individual asset
        (await this.sharedLinkRepository.exist({
          where: {
            id: sharedLinkId,
            assets: {
              id: assetId,
            },
          },
        }))
      );
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
          ownerId: userId,
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
}
