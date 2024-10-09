import { SystemMetadataKey } from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ImmichStartupError, StorageService } from 'src/services/storage.service';
import { mockEnvData } from 'test/repositories/config.repository.mock';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(StorageService.name, () => {
  let sut: StorageService;

  let configMock: Mocked<IConfigRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, configMock, loggerMock, storageMock, systemMock } = newTestService(StorageService));
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
      expect(storageMock.createFile).toHaveBeenCalledWith('upload/encoded-video/.immich', expect.any(Buffer));
      expect(storageMock.createFile).toHaveBeenCalledWith('upload/library/.immich', expect.any(Buffer));
      expect(storageMock.createFile).toHaveBeenCalledWith('upload/profile/.immich', expect.any(Buffer));
      expect(storageMock.createFile).toHaveBeenCalledWith('upload/thumbs/.immich', expect.any(Buffer));
      expect(storageMock.createFile).toHaveBeenCalledWith('upload/upload/.immich', expect.any(Buffer));
    });

    it('should throw an error if .immich is missing', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: true });
      storageMock.readFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to read');

      expect(storageMock.createOrOverwriteFile).not.toHaveBeenCalled();
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should throw an error if .immich is present but read-only', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: true });
      storageMock.overwriteFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).rejects.toThrow('Failed to write');

      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should skip mount file creation if file already exists', async () => {
      const error = new Error('Error creating file') as any;
      error.code = 'EEXIST';
      systemMock.get.mockResolvedValue({ mountFiles: false });
      storageMock.createFile.mockRejectedValue(error);

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

      expect(loggerMock.warn).toHaveBeenCalledWith('Found existing mount file, skipping creation');
    });

    it('should throw an error if mount file could not be created', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: false });
      storageMock.createFile.mockRejectedValue(new Error('Error creating file'));

      await expect(sut.onBootstrap()).rejects.toBeInstanceOf(ImmichStartupError);
      expect(systemMock.set).not.toHaveBeenCalled();
    });

    it('should startup if checks are disabled', async () => {
      systemMock.get.mockResolvedValue({ mountFiles: true });
      configMock.getEnv.mockReturnValue(
        mockEnvData({
          storage: { ignoreMountCheckErrors: true },
        }),
      );
      storageMock.overwriteFile.mockRejectedValue(new Error("ENOENT: no such file or directory, open '/app/.immich'"));

      await expect(sut.onBootstrap()).resolves.toBeUndefined();

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
