import { ProcessRepository } from 'src/repositories/process.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newProcessRepositoryMock = (): Mocked<RepositoryInterface<ProcessRepository>> => {
  return {
    spawn: vitest.fn(),
  };
};
