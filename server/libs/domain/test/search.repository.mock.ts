import { ISearchRepository } from '../src';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    setup: jest.fn(),
    checkMigrationStatus: jest.fn(),
    index: jest.fn(),
    import: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
  };
};
