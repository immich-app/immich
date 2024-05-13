import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { Mocked, vitest } from 'vitest';

export const newSystemMetadataRepositoryMock = (): Mocked<ISystemMetadataRepository> => {
  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
  };
};
