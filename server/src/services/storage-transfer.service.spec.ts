import { Readable, Writable } from 'node:stream';
import { StorageCore } from 'src/cores/storage.core';
import {
  JobStatus,
  StorageTargetKind,
  StorageTransferDirection,
  StorageTransferScopeType,
  StorageTransferStatus,
} from 'src/enum';
import { StorageTransferService } from 'src/services/storage-transfer.service';
import { newTestService, ServiceMocks } from 'test/utils';

const targetStub = {
  id: 'target-1',
  name: 'MinIO',
  kind: StorageTargetKind.S3,
  config: {
    kind: StorageTargetKind.S3 as const,
    endpoint: 'http://minio:9000',
    bucket: 'immich',
    region: 'us-east-1',
    forcePathStyle: true,
    prefix: '',
  },
  secret: { kind: StorageTargetKind.S3 as const, accessKeyId: 'key', secretAccessKey: 'secret' },
  isEnabled: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const transferStub = {
  id: 'transfer-1',
  targetId: 'target-1',
  ownerId: 'user-1',
  direction: StorageTransferDirection.Export,
  status: StorageTransferStatus.Running,
  scope: { type: StorageTransferScopeType.All } as const,
  totalCount: 1,
  completedCount: 0,
  failedCount: 0,
  startedAt: new Date('2026-01-01'),
  finishedAt: null,
  error: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  updateId: 'update-1',
};

const assetStub = {
  id: 'asset-1',
  ownerId: 'user-1',
  originalPath: '/data/library/user-1/2026/2026-01-01/IMG_0001.jpg',
  originalFileName: 'IMG_0001.jpg',
  checksum: Buffer.from('checksum'),
  type: 'IMAGE',
  fileSizeInByte: 1024,
};

const objectStub = {
  id: 'object-1',
  targetId: 'target-1',
  remoteKey: 'user-1/2026/2026-01-01/IMG_0001.jpg',
  assetId: 'asset-1',
  size: 1024,
  checksum: Buffer.from('checksum'),
  syncedAt: new Date('2026-01-01'),
};

const asAsyncBatches = <T>(...batches: T[][]) => {
  let index = 0;
  return {
    [Symbol.asyncIterator]: () => ({
      next: () =>
        Promise.resolve(
          index < batches.length ? { value: batches[index++], done: false } : { value: undefined, done: true },
        ),
    }),
  } as AsyncIterableIterator<T[]>;
};

const asAsyncItems = <T>(...items: T[]) => {
  let index = 0;
  return {
    [Symbol.asyncIterator]: () => ({
      next: () =>
        Promise.resolve(
          index < items.length ? { value: items[index++], done: false } : { value: undefined, done: true },
        ),
    }),
  } as AsyncIterableIterator<T>;
};

const asAsyncThrow = (error: Error) =>
  ({
    [Symbol.asyncIterator]: () => ({ next: () => Promise.reject(error) }),
  }) as unknown as AsyncIterableIterator<never>;

const setupDownload = (mocks: ServiceMocks) => {
  mocks.storage.mkdirSync.mockReturnValue(void 0);
  mocks.remoteStorage.createReadStream.mockResolvedValue(Readable.from(['data']));
  mocks.storage.createWriteStream.mockImplementation(
    () =>
      new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
      }),
  );
  mocks.crypto.hashFile.mockResolvedValue(Buffer.from('checksum'));
  mocks.storage.stat.mockResolvedValue({ size: 1024, mtime: new Date('2026-01-01') } as never);
};

