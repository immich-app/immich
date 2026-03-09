import { AssetFileType, AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { OcrService } from 'src/services/ocr.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(OcrService.name, () => {
  let sut: OcrService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(OcrService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.assetJob.getForOcr.mockResolvedValue({
      visibility: AssetVisibility.Timeline,
      previewFile: '/uploads/user-id/thumbs/path.jpg',
    });
  });

  const mockOcrResult = (...texts: string[]) => {
    mocks.machineLearning.ocr.mockResolvedValue({
      box: texts.flatMap((_, i) => Array.from({ length: 8 }, (_, j) => i * 10 + j)),
      boxScore: texts.map(() => 0.9),
      text: texts,
      textScore: texts.map(() => 0.95),
    });
  };

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
      const asset = AssetFactory.create();
      mocks.assetJob.streamForOcrJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueOcr({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Ocr, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForOcrJob).toHaveBeenCalledWith(false);
    });

    it('should queue all the assets', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForOcrJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueOcr({ force: true });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.Ocr, data: { id: asset.id } }]);
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
      const asset = AssetFactory.create();
      mocks.assetJob.getForOcr.mockResolvedValue({ visibility: AssetVisibility.Timeline, previewFile: null });

      expect(await sut.handleOcr({ id: asset.id })).toEqual(JobStatus.Failed);

      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
    });

    it('should save the returned objects', async () => {
      const asset = AssetFactory.create();
      mocks.machineLearning.ocr.mockResolvedValue({
        box: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160],
        boxScore: [0.9, 0.8],
        text: ['One Two Three', 'Four Five'],
        textScore: [0.95, 0.85],
      });

      expect(await sut.handleOcr({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.ocr).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({
          modelName: 'PP-OCRv5_mobile',
          minDetectionScore: 0.5,
          minRecognitionScore: 0.8,
          maxResolution: 736,
        }),
      );
      expect(mocks.ocr.upsert).toHaveBeenCalledWith(
        asset.id,
        [
          {
            assetId: asset.id,
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
            assetId: asset.id,
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
        ],
        'One Two Three Four Five',
      );
    });

    it('should apply config settings', async () => {
      const asset = AssetFactory.create();
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
      mockOcrResult();

      expect(await sut.handleOcr({ id: asset.id })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.ocr).toHaveBeenCalledWith(
        '/uploads/user-id/thumbs/path.jpg',
        expect.objectContaining({
          modelName: 'PP-OCRv5_server',
          minDetectionScore: 0.8,
          minRecognitionScore: 0.9,
          maxResolution: 1500,
        }),
      );
      expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, [], '');
    });

    it('should skip invisible assets', async () => {
      const asset = AssetFactory.from().file({ type: AssetFileType.Preview }).build();
      mocks.assetJob.getForOcr.mockResolvedValue({
        visibility: AssetVisibility.Hidden,
        previewFile: asset.files[0].path,
      });

      expect(await sut.handleOcr({ id: asset.id })).toEqual(JobStatus.Skipped);

      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
    });

    it('should fail if asset could not be found', async () => {
      mocks.assetJob.getForOcr.mockResolvedValue(void 0);

      expect(await sut.handleOcr({ id: 'non-existent' })).toEqual(JobStatus.Failed);

      expect(mocks.machineLearning.ocr).not.toHaveBeenCalled();
      expect(mocks.ocr.upsert).not.toHaveBeenCalled();
    });

    describe('search tokenization', () => {
      it('should generate bigrams for Chinese text', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('機器學習');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), '機器 器學 學習');
      });

      it('should generate bigrams for Japanese text', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('テスト');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), 'テス スト');
      });

      it('should generate bigrams for Korean text', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('한국어');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), '한국 국어');
      });

      it('should pass through Latin text unchanged', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('Hello World');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), 'Hello World');
      });

      it('should handle mixed CJK and Latin text', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('機器學習Model');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), '機器 器學 學習 Model');
      });

      it('should handle year followed by CJK', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('2024年レポート');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), '2024 年レ レポ ポー ート');
      });

      it('should join multiple OCR boxes', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('機器', 'Learning');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), '機器 Learning');
      });

      it('should normalize whitespace', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('  Hello   World  ');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), 'Hello World');
      });

      it('should keep single CJK characters', async () => {
        const asset = AssetFactory.create();
        mockOcrResult('A', '中', 'B');

        await sut.handleOcr({ id: asset.id });

        expect(mocks.ocr.upsert).toHaveBeenCalledWith(asset.id, expect.any(Array), 'A 中 B');
      });
    });
  });
});
