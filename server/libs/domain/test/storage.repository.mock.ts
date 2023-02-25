import { IStorageRepository } from '../src';

export const newStorageRepositoryMock = (): jest.Mocked<IStorageRepository> => {
  return {
    createReadStream: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn(),
    removeEmptyDirs: jest.fn(),
    moveFile: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
  };
};
