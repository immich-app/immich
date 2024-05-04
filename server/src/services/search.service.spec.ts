import { mapAsset } from 'src/dtos/asset-response.dto';
import { SystemConfigKey } from 'src/entities/system-config.entity';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { IMetadataRepository } from 'src/interfaces/metadata.interface';
import { IPartnerRepository } from 'src/interfaces/partner.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemConfigRepository } from 'src/interfaces/system-config.interface';
import { SearchService } from 'src/services/search.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { authStub } from 'test/fixtures/auth.stub';
import { personStub } from 'test/fixtures/person.stub';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newCryptoRepositoryMock } from 'test/repositories/crypto.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMachineLearningRepositoryMock } from 'test/repositories/machine-learning.repository.mock';
import { newMetadataRepositoryMock } from 'test/repositories/metadata.repository.mock';
import { newPartnerRepositoryMock } from 'test/repositories/partner.repository.mock';
import { newPersonRepositoryMock } from 'test/repositories/person.repository.mock';
import { newSearchRepositoryMock } from 'test/repositories/search.repository.mock';
import { newSystemConfigRepositoryMock } from 'test/repositories/system-config.repository.mock';
import { Mocked, vitest } from 'vitest';

vitest.useFakeTimers();

describe(SearchService.name, () => {
  let sut: SearchService;
  let assetMock: Mocked<IAssetRepository>;
  let configMock: Mocked<ISystemConfigRepository>;
  let machineMock: Mocked<IMachineLearningRepository>;
  let personMock: Mocked<IPersonRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let partnerMock: Mocked<IPartnerRepository>;
  let metadataMock: Mocked<IMetadataRepository>;
  let loggerMock: Mocked<ILoggerRepository>;
  let cryptoMock: Mocked<ICryptoRepository>;
  let jobMock: Mocked<IJobRepository>;

  beforeEach(() => {
    assetMock = newAssetRepositoryMock();
    configMock = newSystemConfigRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    personMock = newPersonRepositoryMock();
    searchMock = newSearchRepositoryMock();
    partnerMock = newPartnerRepositoryMock();
    metadataMock = newMetadataRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    cryptoMock = newCryptoRepositoryMock();
    jobMock = newJobRepositoryMock();

    sut = new SearchService(
      configMock,
      machineMock,
      personMock,
      searchMock,
      assetMock,
      partnerMock,
      metadataMock,
      loggerMock,
      cryptoMock,
      jobMock,
    );
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('searchPerson', () => {
    it('should pass options to search', async () => {
      const { name } = personStub.withName;

      await sut.searchPerson(authStub.user1, { name, withHidden: false });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.user.id, name, { withHidden: false });

      await sut.searchPerson(authStub.user1, { name, withHidden: true });

      expect(personMock.getByName).toHaveBeenCalledWith(authStub.user1.user.id, name, { withHidden: true });
    });
  });

  describe('getExploreData', () => {
    it('should get assets by city and tag', async () => {
      assetMock.getAssetIdByCity.mockResolvedValue({
        fieldName: 'exifInfo.city',
        items: [{ value: 'Paris', data: assetStub.image.id }],
      });
      assetMock.getAssetIdByTag.mockResolvedValue({
        fieldName: 'smartInfo.tags',
        items: [{ value: 'train', data: assetStub.imageFrom2015.id }],
      });
      assetMock.getByIdsWithAllRelations.mockResolvedValue([assetStub.image, assetStub.imageFrom2015]);
      const expectedResponse = [
        { fieldName: 'exifInfo.city', items: [{ value: 'Paris', data: mapAsset(assetStub.image) }] },
        { fieldName: 'smartInfo.tags', items: [{ value: 'train', data: mapAsset(assetStub.imageFrom2015) }] },
      ];

      const result = await sut.getExploreData(authStub.user1);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('handleQueueSearchDuplicates', () => {
    it('should skip if machine learning is disabled', async () => {
      configMock.load.mockResolvedValue([{ key: SystemConfigKey.MACHINE_LEARNING_ENABLED, value: false }]);

      await expect(sut.handleQueueSearchDuplicates({})).resolves.toBe(JobStatus.SKIPPED);
      expect(jobMock.queue).not.toHaveBeenCalled();
      expect(jobMock.queueAll).not.toHaveBeenCalled();
      expect(configMock.load).toHaveBeenCalled();
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
      personMock.getAll.mockResolvedValue({
        items: [personStub.withName],
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
        maxDistance: 0.03,
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
        maxDistance: 0.03,
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
