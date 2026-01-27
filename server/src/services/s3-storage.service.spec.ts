import { Readable } from 'node:stream';
import { AssetFileType, JobName, JobStatus, StorageBackend } from 'src/enum';
import { S3StorageService } from 'src/services/s3-storage.service';
import { factory } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { Mock, vitest } from 'vitest';

// Mock S3 adapter interface
interface MockS3Adapter {
  exists: Mock<(key: string) => Promise<boolean>>;
  stat: Mock<(key: string) => Promise<{ size: number; mtime: Date }>>;
  readStream: Mock<(key: string) => Promise<{ stream: Readable; length: number }>>;
  writeStreamAsync: Mock<
    (key: string, stream: Readable, options?: { contentType?: string; storageClass?: string }) => Promise<void>
  >;
  delete: Mock<(key: string) => Promise<void>>;
  getPresignedDownloadUrl: Mock<(key: string, options?: { expiresIn?: number }) => Promise<string>>;
  getPresignedUploadUrl: Mock<(key: string, options?: { expiresIn?: number; contentType?: string }) => Promise<string>>;
  copyWithStorageClass: Mock<(key: string, storageClass: string) => Promise<void>>;
  listObjects: Mock<(prefix: string) => Promise<Array<{ key: string; size: number }>>>;
}

// Mock local adapter interface
interface MockLocalAdapter {
  exists: Mock<(key: string) => Promise<boolean>>;
  stat: Mock<(key: string) => Promise<{ size: number; mtime: Date }>>;
  readStream: Mock<(key: string) => Promise<{ stream: Readable; length: number }>>;
  delete: Mock<(key: string) => Promise<void>>;
}

const createMockS3Adapter = (): MockS3Adapter => ({
  exists: vitest.fn(),
  stat: vitest.fn(),
  readStream: vitest.fn(),
  writeStreamAsync: vitest.fn(),
  delete: vitest.fn(),
  getPresignedDownloadUrl: vitest.fn(),
  getPresignedUploadUrl: vitest.fn(),
  copyWithStorageClass: vitest.fn(),
  listObjects: vitest.fn(),
});

const createMockLocalAdapter = (): MockLocalAdapter => ({
  exists: vitest.fn(),
  stat: vitest.fn(),
  readStream: vitest.fn(),
  delete: vitest.fn(),
});

const mockStorageConfig = (overrides: any = {}) => ({
  backend: StorageBackend.Local,
  s3: {
    enabled: true,
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    forcePathStyle: true,
    archiveBucket: {
      bucket: 'archive-bucket',
      storageClass: 'GLACIER_IR',
      prefix: '',
    },
    hotBucket: {
      bucket: 'hot-bucket',
      storageClass: 'STANDARD',
      prefix: '',
    },
  },
  locations: {
    originals: StorageBackend.S3,
    thumbnails: StorageBackend.S3,
    previews: StorageBackend.S3,
    encodedVideos: StorageBackend.S3,
    profile: StorageBackend.Local,
    backups: StorageBackend.Local,
  },
  upload: {
    deleteLocalAfterUpload: false,
    strategy: 'local-first',
  },
  ...overrides,
});

