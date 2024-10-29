import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { DuplicateService } from 'src/services/duplicate.service';
import { SearchService } from 'src/services/search.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { newTestService } from 'test/utils';
import { Mocked, beforeEach, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: DuplicateService;

  let assetMock: Mocked<IAssetRepository>;
  let jobMock: Mocked<IJobRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, assetMock, jobMock, loggerMock, searchMock, systemMock } = newTestService(DuplicateService));
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('getDuplicates', () => {
    it('should get duplicates', async () => {
      assetMock.getDuplicates.mockResolvedValue([assetStub.hasDupe]);
      await expect(sut.getDuplicates(authStub.admin)).resolves.toEqual([
        { duplicateId: assetStub.hasDupe.duplicateId, assets: [expect.objectContaining({ id: assetStub.hasDupe.id })] },
      ]);
    });
  });

  describe('handleQueueSearchDuplicates', () => {
    beforeEach(() => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
    });

    it('should skip if duplicate detection is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(systemMock.get).toHaveBeenCalled();
    });

    it('should queue missing assets', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueSearchDuplicates({});

      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.DUPLICATE);
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.DUPLICATE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });

    it('should queue all assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueSearchDuplicates({ force: true });

      expect(assetMock.getAll).toHaveBeenCalled();
      expect(jobMock.queueAll).toHaveBeenCalledWith([
        {
          name: JobName.DUPLICATE_DETECTION,
          data: { id: assetStub.image.id },
        },
      ]);
    });
  });

  describe('handleSearchDuplicates', () => {
    beforeEach(() => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
    });

    it('should skip if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: false,
          duplicateDetection: {
            enabled: true,
          },
        },
      });
      const id = assetStub.livePhotoMotionAsset.id;
      assetMock.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
    });

    it('should skip if duplicate detection is disabled', async () => {
      systemMock.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          duplicateDetection: {
            enabled: false,
          },
        },
      });
      const id = assetStub.livePhotoMotionAsset.id;
      assetMock.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
    });

    it('should fail if asset is not found', async () => {
      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(loggerMock.error).toHaveBeenCalledWith(`Asset ${assetStub.image.id} not found`);
    });

    it('should skip if asset is not visible', async () => {
      const id = assetStub.livePhotoMotionAsset.id;
      assetMock.getById.mockResolvedValue(assetStub.livePhotoMotionAsset);

      const result = await sut.handleSearchDuplicates({ id });

      expect(result).toBe(JobStatus.SKIPPED);
      expect(loggerMock.debug).toHaveBeenCalledWith(`Asset ${id} is not visible, skipping`);
    });

    it('should fail if asset is missing preview image', async () => {
      assetMock.getById.mockResolvedValue(assetStub.noResizePath);

      const result = await sut.handleSearchDuplicates({ id: assetStub.noResizePath.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(loggerMock.warn).toHaveBeenCalledWith(`Asset ${assetStub.noResizePath.id} is missing preview image`);
    });

    it('should fail if asset is missing embedding', async () => {
      assetMock.getById.mockResolvedValue(assetStub.image);

      const result = await sut.handleSearchDuplicates({ id: assetStub.image.id });

      expect(result).toBe(JobStatus.FAILED);
      expect(loggerMock.debug).toHaveBeenCalledWith(`Asset ${assetStub.image.id} is missing embedding`);
    });

    it('should search for duplicates and update asset with duplicateId', async () => {
      assetMock.getById.mockResolvedValue(assetStub.hasEmbedding);
      searchMock.searchDuplicates.mockResolvedValue([
        { assetId: assetStub.image.id, distance: 0.01, duplicateId: null },
      ]);
      const expectedAssetIds = [assetStub.image.id, assetStub.hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasEmbedding.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(searchMock.searchDuplicates).toHaveBeenCalledWith({
        assetId: assetStub.hasEmbedding.id,
        embedding: assetStub.hasEmbedding.smartSearch!.embedding,
        maxDistance: 0.01,
        type: assetStub.hasEmbedding.type,
        userIds: [assetStub.hasEmbedding.ownerId],
      });
      expect(assetMock.updateDuplicates).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetDuplicateId: expect.any(String),
        duplicateIds: [],
      });
      expect(assetMock.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should use existing duplicate ID among matched duplicates', async () => {
      const duplicateId = assetStub.hasDupe.duplicateId;
      assetMock.getById.mockResolvedValue(assetStub.hasEmbedding);
      searchMock.searchDuplicates.mockResolvedValue([{ assetId: assetStub.hasDupe.id, distance: 0.01, duplicateId }]);
      const expectedAssetIds = [assetStub.hasEmbedding.id];

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasEmbedding.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(searchMock.searchDuplicates).toHaveBeenCalledWith({
        assetId: assetStub.hasEmbedding.id,
        embedding: assetStub.hasEmbedding.smartSearch!.embedding,
        maxDistance: 0.01,
        type: assetStub.hasEmbedding.type,
        userIds: [assetStub.hasEmbedding.ownerId],
      });
      expect(assetMock.updateDuplicates).toHaveBeenCalledWith({
        assetIds: expectedAssetIds,
        targetDuplicateId: assetStub.hasDupe.duplicateId,
        duplicateIds: [],
      });
      expect(assetMock.upsertJobStatus).toHaveBeenCalledWith(
        ...expectedAssetIds.map((assetId) => ({ assetId, duplicatesDetectedAt: expect.any(Date) })),
      );
    });

    it('should remove duplicateId if no duplicates found and asset has duplicateId', async () => {
      assetMock.getById.mockResolvedValue(assetStub.hasDupe);
      searchMock.searchDuplicates.mockResolvedValue([]);

      const result = await sut.handleSearchDuplicates({ id: assetStub.hasDupe.id });

      expect(result).toBe(JobStatus.SUCCESS);
      expect(assetMock.update).toHaveBeenCalledWith({ id: assetStub.hasDupe.id, duplicateId: null });
      expect(assetMock.upsertJobStatus).toHaveBeenCalledWith({
        assetId: assetStub.hasDupe.id,
        duplicatesDetectedAt: expect.any(Date),
      });
    });
  });
});
