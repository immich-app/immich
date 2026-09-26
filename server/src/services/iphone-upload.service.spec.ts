import { StorageCore } from 'src/cores/storage.core';
import {
  AssetFileType,
  AssetPathType,
  AssetStatus,
  AssetType,
  AssetVisibility,
  JobName,
  JobStatus,
} from 'src/enum';
import { IPHONE_UPLOAD_ENV, IphoneUploadService, parseIphoneUploadConfig } from 'src/services/iphone-upload.service';
import { newTestService, ServiceMocks } from 'test/utils';
import { vitest } from 'vitest';

const userId = 'user-id';
const libraryId = 'library-id';
const folder = '/mnt/photos/louis/iphone_upload';
const monthFolder = `${folder}/2026_09`;

type TestAsset = {
  id: string;
  ownerId: string;
  libraryId: string | null;
  originalPath: string;
  originalFileName: string;
  checksum: Buffer;
  localDateTime: Date;
  type: AssetType;
  visibility: AssetVisibility;
  deletedAt: Date | null;
  livePhotoVideoId: string | null;
  files: Array<{ id: string; path: string; type: AssetFileType; isEdited: boolean }>;
};

const makeUpload = (overrides: Partial<TestAsset> = {}): TestAsset => ({
  id: 'asset-id',
  ownerId: userId,
  libraryId: null,
  originalPath: '/data/upload/user-id/as/se/asset-id.heic',
  originalFileName: 'IMG_1234.HEIC',
  checksum: Buffer.from('photo checksum'),
  localDateTime: new Date('2026-09-20T10:00:00.000Z'),
  type: AssetType.Image,
  visibility: AssetVisibility.Timeline,
  deletedAt: null,
  livePhotoVideoId: null,
  files: [],
  ...overrides,
});

