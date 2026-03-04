import { AssetType, AssetVisibility, JobName, JobStatus } from 'src/enum';
import { DuplicateService } from 'src/services/duplicate.service';
import { SearchService } from 'src/services/search.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { authStub } from 'test/fixtures/auth.stub';
import { newUuid } from 'test/small.factory';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, vitest } from 'vitest';

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

describe(SearchService.name, () => {
  let sut: DuplicateService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(DuplicateService));
    mocks.duplicateRepository.delete.mockResolvedValue(undefined as any);
    mocks.duplicateRepository.deleteAll.mockResolvedValue(undefined as any);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDuplicates', () => {
    it('should get duplicates', async () => {
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
  });

  describe('delete', () => {
    it('should delete a specific duplicate group', async () => {
      const duplicateId = newUuid();

      await sut.delete(authStub.admin, duplicateId);

      expect(mocks.duplicateRepository.delete).toHaveBeenCalledWith(authStub.admin.user.id, duplicateId);
    });
  });

  describe('deleteAll', () => {
    it('should delete multiple duplicate groups', async () => {
      const ids = [newUuid(), newUuid()];

      await sut.deleteAll(authStub.admin, { ids });

      expect(mocks.duplicateRepository.deleteAll).toHaveBeenCalledWith(authStub.admin.user.id, ids);
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

    it('should batch queue assets when exceeding pagination size', async () => {
      const assets = Array.from({ length: 1001 }, () => AssetFactory.create());
      mocks.assetJob.streamForSearchDuplicates.mockReturnValue(makeStream(assets));

      await sut.handleQueueSearchDuplicates({});

      // Should have been called at least twice: once for the batch of 1000, once for the remaining 1
      expect(mocks.job.queueAll).toHaveBeenCalledTimes(2);
    });
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

    it('should skip if asset is locked', async () => {
      const asset = AssetFactory.create({ visibility: AssetVisibility.Locked });
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue({ ...hasEmbedding, ...asset });

      const result = await sut.handleSearchDuplicates({ id: asset.id });

      expect(result).toBe(JobStatus.Skipped);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${asset.id} is locked, skipping`);
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

    it('should not remove duplicateId if no duplicates found and asset has no duplicateId', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      mocks.duplicateRepository.search.mockResolvedValue([]);

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.asset.update).not.toHaveBeenCalled();
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: hasEmbedding.id,
        duplicatesDetectedAt: expect.any(Date),
      });
    });

    it('should use asset duplicateId as target when asset already has one', async () => {
      const existingDuplicateId = 'existing-duplicate-id';
      const assetWithDupe = { ...hasEmbedding, duplicateId: existingDuplicateId };
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(assetWithDupe);
      mocks.duplicateRepository.search.mockResolvedValue([
        { assetId: 'other-asset', distance: 0.01, duplicateId: null },
      ]);
      mocks.duplicateRepository.merge.mockResolvedValue();

      const result = await sut.handleSearchDuplicates({ id: assetWithDupe.id });

      expect(result).toBe(JobStatus.Success);
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: ['other-asset', assetWithDupe.id],
        targetId: existingDuplicateId,
        sourceIds: [],
      });
    });

    it('should merge multiple duplicate IDs into one target', async () => {
      mocks.assetJob.getForSearchDuplicatesJob.mockResolvedValue(hasEmbedding);
      mocks.duplicateRepository.search.mockResolvedValue([
        { assetId: 'dup-1', distance: 0.01, duplicateId: 'dup-id-1' },
        { assetId: 'dup-2', distance: 0.01, duplicateId: 'dup-id-2' },
        { assetId: 'dup-3', distance: 0.01, duplicateId: 'dup-id-1' },
      ]);
      mocks.duplicateRepository.merge.mockResolvedValue();

      const result = await sut.handleSearchDuplicates({ id: hasEmbedding.id });

      expect(result).toBe(JobStatus.Success);
      // Should use first duplicate ID (dup-id-1) as target, dup-id-2 as source
      expect(mocks.duplicateRepository.merge).toHaveBeenCalledWith({
        assetIds: expect.arrayContaining(['dup-2', hasEmbedding.id]),
        targetId: 'dup-id-1',
        sourceIds: ['dup-id-2'],
      });
    });
  });
});
