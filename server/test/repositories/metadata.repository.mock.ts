import { Mocked, vitest } from 'vitest';
import { MetadataRepository } from 'src/repositories/metadata.repository.js';
import type { RepositoryInterface } from 'src/types.js';

export const newMetadataRepositoryMock = (): Mocked<RepositoryInterface<MetadataRepository>> => {
  return {
    setMaxConcurrency: vitest.fn(),
    teardown: vitest.fn(),
    readTags: vitest.fn(),
    writeTags: vitest.fn(),
    extractBinaryTag: vitest.fn(),
  };
};
