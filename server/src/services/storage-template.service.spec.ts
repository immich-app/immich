import { Stats } from 'node:fs';
import { SystemConfig, defaults } from 'src/config';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetPathType } from 'src/enum';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { JobStatus } from 'src/interfaces/job.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(StorageTemplateService.name, () => {
  let sut: StorageTemplateService;

  let albumMock: Mocked<IAlbumRepository>;
  let assetMock: Mocked<IAssetRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let moveMock: Mocked<IMoveRepository>;
  let storageMock: Mocked<IStorageRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let userMock: Mocked<IUserRepository>;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, albumMock, assetMock, cryptoMock, moveMock, storageMock, systemMock, userMock } =
      newTestService(StorageTemplateService));

    systemMock.get.mockResolvedValue({ storageTemplate: { enabled: true } });

    sut.onConfigUpdate({ newConfig: defaults });
  });

  describe('onConfigValidate', () => {
    it('should allow valid templates', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: {
            storageTemplate: {
              template:
                '{{y}}{{M}}{{W}}{{d}}{{h}}{{m}}{{s}}{{filename}}{{ext}}{{filetype}}{{filetypefull}}{{assetId}}{{#if album}}{{album}}{{else}}other{{/if}}',
            },
          } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).not.toThrow();
    });

    it('should fail for an invalid template', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: {
            storageTemplate: {
              template: '{{foo}}',
            },
          } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).toThrow(/Invalid storage template.*/);
    });
  });

  describe('handleMigrationSingle', () => {
    it('should skip when storage template is disabled', async () => {
      systemMock.get.mockResolvedValue({ storageTemplate: { enabled: false } });
      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SKIPPED);
      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalled();
      expect(storageMock.rename).not.toHaveBeenCalled();
      expect(storageMock.copyFile).not.toHaveBeenCalled();
      expect(assetMock.update).not.toHaveBeenCalled();
      expect(moveMock.create).not.toHaveBeenCalled();
      expect(moveMock.update).not.toHaveBeenCalled();
      expect(storageMock.stat).not.toHaveBeenCalled();
    });

    it('should migrate single moving picture', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      const newMotionPicturePath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${assetStub.livePhotoStillAsset.id}.mp4`;
      const newStillPicturePath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${assetStub.livePhotoStillAsset.id}.jpeg`;

      assetMock.getByIds.mockImplementation((ids) => {
        const assets = [assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset];
        return Promise.resolve(
          ids.map((id) => assets.find((asset) => asset.id === id)).filter((asset) => !!asset),
        ) as Promise<AssetEntity[]>;
      });

      moveMock.create.mockResolvedValueOnce({
        id: '123',
        entityId: assetStub.livePhotoStillAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.livePhotoStillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      moveMock.create.mockResolvedValueOnce({
        id: '124',
        entityId: assetStub.livePhotoMotionAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.livePhotoMotionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id], { exifInfo: true });
      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id], { exifInfo: true });
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(2);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        originalPath: newStillPicturePath,
      });
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoMotionAsset.id,
        originalPath: newMotionPicturePath,
      });
    });

    it('should use handlebar if condition for album', async () => {
      const asset = assetStub.image;
      const user = userStub.user1;
      const album = albumStub.oneAsset;
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other/{{MM}}{{/if}}/{{filename}}';

      sut.onConfigUpdate({ oldConfig: defaults, newConfig: config });

      userMock.get.mockResolvedValue(user);
      assetMock.getByIds.mockResolvedValueOnce([asset]);
      albumMock.getByAssetId.mockResolvedValueOnce([album]);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.SUCCESS);

      expect(moveMock.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: `upload/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/${album.albumName}/${asset.originalFileName}`,
        oldPath: asset.originalPath,
        pathType: AssetPathType.ORIGINAL,
      });
    });

    it('should use handlebar else condition for album', async () => {
      const asset = assetStub.image;
      const user = userStub.user1;
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other//{{MM}}{{/if}}/{{filename}}';
      sut.onConfigUpdate({ oldConfig: defaults, newConfig: config });

      userMock.get.mockResolvedValue(user);
      assetMock.getByIds.mockResolvedValueOnce([asset]);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.SUCCESS);

      const month = (asset.fileCreatedAt.getMonth() + 1).toString().padStart(2, '0');
      expect(moveMock.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: `upload/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/other/${month}/${asset.originalFileName}`,
        oldPath: asset.originalPath,
        pathType: AssetPathType.ORIGINAL,
      });
    });

    it('should migrate previously failed move from original path when it still exists', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      storageMock.checkFileExists.mockImplementation((path) => Promise.resolve(path === assetStub.image.originalPath));
      moveMock.getByEntity.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: previousFailedNewPath,
      });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      moveMock.update.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(3);
      expect(storageMock.rename).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(moveMock.update).toHaveBeenCalledWith({
        id: '123',
        oldPath: assetStub.image.originalPath,
        newPath,
      });
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should migrate previously failed move from previous new path when old path no longer exists, should validate file size still matches before moving', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      storageMock.checkFileExists.mockImplementation((path) => Promise.resolve(path === previousFailedNewPath));
      storageMock.stat.mockResolvedValue({ size: 5000 } as Stats);
      cryptoMock.hashFile.mockResolvedValue(assetStub.image.checksum);
      moveMock.getByEntity.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: previousFailedNewPath,
      });
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      moveMock.update.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: previousFailedNewPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(3);
      expect(storageMock.stat).toHaveBeenCalledWith(previousFailedNewPath);
      expect(storageMock.rename).toHaveBeenCalledWith(previousFailedNewPath, newPath);
      expect(storageMock.copyFile).not.toHaveBeenCalled();
      expect(moveMock.update).toHaveBeenCalledWith({
        id: '123',
        oldPath: previousFailedNewPath,
        newPath,
      });
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should fail move if copying and hash of asset and the new file do not match', async () => {
      userMock.get.mockResolvedValue(userStub.user1);
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      storageMock.rename.mockRejectedValue({ code: 'EXDEV' });
      storageMock.stat.mockResolvedValue({ size: 5000 } as Stats);
      cryptoMock.hashFile.mockResolvedValue(Buffer.from('different-hash', 'utf8'));
      assetMock.getByIds.mockResolvedValue([assetStub.image]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(1);
      expect(storageMock.stat).toHaveBeenCalledWith(newPath);
      expect(moveMock.create).toHaveBeenCalledWith({
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });
      expect(storageMock.rename).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(storageMock.copyFile).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(storageMock.unlink).toHaveBeenCalledWith(newPath);
      expect(storageMock.unlink).toHaveBeenCalledTimes(1);
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it.each`
      failedPathChecksum                     | failedPathSize                              | reason
      ${assetStub.image.checksum}            | ${500}                                      | ${'file size'}
      ${Buffer.from('bad checksum', 'utf8')} | ${assetStub.image.exifInfo?.fileSizeInByte} | ${'checksum'}
    `(
      'should fail to migrate previously failed move from previous new path when old path no longer exists if $reason validation fails',
      async ({ failedPathChecksum, failedPathSize }) => {
        userMock.get.mockResolvedValue(userStub.user1);
        const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
        const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

        storageMock.checkFileExists.mockImplementation((path) => Promise.resolve(previousFailedNewPath === path));
        storageMock.stat.mockResolvedValue({ size: failedPathSize } as Stats);
        cryptoMock.hashFile.mockResolvedValue(failedPathChecksum);
        moveMock.getByEntity.mockResolvedValue({
          id: '123',
          entityId: assetStub.image.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: assetStub.image.originalPath,
          newPath: previousFailedNewPath,
        });
        assetMock.getByIds.mockResolvedValue([assetStub.image]);
        moveMock.update.mockResolvedValue({
          id: '123',
          entityId: assetStub.image.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: previousFailedNewPath,
          newPath,
        });

        await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

        expect(assetMock.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
        expect(storageMock.checkFileExists).toHaveBeenCalledTimes(3);
        expect(storageMock.stat).toHaveBeenCalledWith(previousFailedNewPath);
        expect(storageMock.rename).not.toHaveBeenCalled();
        expect(storageMock.copyFile).not.toHaveBeenCalled();
        expect(moveMock.update).not.toHaveBeenCalled();
        expect(assetMock.update).not.toHaveBeenCalled();
      },
    );
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
        items: [assetStub.image],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userStub.user1]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
      });

      storageMock.checkFileExists.mockResolvedValueOnce(true);
      storageMock.checkFileExists.mockResolvedValueOnce(false);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.checkFileExists).toHaveBeenCalledTimes(2);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
      });
      expect(userMock.getList).toHaveBeenCalled();
    });

    it('should skip when an asset already matches the template', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [
          {
            ...assetStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
          },
        ],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).not.toHaveBeenCalled();
      expect(storageMock.copyFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [
          {
            ...assetStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
          },
        ],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).not.toHaveBeenCalled();
      expect(storageMock.copyFile).not.toHaveBeenCalled();
      expect(storageMock.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userStub.user1]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });
    });

    it('should use the user storage label', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      userMock.getList.mockResolvedValue([userStub.storageLabel]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/label-1/2023/2023-02-23/asset-id.jpg',
      );
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/label-1/2023/2023-02-23/asset-id.jpg',
      });
    });

    it('should copy the file if rename fails due to EXDEV (rename across filesystems)', async () => {
      const newPath = 'upload/library/user-id/2023/2023-02-23/asset-id.jpg';
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      storageMock.rename.mockRejectedValue({ code: 'EXDEV' });
      userMock.getList.mockResolvedValue([userStub.user1]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });
      storageMock.stat.mockResolvedValueOnce({
        atime: new Date(),
        mtime: new Date(),
      } as Stats);
      storageMock.stat.mockResolvedValueOnce({
        size: 5000,
      } as Stats);
      storageMock.stat.mockResolvedValueOnce({
        atime: new Date(),
        mtime: new Date(),
      } as Stats);
      cryptoMock.hashFile.mockResolvedValue(assetStub.image.checksum);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).toHaveBeenCalledWith('/original/path.jpg', newPath);
      expect(storageMock.copyFile).toHaveBeenCalledWith('/original/path.jpg', newPath);
      expect(storageMock.stat).toHaveBeenCalledWith(newPath);
      expect(storageMock.stat).toHaveBeenCalledWith(assetStub.image.originalPath);
      expect(storageMock.utimes).toHaveBeenCalledWith(newPath, expect.any(Date), expect.any(Date));
      expect(storageMock.unlink).toHaveBeenCalledWith(assetStub.image.originalPath);
      expect(storageMock.unlink).toHaveBeenCalledTimes(1);
      expect(assetMock.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should not update the database if the move fails due to incorrect newPath filesize', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      storageMock.rename.mockRejectedValue({ code: 'EXDEV' });
      userMock.getList.mockResolvedValue([userStub.user1]);
      moveMock.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });
      storageMock.stat.mockResolvedValue({
        size: 100,
      } as Stats);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(storageMock.copyFile).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(storageMock.stat).toHaveBeenCalledWith('upload/library/user-id/2023/2023-02-23/asset-id.jpg');
      expect(assetMock.update).not.toHaveBeenCalled();
    });

    it('should not update the database if the move fails', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      storageMock.rename.mockRejectedValue(new Error('Read only system'));
      storageMock.copyFile.mockRejectedValue(new Error('Read only system'));
      moveMock.create.mockResolvedValue({
        id: 'move-123',
        entityId: '123',
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: '',
      });
      userMock.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(storageMock.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(assetMock.update).not.toHaveBeenCalled();
    });
  });
});
