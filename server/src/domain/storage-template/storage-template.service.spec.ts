import {
  assetEntityStub,
  newAssetRepositoryMock,
  newStorageRepositoryMock,
  newSystemConfigRepositoryMock,
  newUserRepositoryMock,
  systemConfigStub,
  userEntityStub,
} from '@test';
import { when } from 'jest-when';
import { StorageTemplateService } from '.';
import { IAssetRepository } from '../asset';
import { IStorageRepository } from '../storage/storage.repository';
import { ISystemConfigRepository } from '../system-config';
import { IUserRepository } from '../user';

describe(StorageTemplateService.name, () => {
  let sut: StorageTemplateService;
  let assetMock: jest.Mocked<IAssetRepository>;
  let configMock: jest.Mocked<ISystemConfigRepository>;
  let storageMock: jest.Mocked<IStorageRepository>;
  let userMock: jest.Mocked<IUserRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(async () => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    storageMock = newStorageRepositoryMock();
    userMock = newUserRepositoryMock();

    sut = new StorageTemplateService(assetMock, configMock, systemConfigStub.defaults, storageMock, userMock);
  });

  describe('handle template migration', () => {
    it('should handle no assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      assetMock.save.mockResolvedValue(assetEntityStub.image);
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      when(storageMock.checkFileExists)
        .calledWith('upload/library/user-id/2023/2023-02-23/asset-id.ext')
        .mockResolvedValue(true);

      when(storageMock.checkFileExists)
        .calledWith('upload/library/user-id/2023/2023-02-23/asset-id+1.ext')
        .mockResolvedValue(false);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(2);
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.ext',
      });
      expect(userMock.getList).toHaveBeenCalled();
    });

    it('should skip when an asset already matches the template', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [
          {
            ...assetEntityStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.ext',
          },
        ],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [
          {
            ...assetEntityStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.ext',
          },
        ],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      assetMock.save.mockResolvedValue(assetEntityStub.image);
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/library/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.ext',
      });
    });

    it('should use the user storage label', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      assetMock.save.mockResolvedValue(assetEntityStub.image);
      userMock.getList.mockResolvedValue([userEntityStub.storageLabel]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/library/label-1/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/library/label-1/2023/2023-02-23/asset-id.ext',
      });
    });

    it('should not update the database if the move fails', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      storageMock.moveFile.mockRejectedValue(new Error('Read only system'));
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.moveFile).toHaveBeenCalledWith(
        '/original/path.ext',
        'upload/library/user-id/2023/2023-02-23/asset-id.ext',
      );
      expect(assetMock.save).not.toHaveBeenCalled();
    });

    it('should move the asset back if the database fails', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetEntityStub.image],
        hasNextPage: false,
      });
      assetMock.save.mockRejectedValue('Connection Error!');
      userMock.getList.mockResolvedValue([userEntityStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(assetMock.save).toHaveBeenCalledWith({
        id: assetEntityStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.ext',
      });
      expect(storageMock.moveFile.mock.calls).toEqual([
        ['/original/path.ext', 'upload/library/user-id/2023/2023-02-23/asset-id.ext'],
        ['upload/library/user-id/2023/2023-02-23/asset-id.ext', '/original/path.ext'],
      ]);
    });
  });
});
