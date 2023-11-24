import { ISmartInfoRepository } from '@app/domain';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    searchCLIP: jest.fn(),
    searchFaces: jest.fn(),
    upsert: jest.fn(),
  };
};
