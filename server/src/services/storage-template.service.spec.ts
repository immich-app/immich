import { Stats } from 'node:fs';
import { defaults, SystemConfig } from 'src/config';
import { AssetPathType, JobStatus } from 'src/enum';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const motionAsset = assetStub.storageAsset({});
const stillAsset = assetStub.storageAsset({ livePhotoVideoId: motionAsset.id });

describe(StorageTemplateService.name, () => {
  let sut: StorageTemplateService;
  let mocks: ServiceMocks;

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StorageTemplateService));

    mocks.systemMetadata.get.mockResolvedValue({ storageTemplate: { enabled: true } });

    sut.onConfigInit({ newConfig: defaults });
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

  describe('getStorageTemplateOptions', () => {
    it('should send back the datetime variables', () => {
      expect(sut.getStorageTemplateOptions()).toEqual({
        dayOptions: ['d', 'dd'],
        hourOptions: ['h', 'hh', 'H', 'HH'],
        minuteOptions: ['m', 'mm'],
        monthOptions: ['M', 'MM', 'MMM', 'MMMM'],
        presetOptions: [
          '{{y}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MMMM}}-{{dd}}/{{filename}}',
          '{{y}}/{{MM}}/{{filename}}',
          '{{y}}/{{#if album}}{{album}}{{else}}Other/{{MM}}{{/if}}/{{filename}}',
          '{{y}}/{{MMM}}/{{filename}}',
          '{{y}}/{{MMMM}}/{{filename}}',
          '{{y}}/{{MM}}/{{dd}}/{{filename}}',
          '{{y}}/{{MMMM}}/{{dd}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}/{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MMM}}-{{dd}}/{{filename}}',
          '{{y}}-{{MMMM}}-{{dd}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}/{{filename}}',
          '{{y}}/{{y}}-{{WW}}/{{filename}}',
          '{{y}}/{{y}}-{{MM}}-{{dd}}/{{assetId}}',
          '{{y}}/{{y}}-{{MM}}/{{assetId}}',
          '{{y}}/{{y}}-{{WW}}/{{assetId}}',
          '{{album}}/{{filename}}',
        ],
        secondOptions: ['s', 'ss', 'SSS'],
        weekOptions: ['W', 'WW'],
        yearOptions: ['y', 'yy'],
      });
    });
  });

  describe('handleMigrationSingle', () => {
    it('should skip when storage template is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({ storageTemplate: { enabled: false } });

      await expect(sut.handleMigrationSingle({ id: testAsset.id })).resolves.toBe(JobStatus.SKIPPED);

      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.move.create).not.toHaveBeenCalled();
      expect(mocks.move.update).not.toHaveBeenCalled();
      expect(mocks.storage.stat).not.toHaveBeenCalled();
    });

    it('should migrate single moving picture', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      const newMotionPicturePath = `upload/library/${motionAsset.ownerId}/2022/2022-06-19/${motionAsset.originalFileName}`;
      const newStillPicturePath = `upload/library/${stillAsset.ownerId}/2022/2022-06-19/${stillAsset.originalFileName}`;

      mocks.asset.getStorageTemplateAsset.mockResolvedValueOnce(stillAsset);
      mocks.asset.getStorageTemplateAsset.mockResolvedValueOnce(motionAsset);

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: stillAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: stillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: motionAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: motionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await expect(sut.handleMigrationSingle({ id: stillAsset.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: stillAsset.id, originalPath: newStillPicturePath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: motionAsset.id, originalPath: newMotionPicturePath });
    });

    it('should use handlebar if condition for album', async () => {
      const asset = assetStub.storageAsset();
      const user = userStub.user1;
      const album = albumStub.oneAsset;
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other/{{MM}}{{/if}}/{{filename}}';

      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.asset.getStorageTemplateAsset.mockResolvedValueOnce(asset);
      mocks.album.getByAssetId.mockResolvedValueOnce([album]);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.SUCCESS);

      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: `upload/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/${album.albumName}/${asset.originalFileName}`,
        oldPath: asset.originalPath,
        pathType: AssetPathType.ORIGINAL,
      });
    });

    it('should use handlebar else condition for album', async () => {
      const asset = assetStub.storageAsset();
      const user = userStub.user1;
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other//{{MM}}{{/if}}/{{filename}}';
      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.asset.getStorageTemplateAsset.mockResolvedValueOnce(asset);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.SUCCESS);

      const month = (asset.fileCreatedAt.getMonth() + 1).toString().padStart(2, '0');
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: `upload/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/other/${month}/${asset.originalFileName}`,
        oldPath: asset.originalPath,
        pathType: AssetPathType.ORIGINAL,
      });
    });

    it('should migrate previously failed move from original path when it still exists', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);

      const asset = assetStub.storageAsset();
      const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${asset.originalFileName}`;
      const newPath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${asset.originalFileName}`;

      mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(path === asset.originalPath));
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.asset.getStorageTemplateAsset.mockResolvedValue(asset);
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getStorageTemplateAsset).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
      expect(mocks.storage.rename).toHaveBeenCalledWith(asset.originalPath, newPath);
      expect(mocks.move.update).toHaveBeenCalledWith('123', {
        id: '123',
        oldPath: asset.originalPath,
        newPath,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        originalPath: newPath,
      });
    });

    it('should migrate previously failed move from previous new path when old path no longer exists, should validate file size still matches before moving', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);

      const asset = assetStub.storageAsset({ fileSizeInByte: 5000 });
      const previousFailedNewPath = `upload/library/${asset.ownerId}/2022/June/${asset.originalFileName}`;
      const newPath = `upload/library/${asset.ownerId}/2022/2022-06-19/${asset.originalFileName}`;

      mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(path === previousFailedNewPath));
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(asset.checksum);
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.asset.getStorageTemplateAsset.mockResolvedValue(asset);
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: previousFailedNewPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getStorageTemplateAsset).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
      expect(mocks.storage.stat).toHaveBeenCalledWith(previousFailedNewPath);
      expect(mocks.storage.rename).toHaveBeenCalledWith(previousFailedNewPath, newPath);
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.move.update).toHaveBeenCalledWith('123', { id: '123', oldPath: previousFailedNewPath, newPath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath });
    });

    it('should fail move if copying and hash of asset and the new file do not match', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      const newPath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${testAsset.originalFileName}`;

      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(Buffer.from('different-hash', 'utf8'));
      mocks.asset.getStorageTemplateAsset.mockResolvedValue(testAsset);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: testAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: testAsset.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: testAsset.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getStorageTemplateAsset).toHaveBeenCalledWith(testAsset.id);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(1);
      expect(mocks.storage.stat).toHaveBeenCalledWith(newPath);
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: testAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: testAsset.originalPath,
        newPath,
      });
      expect(mocks.storage.rename).toHaveBeenCalledWith(testAsset.originalPath, newPath);
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(testAsset.originalPath, newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    const testAsset = assetStub.storageAsset();

    it.each`
      failedPathChecksum                     | failedPathSize              | reason
      ${testAsset.checksum}                  | ${500}                      | ${'file size'}
      ${Buffer.from('bad checksum', 'utf8')} | ${testAsset.fileSizeInByte} | ${'checksum'}
    `(
      'should fail to migrate previously failed move from previous new path when old path no longer exists if $reason validation fails',
      async ({ failedPathChecksum, failedPathSize }) => {
        mocks.user.get.mockResolvedValue(userStub.user1);
        const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${testAsset.originalFileName}`;
        const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${testAsset.originalFileName}`;

        mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(previousFailedNewPath === path));
        mocks.storage.stat.mockResolvedValue({ size: failedPathSize } as Stats);
        mocks.crypto.hashFile.mockResolvedValue(failedPathChecksum);
        mocks.move.getByEntity.mockResolvedValue({
          id: '123',
          entityId: testAsset.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: testAsset.originalPath,
          newPath: previousFailedNewPath,
        });
        mocks.asset.getStorageTemplateAsset.mockResolvedValue(testAsset);
        mocks.move.update.mockResolvedValue({
          id: '123',
          entityId: testAsset.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: previousFailedNewPath,
          newPath,
        });

        await expect(sut.handleMigrationSingle({ id: testAsset.id })).resolves.toBe(JobStatus.SUCCESS);

        expect(mocks.asset.getStorageTemplateAsset).toHaveBeenCalledWith(testAsset.id);
        expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
        expect(mocks.storage.stat).toHaveBeenCalledWith(previousFailedNewPath);
        expect(mocks.storage.rename).not.toHaveBeenCalled();
        expect(mocks.storage.copyFile).not.toHaveBeenCalled();
        expect(mocks.move.update).not.toHaveBeenCalled();
        expect(mocks.asset.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('handle template migration', () => {
    it('should handle no assets', async () => {
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([]));
      mocks.user.getList.mockResolvedValue([]);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      const asset = assetStub.storageAsset();
      const oldPath = asset.originalPath;
      const newPath = `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`;
      const newPath2 = newPath.replace('.jpg', '+1.jpg');

      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath,
        newPath,
      });

      mocks.storage.checkFileExists.mockResolvedValueOnce(true);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath2 });
      expect(mocks.user.getList).toHaveBeenCalled();
    });

    it('should skip when an asset already matches the template', async () => {
      const asset = assetStub.storageAsset({ originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg' });

      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      const asset = assetStub.storageAsset({ originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg' });

      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      const asset = assetStub.storageAsset();
      const oldPath = asset.originalPath;
      const newPath = `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`;
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(oldPath, newPath);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath });
    });

    it('should use the user storage label', async () => {
      const asset = assetStub.storageAsset();
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.user.getList.mockResolvedValue([userStub.storageLabel]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath: `upload/library/user-id/2023/2023-02-23/${asset.originalFileName}`,
      });

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        `upload/library/label-1/2022/2022-06-19/${asset.originalFileName}`,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        originalPath: `upload/library/label-1/2022/2022-06-19/${asset.originalFileName}`,
      });
    });

    it('should copy the file if rename fails due to EXDEV (rename across filesystems)', async () => {
      const asset = assetStub.storageAsset({ originalPath: '/path/to/original.jpg', fileSizeInByte: 5000 });
      const oldPath = asset.originalPath;
      const newPath = `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`;
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath,
        newPath,
      });
      mocks.storage.stat.mockResolvedValueOnce({
        atime: new Date(),
        mtime: new Date(),
      } as Stats);
      mocks.storage.stat.mockResolvedValueOnce({
        size: 5000,
      } as Stats);
      mocks.storage.stat.mockResolvedValueOnce({
        size: 5000,
        atime: new Date(),
        mtime: new Date(),
      } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(asset.checksum);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(oldPath, newPath);
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(oldPath, newPath);
      expect(mocks.storage.stat).toHaveBeenCalledWith(oldPath);
      expect(mocks.storage.stat).toHaveBeenCalledWith(newPath);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(newPath, expect.any(Date), expect.any(Date));
      expect(mocks.storage.unlink).toHaveBeenCalledWith(oldPath);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath });
    });

    it('should not update the database if the move fails due to incorrect newPath filesize', async () => {
      const asset = assetStub.storageAsset();
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath: `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      });
      mocks.storage.stat.mockResolvedValue({
        size: 100,
      } as Stats);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      );
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(
        '/original/path.jpg',
        `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      );
      expect(mocks.storage.stat).toHaveBeenCalledWith(
        `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should not update the database if the move fails', async () => {
      const asset = assetStub.storageAsset();
      mocks.asset.streamStorageTemplateAssets.mockReturnValue(makeStream([asset]));
      mocks.storage.rename.mockRejectedValue(new Error('Read only system'));
      mocks.storage.copyFile.mockRejectedValue(new Error('Read only system'));
      mocks.move.create.mockResolvedValue({
        id: 'move-123',
        entityId: asset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: asset.originalPath,
        newPath: '',
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.streamStorageTemplateAssets).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        `upload/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });
  });
});
