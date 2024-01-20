import { ISearchRepository } from '@app/domain';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    init: jest.fn(),
    searchAssets: jest.fn(),
    searchCLIP: jest.fn(),
    searchFaces: jest.fn(),
    upsert: jest.fn(),
  };
};
