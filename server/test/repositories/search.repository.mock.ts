import { ISearchRepository } from '@app/domain';

export const newSearchRepositoryMock = (): jest.Mocked<ISearchRepository> => {
  return {
    explore: jest.fn(),
  };
};
