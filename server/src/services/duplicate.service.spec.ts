import { BulkIdErrorReason } from 'src/dtos/asset-ids.response.dto';
import { AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { DuplicateService } from 'src/services/duplicate.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { SearchService } from 'src/services/search.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, describe, expect, it, vitest } from 'vitest';

vitest.useFakeTimers();

const hasEmbedding = {
  id: 'asset-1',
  ownerId: 'user-id',
  stackId: null,
  type: AssetType.Image,
  duplicateId: null,
  embedding: '[1, 2, 3, 4]',
  visibility: AssetVisibility.Timeline,
};

const hasDupe = {
  ...hasEmbedding,
  id: 'asset-2',
  duplicateId: 'duplicate-id',
};

describe(DuplicateService.name, () => {
  let sut: DuplicateService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DuplicateService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDuplicates', () => {
    it('should get duplicates', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['duplicate-id']));
      mocks.duplicateRepository.cleanupSingletonGroups.mockResolvedValue();
      const asset = AssetFactory.create();
      mocks.duplicateRepository.getAll.mockResolvedValue([
        {
          duplicateId: 'duplicate-id',
          assets: [asset, asset],
        },
      ]);
      await expect(sut.getDuplicates(authStub.admin)).resolves.toEqual([
        {
          duplicateId: 'duplicate-id',
          assets: [expect.objectContaining({ id: asset.id }), expect.objectContaining({ id: asset.id })],
        },
      ]);
    });

    it('should return suggestedKeepAssetIds based on file size', async () => {
      const smallAsset = {
        ...assetStub.image,
        id: 'small-asset',
        exifInfo: { ...assetStub.image.exifInfo, fileSizeInByte: 1000 },
      };
      const largeAsset = {
        ...assetStub.image,
        id: 'large-asset',
        exifInfo: { ...assetStub.image.exifInfo, fileSizeInByte: 5000 },
      };
      mocks.duplicateRepository.cleanupSingletonGroups.mockResolvedValue();
      mocks.duplicateRepository.getAll.mockResolvedValue([
        {
          duplicateId: 'duplicate-id',
          assets: [smallAsset, largeAsset],
        },
      ]);
      const result = await sut.getDuplicates(authStub.admin);
      expect(result[0].suggestedKeepAssetIds).toEqual(['large-asset']);
    });
  });

  describe('handleQueueSearchDuplicates', () => {
    beforeEach(() => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should skip if duplicate detection is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.Skipped);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForSearchDuplicates.mockReturnValue(makeStream([asset]));

      await sut.handleQueueSearchDuplicates({});

      expect(mocks.assetJob.streamForSearchDuplicates).toHaveBeenCalledWith(undefined);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectDuplicates,
          data: { id: asset.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForSearchDuplicates.mockReturnValue(makeStream([asset]));

      await sut.handleQueueSearchDuplicates({ force: true });

      expect(mocks.assetJob.streamForSearchDuplicates).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.AssetDetectDuplicates,
          data: { id: asset.id },
        },
      ]);
    });
  });

  describe('resolve', () => {
    it('should handle mixed success and failure', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1', 'group-2']));
      mocks.duplicateRepository.get.mockResolvedValueOnce(void 0);
      mocks.duplicateRepository.get.mockResolvedValueOnce({
        duplicateId: 'group-2',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [
            { duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: [] },
            { duplicateId: 'group-2', keepAssetIds: ['asset-1'], trashAssetIds: [] },
          ],
        }),
      ).resolves.toEqual([
        { id: 'group-1', success: false, error: BulkIdErrorReason.NOT_FOUND },
        { id: 'group-2', success: true },
      ]);
    });

    it('should catch and report errors', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockRejectedValue(new Error('Database error'));

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: [] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: false, error: BulkIdErrorReason.UNKNOWN }]);
    });
  });

  describe('resolveGroup (via resolve)', () => {
    it('should fail if duplicate group not found', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['missing-id']));
      mocks.duplicateRepository.get.mockResolvedValue(void 0);

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'missing-id', keepAssetIds: [], trashAssetIds: [] }],
        }),
      ).resolves.toEqual([
        {
          id: 'missing-id',
          success: false,
          error: BulkIdErrorReason.NOT_FOUND,
        },
      ]);
    });

    it('should skip when keepAssetIds contains non-member', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-999', 'asset-1'], trashAssetIds: [] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: true }]);
    });

    it('should skip when trashAssetIds contains non-member', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [{ ...assetStub.image, id: 'asset-1' }],
      });

      await expect(
        sut.resolve(authStub.admin, {
          groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-999'] }],
        }),
      ).resolves.toEqual([{ id: 'group-1', success: true }]);
    });

    it('should fail if keepAssetIds and trashAssetIds overlap', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-1'] }],
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('An asset cannot be in both keepAssetIds and trashAssetIds');
    });

    it('should fail if keepAssetIds and trashAssetIds do not cover all assets', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
          { ...assetStub.image, id: 'asset-3' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-2'] }],
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('Every asset must be in either keepAssetIds or trashAssetIds');
    });

    it('should fail if partial trash without keepers', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          { ...assetStub.image, id: 'asset-1' },
          { ...assetStub.image, id: 'asset-2' },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: [], trashAssetIds: ['asset-1'] }],
      });

      expect(result[0].success).toBe(false);
      expect(result[0].errorMessage).toContain('Every asset must be in either keepAssetIds or trashAssetIds');
    });

    it('should sync merged tags to asset_exif.tags', async () => {
      mocks.access.duplicate.checkOwnerAccess.mockResolvedValue(new Set(['group-1']));
      mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set(['asset-2']));
      mocks.access.tag.checkOwnerAccess.mockResolvedValue(new Set(['tag-1', 'tag-2']));
      mocks.duplicateRepository.get.mockResolvedValue({
        duplicateId: 'group-1',
        assets: [
          {
            ...assetStub.image,
            id: 'asset-1',
            tags: [{ id: 'tag-1', value: 'Work', createdAt: new Date(), updatedAt: new Date(), userId: 'user-1' }],
          },
          {
            ...assetStub.image,
            id: 'asset-2',
            tags: [{ id: 'tag-2', value: 'Travel', createdAt: new Date(), updatedAt: new Date(), userId: 'user-1' }],
          },
        ],
      });

      const result = await sut.resolve(authStub.admin, {
        groups: [{ duplicateId: 'group-1', keepAssetIds: ['asset-1'], trashAssetIds: ['asset-2'] }],
      });

      expect(result[0].success).toBe(true);

      // Verify tags were applied to tag_asset table
      expect(mocks.tag.replaceAssetTags).toHaveBeenCalledWith('asset-1', ['tag-1', 'tag-2']);

      // Verify merged tag values were written to asset_exif.tags so SidecarWrite preserves them
      expect(mocks.asset.updateAllExif).toHaveBeenCalledWith(['asset-1'], { tags: ['Work', 'Travel'] });

      // Verify SidecarWrite was queued (to write tags to sidecar)
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SidecarWrite, data: { id: 'asset-1' } },
      ]);
    });

    // NOTE: The following integration-style tests are covered by E2E tests instead
    // to avoid complex mock setup. The validation and error-handling logic above
    // is thoroughly unit tested.
  });

  describe('handleSearchDuplicates', () => {
    beforeEach(() => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
      const result = await sut.handleSearchDuplicates({ id: newUuid() });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.assetJob.getForSearchDuplicatesJob).not.toHaveBeenCalled();
    });

    it('should skip if duplicate detection is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });
      const result = await sut.handleSearchDuplicates({ id: newUuid() });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.assetJob.getForSearchDuplicatesJob).not.toHaveBeenCalled();
    });

    it('should fail if asset is not found', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(void 0);

      const asset = AssetFactory.create();
      const result = await sut.handleSearchDuplicates({ id: asset.id });

      expect(result).toBe(JobStatus.Failed);
      expect(mocks.logger.error).toHaveBeenCalledWith(`Asset ${asset.id} not found`);
    });

    it('should skip if asset is part of stack', async () => {
      const asset = AssetFactory.from().stack().build();
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, stackId: asset.stackId });

      const result = await sut.handleSearchDuplicates({ id: asset.id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${asset.id} is part of a stack, skipping`);
    });

    it('should skip if asset is not visible', async () => {
      const asset = AssetFactory.create({ visibility: AssetVisibility.Hidden });
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, ...asset });

      const result = await sut.handleSearchDuplicates({ id: asset.id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${asset.id} is not visible, skipping`);
    });

    it('should fail if asset is missing embedding', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, embedding: null });

      const asset = AssetFactory.create();
      const result = await sut.handleSearchDuplicates({ id: asset.id });

      expect(result).toBe(JobStatus.Failed);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${asset.id} is missing embedding`);
    });

    it('should search for duplicates and update asset with duplicateId', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      const asset = AssetFactory.create();
      mocks.duplicateRepository.search.mockResolvedValue([{ assetId: asset.id, distance: 0.01, duplicateId: null }]);
      mocks.duplicateRepository.merge.mockResolvedValue();
      const expectedAssetIds = [asset.id, hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.duplicateRepository.search).toHaveBeenCalledWith({
        assetId: hasEmbedding.id,
        embedding: hasEmbedding.embedding,
        maxDistance: 0.01,
        type: hasEmbedding.type,
        userIds: [hasEmbedding.ownerId],
      });
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetId: expect.any(String),
        sourceIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should use existing duplicate ID among matched duplicates', async () => {
      const duplicateId = hasDupe.duplicateId;
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      mocks.duplicateRepository.search.mockResolvedValue([{ assetId: hasDupe.id, distance: 0.01, duplicateId }]);
      mocks.duplicateRepository.merge.mockResolvedValue();
      const expectedAssetIds = [hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.duplicateRepository.search).toHaveBeenCalledWith({
        assetId: hasEmbedding.id,
        embedding: hasEmbedding.embedding,
        maxDistance: 0.01,
        type: hasEmbedding.type,
        userIds: [hasEmbedding.ownerId],
      });
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetId: duplicateId,
        sourceIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should remove duplicateId if no duplicates found and asset has duplicateId', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasDupe);
      mocks.duplicateRepository.search.mockResolvedValue([]);

      const result = await sut.handleSearchDuplicates({ id: hasDupe.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: hasDupe.id, duplicateId: null });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: hasDupe.id,
        duplicatesDetectedAt: expect.any(Date),
      });
    });
  });
});

