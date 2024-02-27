import { ISearchRepository } from '@app/domain';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    init: jest.fn(),
    searchMetadata: jest.fn(),
    searchSmart: jest.fn(),
    searchFaces: jest.fn(),
    upsert: jest.fn(),
    searchPlaces: jest.fn(),
    deleteAllSearchEmbeddings: jest.fn(),
  };
};
