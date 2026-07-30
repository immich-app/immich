import { AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { TranscriptionService } from 'src/services/transcription.service';
import { AssetFactory } from 'test/factories/asset.factory';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

describe(TranscriptionService.name, () => {
  let sut: TranscriptionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TranscriptionService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.assetJob.getForTranscription.mockResolvedValue({
      id: 'asset-id',
      originalPath: '/uploads/user-id/original/video.mp4',
      visibility: AssetVisibility.Timeline,
      audioStream: { index: 0, codecName: 'aac', profile: null, bitrate: 128_000 },
    });
    mocks.machineLearning.transcribe.mockResolvedValue({
      language: 'en',
      segments: [{ start: 0, end: 1.5, text: 'Hello there' }],
    });
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  describe('handleQueueTranscription', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleQueueTranscription({ force: false })).toEqual(JobStatus.Skipped);

      expect(mocks.assetJob.streamForTranscriptionJob).not.toHaveBeenCalled();
    });

    it('should queue the assets without a transcript', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForTranscriptionJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueTranscription({ force: false });

      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetTranscribe, data: { id: asset.id } }]);
      expect(mocks.assetJob.streamForTranscriptionJob).toHaveBeenCalledWith(false);
    });

    it('should truncate existing transcripts when forced', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForTranscriptionJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueTranscription({ force: true });

      expect(mocks.transcript.deleteAll).toHaveBeenCalled();
      expect(mocks.assetJob.streamForTranscriptionJob).toHaveBeenCalledWith(true);
    });
  });

  describe('handleTranscribe', () => {
    it('should do nothing if machine learning is disabled', async () => {
      mocks.systemMetadata.get.mockResolvedValue(systemConfigStub.machineLearningDisabled);

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
      expect(mocks.machineLearning.transcribe).not.toHaveBeenCalled();
    });

    it('should fail if the asset could not be found', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(void 0);

      expect(await sut.handleTranscribe({ id: 'missing' })).toEqual(JobStatus.Failed);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
    });

    it('should skip hidden assets', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue({
        id: 'asset-id',
        originalPath: '/uploads/user-id/original/video.mp4',
        visibility: AssetVisibility.Hidden,
        audioStream: { index: 0, codecName: 'aac', profile: null, bitrate: 128_000 },
      });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
    });

    it('should skip videos without an audio track', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue({
        id: 'asset-id',
        originalPath: '/uploads/user-id/original/video.mp4',
        visibility: AssetVisibility.Timeline,
        audioStream: null,
      });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
      expect(mocks.machineLearning.transcribe).not.toHaveBeenCalled();
      expect(mocks.transcript.upsert).not.toHaveBeenCalled();
    });

    it('should extract audio from the original file and persist the transcript', async () => {
      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Success);

      expect(mocks.media.extractAudio).toHaveBeenCalledWith(
        '/uploads/user-id/original/video.mp4',
        expect.any(String),
      );
      expect(mocks.machineLearning.transcribe).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ modelName: 'small', threads: 4 }),
      );
      expect(mocks.transcript.upsert).toHaveBeenCalledWith('asset-id', [
        { assetId: 'asset-id', startTime: 0, endTime: 1.5, text: 'Hello there' },
      ]);
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: 'asset-id',
        transcribedAt: expect.any(Date),
      });
    });
  });
});
