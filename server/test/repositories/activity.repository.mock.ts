import { IActivityRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newActivityRepositoryMock = (): Mocked<IActivityRepository> => {
  return {
    search: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    getStatistics: vi.fn(),
  };
};