describe(S3StorageService.name, () => {
  let sut: S3StorageService;
  let mocks: ServiceMocks;
  let mockS3Adapter: MockS3Adapter;
  let mockLocalAdapter: MockLocalAdapter;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(S3StorageService));

    mockS3Adapter = createMockS3Adapter();
    mockLocalAdapter = createMockLocalAdapter();

    // Default: S3 disabled
    mocks.s3Manager.isS3Enabled.mockResolvedValue(false);
    mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);
    mocks.s3Manager.getLocalAdapter.mockReturnValue(mockLocalAdapter as any);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleS3UploadAsset', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);

      const result = await sut.handleS3UploadAsset({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should return Failed when asset is not found', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(undefined);

      const result = await sut.handleS3UploadAsset({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should skip upload when asset is already in S3', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      const asset = factory.asset({ storageBackend: StorageBackend.S3, s3Key: 'existing-key' });
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.writeStreamAsync).not.toHaveBeenCalled();
    });

    it('should upload asset successfully with size verification', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });
      const fileSize = 1024;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: fileSize,
      });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          storageBackend: StorageBackend.S3,
          s3Bucket: 'test-bucket',
        }),
      );
    });

    it('should delete local file when deleteLocalAfterUpload is enabled', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });
      const fileSize = 1024;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: true } }),
      });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: fileSize,
      });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      await sut.handleS3UploadAsset({ id: asset.id });

      expect(mockLocalAdapter.delete).toHaveBeenCalledWith(asset.originalPath);
    });

    it('should mark asset as uploaded when local file is missing but exists in S3', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(false);
      mockS3Adapter.exists.mockResolvedValue(true);

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          id: asset.id,
          storageBackend: StorageBackend.S3,
        }),
      );
    });

    it('should return Failed when local file is missing and not in S3', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(false);
      mockS3Adapter.exists.mockResolvedValue(false);

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should return Skipped for permanent S3 errors (NoSuchBucket)', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: 1024,
      });
      mockS3Adapter.writeStreamAsync.mockRejectedValue({ name: 'NoSuchBucket' });

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Skipped);
    });

    it('should return Failed for transient S3 errors (503)', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: 1024,
      });
      mockS3Adapter.writeStreamAsync.mockRejectedValue({ $metadata: { httpStatusCode: 503 } });

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should throw error on size mismatch', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: 1024,
      });
      mockLocalAdapter.stat.mockResolvedValue({ size: 1024, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: 512, mtime: new Date() }); // Different size

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      // Size mismatch throws and is classified as transient/unknown, so returns Failed
      expect(result).toBe(JobStatus.Failed);
    });

    it('should clean up S3 object on database update failure', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });
      const fileSize = 1024;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });
      mocks.asset.update.mockRejectedValue(new Error('Database error'));

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: fileSize,
      });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      await sut.handleS3UploadAsset({ id: asset.id });

      expect(mockS3Adapter.delete).toHaveBeenCalled();
    });

    it('should succeed even if local delete fails', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local, originalPath: '/data/photo.jpg' });
      const fileSize = 1024;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'test-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: true } }),
      });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({
        stream: Readable.from(['test data']),
        length: fileSize,
      });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockLocalAdapter.delete.mockRejectedValue(new Error('Delete failed'));
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      const result = await sut.handleS3UploadAsset({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  describe('handleS3UploadQueueAll', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);

      const result = await sut.handleS3UploadQueueAll();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.getByStorageBackend).not.toHaveBeenCalled();
    });

    it('should queue jobs for all local assets', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      const assets = [factory.asset({ id: 'asset-1' }), factory.asset({ id: 'asset-2' })];
      mocks.asset.getByStorageBackend.mockResolvedValue(assets);

      const result = await sut.handleS3UploadQueueAll();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.S3UploadAsset, data: { id: 'asset-1' } });
      expect(mocks.job.queue).toHaveBeenCalledWith({ name: JobName.S3UploadAsset, data: { id: 'asset-2' } });
    });

    it('should handle empty asset list', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.asset.getByStorageBackend.mockResolvedValue([]);

      const result = await sut.handleS3UploadQueueAll();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.job.queue).not.toHaveBeenCalled();
    });
  });

  describe('handleS3UploadThumbnails', () => {
    it('should return Success when S3 is disabled for both thumbnails and previews', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);

      const result = await sut.handleS3UploadThumbnails({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
    });

    it('should return Failed when asset is not found', async () => {
      mocks.s3Manager.isS3EnabledForLocation
        .mockResolvedValueOnce(true) // thumbnails
        .mockResolvedValueOnce(false); // previews
      mocks.asset.getById.mockResolvedValue(undefined);

      const result = await sut.handleS3UploadThumbnails({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Failed);
    });

    it('should upload thumbnail only when previews disabled', async () => {
      const asset = factory.asset({
        files: [
          { id: 'file-1', type: 'thumbnail', path: '/thumbs/thumb.webp', storageBackend: StorageBackend.Local },
        ] as any,
      });

      mocks.s3Manager.isS3EnabledForLocation
        .mockResolvedValueOnce(true) // thumbnails
        .mockResolvedValueOnce(false); // previews
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: 100 });
      mockLocalAdapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });

      const result = await sut.handleS3UploadThumbnails({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.upsertFileWithS3).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AssetFileType.Thumbnail,
        }),
      );
    });

    it('should upload preview only when thumbnails disabled', async () => {
      const asset = factory.asset({
        files: [
          { id: 'file-1', type: 'preview', path: '/thumbs/preview.webp', storageBackend: StorageBackend.Local },
        ] as any,
      });

      mocks.s3Manager.isS3EnabledForLocation
        .mockResolvedValueOnce(false) // thumbnails
        .mockResolvedValueOnce(true); // previews
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: 100 });
      mockLocalAdapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });

      const result = await sut.handleS3UploadThumbnails({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.upsertFileWithS3).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AssetFileType.Preview,
        }),
      );
    });

    it('should upload both thumbnail and preview', async () => {
      const asset = factory.asset({
        files: [
          { id: 'file-1', type: 'thumbnail', path: '/thumbs/thumb.webp', storageBackend: StorageBackend.Local },
          { id: 'file-2', type: 'preview', path: '/thumbs/preview.webp', storageBackend: StorageBackend.Local },
        ] as any,
      });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: 100 });
      mockLocalAdapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: 100, mtime: new Date() });

      const result = await sut.handleS3UploadThumbnails({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.upsertFileWithS3).toHaveBeenCalledTimes(2);
    });

    it('should skip files already in S3', async () => {
      const asset = factory.asset({
        files: [
          {
            id: 'file-1',
            type: 'thumbnail',
            path: '/thumbs/thumb.webp',
            storageBackend: StorageBackend.S3,
            s3Key: 'already-uploaded',
          },
        ] as any,
      });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      const result = await sut.handleS3UploadThumbnails({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.writeStreamAsync).not.toHaveBeenCalled();
    });

    it('should return Skipped for permanent S3 errors', async () => {
      const asset = factory.asset({
        files: [
          { id: 'file-1', type: 'thumbnail', path: '/thumbs/thumb.webp', storageBackend: StorageBackend.Local },
        ] as any,
      });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: 100 });
      mockS3Adapter.writeStreamAsync.mockRejectedValue({ name: 'AccessDenied' });

      const result = await sut.handleS3UploadThumbnails({ id: asset.id });

      expect(result).toBe(JobStatus.Skipped);
    });
  });

  describe('handleS3UploadEncodedVideo', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);

      const result = await sut.handleS3UploadEncodedVideo({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
    });

    it('should return Success when no encoded video exists', async () => {
      const asset = factory.asset({ encodedVideoPath: null });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.handleS3UploadEncodedVideo({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
    });

    it('should skip when already in S3', async () => {
      const asset = factory.asset({
        encodedVideoPath: '/videos/encoded.mp4',
        s3KeyEncodedVideo: 'already-uploaded',
      });

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.handleS3UploadEncodedVideo({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.writeStreamAsync).not.toHaveBeenCalled();
    });

    it('should upload encoded video successfully', async () => {
      const asset = factory.asset({ encodedVideoPath: '/videos/encoded.mp4' });
      const fileSize = 5000;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({ storage: mockStorageConfig() });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: fileSize });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      const result = await sut.handleS3UploadEncodedVideo({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          s3KeyEncodedVideo: expect.stringContaining('encoded.mp4'),
          s3BucketEncodedVideo: 'hot-bucket',
        }),
      );
    });

    it('should clear encodedVideoPath when deleteLocalAfterUpload is true', async () => {
      const asset = factory.asset({ encodedVideoPath: '/videos/encoded.mp4' });
      const fileSize = 5000;

      mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: true } }),
      });

      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.readStream.mockResolvedValue({ stream: Readable.from(['data']), length: fileSize });
      mockLocalAdapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });
      mockS3Adapter.writeStreamAsync.mockResolvedValue();
      mockS3Adapter.stat.mockResolvedValue({ size: fileSize, mtime: new Date() });

      await sut.handleS3UploadEncodedVideo({ id: asset.id });

      expect(mockLocalAdapter.delete).toHaveBeenCalled();
      expect(mocks.asset.update).toHaveBeenCalledWith(
        expect.objectContaining({
          encodedVideoPath: null,
        }),
      );
    });
  });

  describe('handleS3MigrateStorageClass', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.handleS3MigrateStorageClass({ id: 'asset-1' });

      expect(result).toBe(JobStatus.Success);
    });

    it('should skip when asset is not in S3', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.handleS3MigrateStorageClass({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.copyWithStorageClass).not.toHaveBeenCalled();
    });

    it('should copy with new storage class', async () => {
      const asset = factory.asset({
        storageBackend: StorageBackend.S3,
        s3Key: 'users/user-1/asset-1/original.jpg',
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'archive-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.handleS3MigrateStorageClass({ id: asset.id });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.copyWithStorageClass).toHaveBeenCalledWith(asset.s3Key, 'GLACIER_IR');
    });

    it('should return Failed on migration error', async () => {
      const asset = factory.asset({
        storageBackend: StorageBackend.S3,
        s3Key: 'users/user-1/asset-1/original.jpg',
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'archive-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mockS3Adapter.copyWithStorageClass.mockRejectedValue(new Error('Copy failed'));

      const result = await sut.handleS3MigrateStorageClass({ id: asset.id });

      expect(result).toBe(JobStatus.Failed);
    });
  });

  describe('handleS3FileDelete', () => {
    it('should return Success when files array is empty', async () => {
      const result = await sut.handleS3FileDelete({ files: [] });

      expect(result).toBe(JobStatus.Success);
    });

    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.handleS3FileDelete({
        files: [{ bucket: 'test-bucket', key: 'test-key' }],
      });

      expect(result).toBe(JobStatus.Success);
    });

    it('should delete files from correct buckets', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getAdapterForBucket.mockResolvedValue(mockS3Adapter as any);

      const result = await sut.handleS3FileDelete({
        files: [
          { bucket: 'bucket-1', key: 'key-1' },
          { bucket: 'bucket-2', key: 'key-2' },
        ],
      });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.s3Manager.getAdapterForBucket).toHaveBeenCalledWith('bucket-1');
      expect(mocks.s3Manager.getAdapterForBucket).toHaveBeenCalledWith('bucket-2');
      expect(mockS3Adapter.delete).toHaveBeenCalledWith('key-1');
      expect(mockS3Adapter.delete).toHaveBeenCalledWith('key-2');
    });

    it('should continue on permanent errors', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getAdapterForBucket.mockResolvedValue(mockS3Adapter as any);
      mockS3Adapter.delete.mockRejectedValueOnce({ name: 'NoSuchKey' }).mockResolvedValueOnce();

      const result = await sut.handleS3FileDelete({
        files: [
          { bucket: 'bucket-1', key: 'key-1' },
          { bucket: 'bucket-1', key: 'key-2' },
        ],
      });

      expect(result).toBe(JobStatus.Success);
      expect(mockS3Adapter.delete).toHaveBeenCalledTimes(2);
    });

    it('should log transient errors', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getAdapterForBucket.mockResolvedValue(mockS3Adapter as any);
      mockS3Adapter.delete.mockRejectedValue({ $metadata: { httpStatusCode: 503 } });

      await sut.handleS3FileDelete({
        files: [{ bucket: 'bucket-1', key: 'key-1' }],
      });

      expect(mocks.logger.error).toHaveBeenCalled();
    });
  });

  describe('handleS3CleanupOrphanedFiles', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.handleS3CleanupOrphanedFiles();

      expect(result).toBe(JobStatus.Success);
    });

    it('should return Success when deleteLocalAfterUpload is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: false } }),
      });

      const result = await sut.handleS3CleanupOrphanedFiles();

      expect(result).toBe(JobStatus.Success);
    });

    it('should delete local files for S3 assets', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: true } }),
      });

      const asset = factory.asset({ originalPath: '/data/photo.jpg' });
      mocks.asset.getS3AssetsWithLocalPaths.mockImplementation(() => makeStream([asset]));
      mockLocalAdapter.exists.mockResolvedValue(true);

      const result = await sut.handleS3CleanupOrphanedFiles();

      expect(result).toBe(JobStatus.Success);
      expect(mockLocalAdapter.delete).toHaveBeenCalledWith(asset.originalPath);
    });

    it('should handle delete errors gracefully', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { deleteLocalAfterUpload: true } }),
      });

      const asset = factory.asset({ originalPath: '/data/photo.jpg' });
      mocks.asset.getS3AssetsWithLocalPaths.mockImplementation(() => makeStream([asset]));
      mockLocalAdapter.exists.mockResolvedValue(true);
      mockLocalAdapter.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await sut.handleS3CleanupOrphanedFiles();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.logger.warn).toHaveBeenCalled();
    });
  });

  describe('handleS3OrphanScanner', () => {
    it('should return Success when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.handleS3OrphanScanner();

      expect(result).toBe(JobStatus.Success);
    });

    it('should scan and identify orphaned objects', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getDefaultAdapter.mockResolvedValue(mockS3Adapter as any);
      mockS3Adapter.listObjects.mockResolvedValue([
        { key: 'users/user-1/asset-uuid-1234-5678-9012-345678901234/original.jpg', size: 1000 },
      ]);
      mocks.asset.getById.mockResolvedValue(undefined); // Asset not found = orphan

      const result = await sut.handleS3OrphanScanner();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('orphan detected'));
    });

    it('should skip invalid key formats', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getDefaultAdapter.mockResolvedValue(mockS3Adapter as any);
      mockS3Adapter.listObjects.mockResolvedValue([
        { key: 'invalid/key/format', size: 1000 },
        { key: 'users/user-1/not-a-uuid/original.jpg', size: 1000 },
      ]);

      const result = await sut.handleS3OrphanScanner();

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.getById).not.toHaveBeenCalled();
    });

    it('should return Failed on scan error', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getDefaultAdapter.mockResolvedValue(mockS3Adapter as any);
      mockS3Adapter.listObjects.mockRejectedValue(new Error('List failed'));

      const result = await sut.handleS3OrphanScanner();

      expect(result).toBe(JobStatus.Failed);
    });
  });
});
