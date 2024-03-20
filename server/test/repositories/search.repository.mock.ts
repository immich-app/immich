import { ISearchRepository } from 'src/domain/repositories/search.repository';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    init: jest.fn(),
    searchMetadata: jest.fn(),
    searchSmart: jest.fn(),
    searchFaces: jest.fn(),
    upsert: jest.fn(),
    searchPlaces: jest.fn(),
    getAssetsByCity: jest.fn(),
    deleteAllSearchEmbeddings: jest.fn(),
  };
};
