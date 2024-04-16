import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { StorageService } from 'src/services/storage.service';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { Mocked } from 'vitest';

describe(StorageService.name, () => {
  let sut: StorageService;
  let storageMock: Mocked<IStorageRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    storageMock = newStorageRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new StorageService(storageMock, loggerMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('init', () => {
    it('should create the library folder on initialization', () => {
      sut.init();
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/library');
    });
  });

  describe('handleDeleteFiles', () => {
    it('should handle null values', async () => {
      await sut.handleDeleteFiles({ files: [undefined, null] });

      expect(storageMock.unlink).not.toHaveBeenCalled();
    });

    it('should handle an error removing a file', async () => {
      storageMock.unlink.mockRejectedValue(new Error('something-went-wrong'));

      await sut.handleDeleteFiles({ files: ['path/to/something'] });

      expect(storageMock.unlink).toHaveBeenCalledWith('path/to/something');
    });

    it('should remove the file', async () => {
      await sut.handleDeleteFiles({ files: ['path/to/something'] });

      expect(storageMock.unlink).toHaveBeenCalledWith('path/to/something');
    });
  });
});
