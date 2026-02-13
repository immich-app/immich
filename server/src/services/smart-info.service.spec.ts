import { SystemConfig } from 'src/config';
import { AssetFileType, AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { SmartInfoService } from 'src/services/smart-info.service';
import { getCLIPModelInfo } from 'src/utils/misc';
import { AssetFactory } from 'test/factories/asset.factory';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(SmartInfoService.name, () => {
  let sut: SmartInfoService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(SmartInfoService));

    mocks.asset.getByIds.mockResolvedValue([AssetFactory.create()]);
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
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

      expect(mocks.database.getDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      mocks.database.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigInit({ newConfig: systemConfigStub.machineLearningEnabled as SystemConfig });

      expect(mocks.database.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      mocks.database.getDimensionSize.mockResolvedValue(768);

      await sut.onConfigInit({ newConfig: systemConfigStub.machineLearningEnabled as SystemConfig });

      expect(mocks.database.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.database.setDimensionSize).toHaveBeenCalledWith(512);
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
      expect(mocks.database.getDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should return if model and DB dimension size are equal', async () => {
      mocks.database.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.database.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
      expect(mocks.database.deleteAllSearchEmbeddings).not.toHaveBeenCalled();
    });

    it('should update DB dimension size if model and DB have different values', async () => {
      mocks.database.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-L-14-quickgelu__dfn2b', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.database.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.database.setDimensionSize).toHaveBeenCalledWith(768);
    });

    it('should clear embeddings if old and new models are different', async () => {
      mocks.database.getDimensionSize.mockResolvedValue(512);

      await sut.onConfigUpdate({
        newConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-32__openai', enabled: true }, enabled: true },
        } as SystemConfig,
        oldConfig: {
          machineLearning: { clip: { modelName: 'ViT-B-16__openai', enabled: true }, enabled: true },
        } as SystemConfig,
      });

      expect(mocks.database.deleteAllSearchEmbeddings).toHaveBeenCalled();
      expect(mocks.database.getDimensionSize).toHaveBeenCalledTimes(1);
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
    });
  });

  describe('handleQueueEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.handleQueueEncodeClip({});

      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
    });

    it('should queue the assets without clip embeddings', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForEncodeClip.mockReturnValue(makeStream([asset]));

      await sut.handleQueueEncodeClip({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SmartSearch, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForEncodeClip).toHaveBeenCalledWith(false);
      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
    });

    it('should queue all the assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForEncodeClip.mockReturnValue(makeStream([asset]));

      await sut.handleQueueEncodeClip({ force: true });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.SmartSearch, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForEncodeClip).toHaveBeenCalledWith(true);
      expect(mocks.database.setDimensionSize).toHaveBeenCalledExactlyOnceWith(512);
    });
  });

  describe('handleEncodeClip', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleEncodeClip({ id: '123' })).toEqual(JobStatus.Skipped);

      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

      expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Failed);

      expect(mocks.search.upsert).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.machineLearning.encodeImage.mockResolvedValue('[0.01, 0.02, 0.03]');
      mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

      expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.encodeImage).toHaveBeenCalledWith(
        asset.files[0].path,
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(mocks.search.upsert).toHaveBeenCalledWith(asset.id, '[0.01, 0.02, 0.03]');
    });

    it('should skip invisible assets', async () => {
      const asset = AssetFactory.from({ visibility: AssetVisibility.Hidden })
        .file({ type: AssetFileType.Preview })
        .build();
      mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

      expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Skipped);

      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
      expect(mocks.search.upsert).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForClipEncoding.mockResolvedValue(void 0);

      expect(await sut.handleEncodeClip({ id: 'non-existent' })).toEqual(JobStatus.Failed);

      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
      expect(mocks.search.upsert).not.toHaveBeenCalled();
    });

    it('should wait for database', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.machineLearning.encodeImage.mockResolvedValue('[0.01, 0.02, 0.03]');
      mocks.database.isBusy.mockReturnValue(true);
      mocks.assetJob.getForClipEncoding.mockResolvedValue(asset);

      expect(await sut.handleEncodeClip({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.database.wait).toHaveBeenCalledWith(512);
      expect(mocks.machineLearning.encodeImage).toHaveBeenCalledWith(
        asset.files[0].path,
        expect.objectContaining({ modelName: 'ViT-B-32__openai' }),
      );
      expect(mocks.search.upsert).toHaveBeenCalledWith(asset.id, '[0.01, 0.02, 0.03]');
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
