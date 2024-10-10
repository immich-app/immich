import { SystemConfig } from 'src/config';
import { ImmichWorker } from 'src/enum';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { IDatabaseRepository } from 'src/interfaces/database.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { SmartInfoService } from 'src/services/smart-info.service';
import { getCLIPModelInfo } from 'src/utils/misc';
import { assetStub } from 'test/fixtures/asset.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { newTestService } from 'test/utils';
import { Mocked } from 'vitest';

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;

  let assetMock: Mocked<IAssetRepository>;
  let databaseMock: Mocked<IDatabaseRepository>;
  let jobMock: Mocked<IJobRepository>;
  let machineLearningMock: Mocked<IMachineLearningRepository>;
  let searchMock: Mocked<ISearchRepository>;
  let systemMock: Mocked<ISystemMetadataRepository>;

  beforeEach(() => {
    ({ sut, assetMock, databaseMock, jobMock, machineLearningMock, searchMock, systemMock } =
      newTestService(SmartInfoService));

    assetMock.getByIds.mockResolvedValue([assetStub.image]);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('onConfigValidateEvent', () => {
    it('should allow a valid model', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: { machineLearning: { clip: { modelName: 'ViT-B-16__openai' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).not.toThrow();
    });

    it('should allow including organization', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: { machineLearning: { clip: { modelName: 'immich-app/ViT-B-16__openai' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).not.toThrow();
    });

    it('should fail for an unsupported model', () => {
      expect(() =>
        sut.onConfigValidate({
          newConfig: { machineLearning: { clip: { modelName: 'test-model' } } } as SystemConfig,
          oldConfig: {} as SystemConfig,
        }),
      ).toThrow('Unknown CLIP model: test-model');
    });
  });

  describe('onBootstrapEvent', () => {
    it('should return if not microservices', async () => {
      await sut.onBootstrap(ImmichWorker.API);

      expect(systemMock.get).not.toHaveBeenCalled();
      expect(searchMock.getDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).not.toHaveBeenCalled();
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });

    it('should return if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.onBootstrap(ImmichWorker.MICROSERVICES);

      expect(systemMock.get).toHaveBeenCalledTimes(1);
      expect(searchMock.getDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).not.toHaveBeenCalled();
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      searchMock.getDimensionSize.mockResolvedValue(512);

      await sut.onBootstrap(ImmichWorker.MICROSERVICES);

      expect(systemMock.get).toHaveBeenCalledTimes(1);
      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).not.toHaveBeenCalled();
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      searchMock.getDimensionSize.mockResolvedValue(768);
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.onBootstrap(ImmichWorker.MICROSERVICES);

      expect(systemMock.get).toHaveBeenCalledTimes(1);
      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).toHaveBeenCalledWith(512);
      expect(jobMock.getQueueStatus).toHaveBeenCalledTimes(1);
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(jobMock.waitForQueueCompletion).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should skip pausing and resuming queue if already paused', async () => {
      searchMock.getDimensionSize.mockResolvedValue(768);
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: true });

      await sut.onBootstrap(ImmichWorker.MICROSERVICES);

      expect(systemMock.get).toHaveBeenCalledTimes(1);
      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).toHaveBeenCalledWith(512);
      expect(jobMock.getQueueStatus).toHaveBeenCalledTimes(1);
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).not.toHaveBeenCalled();
    });
  });

  describe('onConfigUpdateEvent', () => {
    it('should return if machine learning is disabled', async () => {
      systemMock.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.onConfigUpdate({
        newConfig: systemConfigStub.machineLearningDisabled as SystemConfig,
        oldConfig: systemConfigStub.machineLearningDisabled as SystemConfig,
      });

      expect(systemMock.get).not.toHaveBeenCalled();
      expect(searchMock.getDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).not.toHaveBeenCalled();
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      searchMock.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(searchMock.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).not.toHaveBeenCalled();
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).not.toHaveBeenCalled();
      expect(jobMock.resume).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      searchMock.getDimensionSize.mockResolvedValue(512);
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-L-14-quickgelu__dfn2b', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).toHaveBeenCalledWith(768);
      expect(jobMock.getQueueStatus).toHaveBeenCalledTimes(1);
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(jobMock.waitForQueueCompletion).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should clear embeddings if old and new models are different', async () => {
      searchMock.getDimensionSize.mockResolvedValue(512);
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: false });

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-32__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(searchMock.deleteAllSearchEmbeddings).toHaveBeenCalled();
      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).toHaveBeenCalledTimes(1);
      expect(jobMock.pause).toHaveBeenCalledTimes(1);
      expect(jobMock.waitForQueueCompletion).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).toHaveBeenCalledTimes(1);
    });

    it('should skip pausing and resuming queue if already paused', async () => {
      searchMock.getDimensionSize.mockResolvedValue(512);
      jobMock.getQueueStatus.mockResolvedValue({ isActive: false, isPaused: true });

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-32__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(searchMock.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(searchMock.setDimensionSize).not.toHaveBeenCalled();
      expect(jobMock.getQueueStatus).toHaveBeenCalledTimes(1);
      expect(jobMock.pause).not.toHaveBeenCalled();
      expect(jobMock.waitForQueueCompletion).toHaveBeenCalledTimes(1);
      expect(jobMock.resume).not.toHaveBeenCalled();
    });
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
      expect(machineLearningMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.noResizePath]);

      expect(await sut.handleEncodeClip({ id: assetStub.noResizePath.id })).toEqual(JobStatus.FAILED);

      expect(searchMock.upsert).not.toHaveBeenCalled();
      expect(machineLearningMock.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      machineLearningMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.SUCCESS);

      expect(machineLearningMock.encodeImage).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(searchMock.upsert).toHaveBeenCalledWith(assetStub.image.id, [0.01, 0.02, 0.03]);
    });

    it('should skip invisible assets', async () => {
      assetMock.getByIds.mockResolvedValue([assetStub.livePhotoMotionAsset]);

      expect(await sut.handleEncodeClip({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(machineLearningMock.encodeImage).not.toHaveBeenCalled();
      expect(searchMock.upsert).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      assetMock.getByIds.mockResolvedValue([]);

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.FAILED);

      expect(machineLearningMock.encodeImage).not.toHaveBeenCalled();
      expect(searchMock.upsert).not.toHaveBeenCalled();
    });

    it('should wait for database', async () => {
      machineLearningMock.encodeImage.mockResolvedValue([0.01, 0.02, 0.03]);
      databaseMock.isBusy.mockReturnValue(true);

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.SUCCESS);

      expect(databaseMock.wait).toHaveBeenCalledWith(512);
      expect(machineLearningMock.encodeImage).toHaveBeenCalledWith(
        'http://immich-machine-learning:3003',
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(searchMock.upsert).toHaveBeenCalledWith(assetStub.image.id, [0.01, 0.02, 0.03]);
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
