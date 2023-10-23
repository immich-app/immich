import { IMediaRepository } from '@app/domain';

export const newMediaRepositoryMock = (): jest.Mocked<IMediaRepository> => {
  return {
    generateThumbhash: jest.fn(),
    resize: jest.fn(),
    crop: jest.fn(),
    probe: jest.fn(),
    transcode: jest.fn(),
  };
};
