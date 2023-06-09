import { IStorageRepository } from '@app/domain';

export const newStorageRepositoryMock = (): jest.Mocked<IStorageRepository> => {
  return {
    createReadStream: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn().mockResolvedValue(true),
    removeEmptyDirs: jest.fn(),
    moveFile: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
    checkDiskUsage: jest.fn(),
  };
};
