import { Stats } from 'node:fs';
import { defaults, SystemConfig } from 'src/config';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetPathType, JobStatus } from 'src/enum';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { albumStub } from 'test/fixtures/album.stub';
import { assetStub } from 'test/fixtures/asset.stub';
import { userStub } from 'test/fixtures/user.stub';
import { newTestService, ServiceMocks } from 'test/utils';

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
      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SKIPPED);
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
      const newMotionPicturePath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${assetStub.livePhotoStillAsset.id}.mp4`;
      const newStillPicturePath = `upload/library/${userStub.user1.id}/2022/2022-06-19/${assetStub.livePhotoStillAsset.id}.jpeg`;

      mocks.asset.getByIds.mockImplementation((ids) => {
        const assets = [assetStub.livePhotoStillAsset, assetStub.livePhotoMotionAsset];
        return Promise.resolve(
          ids.map((id) => assets.find((asset) => asset.id === id)).filter((asset) => !!asset),
        ) as Promise<AssetEntity[]>;
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: assetStub.livePhotoStillAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.livePhotoStillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: assetStub.livePhotoMotionAsset.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.livePhotoMotionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.livePhotoStillAsset.id })).resolves.toBe(
        JobStatus.SUCCESS,
      );

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoStillAsset.id], { exifInfo: true });
      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.livePhotoMotionAsset.id], { exifInfo: true });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.livePhotoStillAsset.id,
        originalPath: newStillPicturePath,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
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

      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.asset.getByIds.mockResolvedValueOnce([asset]);
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
      const asset = assetStub.image;
      const user = userStub.user1;
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other//{{MM}}{{/if}}/{{filename}}';
      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.asset.getByIds.mockResolvedValueOnce([asset]);

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
      const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      mocks.storage.checkFileExists.mockImplementation((path) =>
        Promise.resolve(path === assetStub.image.originalPath),
      );
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
      expect(mocks.storage.rename).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(mocks.move.update).toHaveBeenCalledWith('123', {
        id: '123',
        oldPath: assetStub.image.originalPath,
        newPath,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should migrate previously failed move from previous new path when old path no longer exists, should validate file size still matches before moving', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(path === previousFailedNewPath));
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(assetStub.image.checksum);
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: previousFailedNewPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
      expect(mocks.storage.stat).toHaveBeenCalledWith(previousFailedNewPath);
      expect(mocks.storage.rename).toHaveBeenCalledWith(previousFailedNewPath, newPath);
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.move.update).toHaveBeenCalledWith('123', {
        id: '123',
        oldPath: previousFailedNewPath,
        newPath,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should fail move if copying and hash of asset and the new file do not match', async () => {
      mocks.user.get.mockResolvedValue(userStub.user1);
      const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(Buffer.from('different-hash', 'utf8'));
      mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

      expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(1);
      expect(mocks.storage.stat).toHaveBeenCalledWith(newPath);
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath,
      });
      expect(mocks.storage.rename).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(assetStub.image.originalPath, newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it.each`
      failedPathChecksum                     | failedPathSize                              | reason
      ${assetStub.image.checksum}            | ${500}                                      | ${'file size'}
      ${Buffer.from('bad checksum', 'utf8')} | ${assetStub.image.exifInfo?.fileSizeInByte} | ${'checksum'}
    `(
      'should fail to migrate previously failed move from previous new path when old path no longer exists if $reason validation fails',
      async ({ failedPathChecksum, failedPathSize }) => {
        mocks.user.get.mockResolvedValue(userStub.user1);
        const previousFailedNewPath = `upload/library/${userStub.user1.id}/2023/Feb/${assetStub.image.id}.jpg`;
        const newPath = `upload/library/${userStub.user1.id}/2023/2023-02-23/${assetStub.image.id}.jpg`;

        mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(previousFailedNewPath === path));
        mocks.storage.stat.mockResolvedValue({ size: failedPathSize } as Stats);
        mocks.crypto.hashFile.mockResolvedValue(failedPathChecksum);
        mocks.move.getByEntity.mockResolvedValue({
          id: '123',
          entityId: assetStub.image.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: assetStub.image.originalPath,
          newPath: previousFailedNewPath,
        });
        mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
        mocks.move.update.mockResolvedValue({
          id: '123',
          entityId: assetStub.image.id,
          pathType: AssetPathType.ORIGINAL,
          oldPath: previousFailedNewPath,
          newPath,
        });

        await expect(sut.handleMigrationSingle({ id: assetStub.image.id })).resolves.toBe(JobStatus.SUCCESS);

        expect(mocks.asset.getByIds).toHaveBeenCalledWith([assetStub.image.id], { exifInfo: true });
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
      mocks.asset.getAll.mockResolvedValue({
        items: [],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([]);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
      });

      mocks.storage.checkFileExists.mockResolvedValueOnce(true);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
      });
      expect(mocks.user.getList).toHaveBeenCalled();
    });

    it('should skip when an asset already matches the template', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [
          {
            ...assetStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
          },
        ],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [
          {
            ...assetStub.image,
            originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id+1.jpg',
          },
        ],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });
    });

    it('should use the user storage label', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.user.getList.mockResolvedValue([userStub.storageLabel]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/label-1/2023/2023-02-23/asset-id.jpg',
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: 'upload/library/label-1/2023/2023-02-23/asset-id.jpg',
      });
    });

    it('should copy the file if rename fails due to EXDEV (rename across filesystems)', async () => {
      const newPath = 'upload/library/user-id/2023/2023-02-23/asset-id.jpg';
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
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
        atime: new Date(),
        mtime: new Date(),
      } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(assetStub.image.checksum);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith('/original/path.jpg', newPath);
      expect(mocks.storage.copyFile).toHaveBeenCalledWith('/original/path.jpg', newPath);
      expect(mocks.storage.stat).toHaveBeenCalledWith(newPath);
      expect(mocks.storage.stat).toHaveBeenCalledWith(assetStub.image.originalPath);
      expect(mocks.storage.utimes).toHaveBeenCalledWith(newPath, expect.any(Date), expect.any(Date));
      expect(mocks.storage.unlink).toHaveBeenCalledWith(assetStub.image.originalPath);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: assetStub.image.id,
        originalPath: newPath,
      });
    });

    it('should not update the database if the move fails due to incorrect newPath filesize', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: assetStub.image.id,
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: 'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      });
      mocks.storage.stat.mockResolvedValue({
        size: 100,
      } as Stats);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(mocks.storage.stat).toHaveBeenCalledWith('upload/library/user-id/2023/2023-02-23/asset-id.jpg');
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should not update the database if the move fails', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });
      mocks.storage.rename.mockRejectedValue(new Error('Read only system'));
      mocks.storage.copyFile.mockRejectedValue(new Error('Read only system'));
      mocks.move.create.mockResolvedValue({
        id: 'move-123',
        entityId: '123',
        pathType: AssetPathType.ORIGINAL,
        oldPath: assetStub.image.originalPath,
        newPath: '',
      });
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        '/original/path.jpg',
        'upload/library/user-id/2023/2023-02-23/asset-id.jpg',
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });
  });
});