describe(StorageTransferService.name, () => {
  let sut: StorageTransferService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(StorageTransferService));

    StorageCore.setMediaLocation('/data');

    mocks.storageTarget.getTransfer.mockResolvedValue(transferStub);
    mocks.storageTarget.get.mockResolvedValue(targetStub);
    mocks.storageTarget.updateTransfer.mockResolvedValue(transferStub);
    mocks.storageTarget.incrementTransferProgress.mockResolvedValue(transferStub);
    mocks.storageTarget.upsertObject.mockResolvedValue(objectStub);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleExportQueue', () => {
    it('should skip a transfer that no longer exists', async () => {
      mocks.storageTarget.getTransfer.mockResolvedValue(void 0);

      await expect(sut.handleExportQueue({ transferId: 'transfer-1' })).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });

    it('should queue one job per asset and record the total', async () => {
      mocks.storageTarget.streamAssetsForExport.mockReturnValue(
        asAsyncItems({ id: 'asset-1' }, { id: 'asset-2' }) as never,
      );

      await expect(sut.handleExportQueue({ transferId: 'transfer-1' })).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
      expect(mocks.storageTarget.updateTransfer).toHaveBeenCalledWith('transfer-1', { totalCount: 2 });
    });

    it('should complete immediately when there is nothing to export', async () => {
      mocks.storageTarget.streamAssetsForExport.mockReturnValue(asAsyncItems() as never);

      await expect(sut.handleExportQueue({ transferId: 'transfer-1' })).resolves.toBe(JobStatus.Success);

      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.storageTarget.updateTransfer).toHaveBeenCalledWith(
        'transfer-1',
        expect.objectContaining({ status: StorageTransferStatus.Completed }),
      );
    });
  });

  describe('handleExportAsset', () => {
    it('should skip an asset already recorded on the target', async () => {
      mocks.storageTarget.getAssetForExport.mockResolvedValue(assetStub as never);
      mocks.storageTarget.getObjectByAsset.mockResolvedValue(objectStub);

      await expect(sut.handleExportAsset({ transferId: 'transfer-1', assetId: 'asset-1' })).resolves.toBe(
        JobStatus.Skipped,
      );

      expect(mocks.remoteStorage.upload).not.toHaveBeenCalled();
      expect(mocks.storageTarget.incrementTransferProgress).toHaveBeenCalledWith('transfer-1', { completed: 1 });
    });

    it('should upload the original under a key mirroring the library layout', async () => {
      mocks.storageTarget.getAssetForExport.mockResolvedValue(assetStub as never);
      mocks.storageTarget.getObjectByAsset.mockResolvedValue(void 0);
      mocks.storage.stat.mockResolvedValue({ size: 1024 } as never);
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(['data']));
      mocks.storage.checkFileExists.mockResolvedValue(false);
      mocks.remoteStorage.upload.mockResolvedValue({ key: objectStub.remoteKey, size: 1024 });

      await expect(sut.handleExportAsset({ transferId: 'transfer-1', assetId: 'asset-1' })).resolves.toBe(
        JobStatus.Success,
      );

      expect(mocks.remoteStorage.upload).toHaveBeenCalledWith(
        targetStub,
        'user-1/2026/2026-01-01/IMG_0001.jpg',
        expect.anything(),
        expect.objectContaining({ size: 1024 }),
      );
      expect(mocks.storageTarget.incrementTransferProgress).toHaveBeenCalledWith('transfer-1', { completed: 1 });
    });

    it('should also upload the sidecar when one exists', async () => {
      mocks.storageTarget.getAssetForExport.mockResolvedValue(assetStub as never);
      mocks.storageTarget.getObjectByAsset.mockResolvedValue(void 0);
      mocks.storage.stat.mockResolvedValue({ size: 1024 } as never);
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(['data']));
      mocks.storage.checkFileExists.mockResolvedValue(true);
      mocks.remoteStorage.upload.mockResolvedValue({ key: objectStub.remoteKey, size: 1024 });

      await sut.handleExportAsset({ transferId: 'transfer-1', assetId: 'asset-1' });

      expect(mocks.remoteStorage.upload).toHaveBeenCalledTimes(2);
      expect(mocks.remoteStorage.upload).toHaveBeenCalledWith(
        targetStub,
        'user-1/2026/2026-01-01/IMG_0001.jpg.xmp',
        expect.anything(),
        expect.objectContaining({ contentType: 'application/xml' }),
      );
    });

    it('should count a failure without aborting the rest of the transfer', async () => {
      mocks.storageTarget.getAssetForExport.mockResolvedValue(assetStub as never);
      mocks.storageTarget.getObjectByAsset.mockResolvedValue(void 0);
      mocks.storage.stat.mockResolvedValue({ size: 1024 } as never);
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(['data']));
      mocks.remoteStorage.upload.mockRejectedValue(new Error('Access Denied'));

      await expect(sut.handleExportAsset({ transferId: 'transfer-1', assetId: 'asset-1' })).resolves.toBe(
        JobStatus.Failed,
      );

      expect(mocks.storageTarget.incrementTransferProgress).toHaveBeenCalledWith('transfer-1', { failed: 1 });
      expect(mocks.storageTarget.upsertObject).not.toHaveBeenCalled();
    });

    it('should fall back to an owner-scoped key for assets outside the library folder', async () => {
      mocks.storageTarget.getAssetForExport.mockResolvedValue({
        ...assetStub,
        originalPath: '/data/upload/user-1/ab/cd/uuid.jpg',
      } as never);
      mocks.storageTarget.getObjectByAsset.mockResolvedValue(void 0);
      mocks.storage.stat.mockResolvedValue({ size: 1024 } as never);
      mocks.storage.createPlainReadStream.mockReturnValue(Readable.from(['data']));
      mocks.storage.checkFileExists.mockResolvedValue(false);
      mocks.remoteStorage.upload.mockResolvedValue({ key: 'user-1/uuid.jpg', size: 1024 });

      await sut.handleExportAsset({ transferId: 'transfer-1', assetId: 'asset-1' });

      expect(mocks.remoteStorage.upload).toHaveBeenCalledWith(
        targetStub,
        'user-1/uuid.jpg',
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('handleImportScan', () => {
    it('should only queue supported, not-yet-known files', async () => {
      mocks.remoteStorage.list.mockReturnValue(
        asAsyncBatches([
          { key: 'a/IMG_0001.jpg', size: 1 },
          { key: 'a/notes.txt', size: 2 },
          { key: 'a/IMG_0002.jpg', size: 3 },
        ]) as never,
      );
      // IMG_0001 is already recorded, so only IMG_0002 comes back as new.
      mocks.storageTarget.filterNewRemoteKeys.mockResolvedValue(['a/IMG_0002.jpg']);

      await expect(sut.handleImportScan({ transferId: 'transfer-1' })).resolves.toBe(JobStatus.Success);

      expect(mocks.storageTarget.filterNewRemoteKeys).toHaveBeenCalledWith('target-1', [
        'a/IMG_0001.jpg',
        'a/IMG_0002.jpg',
      ]);
      expect(mocks.job.queue).toHaveBeenCalledTimes(1);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: 'StorageTargetImportObject',
        data: { transferId: 'transfer-1', remoteKey: 'a/IMG_0002.jpg', size: 3 },
      });
    });

    it('should fail the transfer when the target cannot be listed', async () => {
      mocks.remoteStorage.list.mockReturnValue(asAsyncThrow(new Error('Connection refused')) as never);

      await expect(sut.handleImportScan({ transferId: 'transfer-1' })).resolves.toBe(JobStatus.Failed);

      expect(mocks.storageTarget.updateTransfer).toHaveBeenCalledWith(
        'transfer-1',
        expect.objectContaining({ status: StorageTransferStatus.Failed, error: 'Connection refused' }),
      );
    });
  });

  describe('handleImportObject', () => {
    it('should skip and record the mapping when the user already has those bytes', async () => {
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue('existing-asset');

      await expect(
        sut.handleImportObject({ transferId: 'transfer-1', remoteKey: 'a/IMG_0001.jpg', size: 1024 }),
      ).resolves.toBe(JobStatus.Skipped);

      expect(mocks.asset.create).not.toHaveBeenCalled();
      expect(mocks.storageTarget.upsertObject).toHaveBeenCalledWith(
        expect.objectContaining({ assetId: 'existing-asset', remoteKey: 'a/IMG_0001.jpg' }),
      );
      expect(mocks.storageTarget.incrementTransferProgress).toHaveBeenCalledWith('transfer-1', { completed: 1 });
    });

    it('should create an asset and queue metadata extraction', async () => {
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(void 0);
      mocks.asset.create.mockResolvedValue({ id: 'asset-new' } as never);
      mocks.remoteStorage.head.mockResolvedValue(null);
      mocks.asset.upsertExif.mockResolvedValue(void 0);

      await expect(
        sut.handleImportObject({ transferId: 'transfer-1', remoteKey: 'a/IMG_0001.jpg', size: 1024 }),
      ).resolves.toBe(JobStatus.Success);

      expect(mocks.asset.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'user-1', originalFileName: 'IMG_0001.jpg' }),
      );
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: 'AssetExtractMetadata',
        data: { id: 'asset-new', source: 'upload' },
      });
    });

    it('should clean up the partial download when the import fails', async () => {
      setupDownload(mocks);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(void 0);
      mocks.asset.create.mockRejectedValue(new Error('constraint violation'));

      await expect(
        sut.handleImportObject({ transferId: 'transfer-1', remoteKey: 'a/IMG_0001.jpg', size: 1024 }),
      ).resolves.toBe(JobStatus.Failed);

      expect(mocks.job.queue).toHaveBeenCalledWith(expect.objectContaining({ name: 'FileDelete' }));
      expect(mocks.storageTarget.incrementTransferProgress).toHaveBeenCalledWith('transfer-1', { failed: 1 });
    });
  });
});
