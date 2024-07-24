import { AccessCore } from 'src/cores/access.core';
import { IAccessRepository } from 'src/interfaces/access.interface';
import { Mocked, vitest } from 'vitest';

export interface IAccessRepositoryMock {
  activity: Mocked<IAccessRepository['activity']>;
  asset: Mocked<IAccessRepository['asset']>;
  album: Mocked<IAccessRepository['album']>;
  authDevice: Mocked<IAccessRepository['authDevice']>;
  timeline: Mocked<IAccessRepository['timeline']>;
  memory: Mocked<IAccessRepository['memory']>;
  person: Mocked<IAccessRepository['person']>;
  partner: Mocked<IAccessRepository['partner']>;
}

export const newAccessRepositoryMock = (reset = true): IAccessRepositoryMock => {
  if (reset) {
    AccessCore.reset();
  }

  return {
    activity: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkAlbumOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkCreateAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    asset: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkAlbumAccess: vitest.fn().mockResolvedValue(new Set()),
      checkPartnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    album: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkSharedAlbumAccess: vitest.fn().mockResolvedValue(new Set()),
      checkSharedLinkAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    authDevice: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    timeline: {
      checkPartnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    memory: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    person: {
      checkFaceOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    partner: {
      checkUpdateAccess: vitest.fn().mockResolvedValue(new Set()),
    },
  };
};
