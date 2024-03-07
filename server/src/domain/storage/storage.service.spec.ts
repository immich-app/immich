import { newStorageRepositoryMock } from '@test';
import { IStorageRepository } from '../repositories';
import { StorageService } from './storage.service';

describe(StorageService.name, () => {
  let sut: StorageService;
  let storageMock: jest.Mocked<IStorageRepository>;

  beforeEach(() => {
    storageMock = newStorageRepositoryMock();
    sut = new StorageService(storageMock);
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
