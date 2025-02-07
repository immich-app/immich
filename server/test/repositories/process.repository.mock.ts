import { IProcessRepository } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newProcessRepositoryMock = (): Mocked<IProcessRepository> => {
  return {
    spawn: vitest.fn(),
  };
};