describe(IphoneUploadService.name, () => {
  let sut: IphoneUploadService;
  let mocks: ServiceMocks;
  let assets: Record<string, TestAsset>;
  let existingFiles: Set<string>;

  const addAssets = (...items: TestAsset[]) => {
    for (const item of items) {
      assets[item.id] = item;
    }
  };

  beforeEach(() => {
    ({ sut, mocks } = newTestService(IphoneUploadService));
    process.env[IPHONE_UPLOAD_ENV] = `louis@example.com=${folder}`;

    assets = {};
    existingFiles = new Set([folder]);

    mocks.user.getByEmail.mockImplementation((email: string) =>
      Promise.resolve(email === 'louis@example.com' ? ({ id: userId } as any) : undefined),
    );
    mocks.library.getAll.mockResolvedValue([{ id: libraryId, ownerId: userId, importPaths: ['/mnt/photos'] } as any]);
    mocks.storage.checkFileExists.mockImplementation((path: string) => Promise.resolve(existingFiles.has(path)));
    mocks.storage.stat.mockResolvedValue({ size: 1000 } as any);
    mocks.storage.rename.mockImplementation((source: string, target: string) => {
      existingFiles.delete(source);
      existingFiles.add(target);
      return Promise.resolve();
    });
    mocks.asset.getForIphoneUpload.mockImplementation((id: string) =>
      Promise.resolve(assets[id] ? ({ ...assets[id] } as any) : undefined),
    );
    mocks.asset.getByChecksum.mockResolvedValue(undefined);

    vitest.spyOn(StorageCore.prototype, 'moveFile').mockImplementation(({ entityId, pathType, newPath }) => {
      if (pathType === AssetPathType.Original) {
        assets[entityId].originalPath = newPath;
        existingFiles.add(newPath);
      }
      return Promise.resolve();
    });
  });

  afterEach(() => {
    delete process.env[IPHONE_UPLOAD_ENV];
    vitest.restoreAllMocks();
  });

  describe('parseIphoneUploadConfig', () => {
    it('should parse several entries and report invalid ones', () => {
      expect(parseIphoneUploadConfig(' a@b.c = /one ;x@y.z=/two;broken;=/nope;')).toEqual({
        entries: [
          { email: 'a@b.c', folder: '/one' },
          { email: 'x@y.z', folder: '/two' },
        ],
        invalid: ['broken', '=/nope'],
      });
    });

    it('should handle a missing value', () => {
      expect(parseIphoneUploadConfig(undefined)).toEqual({ entries: [], invalid: [] });
    });
  });

  describe('onConfigInit', () => {
    it('should create the hourly sweep', async () => {
      mocks.database.tryLock.mockResolvedValue(true);

      await sut.onConfigInit();

      expect(mocks.cron.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'IphoneUploadSweep' }));
    });

    it('should do nothing when not configured', async () => {
      delete process.env[IPHONE_UPLOAD_ENV];

      await sut.onConfigInit();

      expect(mocks.database.tryLock).not.toHaveBeenCalled();
      expect(mocks.cron.create).not.toHaveBeenCalled();
    });
  });

  describe('onJobSuccess', () => {
    it('should queue an image once its thumbnails are generated', async () => {
      addAssets(makeUpload());

      await sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-id', source: 'upload' } },
        response: JobStatus.Success,
      });

      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.IphoneUploadAdopt, data: { id: 'asset-id' } });
    });

    it('should wait for the transcoding of a video', async () => {
      addAssets(makeUpload({ type: AssetType.Video, originalFileName: 'IMG_1235.MOV' }));

      await sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-id', source: 'upload' } },
        response: JobStatus.Success,
      });
      expect(mocks.job.queue).not.toHaveBeenCalled();

      await sut.onJobSuccess({
        job: { name: JobName.AssetEncodeVideo, data: { id: 'asset-id', source: 'upload' } },
        response: JobStatus.Skipped,
      });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.IphoneUploadAdopt, data: { id: 'asset-id' } });
    });

    it('should ignore uploads of users that are not configured', async () => {
      addAssets(makeUpload({ ownerId: 'someone-else' }));

      await sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-id', source: 'upload' } },
        response: JobStatus.Success,
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should ignore jobs that are not part of an upload', async () => {
      addAssets(makeUpload());

      await sut.onJobSuccess({
        job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-id' } },
        response: JobStatus.Success,
      });

      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should never throw, to not break the job pipeline', async () => {
      mocks.asset.getForIphoneUpload.mockRejectedValue(new Error('database down'));

      await expect(
        sut.onJobSuccess({
          job: { name: JobName.AssetGenerateThumbnails, data: { id: 'asset-id', source: 'upload' } },
          response: JobStatus.Success,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('sweep', () => {
    it('should queue candidates of configured users', async () => {
      mocks.asset.getIphoneUploadCandidateIds.mockResolvedValue(['a', 'b']);

      await sut.sweep();

      expect(mocks.asset.getIphoneUploadCandidateIds).toHaveBeenCalledWith([userId], expect.any(Date));
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.IphoneUploadAdopt, data: { id: 'a' } },
        { name: JobName.IphoneUploadAdopt, data: { id: 'b' } },
      ]);
    });
  });

  describe('handleAdopt', () => {
    it('should move an upload into the month folder and attach it to the library', async () => {
      addAssets(makeUpload());

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Success);

      expect(StorageCore.prototype.moveFile).toHaveBeenCalledWith({
        entityId: 'asset-id',
        pathType: AssetPathType.Original,
        oldPath: '/data/upload/user-id/as/se/asset-id.heic',
        newPath: `${monthFolder}/.IMG_1234.HEIC.immich-tmp`,
        assetInfo: { sizeInBytes: 1000, checksum: Buffer.from('photo checksum') },
      });
      expect(mocks.storage.rename).toHaveBeenCalledWith(
        `${monthFolder}/.IMG_1234.HEIC.immich-tmp`,
        `${monthFolder}/IMG_1234.HEIC`,
      );
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: 'asset-id',
        originalPath: `${monthFolder}/IMG_1234.HEIC`,
        libraryId,
        isExternal: true,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(userId, -1000);
    });

    it('should add a suffix when the file name is taken', async () => {
      addAssets(makeUpload());
      existingFiles.add(`${monthFolder}/IMG_1234.HEIC`);

      await sut.handleAdopt({ id: 'asset-id' });

      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({ originalPath: `${monthFolder}/IMG_1234_1.HEIC` }),
      );
    });

    it('should move a Live Photo video next to its still with the same name', async () => {
      addAssets(
        makeUpload({ livePhotoVideoId: 'video-id' }),
        makeUpload({
          id: 'video-id',
          type: AssetType.Video,
          visibility: AssetVisibility.Hidden,
          originalPath: '/data/upload/user-id/vi/de/video-id.mov',
          originalFileName: 'IMG_1234.MOV',
          checksum: Buffer.from('video checksum'),
        }),
      );
      existingFiles.add(`${monthFolder}/IMG_1234.MOV`);

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Success);

      // the video name was taken, so both files get the same suffix
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: 'video-id',
        originalPath: `${monthFolder}/IMG_1234_1.MOV`,
        libraryId,
        isExternal: true,
      });
      expect(mocks.asset.update).toHaveBeenCalledWith({
        id: 'asset-id',
        originalPath: `${monthFolder}/IMG_1234_1.HEIC`,
        libraryId,
        isExternal: true,
      });
      expect(mocks.user.updateUsage).toHaveBeenCalledWith(userId, -2000);
    });

    it('should adopt through the still when triggered by a Live Photo video', async () => {
      addAssets(
        makeUpload({ livePhotoVideoId: 'video-id' }),
        makeUpload({
          id: 'video-id',
          type: AssetType.Video,
          visibility: AssetVisibility.Hidden,
          originalPath: '/data/upload/user-id/vi/de/video-id.mov',
          originalFileName: 'IMG_1234.MOV',
        }),
      );
      mocks.asset.getLivePhotoStillId.mockResolvedValue('asset-id');

      await expect(sut.handleAdopt({ id: 'video-id' })).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.update).toHaveBeenCalledWith(expect.objectContaining({ id: 'asset-id' }));
    });

    it('should move the sidecar next to the file', async () => {
      addAssets(
        makeUpload({
          files: [{ id: 'file-id', path: '/data/upload/user-id/as/se/asset-id.xmp', type: AssetFileType.Sidecar, isEdited: false }],
        }),
      );

      await sut.handleAdopt({ id: 'asset-id' });

      expect(StorageCore.prototype.moveFile).toHaveBeenCalledWith({
        entityId: 'asset-id',
        pathType: AssetFileType.Sidecar,
        oldPath: '/data/upload/user-id/as/se/asset-id.xmp',
        newPath: `${monthFolder}/IMG_1234.HEIC.xmp`,
      });
    });

    it('should never move assets of the locked folder', async () => {
      addAssets(makeUpload({ visibility: AssetVisibility.Locked }));

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Skipped);

      expect(StorageCore.prototype.moveFile).not.toHaveBeenCalled();
    });

    it('should skip assets that are already in a library', async () => {
      addAssets(makeUpload({ libraryId }));

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should skip users that are not configured', async () => {
      addAssets(makeUpload({ ownerId: 'someone-else' }));

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Skipped);
      expect(StorageCore.prototype.moveFile).not.toHaveBeenCalled();
    });

    it('should skip entries whose folder is not in a library of the user', async () => {
      process.env[IPHONE_UPLOAD_ENV] = 'louis@example.com=/somewhere/else';
      existingFiles.add('/somewhere/else');
      addAssets(makeUpload());

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Skipped);
    });

    it('should trash the upload when its content is already in the library', async () => {
      addAssets(makeUpload());
      mocks.asset.getByChecksum.mockResolvedValue({ id: 'existing-id' } as any);

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Success);

      expect(StorageCore.prototype.moveFile).not.toHaveBeenCalled();
      expect(mocks.asset.updateAll).toHaveBeenCalledWith(['asset-id'], {
        deletedAt: expect.any(Date),
        status: AssetStatus.Trashed,
      });
    });

    it('should not attach the asset when the move failed', async () => {
      addAssets(makeUpload());
      vitest.spyOn(StorageCore.prototype, 'moveFile').mockResolvedValue();

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Failed);

      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.asset.update).not.toHaveBeenCalled();
    });

    it('should resume a move interrupted before the rename', async () => {
      const tmpPath = `${monthFolder}/.IMG_1234.HEIC.immich-tmp`;
      addAssets(makeUpload({ originalPath: tmpPath }));
      existingFiles.add(tmpPath);

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Success);

      expect(StorageCore.prototype.moveFile).not.toHaveBeenCalled();
      expect(mocks.storage.rename).toHaveBeenCalledWith(tmpPath, `${monthFolder}/IMG_1234.HEIC`);
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({ originalPath: `${monthFolder}/IMG_1234.HEIC`, libraryId }),
      );
      expect(mocks.user.updateUsage).not.toHaveBeenCalled();
    });

    it('should resume a move interrupted after the rename', async () => {
      addAssets(makeUpload({ originalPath: `${monthFolder}/.IMG_1234.HEIC.immich-tmp` }));
      existingFiles.add(`${monthFolder}/IMG_1234.HEIC`);

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Success);

      expect(mocks.storage.rename).not.toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({ originalPath: `${monthFolder}/IMG_1234.HEIC`, libraryId }),
      );
    });

    it('should refuse to move files when hash verification is disabled', async () => {
      addAssets(makeUpload());
      mocks.systemMetadata.get.mockResolvedValue({ storageTemplate: { hashVerificationEnabled: false } });

      await expect(sut.handleAdopt({ id: 'asset-id' })).resolves.toBe(JobStatus.Skipped);
      expect(StorageCore.prototype.moveFile).not.toHaveBeenCalled();
    });
  });
});
