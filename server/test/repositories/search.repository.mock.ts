import { ISearchRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newSearchRepositoryMock = (): Mocked<ISearchRepository> => {
  return {
    init: vi.fn(),
    searchMetadata: vi.fn(),
    searchSmart: vi.fn(),
    searchFaces: vi.fn(),
    upsert: vi.fn(),
    searchPlaces: vi.fn(),
    deleteAllSearchEmbeddings: vi.fn(),
  };
};
