import { AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { OcrService } from 'src/services/ocr.service';
import { assetStub } from 'test/fixtures/asset.stub';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(OcrService.name, () => {
  let sut: OcrService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(OcrService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueOcr', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      await sut.handleQueueOcr({ force: false });

      expect(mocks.database.setDimensionSize).not.toHaveBeenCalled();
    });

    it('should queue the assets without ocr', async () => {
      mocks.assetJob.streamForOcrJob.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueOcr({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Ocr, data: { id: assetStub.image.id } }]);
      expect(mocks.assetJob.streamForOcrJob).toHaveBeenCalledWith(false);
    });

    it('should queue all the assets', async () => {
      mocks.assetJob.streamForOcrJob.mockReturnValue(makeStream([assetStub.image]));

      await sut.handleQueueOcr({ force: true });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Ocr, data: { id: assetStub.image.id } }]);
      expect(mocks.assetJob.streamForOcrJob).toHaveBeenCalledWith(true);
    });
  });

  describe('handleOcr', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleOcr({ id: '123' })).toEqual(JobStatus.Skipped);

      expect(mocks.asset.getByIds).not.toHaveBeenCalled();
      expect(mocks.machineLearning.encodeImage).not.toHaveBeenCalled();
    });

    it('should skip assets without a resize path', async () => {
      mocks.assetJob.getForOcr.mockResolvedValue({ visibility: AssetVisibility.Timeline, previewFile: null });

      expect(await sut.handleOcr({ id: assetStub.noResizePath.id })).toEqual(JobStatus.Failed);

      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      mocks.machineLearning.ocr.mockResolvedValue({
        box: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
        boxScore: [0.9, 0.8],
        text: ['One Two Three', 'Four Five'],
        textScore: [0.95, 0.85],
      });
      mocks.assetJob.getForOcr.mockResolvedValue({
        visibility: AssetVisibility.Timeline,
        previewFile: assetStub.image.files[1].path,
      });

      expect(await sut.handleOcr({ id: assetStub.image.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.ocr).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({
          modelName: 'PP-OCRv5_mobile',
          minDetectionScore: 0.5,
          minRecognitionScore: 0.8,
          maxResolution: 736,
        }),
      );
      expect(mocks.ocr.upsert).toHaveBeenCalledWith(assetStub.image.id, [
        {
          assetId: assetStub.image.id,
          boxScore: 0.9,
          text: 'One Two Three',
          textScore: 0.95,
          x1: 10,
          y1: 20,
          x2: 30,
          y2: 40,
          x3: 50,
          y3: 60,
          x4: 70,
          y4: 80,
        },
        {
          assetId: assetStub.image.id,
          boxScore: 0.8,
          text: 'Four Five',
          textScore: 0.85,
          x1: 90,
          y1: 100,
          x2: 110,
          y2: 120,
          x3: 130,
          y3: 140,
          x4: 150,
          y4: 160,
        },
      ]);
    });

    it('should apply config settings', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: {
          enabled: true,
          ocr: {
            modelName: 'PP-OCRv5_server',
            enabled: true,
            minDetectionScore: 0.8,
            minRecognitionScore: 0.9,
            maxResolution: 1500,
          },
        },
      });
      mocks.machineLearning.ocr.mockResolvedValue({ box: [], boxScore: [], text: [], textScore: [] });
      mocks.assetJob.getForOcr.mockResolvedValue({
        visibility: AssetVisibility.Timeline,
        previewFile: assetStub.image.files[1].path,
      });

      expect(await sut.handleOcr({ id: assetStub.image.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.ocr).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({
          modelName: 'PP-OCRv5_server',
          minDetectionScore: 0.8,
          minRecognitionScore: 0.9,
          maxResolution: 1500,
        }),
      );
      expect(mocks.ocr.upsert).toHaveBeenCalledWith(assetStub.image.id, []);
    });

    it('should skip invisible assets', async () => {
      mocks.assetJob.getForOcr.mockResolvedValue({
        visibility: AssetVisibility.Hidden,
        previewFile: assetStub.image.files[1].path,
      });

      expect(await sut.handleOcr({ id: assetStub.livePhotoMotionAsset.id })).toEqual(JobStatus.Skipped);

      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForOcr.mockResolvedValue(void 0);

      expect(await sut.handleOcr({ id: assetStub.image.id })).toEqual(JobStatus.Failed);

      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
    });
  });
});
