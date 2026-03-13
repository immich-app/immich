import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';
import { resolveBackend } from 'src/backends/storage-backend.provider';
import { describe, expect, it } from 'vitest';

// Use minimal mocks
const mockDiskBackend = {} as DiskStorageBackend;
const mockS3Backend = {} as S3StorageBackend;

describe('resolveBackend', () => {
  it('should return disk backend for absolute paths', () => {
    const result = resolveBackend('/data/upload/user1/ab/cd/file.jpg', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockDiskBackend);
  });

  it('should return S3 backend for relative keys', () => {
    const result = resolveBackend('upload/user1/ab/cd/file.jpg', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockS3Backend);
  });

  it('should return S3 backend for relative paths without leading slash', () => {
    const result = resolveBackend('thumbs/user1/ab/cd/thumb.webp', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockS3Backend);
  });
});
