import { IAssetStackRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newAssetStackRepositoryMock = (): Mocked<IAssetStackRepository> => {
  return {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  };
};
