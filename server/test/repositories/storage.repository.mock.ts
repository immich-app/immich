import { IStorageRepository, StorageCore } from '@app/domain';

export const newStorageRepositoryMock = (reset = true): jest.Mocked<IStorageRepository> => {
  if (reset) {
    StorageCore.reset();
  }

  return {
    createZipStream: jest.fn(),
    createReadStream: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    unlinkDir: jest.fn().mockResolvedValue(true),
    removeEmptyDirs: jest.fn(),
    checkFileExists: jest.fn(),
    mkdirSync: jest.fn(),
    checkDiskUsage: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    crawl: jest.fn(),
    rename: jest.fn(),
    copyFile: jest.fn(),
    watch: jest.fn(),
  };
};
