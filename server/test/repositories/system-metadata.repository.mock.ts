import { Mocked, vitest } from 'vitest';
import type { RepositoryInterface } from 'src/types.js';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository.js';
import { clearConfigCache } from 'src/utils/config.js';

export const newSystemMetadataRepositoryMock = (): Mocked<RepositoryInterface<SystemMetadataRepository>> => {
  clearConfigCache();
  return {
    get: vitest.fn() as any,
    set: vitest.fn(),
    delete: vitest.fn(),
    readFile: vitest.fn(),
  };
};
