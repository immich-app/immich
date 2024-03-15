import { IKeyRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newKeyRepositoryMock = (): Mocked<IKeyRepository> => {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getKey: vi.fn(),
    getById: vi.fn(),
    getByUserId: vi.fn(),
  };
};
