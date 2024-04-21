import { IMoveRepository } from 'src/interfaces/move.interface';
import { Mocked, vitest } from 'vitest';

export const newMoveRepositoryMock = (): Mocked<IMoveRepository> => {
  return {
    create: vitest.fn(),
    getByEntity: vitest.fn(),
    update: vitest.fn(),
    delete: vitest.fn(),
  };
};
