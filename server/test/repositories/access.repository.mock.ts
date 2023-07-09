import { IAccessRepository } from '@app/domain';

export type IAccessRepositoryMock = {
  asset: jest.Mocked<IAccessRepository['asset']>;
  album: jest.Mocked<IAccessRepository['album']>;
  library: jest.Mocked<IAccessRepository['library']>;
};

export const newAccessRepositoryMock = (): IAccessRepositoryMock => {
  return {
    asset: {
      hasOwnerAccess: jest.fn(),
      hasAlbumAccess: jest.fn(),
      hasPartnerAccess: jest.fn(),
      hasSharedLinkAccess: jest.fn(),
    },

    album: {
      hasOwnerAccess: jest.fn(),
      hasSharedAlbumAccess: jest.fn(),
      hasSharedLinkAccess: jest.fn(),
    },

    library: {
      hasPartnerAccess: jest.fn(),
    },
  };
};
