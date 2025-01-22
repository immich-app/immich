import { IViewRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newViewRepositoryMock = (): Mocked<IViewRepository> => {
  return {
    getAssetsByOriginalPath: vitest.fn(),
    getUniqueOriginalPaths: vitest.fn(),
  };
};
