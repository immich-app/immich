import { IStorageRepository } from '@app/domain';

export const newStorageRepositoryMock = (): jest.Mocked<IStorageRepository> => {
  return {
    createZipStream: jest.fn(),
    createReadStream: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn().mockResolvedValue(true),
    removeEmptyDirs: jest.fn(),
    moveFile: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
    checkDiskUsage: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    crawl: jest.fn(),
  };
};
