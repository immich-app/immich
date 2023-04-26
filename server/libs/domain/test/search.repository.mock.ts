import { ISearchRepository } from '../src';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    setup: jest.fn(),
    checkMigrationStatus: jest.fn(),
    importAssets: jest.fn(),
    importAlbums: jest.fn(),
    importFaces: jest.fn(),
    deleteAlbums: jest.fn(),
    deleteAssets: jest.fn(),
    deleteFaces: jest.fn(),
    searchAssets: jest.fn(),
    searchAlbums: jest.fn(),
    vectorSearch: jest.fn(),
    explore: jest.fn(),
    faceSearch: jest.fn(),
  };
};
