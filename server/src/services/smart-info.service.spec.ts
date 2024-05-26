import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SmartInfoService } from 'src/services/smart-info.service';
import { getCLIPModelInfo } from 'src/utils/misc';
import { assetStub } from 'test/fixtures/asset.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { newAssetRepositoryMock } from 'test/repositories/asset.repository.mock';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newJobRepositoryMock } from 'test/repositories/job.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { newMachineLearningRepositoryMock } from 'test/repositories/machine-learning.repository.mock';
import { newSearchRepositoryMock } from 'test/repositories/search.repository.mock';
import { newSystemMetadataRepositoryMock } from 'test/repositories/system-metadata.repository.mock';
import { Mocked } from 'vitest';

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;
  let assetMock: Mocked<IAssetRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;
  let jobMock: Mocked<IJobRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let machineMock: Mocked<IMachineLearningRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    assetMock = newAssetRepositoryMock();
    systemMock = newSystemMetadataRepositoryMock();
    searchMock = newSearchRepositoryMock();
    jobMock = newJobRepositoryMock();
    machineMock = newMachineLearningRepositoryMock();
    databaseMock = newDatabaseRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new SmartInfoService(assetMock, databaseMock, jobMock, machineMock, searchMock, systemMock, loggerMock);

    assetMock.getByIds.mockResolvedValue([assetStub.image]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.handleQueueEncodeClip({});

      expect(assetMock.getAll).not.toHaveBeenCalled();
      expect(assetMock.getWithout).not.toHaveBeenCalled();
    });

    it('should queue the assets without clip embeddings', async () => {
      assetMock.getWithout.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: false });

      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } }]);
      expect(assetMock.getWithout).toHaveBeenCalledWith({ skip: 0, take: 1000 }, WithoutProperty.SMART_SEARCH);
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should queue all the assets', async () => {
      assetMock.getAll.mockResolvedValue({
        items: [assetStub.image],
        hasNextPage: false,
      });

      await sut.handleQueueEncodeClip({ force: true });

      expect(jobMock.queueAll).toHaveBeenCalledWith([{ name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } }]);
      expect(assetMock.getAll).toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).toHaveBeenCalled();
    });
  });

  describe('handleEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleEncodeClip({ id: '123' })).toEqual(JobStatus.SKIPPED);

      expect(assetMock.getByIds).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);

      expect(await sut.handleEncodeClip({ id: assetStub.noResizePath.id })).toEqual(JobStatus.FAILED);

      expect(searchMock.upsert).not.toHaveBeenCalled();
      expect(machineMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      machineMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.SUCCESS);

      expect(machineMock.encodeImage).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        { imagePath: assetStub.image.previewPath },
        { enabled: true, modelName: 'ViT-B-32__openai' },
      );
      expect(searchMock.upsert).toHaveBeenCalledWith(assetStub.image.id, [0.01, 0.02, 0.03]);
    });

    it('should skip invisible assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);

      expect(await sut.handleEncodeClip({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(machineMock.encodeImage).not.toHaveBeenCalled();
      expect(searchMock.upsert).not.toHaveBeenCalled();
    });
  });

  describe('getCLIPModelInfo', () => {
    it('should return the model info', () => {
      expect(getCLIPModelInfo('ViT-B-32__openai')).toEqual({ dimSize: 512 });
      expect(getCLIPModelInfo('M-CLIP/XLM-Roberta-Large-Vit-L-14')).toEqual({ dimSize: 768 });
    });

    it('should clean the model name', () => {
      expect(getCLIPModelInfo('ViT-B-32::openai')).toEqual({ dimSize: 512 });
    });

    it('should throw an error if the model is not present', () => {
      expect(() => getCLIPModelInfo('test-model')).toThrow('Unknown CLIP model: test-model');
    });
  });
});
