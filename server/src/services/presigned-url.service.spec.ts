import { Readable } from 'node:stream';
import { StorageBackend, StorageLocationType } from 'src/enum';
import { PresignedUrlService } from 'src/services/presigned-url.service';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';
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
  getPresignedUploadUrl: Mock<
    (key: string, options?: { expiresIn?: number; contentType?: string }) => Promise<string>
  >;
  copyWithStorageClass: Mock<(key: string, storageClass: string) => Promise<void>>;
  listObjects: Mock<(prefix: string) => Promise<Array<{ key: string; size: number }>>>;
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

describe(PresignedUrlService.name, () => {
  let sut: PresignedUrlService;
  let mocks: ServiceMocks;
  let mockS3Adapter: MockS3Adapter;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(PresignedUrlService));

    mockS3Adapter = createMockS3Adapter();

    // Default: S3 disabled
    mocks.s3Manager.isS3Enabled.mockResolvedValue(false);
    mocks.s3Manager.isS3EnabledForLocation.mockResolvedValue(false);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getPresignedDownloadUrl', () => {
    it('should return null when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.getPresignedDownloadUrl('asset-1');

      expect(result).toBeNull();
    });

    it('should return null when asset is not found', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue();

      const result = await sut.getPresignedDownloadUrl('asset-1');

      expect(result).toBeNull();
    });

    it('should return null when asset is not in S3', async () => {
      const asset = factory.asset({ storageBackend: StorageBackend.Local });
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.getPresignedDownloadUrl(asset.id);

      expect(result).toBeNull();
    });

    it('should return presigned URL for S3 asset', async () => {
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
      mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue('https://presigned-url.com');

      const result = await sut.getPresignedDownloadUrl(asset.id);

      expect(result).toBe('https://presigned-url.com');
    });

    it('should cap expiry at max allowed', async () => {
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
      mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue('https://presigned-url.com');

      await sut.getPresignedDownloadUrl(asset.id, 999_999_999);

      // Should be capped at 7 days (604800 seconds)
      expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledWith(
        asset.s3Key,
        expect.objectContaining({ expiresIn: 604_800 }),
      );
    });
  });

  describe('getPresignedEncodedVideoUrl', () => {
    it('should return null when no s3KeyEncodedVideo', async () => {
      const asset = factory.asset({ s3KeyEncodedVideo: null });
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.getPresignedEncodedVideoUrl(asset.id);

      expect(result).toBeNull();
    });

    it('should use stored bucket when available', async () => {
      const asset = factory.asset({
        s3KeyEncodedVideo: 'users/user-1/asset-1/encoded.mp4',
        s3BucketEncodedVideo: 'specific-bucket',
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getAdapterForBucket.mockResolvedValue(mockS3Adapter as any);
      mocks.asset.getById.mockResolvedValue(asset);
      mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue('https://presigned-url.com');

      const result = await sut.getPresignedEncodedVideoUrl(asset.id);

      expect(result).toBe('https://presigned-url.com');
      expect(mocks.s3Manager.getAdapterForBucket).toHaveBeenCalledWith('specific-bucket');
    });

    it('should fall back to location config when no bucket stored', async () => {
      const asset = factory.asset({
        s3KeyEncodedVideo: 'users/user-1/asset-1/encoded.mp4',
        s3BucketEncodedVideo: null,
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue('https://presigned-url.com');

      const result = await sut.getPresignedEncodedVideoUrl(asset.id);

      expect(result).toBe('https://presigned-url.com');
      expect(mocks.s3Manager.getConfigForLocation).toHaveBeenCalledWith(StorageLocationType.EncodedVideos);
    });
  });

  describe('getPresignedThumbnailUrl', () => {
    it('should return null when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.getPresignedThumbnailUrl('asset-1', 'thumbnail');

      expect(result).toBeNull();
    });

    it('should find correct file by type', async () => {
      const asset = factory.asset({
        files: [
          { type: 'thumbnail', storageBackend: StorageBackend.S3, s3Key: 'thumb-key', s3Bucket: 'hot-bucket' },
          { type: 'preview', storageBackend: StorageBackend.S3, s3Key: 'preview-key', s3Bucket: 'hot-bucket' },
        ] as any,
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'hot-bucket',
        storageClass: 'STANDARD',
        prefix: '',
      });
      mocks.asset.getById.mockResolvedValue(asset);
      mockS3Adapter.getPresignedDownloadUrl.mockResolvedValue('https://presigned-url.com');

      const result = await sut.getPresignedThumbnailUrl(asset.id, 'thumbnail');

      expect(result).toBe('https://presigned-url.com');
      expect(mockS3Adapter.getPresignedDownloadUrl).toHaveBeenCalledWith('thumb-key', expect.anything());
    });

    it('should return null when file is not in S3', async () => {
      const asset = factory.asset({
        files: [{ type: 'thumbnail', storageBackend: StorageBackend.Local, path: '/local/thumb.webp' }] as any,
      });

      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.asset.getById.mockResolvedValue(asset);

      const result = await sut.getPresignedThumbnailUrl(asset.id, 'thumbnail');

      expect(result).toBeNull();
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should return null when S3 is disabled', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(false);

      const result = await sut.getPresignedUploadUrl('user-1', 'photo.jpg', 'image/jpeg');

      expect(result).toBeNull();
    });

    it('should return null when strategy is not s3-first', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 'local-first' } }),
      });

      const result = await sut.getPresignedUploadUrl('user-1', 'photo.jpg', 'image/jpeg');

      expect(result).toBeNull();
    });

    it('should reject invalid content types (text/html)', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 's3-first' } }),
      });

      const result = await sut.getPresignedUploadUrl('user-1', 'malicious.html', 'text/html');

      expect(result).toBeNull();
      expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('invalid content type'));
    });

    it('should reject invalid content types (application/javascript)', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 's3-first' } }),
      });

      const result = await sut.getPresignedUploadUrl('user-1', 'script.js', 'application/javascript');

      expect(result).toBeNull();
    });

    it('should accept valid image types', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'archive-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 's3-first' } }),
      });
      mockS3Adapter.getPresignedUploadUrl.mockResolvedValue('https://upload-url.com');

      const result = await sut.getPresignedUploadUrl('user-1', 'photo.jpg', 'image/jpeg');

      expect(result).toEqual({
        url: 'https://upload-url.com',
        key: expect.stringContaining('uploads/user-1/'),
      });
    });

    it('should accept valid video types', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'archive-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 's3-first' } }),
      });
      mockS3Adapter.getPresignedUploadUrl.mockResolvedValue('https://upload-url.com');

      const result = await sut.getPresignedUploadUrl('user-1', 'video.mp4', 'video/mp4');

      expect(result).not.toBeNull();
    });

    it('should cap expiry at 24 hours', async () => {
      mocks.s3Manager.isS3Enabled.mockResolvedValue(true);
      mocks.s3Manager.getConfigForLocation.mockResolvedValue({
        adapter: mockS3Adapter as any,
        bucket: 'archive-bucket',
        storageClass: 'GLACIER_IR',
        prefix: '',
      });
      mocks.systemMetadata.get.mockResolvedValue({
        storage: mockStorageConfig({ upload: { strategy: 's3-first' } }),
      });
      mockS3Adapter.getPresignedUploadUrl.mockResolvedValue('https://upload-url.com');

      await sut.getPresignedUploadUrl('user-1', 'photo.jpg', 'image/jpeg', 999_999);

      // Should be capped at 86400 seconds (24 hours)
      expect(mockS3Adapter.getPresignedUploadUrl).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ expiresIn: 86_400 }),
      );
    });
  });
});
