import { IMediaRepository } from 'src/interfaces/media.interface';
import { Mocked, vitest } from 'vitest';

export const newMediaRepositoryMock = (): Mocked<IMediaRepository> => {
  return {
    generateThumbnail: vitest.fn(),
    generateThumbhash: vitest.fn(),
    extract: vitest.fn().mockResolvedValue(false),
    probe: vitest.fn(),
    transcode: vitest.fn(),
    getImageDimensions: vitest.fn(),
  };
};
