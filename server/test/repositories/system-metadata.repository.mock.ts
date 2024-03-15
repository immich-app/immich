import { ISystemMetadataRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newSystemMetadataRepositoryMock = (): Mocked<ISystemMetadataRepository> => {
  return {
    get: vi.fn() as any,
    set: vi.fn(),
  };
};
