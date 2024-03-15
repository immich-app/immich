import { ISharedLinkRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newSharedLinkRepositoryMock = (): Mocked<ISharedLinkRepository> => {
  return {
    getAll: vi.fn(),
    get: vi.fn(),
    getByKey: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  };
};
