import { IMediaRepository } from 'src/interfaces/media.interface';
import { Mocked, vitest } from 'vitest';

export const newMediaRepositoryMock = (): Mocked<IMediaRepository> => {
  return {
    generateThumbhash: vitest.fn(),
    extract: vitest.fn().mockResolvedValue(false),
    resize: vitest.fn(),
    crop: vitest.fn(),
    probe: vitest.fn(),
    transcode: vitest.fn(),
    getImageDimensions: vitest.fn(),
  };
};
