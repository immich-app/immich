import { IAccessRepository } from '@app/domain';

export const newAccessRepositoryMock = (): jest.Mocked<IAccessRepository> => {
  return {
    hasPartnerAccess: jest.fn(),
    hasAlbumAssetAccess: jest.fn(),
    hasOwnerAssetAccess: jest.fn(),
    hasPartnerAssetAccess: jest.fn(),
    hasSharedLinkAssetAccess: jest.fn(),
  };
};
