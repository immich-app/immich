import { ISystemConfigRepository, SystemConfigCore } from '@app/domain';
import { Mocked } from 'vitest';

export const newSystemConfigRepositoryMock = (reset = true): Mocked<ISystemConfigRepository> => {
  if (reset) {
    SystemConfigCore.reset();
  }

  return {
    fetchStyle: vi.fn(),
    load: vi.fn().mockResolvedValue([]),
    readFile: vi.fn(),
    saveAll: vi.fn().mockResolvedValue([]),
    deleteKeys: vi.fn(),
  };
};
