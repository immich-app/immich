import { IViewRepository } from 'src/interfaces/view.interface';
import { Mocked, vitest } from 'vitest';

export const newViewRepositoryMock = (): Mocked<IViewRepository> => {
  return {
    getAssetsByOriginalPath: vitest.fn(),
    getUniqueOriginalPaths: vitest.fn(),
  };
};
