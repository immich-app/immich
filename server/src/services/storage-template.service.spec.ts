import { Stats } from 'node:fs';
import { defaults, SystemConfig } from 'src/config';
import { AssetPathType, AssetType, JobStatus } from 'src/enum';
import { StorageTemplateService } from 'src/services/storage-template.service';
import { AlbumFactory } from 'test/factories/album.factory';
import { AssetFactory } from 'test/factories/asset.factory';
import { UserFactory } from 'test/factories/user.factory';
import { userStub } from 'test/fixtures/user.stub';
import { getForStorageTemplate } from 'test/mappers';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

const motionAsset = AssetFactory.from({ type: AssetType.Video }).exif().build();
const stillAsset = AssetFactory.from({ livePhotoVideoId: motionAsset.id }).exif().build();

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
          '{{#if album}}{{album-startDate-y}}/{{album}}{{else}}{{y}}/Other/{{MM}}{{/if}}/{{filename}}',
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
          '{{make}}/{{model}}/{{lensModel}}/{{filename}}',
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

      await expect(sut.handleMigrationSingle({ id: testAsset.id })).resolves.toBe(JobStatus.Skipped);

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
      const motionAsset = AssetFactory.from({
        type: AssetType.Video,

        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();
      const stillAsset = AssetFactory.from({
        livePhotoVideoId: motionAsset.id,

        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();

      mocks.user.get.mockResolvedValue(userStub.user1);
      const newMotionPicturePath = `/data/library/${motionAsset.ownerId}/2022/2022-06-19/${stillAsset.originalFileName.slice(0, -4)}.mp4`;
      const newStillPicturePath = `/data/library/${stillAsset.ownerId}/2022/2022-06-19/${stillAsset.originalFileName}`;

      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(stillAsset));
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(motionAsset));

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: stillAsset.id,
        pathType: AssetPathType.Original,
        oldPath: stillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: motionAsset.id,
        pathType: AssetPathType.Original,
        oldPath: motionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await expect(sut.handleMigrationSingle({ id: stillAsset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: stillAsset.id, originalPath: newStillPicturePath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: motionAsset.id, originalPath: newMotionPicturePath });
    });

    it('should migrate live photo motion video alongside the still image using album in path', async () => {
      const motionAsset = AssetFactory.from({
        type: AssetType.Video,
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();
      const stillAsset = AssetFactory.from({
        livePhotoVideoId: motionAsset.id,
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();

      const album = AlbumFactory.from().asset().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other/{{MM}}{{/if}}/{{filename}}';
      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(userStub.user1);

      const newMotionPicturePath = `/data/library/${motionAsset.ownerId}/2022/${album.albumName}/${stillAsset.originalFileName.slice(0, -4)}.mp4`;
      const newStillPicturePath = `/data/library/${stillAsset.ownerId}/2022/${album.albumName}/${stillAsset.originalFileName}`;

      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(stillAsset));
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(motionAsset));
      mocks.album.getByAssetId.mockResolvedValue([album]);

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: stillAsset.id,
        pathType: AssetPathType.Original,
        oldPath: stillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: motionAsset.id,
        pathType: AssetPathType.Original,
        oldPath: motionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await expect(sut.handleMigrationSingle({ id: stillAsset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.album.getByAssetId).toHaveBeenCalledWith(stillAsset.ownerId, stillAsset.id);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: stillAsset.id, originalPath: newStillPicturePath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: motionAsset.id, originalPath: newMotionPicturePath });
    });

    it('should use handlebar if condition for album', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from().owner(user).exif().build();
      const album = AlbumFactory.from().asset().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other/{{MM}}{{/if}}/{{filename}}';

      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(asset));
      mocks.album.getByAssetId.mockResolvedValueOnce([album]);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.Success);

      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: expect.stringContaining(
          `/data/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/${album.albumName}/${asset.originalFileName}`,
        ),
        oldPath: asset.originalPath,
        pathType: AssetPathType.Original,
      });
    });

    it('should use handlebar else condition for album', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from().owner(user).exif().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other//{{MM}}{{/if}}/{{filename}}';
      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(asset));

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.Success);

      const month = (asset.fileCreatedAt.getMonth() + 1).toString().padStart(2, '0');
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: expect.stringContaining(
          `/data/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/other/${month}/${asset.originalFileName}`,
        ),
        oldPath: asset.originalPath,
        pathType: AssetPathType.Original,
      });
    });

    it('should handle album startDate', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from().owner(user).exif().build();
      const album = AlbumFactory.from().asset().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template =
        '{{#if album}}{{album-startDate-y}}/{{album-startDate-MM}} - {{album}}{{else}}{{y}}/{{MM}}/{{/if}}/{{filename}}';

      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(asset));
      mocks.album.getByAssetId.mockResolvedValueOnce([album]);
      mocks.album.getMetadataForIds.mockResolvedValueOnce([
        {
          startDate: asset.fileCreatedAt,
          endDate: asset.fileCreatedAt,
          albumId: album.id,
          assetCount: 1,
          lastModifiedAssetTimestamp: null,
        },
      ]);

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.Success);

      const month = (asset.fileCreatedAt.getMonth() + 1).toString().padStart(2, '0');
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: expect.stringContaining(
          `/data/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/${month} - ${album.albumName}/${asset.originalFileName}`,
        ),
        oldPath: asset.originalPath,
        pathType: AssetPathType.Original,
      });
    });

    it('should handle else condition from album startDate', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from().owner(user).exif().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template =
        '{{#if album}}{{album-startDate-y}}/{{album-startDate-MM}} - {{album}}{{else}}{{y}}/{{MM}}/{{/if}}/{{filename}}';

      sut.onConfigInit({ newConfig: config });

      mocks.user.get.mockResolvedValue(user);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(asset));

      expect(await sut.handleMigrationSingle({ id: asset.id })).toBe(JobStatus.Success);

      const month = (asset.fileCreatedAt.getMonth() + 1).toString().padStart(2, '0');
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        newPath: `/data/library/${user.id}/${asset.fileCreatedAt.getFullYear()}/${month}/${asset.originalFileName}`,
        oldPath: asset.originalPath,
        pathType: AssetPathType.Original,
      });
    });

    it('should migrate previously failed move from original path when it still exists', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif()
        .build();

      mocks.user.get.mockResolvedValue(user);

      const previousFailedNewPath = `/data/library/${user.id}/2023/Feb/${asset.originalFileName}`;
      const newPath = `/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`;

      mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(path === asset.originalPath));
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValue(getForStorageTemplate(asset));
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.getForStorageTemplateJob).toHaveBeenCalledWith(asset.id);
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
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif({ fileSizeInByte: 5000 })
        .build();

      mocks.user.get.mockResolvedValue(user);

      const previousFailedNewPath = `/data/library/${asset.ownerId}/2022/June/${asset.originalFileName}`;
      const newPath = `/data/library/${asset.ownerId}/2022/2022-06-19/${asset.originalFileName}`;

      mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(path === previousFailedNewPath));
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(asset.checksum);
      mocks.move.getByEntity.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath: previousFailedNewPath,
      });
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValue(getForStorageTemplate(asset));
      mocks.move.update.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: previousFailedNewPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.getForStorageTemplateJob).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(3);
      expect(mocks.storage.stat).toHaveBeenCalledWith(previousFailedNewPath);
      expect(mocks.storage.rename).toHaveBeenCalledWith(previousFailedNewPath, newPath);
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.move.update).toHaveBeenCalledWith('123', { id: '123', oldPath: previousFailedNewPath, newPath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath });
    });

    it('should fail move if copying and hash of asset and the new file do not match', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif()
        .build();

      mocks.user.get.mockResolvedValue(user);
      const newPath = `/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`;

      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.storage.stat.mockResolvedValue({ size: 5000 } as Stats);
      mocks.crypto.hashFile.mockResolvedValue(Buffer.from('different-hash', 'utf8'));
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValue(getForStorageTemplate(asset));
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath,
      });

      await expect(sut.handleMigrationSingle({ id: asset.id })).resolves.toBe(JobStatus.Success);

      expect(mocks.assetJob.getForStorageTemplateJob).toHaveBeenCalledWith(asset.id);
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(1);
      expect(mocks.storage.stat).toHaveBeenCalledWith(newPath);
      expect(mocks.move.create).toHaveBeenCalledWith({
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath,
      });
      expect(mocks.storage.rename).toHaveBeenCalledWith(asset.originalPath, newPath);
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(asset.originalPath, newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(newPath);
      expect(mocks.storage.unlink).toHaveBeenCalledTimes(1);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    const testAsset = AssetFactory.from().exif({ fileSizeInByte: 12_345 }).build();

    it.each`
      failedPathChecksum                     | failedPathSize                       | reason
      ${testAsset.checksum}                  | ${500}                               | ${'file size'}
      ${Buffer.from('bad checksum', 'utf8')} | ${testAsset.exifInfo.fileSizeInByte} | ${'checksum'}
    `(
      'should fail to migrate previously failed move from previous new path when old path no longer exists if $reason validation fails',
      async ({ failedPathChecksum, failedPathSize }) => {
        mocks.user.get.mockResolvedValue(userStub.user1);
        const previousFailedNewPath = `/data/library/${userStub.user1.id}/2023/Feb/${testAsset.originalFileName}`;
        const newPath = `/data/library/${userStub.user1.id}/2023/2023-02-23/${testAsset.originalFileName}`;

        mocks.storage.checkFileExists.mockImplementation((path) => Promise.resolve(previousFailedNewPath === path));
        mocks.storage.stat.mockResolvedValue({ size: failedPathSize } as Stats);
        mocks.crypto.hashFile.mockResolvedValue(failedPathChecksum);
        mocks.move.getByEntity.mockResolvedValue({
          id: '123',
          entityId: testAsset.id,
          pathType: AssetPathType.Original,
          oldPath: testAsset.originalPath,
          newPath: previousFailedNewPath,
        });
        mocks.assetJob.getForStorageTemplateJob.mockResolvedValue(getForStorageTemplate(testAsset));
        mocks.move.update.mockResolvedValue({
          id: '123',
          entityId: testAsset.id,
          pathType: AssetPathType.Original,
          oldPath: previousFailedNewPath,
          newPath,
        });

        await expect(sut.handleMigrationSingle({ id: testAsset.id })).resolves.toBe(JobStatus.Success);

        expect(mocks.assetJob.getForStorageTemplateJob).toHaveBeenCalledWith(testAsset.id);
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
      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([]));
      mocks.user.getList.mockResolvedValue([]);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
    });

    it('should handle an asset with a duplicate destination', async () => {
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();

      const oldPath = asset.originalPath;
      const newPath = `/data/library/${asset.ownerId}/2022/2022-06-19/${asset.originalFileName}`;
      const newPath2 = newPath.replace('.jpg', '+1.jpg');

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath,
        newPath,
      });

      mocks.storage.checkFileExists.mockResolvedValueOnce(true);
      mocks.storage.checkFileExists.mockResolvedValueOnce(false);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath2 });
      expect(mocks.user.getList).toHaveBeenCalled();
    });

    it('should skip when an asset already matches the template', async () => {
      const asset = AssetFactory.from({
        originalPath: '/data/library/user-id/2023/2023-02-23/asset-id.jpg',
      })
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should skip when an asset is probably a duplicate', async () => {
      const asset = AssetFactory.from({
        originalPath: '/data/library/user-id/2023/2023-02-23/asset-id+1.jpg',
      })
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.storage.copyFile).not.toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).not.toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should move an asset', async () => {
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();

      const oldPath = asset.originalPath;
      const newPath = `/data/library/${asset.ownerId}/2022/2022-06-19/${asset.originalFileName}`;
      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(oldPath, newPath);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: asset.id, originalPath: newPath });
    });

    it('should use the user storage label', async () => {
      const user = UserFactory.create({ storageLabel: 'label-1' });
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath: `/data/library/${user.storageLabel}/2023/2023-02-23/${asset.originalFileName}`,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        asset.originalPath,
        expect.stringContaining(`/data/library/${user.storageLabel}/2022/2022-06-19/${asset.originalFileName}`),
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: asset.id,
        originalPath: expect.stringContaining(
          `/data/library/${user.storageLabel}/2022/2022-06-19/${asset.originalFileName}`,
        ),
      });
    });

    it('should copy the file if rename fails due to EXDEV (rename across filesystems)', async () => {
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
        originalPath: '/path/to/original.jpg',
      })
        .exif({ fileSizeInByte: 5000 })
        .build();

      const oldPath = asset.originalPath;
      const newPath = `/data/library/${asset.ownerId}/2022/2022-06-19/${asset.originalFileName}`;
      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
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

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
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
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.storage.rename.mockRejectedValue({ code: 'EXDEV' });
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath: `/data/library/user-id/2022/2022-06-19/${asset.originalFileName}`,
      });
      mocks.storage.stat.mockResolvedValue({
        size: 100,
      } as Stats);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        asset.originalPath,
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`),
      );
      expect(mocks.storage.copyFile).toHaveBeenCalledWith(
        asset.originalPath,
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`),
      );
      expect(mocks.storage.stat).toHaveBeenCalledWith(
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`),
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should not update the database if the move fails', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.storage.rename.mockRejectedValue(new Error('Read only system'));
      mocks.storage.copyFile.mockRejectedValue(new Error('Read only system'));
      mocks.move.create.mockResolvedValue({
        id: 'move-123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: asset.originalPath,
        newPath: '',
      });
      mocks.user.getList.mockResolvedValue([user]);

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        asset.originalPath,
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/${asset.originalFileName}`),
      );
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should migrate live photo motion video alongside the still image', async () => {
      const motionAsset = AssetFactory.from({
        type: AssetType.Video,
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();
      const stillAsset = AssetFactory.from({
        livePhotoVideoId: motionAsset.id,
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
      })
        .exif()
        .build();
      const album = AlbumFactory.from().asset().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other/{{MM}}{{/if}}/{{filename}}';
      sut.onConfigInit({ newConfig: config });

      const newMotionPicturePath = `/data/library/${motionAsset.ownerId}/2022/${album.albumName}/${stillAsset.originalFileName.slice(0, -4)}.mp4`;
      const newStillPicturePath = `/data/library/${stillAsset.ownerId}/2022/${album.albumName}/${stillAsset.originalFileName}`;

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(stillAsset)]));
      mocks.user.getList.mockResolvedValue([userStub.user1]);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(motionAsset));
      mocks.album.getByAssetId.mockResolvedValue([album]);

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: stillAsset.id,
        pathType: AssetPathType.Original,
        oldPath: stillAsset.originalPath,
        newPath: newStillPicturePath,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: motionAsset.id,
        pathType: AssetPathType.Original,
        oldPath: motionAsset.originalPath,
        newPath: newMotionPicturePath,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.checkFileExists).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: stillAsset.id, originalPath: newStillPicturePath });
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: motionAsset.id, originalPath: newMotionPicturePath });
    });

    it('should use still photo album info when migrating live photo motion video', async () => {
      const user = userStub.user1;
      const album = AlbumFactory.from().asset().build();
      const config = structuredClone(defaults);
      config.storageTemplate.template = '{{y}}/{{#if album}}{{album}}{{else}}other{{/if}}/{{filename}}';

      sut.onConfigInit({ newConfig: config });

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(stillAsset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.assetJob.getForStorageTemplateJob.mockResolvedValueOnce(getForStorageTemplate(motionAsset));
      mocks.album.getByAssetId.mockResolvedValue([album]);

      mocks.move.create.mockResolvedValueOnce({
        id: '123',
        entityId: stillAsset.id,
        pathType: AssetPathType.Original,
        oldPath: stillAsset.originalPath,
        newPath: `/data/library/${user.id}/2022/${album.albumName}/${stillAsset.originalFileName}`,
      });

      mocks.move.create.mockResolvedValueOnce({
        id: '124',
        entityId: motionAsset.id,
        pathType: AssetPathType.Original,
        oldPath: motionAsset.originalPath,
        newPath: `/data/library/${user.id}/2022/${album.albumName}/${motionAsset.originalFileName}`,
      });

      await sut.handleMigration();

      expect(mocks.album.getByAssetId).toHaveBeenCalledWith(stillAsset.ownerId, stillAsset.id);
      expect(mocks.album.getByAssetId).toHaveBeenCalledTimes(2);
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: stillAsset.id,
        originalPath: expect.stringContaining(`/${album.albumName}/`),
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: motionAsset.id,
        originalPath: expect.stringContaining(`/${album.albumName}/`),
      });
    });
  });

  describe('file rename correctness', () => {
    it('should not create double extensions when filename has lower extension', async () => {
      const user = UserFactory.create({ storageLabel: 'label-1' });
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
        originalPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.heic`,
        originalFileName: 'IMG_7065.HEIC',
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.heic`,
        newPath: `/data/library/${user.id}/2023/2023-02-23/IMG_7065.heic`,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.heic`),
        expect.stringContaining(`/data/library/${user.storageLabel}/2022/2022-06-19/IMG_7065.heic`),
      );
    });

    it('should not create double extensions when filename has uppercase extension', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
        originalPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.HEIC`,
        originalFileName: 'IMG_7065.HEIC',
      })
        .owner(user)
        .exif({ fileSizeInByte: 12_345 })
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.HEIC`,
        newPath: `/data/library/${user.id}/2023/2023-02-23/IMG_7065.heic`,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.HEIC`),
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.heic`),
      );
    });

    it('should normalize the filename to lowercase (JPEG > jpg)', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
        originalPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.JPEG`,
        originalFileName: 'IMG_7065.JPEG',
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.JPEG`,
        newPath: `/data/library/${user.id}/2023/2023-02-23/IMG_7065.jpg`,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.JPEG`),
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.jpg`),
      );
    });

    it('should normalize the filename to lowercase (JPG > jpg)', async () => {
      const user = UserFactory.create();
      const asset = AssetFactory.from({
        fileCreatedAt: new Date('2022-06-19T23:41:36.910Z'),
        originalPath: '/data/library/user-id/2022/2022-06-19/IMG_7065.JPG',
        originalFileName: 'IMG_7065.JPG',
      })
        .owner(user)
        .exif()
        .build();

      mocks.assetJob.streamForStorageTemplateJob.mockReturnValue(makeStream([getForStorageTemplate(asset)]));
      mocks.user.getList.mockResolvedValue([user]);
      mocks.move.create.mockResolvedValue({
        id: '123',
        entityId: asset.id,
        pathType: AssetPathType.Original,
        oldPath: `/data/library/${user.id}/2022/2022-06-19/IMG_7065.JPG`,
        newPath: `/data/library/${user.id}/2023/2023-02-23/IMG_7065.jpg`,
      });

      await sut.handleMigration();

      expect(mocks.assetJob.streamForStorageTemplateJob).toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.JPG`),
        expect.stringContaining(`/data/library/${user.id}/2022/2022-06-19/IMG_7065.jpg`),
      );
    });
  });
});
