import { IMoveRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newMoveRepositoryMock = (): Mocked<IMoveRepository> => {
  return {
    create: vi.fn(),
    getByEntity: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
};
