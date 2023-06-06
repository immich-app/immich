import { IAccessRepository } from '../src';

export const newAccessRepositoryMock = (): jest.Mocked<IAccessRepository> => {
  return {
    hasPartnerAccess: jest.fn(),
    hasPartnerAssetAccess: jest.fn(),
  };
};
