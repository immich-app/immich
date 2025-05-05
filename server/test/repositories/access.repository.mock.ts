import { AccessRepository } from 'src/repositories/access.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

type IAccessRepository = { [K in keyof AccessRepository]: RepositoryInterface<AccessRepository[K]> };

export type IAccessRepositoryMock = {
  [K in keyof IAccessRepository]: Mocked<IAccessRepository[K]>;
};

export const newAccessRepositoryMock = (): IAccessRepositoryMock => {
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

    memory: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    notification: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    person: {
      checkFaceOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    partner: {
      checkUpdateAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    stack: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    timeline: {
      checkPartnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },

    tag: {
      checkOwnerAccess: vitest.fn().mockResolvedValue(new Set()),
    },
  };
};
