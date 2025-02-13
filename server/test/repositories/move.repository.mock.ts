import { MoveRepository } from 'src/repositories/move.repository';
import { RepositoryInterface } from 'src/types';
import { Mocked, vitest } from 'vitest';

export const newMoveRepositoryMock = (): Mocked<RepositoryInterface<MoveRepository>> => {
  return {
    create: vitest.fn(),
    getByEntity: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
  };
};
