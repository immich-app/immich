import { IMediaRepository } from '@app/domain';
import { Mocked } from 'vitest';

export const newMediaRepositoryMock = (): Mocked<IMediaRepository> => {
  return {
    generateThumbhash: vi.fn(),
    resize: vi.fn(),
    crop: vi.fn(),
    probe: vi.fn(),
    transcode: vi.fn(),
  };
};
