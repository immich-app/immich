import { ISmartInfoRepository } from '@app/domain';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    init: jest.fn(),
    searchCLIP: jest.fn(),
    searchFaces: jest.fn(),
    upsert: jest.fn(),
  };
};
