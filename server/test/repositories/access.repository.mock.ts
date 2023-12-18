import { AccessCore, IAccessRepository } from '@app/domain';

export interface IAccessRepositoryMock {
  activity: jest.Mocked<IAccessRepository['activity']>;
  asset: jest.Mocked<IAccessRepository['asset']>;
  album: jest.Mocked<IAccessRepository['album']>;
  authDevice: jest.Mocked<IAccessRepository['authDevice']>;
  library: jest.Mocked<IAccessRepository['library']>;
  timeline: jest.Mocked<IAccessRepository['timeline']>;
  person: jest.Mocked<IAccessRepository['person']>;
  partner: jest.Mocked<IAccessRepository['partner']>;
}

export const newAccessRepositoryMock = (reset = true): IAccessRepositoryMock => {
  if (reset) {
    AccessCore.reset();
  }

  return {
    activity: {
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkAlbumOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkCreateAccess: jest.fn().mockResolvedValue(new Set()),
    },

    asset: {
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkAlbumAccess: jest.fn().mockResolvedValue(new Set()),
      checkPartnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: jest.fn().mockResolvedValue(new Set()),
    },

    album: {
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkSharedAlbumAccess: jest.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: jest.fn().mockResolvedValue(new Set()),
    },

    authDevice: {
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
    },

    library: {
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkPartnerAccess: jest.fn().mockResolvedValue(new Set()),
    },

    timeline: {
      checkPartnerAccess: jest.fn().mockResolvedValue(new Set()),
    },

    person: {
      checkFaceOwnerAccess: jest.fn().mockResolvedValue(new Set()),
      checkOwnerAccess: jest.fn().mockResolvedValue(new Set()),
    },

    partner: {
      checkUpdateAccess: jest.fn().mockResolvedValue(new Set()),
    },
  };
};
