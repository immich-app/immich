import { IMediaRepository } from 'src/interfaces/media.interface';
import { Mocked, vitest } from 'vitest';

export const newMediaRepositoryMock = (): Mocked<IMediaRepository> => {
  return {
    generateThumbhash: vitest.fn(),
    resize: vitest.fn(),
    crop: vitest.fn(),
    probe: vitest.fn(),
    transcode: vitest.fn(),
  };
};
