import { ISearchRepository } from '../src';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    setup: jest.fn(),
    checkMigrationStatus: jest.fn(),
    importAssets: jest.fn(),
    importAlbums: jest.fn(),
    deleteAlbums: jest.fn(),
    deleteAssets: jest.fn(),
    searchAssets: jest.fn(),
    searchAlbums: jest.fn(),
    vectorSearch: jest.fn(),
    explore: jest.fn(),
  };
};
