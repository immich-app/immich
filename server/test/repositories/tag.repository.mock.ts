import { ITagRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newTagRepositoryMock = (): Mocked<ITagRepository> => {
  return {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    hasAsset: vi.fn(),
    hasName: vi.fn(),
    getAssets: vi.fn(),
    addAssets: vi.fn(),
    removeAssets: vi.fn(),
  };
};
