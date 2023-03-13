import { when } from 'jest-when';
import {
  assetEntityStub,
  newAssetRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  systemConfigStub,
} from '../../test';
import { IAssetRepository } from '../asset';
import { StorageTemplateService } from '../storage-template';
import { IStorageRepository } from '../storage/storage.repository';
import { ISystemConfigRepository } from '../system-config';

describe(StorageTemplateService.name, () => {
  let sut: StorageTemplateService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    storageMock = newStorageRepositoryMock();
    sut = new StorageTemplateService(assetMock, configMock, systemConfigStub.defaults, storageMock);
  });

  describe('handle template migration', () => {
    it('should handle no assets', async () => {
      assetMock.getAll.mockResolvedValue([]);

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      assetMock.save.mockResolvedValue(assetEntityStub.image);

      when(storageMock.checkFileExists)
        .calledWith('upload/user-id/2023/2023-02-23/asset-id.ext')
        .mockResolvedValue(true);

      when(storageMock.checkFileExists)
        .calledWith('upload/user-id/2023/2023-02-23/asset-id+1.ext')
        .mockResolvedValue(false);

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(2);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/user-id/2023/2023-02-23/asset-id+1.ext',
      });
    });

    it('should skip when an asset already matches the template', async () => {
      assetMock.getAll.mockResolvedValue([
        {
          ...assetEntityStub.image,
          originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
        },
      ]);

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      assetMock.getAll.mockResolvedValue([
        {
          ...assetEntityStub.image,
          originalPath: 'upload/user-id/2023/2023-02-23/asset-id+1.ext',
        },
      ]);

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      assetMock.save.mockResolvedValue(assetEntityStub.image);

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
      });
    });

    it('should not update the database if the move fails', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      storageMock.moveFile.mockRejectedValue(new Error('Read only system'));

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move the asset back if the database fails', async () => {
      assetMock.getAll.mockResolvedValue([assetEntityStub.image]);
      assetMock.save.mockRejectedValue('Connection Error!');

      await sut.handleTemplateMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/user-id/2023/2023-02-23/asset-id.ext',
      });
      expect(storageMock.moveFile.mock.calls).toEqual([
        ['/original/path.ext', 'upload/user-id/2023/2023-02-23/asset-id.ext'],
        ['upload/user-id/2023/2023-02-23/asset-id.ext', '/original/path.ext'],
      ]);
    });
  });

  it('should handle an error', async () => {
    assetMock.getAll.mockResolvedValue([]);
    storageMock.removeEmptyDirs.mockRejectedValue(new Error('Read only filesystem'));

    await sut.handleTemplateMigration();
  });
});
