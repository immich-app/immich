import { ViewRepository } from 'src/repositories/view-repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newViewRepositoryMock = (): Mocked<RepositoryInterface<ViewRepository>> => {
  return {
    getAssetsByOriginalPath: vitest.fn(),
    getUniqueOriginalPaths: vitest.fn(),
  };
};
