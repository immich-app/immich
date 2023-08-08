import { ISmartInfoRepository } from '@app/domain';

export const newSmartInfoRepositoryMock = (): jest.Mocked<ISmartInfoRepository> => {
  return {
    searchByEmbedding: jest.fn(),
    upsert: jest.fn(),
  };
};
