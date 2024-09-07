import { SystemMetadataKey } from 'src/enum';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { StorageService } from 'src/services/storage.service';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newStorageRepositoryMock } from 'test/repositories/storage.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

describe(StorageService.name, () => {
  let sut: StorageService;
  let databaseMock: Mocked<IDatabaseRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    databaseMock = newDatabaseRepositoryMock();
    storageMock = newStorageRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();

    sut = new StorageService(databaseMock, storageMock, loggerMock, systemMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onBootstrap', () => {
    it('should enable mount folder checking', async () => {
      systemMock.get.mockResolvedValue(null);

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(systemMock.set).toHaveBeenCalledWith(SystemMetadataKey.SYSTEM_FLAGS, { mountFiles: true });
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/encoded-video');
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/library');
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/profile');
      expect(storageMock.mkdirSync).toHaveBeenCalledWith('upload/thumbs');
    });

    it('should throw an error if .immich is missing', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: true });
      storageMock.readFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to validate folder mount');

      expect(storageMock.writeFile).not.toHaveBeenCalled();
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should throw an error if .immich is present but read-only', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: true });
      storageMock.writeFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to validate folder mount');

      expect(systemMock.set).not.toHaveBeenCalled();
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
