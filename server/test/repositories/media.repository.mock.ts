import { IMediaRepository } from 'src/interfaces/media.interface';
import { Mocked, vitest } from 'vitest';

export const newMediaRepositoryMock = (): Mocked<IMediaRepository> => {
  return {
    generateThumbnail: vitest.fn().mockImplementation(() => Promise.resolve()),
    generateThumbhash: vitest.fn().mockImplementation(() => Promise.resolve()),
    decodeImage: vitest.fn().mockResolvedValue({ data: Buffer.from(''), info: {} }),
    extract: vitest.fn().mockResolvedValue(false),
    probe: vitest.fn(),
    transcode: vitest.fn(),
    getImageDimensions: vitest.fn(),
  };
};
