import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import type { RepositoryInterface } from 'src/types.js';
import { clearConfigCache } from 'src/utils/config.js';
import { Mocked, vitest } from 'vitest';

export const newSystemMetadataRepositoryMock = (): Mocked<RepositoryInterface<SystemMetadataRepository>> => {
  clearConfigCache();
  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
    delete: vitest.fn(),
    readFile: vitest.fn(),
  };
};
