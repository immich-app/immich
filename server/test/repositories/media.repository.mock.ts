import { IMediaRepository } from '@app/domain';

export const newMediaRepositoryMock = (): jest.Mocked<IMediaRepository> => {
  return {
    generateThumbnail: jest.fn(),
    generateThumbhash: jest.fn(),
    probe: jest.fn(),
    transcode: jest.fn(),
  };
};
