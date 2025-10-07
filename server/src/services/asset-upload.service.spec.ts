import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { StructuredBoolean } from 'src/dtos/asset-upload';
import { AssetMetadataKey, AssetStatus, AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { AssetUploadService } from 'src/services/asset-upload.service';
import { ASSET_CHECKSUM_CONSTRAINT } from 'src/utils/database';
import { authStub } from 'test/fixtures/auth.stub';
import { factory } from 'test/small.factory';
import { newTestService, ServiceMocks } from 'test/utils';

describe(AssetUploadService.name, () => {
  let sut: AssetUploadService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(AssetUploadService));
  });

  describe('onStart', () => {
    const mockDto = {
      assetData: {
        filename: 'test.jpg',
        deviceAssetId: 'device-asset-1',
        deviceId: 'device-1',
        fileCreatedAt: new Date('2025-01-01T00:00:00Z'),
        fileModifiedAt: new Date('2025-01-01T12:00:00Z'),
        isFavorite: false,
        iCloudId: '',
      },
      checksum: Buffer.from('checksum'),
      uploadLength: 1024,
      uploadComplete: StructuredBoolean.True,
      uploadIncomplete: StructuredBoolean.False,
      contentLength: 1024,
      isComplete: true,
      version: 8,
    };

    it('should create a new asset and return upload metadata', async () => {
      const assetId = factory.uuid();
      mocks.crypto.randomUUID.mockReturnValue(assetId);

      const result = await sut.onStart(authStub.user1, mockDto);

      expect(result).toEqual({
        id: assetId,
        path: expect.stringContaining(assetId),
        status: AssetStatus.Partial,
        isDuplicate: false,
      });

      expect(mocks.asset.createWithMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          id: assetId,
          ownerId: authStub.user1.user.id,
          checksum: mockDto.checksum,
          deviceAssetId: mockDto.assetData.deviceAssetId,
          deviceId: mockDto.assetData.deviceId,
          fileCreatedAt: mockDto.assetData.fileCreatedAt,
          fileModifiedAt: mockDto.assetData.fileModifiedAt,
          type: AssetType.Image,
          isFavorite: false,
          status: AssetStatus.Partial,
          visibility: AssetVisibility.Hidden,
          originalFileName: 'test.jpg',
        }),
        1024,
        undefined,
      );

      expect(mocks.storage.mkdir).toHaveBeenCalledWith(expect.stringContaining(authStub.user1.user.id));
    });

    it('should determine asset type from filename extension', async () => {
      const videoDto = { ...mockDto, assetData: { ...mockDto.assetData, filename: 'video.mp4' } };
      mocks.crypto.randomUUID.mockReturnValue(factory.uuid());

      await sut.onStart(authStub.user1, videoDto);

      expect(mocks.asset.createWithMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          type: AssetType.Video,
        }),
        expect.anything(),
        undefined,
      );
    });

    it('should throw BadRequestException for unsupported file types', async () => {
      const unsupportedDto = { ...mockDto, assetData: { ...mockDto.assetData, filename: 'document.xyz' } };

      await expect(sut.onStart(authStub.user1, unsupportedDto)).rejects.toThrow(BadRequestException);
      await expect(sut.onStart(authStub.user1, unsupportedDto)).rejects.toThrow('unsupported file type');
    });

    it('should validate quota before creating asset', async () => {
      const authWithQuota = {
        ...authStub.user1,
        user: {
          ...authStub.user1.user,
          quotaSizeInBytes: 2000,
          quotaUsageInBytes: 1500,
        },
      };

      await expect(sut.onStart(authWithQuota, mockDto)).rejects.toThrow(BadRequestException);
      await expect(sut.onStart(authWithQuota, mockDto)).rejects.toThrow('Quota has been exceeded');
    });

    it('should allow upload when quota is null (unlimited)', async () => {
      const authWithUnlimitedQuota = {
        ...authStub.user1,
        user: {
          ...authStub.user1.user,
          quotaSizeInBytes: null,
          quotaUsageInBytes: 1000,
        },
      };

      mocks.crypto.randomUUID.mockReturnValue(factory.uuid());

      await expect(sut.onStart(authWithUnlimitedQuota, mockDto)).resolves.toBeDefined();
    });

    it('should allow upload when within quota', async () => {
      const authWithQuota = {
        ...authStub.user1,
        user: {
          ...authStub.user1.user,
          quotaSizeInBytes: 5000,
          quotaUsageInBytes: 1000,
        },
      };

      mocks.crypto.randomUUID.mockReturnValue(factory.uuid());

      const result = await sut.onStart(authWithQuota, mockDto);

      expect(result.isDuplicate).toBe(false);
    });

    it('should handle duplicate detection via checksum constraint', async () => {
      const existingAssetId = factory.uuid();
      const checksumError = new Error('duplicate key value violates unique constraint');
      (checksumError as any).constraint_name = ASSET_CHECKSUM_CONSTRAINT;

      mocks.asset.createWithMetadata.mockRejectedValue(checksumError);
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue({
        id: existingAssetId,
        status: AssetStatus.Partial,
        createdAt: new Date(),
      });

      const result = await sut.onStart(authStub.user1, mockDto);

      expect(result).toEqual({
        id: existingAssetId,
        path: expect.any(String),
        status: AssetStatus.Partial,
        isDuplicate: true,
      });

      expect(mocks.asset.getUploadAssetIdByChecksum).toHaveBeenCalledWith(authStub.user1.user.id, mockDto.checksum);
    });

    it('should throw InternalServerErrorException if duplicate lookup fails', async () => {
      const checksumError = new Error('duplicate key value violates unique constraint');
      (checksumError as any).constraint_name = ASSET_CHECKSUM_CONSTRAINT;

      mocks.asset.createWithMetadata.mockRejectedValue(checksumError);
      // eslint-disable-next-line unicorn/no-useless-undefined
      mocks.asset.getUploadAssetIdByChecksum.mockResolvedValue(undefined);

      await expect(sut.onStart(authStub.user1, mockDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should throw InternalServerErrorException for non-checksum errors', async () => {
      const genericError = new Error('database connection failed');
      mocks.asset.createWithMetadata.mockRejectedValue(genericError);

      await expect(sut.onStart(authStub.user1, mockDto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should include iCloud metadata when provided', async () => {
      const dtoWithICloud = {
        ...mockDto,
        assetData: {
          ...mockDto.assetData,
          iCloudId: 'icloud-123',
        },
      };

      mocks.crypto.randomUUID.mockReturnValue(factory.uuid());

      await sut.onStart(authStub.user1, dtoWithICloud);

      expect(mocks.asset.createWithMetadata).toHaveBeenCalledWith(expect.anything(), expect.anything(), [
        { key: AssetMetadataKey.MobileApp, value: { iCloudId: 'icloud-123' } },
      ]);
    });

    it('should set isFavorite when true', async () => {
      const favoriteDto = {
        ...mockDto,
        assetData: {
          ...mockDto.assetData,
          isFavorite: true,
        },
      };

      mocks.crypto.randomUUID.mockReturnValue(factory.uuid());

      await sut.onStart(authStub.user1, favoriteDto);

      expect(mocks.asset.createWithMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          isFavorite: true,
        }),
        expect.anything(),
        undefined,
      );
    });
  });

  describe('onComplete', () => {
    const assetId = factory.uuid();
    const path = `/upload/${assetId}/file.jpg`;
    const fileModifiedAt = new Date('2025-01-01T12:00:00Z');

    it('should mark asset as complete and queue metadata extraction job', async () => {
      await sut.onComplete({ id: assetId, path, fileModifiedAt });

      expect(mocks.asset.setComplete).toHaveBeenCalledWith(assetId);
      expect(mocks.job.queue).toHaveBeenCalledWith({
        name: JobName.AssetExtractMetadata,
        data: { id: assetId, source: 'upload' },
      });
    });

    it('should update file modification time', async () => {
      await sut.onComplete({ id: assetId, path, fileModifiedAt });

      expect(mocks.storage.utimes).toHaveBeenCalledWith(path, expect.any(Date), fileModifiedAt);
    });

    it('should handle utimes failure gracefully', async () => {
      mocks.storage.utimes.mockRejectedValue(new Error('Permission denied'));

      await expect(sut.onComplete({ id: assetId, path, fileModifiedAt })).resolves.toBeUndefined();

      // Should still complete asset and queue job
      expect(mocks.asset.setComplete).toHaveBeenCalled();
      expect(mocks.job.queue).toHaveBeenCalled();
    });

    it('should retry setComplete on transient failures', async () => {
      mocks.asset.setComplete
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockRejectedValueOnce(new Error('Transient error'))
        .mockResolvedValue();

      await sut.onComplete({ id: assetId, path, fileModifiedAt });

      expect(mocks.asset.setComplete).toHaveBeenCalledTimes(3);
    });

    it('should retry job queueing on transient failures', async () => {
      mocks.job.queue.mockRejectedValueOnce(new Error('Transient error')).mockResolvedValue();

      await sut.onComplete({ id: assetId, path, fileModifiedAt });

      expect(mocks.job.queue).toHaveBeenCalledTimes(2);
    });
  });

  describe('onCancel', () => {
    const assetId = factory.uuid();
    const path = `/upload/${assetId}/file.jpg`;

    it('should delete file and remove asset record', async () => {
      await sut.onCancel(assetId, path);

      expect(mocks.storage.unlink).toHaveBeenCalledWith(path);
      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledWith(assetId);
    });

    it('should retry unlink on transient failures', async () => {
      mocks.storage.unlink.mockRejectedValueOnce(new Error('Transient error')).mockResolvedValue();

      await sut.onCancel(assetId, path);

      expect(mocks.storage.unlink).toHaveBeenCalledTimes(2);
    });

    it('should retry removeAndDecrementQuota on transient failures', async () => {
      mocks.asset.removeAndDecrementQuota.mockRejectedValueOnce(new Error('Transient error')).mockResolvedValue();

      await sut.onCancel(assetId, path);

      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeStaleUploads', () => {
    it('should queue cleanup jobs for stale partial assets', async () => {
      const staleAssets = [{ id: factory.uuid() }, { id: factory.uuid() }, { id: factory.uuid() }];

      mocks.assetJob.streamForPartialAssetCleanupJob.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/require-await
        (async function* () {
          for (const asset of staleAssets) {
            yield asset;
          }
        })(),
      );

      await sut.removeStaleUploads();

      expect(mocks.assetJob.streamForPartialAssetCleanupJob).toHaveBeenCalledWith(expect.any(Date));

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.PartialAssetCleanup, data: staleAssets[0] },
        { name: JobName.PartialAssetCleanup, data: staleAssets[1] },
        { name: JobName.PartialAssetCleanup, data: staleAssets[2] },
      ]);
    });

    it('should batch cleanup jobs', async () => {
      const assets = Array.from({ length: 1500 }, () => ({ id: factory.uuid() }));

      mocks.assetJob.streamForPartialAssetCleanupJob.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/require-await
        (async function* () {
          for (const asset of assets) {
            yield asset;
          }
        })(),
      );

      await sut.removeStaleUploads();

      // Should be called twice: once for 1000, once for 500
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(2);
    });

    it('should handle empty stream', async () => {
      mocks.assetJob.streamForPartialAssetCleanupJob.mockReturnValue((async function* () {})());

      await sut.removeStaleUploads();

      expect(mocks.job.queueAll).toHaveBeenCalledWith([]);
    });
  });

  describe('removeStaleUpload', () => {
    const assetId = factory.uuid();
    const path = `/upload/${assetId}/file.jpg`;

    it('should skip if asset not found', async () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue(undefined);

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.storage.stat).not.toHaveBeenCalled();
    });

    it('should complete asset if file matches expected state', async () => {
      const checksum = Buffer.from('checksum');
      const fileModifiedAt = new Date();

      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue({
        path,
        checksum,
        fileModifiedAt,
        size: 1024,
      });

      mocks.storage.stat.mockResolvedValue({ size: 1024 } as any);
      mocks.crypto.hashFile.mockResolvedValue(checksum);

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.setComplete).toHaveBeenCalledWith(assetId);
      expect(mocks.storage.unlink).not.toHaveBeenCalled();
    });

    it('should cancel asset if file size does not match', async () => {
      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue({
        path,
        checksum: Buffer.from('checksum'),
        fileModifiedAt: new Date(),
        size: 1024,
      });

      mocks.storage.stat.mockResolvedValue({ size: 512 } as any);

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(path);
      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledWith(assetId);
    });

    it('should cancel asset if checksum does not match', async () => {
      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue({
        path,
        checksum: Buffer.from('expected-checksum'),
        fileModifiedAt: new Date(),
        size: 1024,
      });

      mocks.storage.stat.mockResolvedValue({ size: 1024 } as any);
      mocks.crypto.hashFile.mockResolvedValue(Buffer.from('actual-checksum'));

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.storage.unlink).toHaveBeenCalledWith(path);
      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledWith(assetId);
    });

    it('should cancel asset if file does not exist', async () => {
      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue({
        path,
        checksum: Buffer.from('checksum'),
        fileModifiedAt: new Date(),
        size: 1024,
      });

      const error = new Error('File not found') as NodeJS.ErrnoException;
      error.code = 'ENOENT';
      mocks.storage.stat.mockRejectedValue(error);

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledWith(assetId);
    });

    it('should cancel asset if stat fails with permission error', async () => {
      mocks.assetJob.getForPartialAssetCleanupJob.mockResolvedValue({
        path,
        checksum: Buffer.from('checksum'),
        fileModifiedAt: new Date(),
        size: 1024,
      });

      const error = new Error('Permission denied') as NodeJS.ErrnoException;
      error.code = 'EACCES';
      mocks.storage.stat.mockRejectedValue(error);

      const result = await sut.removeStaleUpload({ id: assetId });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.removeAndDecrementQuota).toHaveBeenCalledWith(assetId);
    });
  });
});
