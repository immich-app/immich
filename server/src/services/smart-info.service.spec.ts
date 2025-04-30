import { SystemConfig } from 'src/config';
import { ImmichWorker, JobName, JobStatus } from 'src/enum';
import { SmartInfoService } from 'src/services/smart-info.service';
import { getCLIPModelInfo } from 'src/utils/misc';
import { assetStub } from 'test/fixtures/asset.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SmartInfoService));

    mocks.asset.getByIds.mockResolvedValue([assetStub.image]);
    mocks.config.getWorker.mockReturnValue(ImmichWorker.MICROSERVICES);
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

  describe('onConfigInit', () => {
    it('should return if machine learning is disabled', async () => {
      await sut.onConfigInit({ newConfig: systemConfigStub.machineLearningDisabled as SystemConfig });

      expect(mocks.search.getDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      mocks.search.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigInit({ newConfig: systemConfigStub.machineLearningEnabled as SystemConfig });

      expect(mocks.search.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      mocks.search.getDimensionSize.mockResolvedValue(768);

      await sut.onConfigInit({ newConfig: systemConfigStub.machineLearningEnabled as SystemConfig });

      expect(mocks.search.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.search.setDimensionSize).toHaveBeenCalledWith(512);
    });
  });

  describe('onConfigUpdateEvent', () => {
    it('should return if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.onConfigUpdate({
        newConfig: systemConfigStub.machineLearningDisabled as SystemConfig,
        oldConfig: systemConfigStub.machineLearningDisabled as SystemConfig,
      });

      expect(mocks.systemMetadata.get).not.toHaveBeenCalled();
      expect(mocks.search.getDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      mocks.search.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.search.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.search.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      mocks.search.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-L-14-quickgelu__dfn2b', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.search.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.search.setDimensionSize).toHaveBeenCalledWith(768);
    });

    it('should clear embeddings if old and new models are different', async () => {
      mocks.search.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-32__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.search.deleteAllSearchEmbeddings).toHaveBeenCalled();
      expect(mocks.search.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.handleQueueEncodeClip({});

      expect(mocks.asset.getWithout).not.toHaveBeenCalled();
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
    });

    it('should queue the assets without clip embeddings', async () => {
      mocks.assetJob.streamForEncodeClip.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueEncodeClip({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } },
      ]);
      expect(mocks.assetJob.streamForEncodeClip).toHaveBeenCalledWith(false);
      expect(mocks.search.setDimensionSize).not.toHaveBeenCalled();
    });

    it('should queue all the assets', async () => {
      mocks.assetJob.streamForEncodeClip.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueEncodeClip({ force: true });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([
        { name: JobName.SMART_SEARCH, data: { id: assetStub.image.id } },
      ]);
      expect(mocks.assetJob.streamForEncodeClip).toHaveBeenCalledWith(true);
      expect(mocks.search.setDimensionSize).toHaveBeenCalledExactlyOnceWith(512);
    });
  });

  describe('handleEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleEncodeClip({ id: '123' })).toEqual(JobStatus.SKIPPED);

      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      mocks.assetJob.getForClipEncoding.mockResolvedValue({ ...assetStub.noResizePath, files: [] });

      expect(await sut.handleEncodeClip({ id: assetStub.noResizePath.id })).toEqual(JobStatus.FAILED);

      expect(mocks.search.upsert).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      mocks.machineLearning.encodeImage.mockResolvedValue('[0.01, 0.02, 0.03]');
      mocks.assetJob.getForClipEncoding.mockResolvedValue({ ...assetStub.image, files: [assetStub.image.files[1]] });

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.SUCCESS);

      expect(mocks.machineLearning.encodeImage).toHaveBeenCalledWith(
        ['http://immich-machine-learning:3003'],
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(mocks.search.upsert).toHaveBeenCalledWith(assetStub.image.id, '[0.01, 0.02, 0.03]');
    });

    it('should skip invisible assets', async () => {
      mocks.assetJob.getForClipEncoding.mockResolvedValue({
        ...assetStub.livePhotoMotionAsset,
        files: [assetStub.image.files[1]],
      });

      expect(await sut.handleEncodeClip({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.SKIPPED);

      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
      expect(mocks.search.upsert).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForClipEncoding.mockResolvedValue(void 0);

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.FAILED);

      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
      expect(mocks.search.upsert).not.toHaveBeenCalled();
    });

    it('should wait for database', async () => {
      mocks.machineLearning.encodeImage.mockResolvedValue('[0.01, 0.02, 0.03]');
      mocks.database.isBusy.mockReturnValue(true);
      mocks.assetJob.getForClipEncoding.mockResolvedValue({ ...assetStub.image, files: [assetStub.image.files[1]] });

      expect(await sut.handleEncodeClip({ id: assetStub.image.id })).toEqual(JobStatus.SUCCESS);

      expect(mocks.database.wait).toHaveBeenCalledWith(512);
      expect(mocks.machineLearning.encodeImage).toHaveBeenCalledWith(
        ['http://immich-machine-learning:3003'],
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(mocks.search.upsert).toHaveBeenCalledWith(assetStub.image.id, '[0.01, 0.02, 0.03]');
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
