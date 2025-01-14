import { IProcessRepository } from 'src/interfaces/process.interface';
import { Mocked, vitest } from 'vitest';

export const newProcessRepositoryMock = (): Mocked<IProcessRepository> => {
  return {
    spawn: vitest.fn(),
  };
};
