import { JobName, JobStatus } from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { DuplicateService } from 'src/services/duplicate.service';
import { SearchService } from 'src/services/search.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService, ServiceMocks } from 'test/utils';
import { beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
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
      mocks.asset.getDuplicates.mockResolvedValue([
        {
          duplicateId: assetStub.hasDupe.duplicateId!,
          assets: [assetStub.hasDupe, assetStub.hasDupe],
        },
      ]);
      await expect(sut.getDuplicates(authStub.admin)).resolves.toEqual([
        {
          duplicateId: assetStub.hasDupe.duplicateId,
          assets: [
            expect.objectContaining({ id: assetStub.hasDupe.id }),
            expect.objectContaining({ id: assetStub.hasDupe.id }),
          ],
        },
      ]);
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

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.SKIPPED);
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

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.SKIPPED);
      expect(mocks.job.queue).not.toHaveBeenCalled();
      expect(mocks.job.queueAll).not.toHaveBeenCalled();
      expect(mocks.systemMetadata.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      mocks.asset.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueSearchDuplicates({});

      expect(mocks.asset.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.DUPLICATE);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.DUPLICATE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      mocks.asset.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueSearchDuplicates({ force: true });

      expect(mocks.asset.getAll).toHaveBeenCalled();
      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.DUPLICATE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
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
      const id = assetStub.livePhotoMotionAsset.id;
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
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
      const id = assetStub.livePhotoMotionAsset.id;
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
    });

    it('should fail if asset is not found', async () => {
      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(mocks.logger.error).toHaveBeenCalledWith(`Asset ${assetStub.image.id} not found`);
    });

    it('should skip if asset is not visible', async () => {
      const id = assetStub.livePhotoMotionAsset.id;
      mocks.asset.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${id} is not visible, skipping`);
    });

    it('should fail if asset is missing preview image', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.noResizePath);

      const result = await sut.handleSearchDuplicates({ id: assetStub.noResizePath.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(mocks.logger.warn).toHaveBeenCalledWith(`Asset ${assetStub.noResizePath.id} is missing preview image`);
    });

    it('should fail if asset is missing embedding', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.image);

      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(mocks.logger.debug).toHaveBeenCalledWith(`Asset ${assetStub.image.id} is missing embedding`);
    });

    it('should search for duplicates and update asset with duplicateId', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.hasEmbedding);
      mocks.search.searchDuplicates.mockResolvedValue([
        { assetId: assetStub.image.id, distance: 0.01, duplicateId: null },
      ]);
      const expectedAssetIds = [assetStub.image.id, assetStub.hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasEmbedding.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(mocks.search.searchDuplicates).toHaveBeenCalledWith({
        assetId: assetStub.hasEmbedding.id,
        embedding: assetStub.hasEmbedding.smartSearch!.embedding,
        maxDistance: 0.01,
        type: assetStub.hasEmbedding.type,
        userIds: [assetStub.hasEmbedding.ownerId],
      });
      expect(mocks.asset.updateDuplicates).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetDuplicateId: expect.any(String),
        duplicateIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should use existing duplicate ID among matched duplicates', async () => {
      const duplicateId = assetStub.hasDupe.duplicateId;
      mocks.asset.getById.mockResolvedValue(assetStub.hasEmbedding);
      mocks.search.searchDuplicates.mockResolvedValue([{ assetId: assetStub.hasDupe.id, distance: 0.01, duplicateId }]);
      const expectedAssetIds = [assetStub.hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasEmbedding.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(mocks.search.searchDuplicates).toHaveBeenCalledWith({
        assetId: assetStub.hasEmbedding.id,
        embedding: assetStub.hasEmbedding.smartSearch!.embedding,
        maxDistance: 0.01,
        type: assetStub.hasEmbedding.type,
        userIds: [assetStub.hasEmbedding.ownerId],
      });
      expect(mocks.asset.updateDuplicates).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetDuplicateId: assetStub.hasDupe.duplicateId,
        duplicateIds: [],
      });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should remove duplicateId if no duplicates found and asset has duplicateId', async () => {
      mocks.asset.getById.mockResolvedValue(assetStub.hasDupe);
      mocks.search.searchDuplicates.mockResolvedValue([]);

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasDupe.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(mocks.asset.update).toHaveBeenCalledWith({ id: assetStub.hasDupe.id, duplicateId: null });
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: assetStub.hasDupe.id,
        duplicatesDetectedAt: expect.any(Date),
      });
    });
  });
});
