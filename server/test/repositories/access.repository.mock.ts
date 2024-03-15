import { AccessCore, IAccessRepository } from '@app/domain';
import { Mocked } from 'vitest';

export interface IAccessRepositoryMock {
  activity: Mocked<IAccessRepository['activity']>;
  asset: Mocked<IAccessRepository['asset']>;
  album: Mocked<IAccessRepository['album']>;
  authDevice: Mocked<IAccessRepository['authDevice']>;
  library: Mocked<IAccessRepository['library']>;
  timeline: Mocked<IAccessRepository['timeline']>;
  person: Mocked<IAccessRepository['person']>;
  partner: Mocked<IAccessRepository['partner']>;
}

export const newAccessRepositoryMock = (reset = true): IAccessRepositoryMock => {
  if (reset) {
    AccessCore.reset();
  }

  return {
    activity: {
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkAlbumOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkCreateAccess: vi.fn().mockResolvedValue(new Set()),
    },

    asset: {
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkAlbumAccess: vi.fn().mockResolvedValue(new Set()),
      checkPartnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: vi.fn().mockResolvedValue(new Set()),
    },

    album: {
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkSharedAlbumAccess: vi.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: vi.fn().mockResolvedValue(new Set()),
    },

    authDevice: {
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
    },

    library: {
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkPartnerAccess: vi.fn().mockResolvedValue(new Set()),
    },

    timeline: {
      checkPartnerAccess: vi.fn().mockResolvedValue(new Set()),
    },

    person: {
      checkFaceOwnerAccess: vi.fn().mockResolvedValue(new Set()),
      checkOwnerAccess: vi.fn().mockResolvedValue(new Set()),
    },

    partner: {
      checkUpdateAccess: vi.fn().mockResolvedValue(new Set()),
    },
  };
};
