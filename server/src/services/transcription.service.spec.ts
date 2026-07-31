import { Stats } from 'node:fs';
import { AssetVisibility, ImmichWorker, JobName, JobStatus } from 'src/enum';
import { TranscriptionService } from 'src/services/transcription.service';
import { PCM_BYTES_PER_SECOND } from 'src/utils/transcription';
import { AssetFactory } from 'test/factories/asset.factory';
import { systemConfigStub } from 'test/fixtures/system-config.stub';
import { makeStream, newTestService, ServiceMocks } from 'test/utils';

/** An extracted stream holding `seconds` of 16 kHz mono 16-bit PCM. */
const audioOf = (seconds: number) => ({ size: seconds * PCM_BYTES_PER_SECOND }) as Stats;

/** The quality signals of ordinary speech, for the tests that are not about them. */
const speechQuality = { noSpeechProbability: 0.02, avgLogProbability: -0.2, compressionRatio: 1.4 };

/**
 * An asset as `getForTranscription` returns it. `videoStreamId` stands for a video stream row, which
 * every video the current metadata extractor has seen has; without one, an absent audio stream means
 * "not yet extracted" rather than "silent".
 */
const transcribable = (overrides: Record<string, unknown> = {}) => ({
  id: 'asset-id',
  originalPath: '/uploads/user-id/original/video.mp4',
  visibility: AssetVisibility.Timeline,
  videoStreamId: 'asset-id',
  audioStream: { index: 0, codecName: 'aac', profile: null, bitrate: 128_000 },
  ...overrides,
});

describe(TranscriptionService.name, () => {
  let sut: TranscriptionService;
  let mocks: ServiceMocks;

  beforeEach(() => {
    ({ sut, mocks } = newTestService(TranscriptionService));

    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
    mocks.assetJob.getForTranscription.mockResolvedValue(transcribable());
    mocks.media.extractAudio.mockResolvedValue([]);
    mocks.storage.stat.mockResolvedValue(audioOf(10));
    mocks.storage.readFile.mockResolvedValue(Buffer.alloc(4));
    mocks.transcript.getStatus.mockResolvedValue(void 0);
    mocks.transcript.getLastLanguage.mockResolvedValue(void 0);
    mocks.transcript.getByAssetId.mockResolvedValue([]);
    mocks.machineLearning.transcribe.mockResolvedValue({
      language: 'en',
      segments: [
        { start: 0, end: 1.5, text: 'Hello there', language: 'en', languageConfidence: 0.99, ...speechQuality },
      ],
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
      expect(mocks.transcript.deleteAll).not.toHaveBeenCalled();
    });

    it('should queue every video and truncate existing transcripts when forced', async () => {
      const asset = AssetFactory.create();
      mocks.assetJob.streamForTranscriptionJob.mockReturnValue(makeStream([asset]));

      await sut.handleQueueTranscription({ force: true });

      expect(mocks.transcript.deleteAll).toHaveBeenCalled();
      expect(mocks.assetJob.streamForTranscriptionJob).toHaveBeenCalledWith(true);
      expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetTranscribe, data: { id: asset.id } }]);
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
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ visibility: AssetVisibility.Hidden }));

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
    });

    it('should leave a hidden asset unmarked, so unhiding it queues it again', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ visibility: AssetVisibility.Hidden }));

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.asset.upsertJobStatus).not.toHaveBeenCalled();
    });

    it('should skip videos without an audio track', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ audioStream: null }));

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.media.extractAudio).not.toHaveBeenCalled();
      expect(mocks.machineLearning.transcribe).not.toHaveBeenCalled();
      expect(mocks.transcript.appendChunk).not.toHaveBeenCalled();
    });

    it('should mark a probed video without an audio track as transcribed, so bulk runs stop re-examining it', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ audioStream: null }));

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: 'asset-id',
        transcribedAt: expect.any(Date),
      });
    });

    it('should not write off a video whose streams have never been extracted', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ audioStream: null, videoStreamId: null }));

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Skipped);

      expect(mocks.asset.upsertJobStatus).not.toHaveBeenCalled();
      expect(mocks.machineLearning.transcribe).not.toHaveBeenCalled();
    });

    it('should transcribe an unextracted video once its audio stream is recorded', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ audioStream: null, videoStreamId: null }));
      await sut.handleTranscribe({ id: 'asset-id' });

      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable());

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.transcribe).toHaveBeenCalled();
    });

    it('should extract raw pcm with silence detection and persist the transcript', async () => {
      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Success);

      expect(mocks.media.extractAudio).toHaveBeenCalledWith(
        '/uploads/user-id/original/video.mp4',
        expect.stringMatching(/\.pcm$/),
        { silenceThreshold: -30, silenceMinDuration: 0.25 },
      );
      expect(mocks.machineLearning.transcribe).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ modelName: 'small', threads: 4 }),
      );
      expect(mocks.transcript.appendChunk).toHaveBeenCalledWith(
        'asset-id',
        [{ assetId: 'asset-id', startTime: 0, endTime: 1.5, text: 'Hello there', language: 'en', ...speechQuality }],
        10_000,
      );
      expect(mocks.asset.upsertJobStatus).toHaveBeenCalledWith({
        assetId: 'asset-id',
        transcribedAt: expect.any(Date),
      });
    });

    it('should clear any earlier attempt before a fresh run', async () => {
      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.reset).toHaveBeenCalledWith('asset-id');
    });

    it('should split long audio at detected silences', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(90));
      mocks.media.extractAudio.mockResolvedValue([
        { start: 28, end: 30 },
        { start: 62, end: 63 },
      ]);

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledTimes(3);
      expect(mocks.transcript.appendChunk.mock.calls.map((call) => call[2])).toEqual([29_000, 62_500, 90_000]);
    });

    it('should offset segment times by the start of their chunk', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(70));
      mocks.machineLearning.transcribe.mockResolvedValue({
        language: 'en',
        segments: [
          { start: 2, end: 4, text: 'Second chunk', language: 'en', languageConfidence: 0.99, ...speechQuality },
        ],
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk.mock.calls[1][1]).toEqual([
        { assetId: 'asset-id', startTime: 32, endTime: 34, text: 'Second chunk', language: 'en', ...speechQuality },
      ]);
    });

    it('should time out inference on a multiple of the chunk duration', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(120));

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ timeout: 30 * 30 * 1000 }),
      );
    });

    it('should resume from the recorded offset instead of restarting', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(90));
      mocks.transcript.getStatus.mockResolvedValue({ transcribedAt: null, transcriptionProgressMs: 60_000 });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.reset).not.toHaveBeenCalled();
      expect(mocks.machineLearning.transcribe).toHaveBeenCalledTimes(1);
      expect(mocks.transcript.appendChunk).toHaveBeenCalledTimes(1);
      expect(mocks.transcript.appendChunk.mock.calls[0][2]).toBe(90_000);
    });

    it('should still advance progress for a chunk with no speech', async () => {
      mocks.machineLearning.transcribe.mockResolvedValue({ language: 'en', segments: [] });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk).toHaveBeenCalledWith('asset-id', [], 10_000);
    });

    it('should mark an already complete asset done without re-running inference', async () => {
      mocks.transcript.getStatus.mockResolvedValue({ transcribedAt: new Date(), transcriptionProgressMs: 10_000 });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.transcribe).not.toHaveBeenCalled();
      expect(mocks.transcript.appendChunk).not.toHaveBeenCalled();
    });

    it('should re-transcribe a complete asset from the start when forced', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(90));
      mocks.transcript.getStatus.mockResolvedValue({ transcribedAt: new Date(), transcriptionProgressMs: 90_000 });

      expect(await sut.handleTranscribe({ id: 'asset-id', force: true })).toEqual(JobStatus.Success);

      expect(mocks.transcript.getStatus).not.toHaveBeenCalled();
      expect(mocks.transcript.reset).toHaveBeenCalledWith('asset-id');
      expect(mocks.machineLearning.transcribe).toHaveBeenCalledTimes(3);
    });

    it('should stop a run that outlasts its whole-asset budget, leaving the offset to resume from', async () => {
      // Ninety seconds of audio at the default multiplier is a budget of forty-five minutes, and
      // three chunks; a chunk that takes forty minutes puts the third one past the deadline.
      mocks.storage.stat.mockResolvedValue(audioOf(90));

      let now = Date.now();
      const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
      onTestFinished(() => clock.mockRestore());
      mocks.machineLearning.transcribe.mockImplementation(() => {
        now += 40 * 60 * 1000;
        return Promise.resolve({ language: 'en', segments: [] });
      });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Failed);

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledTimes(2);
      expect(mocks.transcript.appendChunk).toHaveBeenCalledTimes(2);
      expect(mocks.asset.upsertJobStatus).not.toHaveBeenCalled();
    });

    it('should always transcribe at least one chunk, however short the budget', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(10));

      let now = Date.now();
      const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
      onTestFinished(() => clock.mockRestore());
      mocks.machineLearning.transcribe.mockImplementation(() => {
        now += 24 * 60 * 60 * 1000;
        return Promise.resolve({ language: 'en', segments: [] });
      });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Success);

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('search text', () => {
    it('should write the flattened search text once, at completion', async () => {
      mocks.transcript.getByAssetId.mockResolvedValue([
        {
          id: 'segment-id',
          assetId: 'asset-id',
          startTime: 0,
          endTime: 1.5,
          text: 'Hello there',
          correctedText: null,
          language: 'en',
          ...speechQuality,
        },
      ]);

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.getByAssetId).toHaveBeenCalledWith('asset-id');
      expect(mocks.transcript.upsertSearchText).toHaveBeenCalledWith('asset-id', 'Hello there');
      // Written before the asset is marked transcribed, so a poller that sees completion never
      // observes a still-absent search row.
      expect(mocks.transcript.upsertSearchText.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.asset.upsertJobStatus.mock.invocationCallOrder[0],
      );
    });

    it('should not write search text for a video skipped for having no audio track', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ audioStream: null }));

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.upsertSearchText).not.toHaveBeenCalled();
    });

    it('should not write search text for a hidden asset', async () => {
      mocks.assetJob.getForTranscription.mockResolvedValue(transcribable({ visibility: AssetVisibility.Hidden }));

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.upsertSearchText).not.toHaveBeenCalled();
    });

    it('should not write search text for a run stopped by its time budget', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(90));

      let now = Date.now();
      const clock = vi.spyOn(Date, 'now').mockImplementation(() => now);
      onTestFinished(() => clock.mockRestore());
      mocks.machineLearning.transcribe.mockImplementation(() => {
        now += 40 * 60 * 1000;
        return Promise.resolve({ language: 'en', segments: [] });
      });

      expect(await sut.handleTranscribe({ id: 'asset-id' })).toEqual(JobStatus.Failed);

      expect(mocks.transcript.upsertSearchText).not.toHaveBeenCalled();
    });
  });

  describe('quality signals', () => {
    it('should store the signals the model reported for every segment', async () => {
      mocks.machineLearning.transcribe.mockResolvedValue({
        language: 'en',
        segments: [
          {
            start: 0,
            end: 1,
            text: 'Hello there',
            language: 'en',
            languageConfidence: 0.99,
            noSpeechProbability: 0.03,
            avgLogProbability: -0.31,
            compressionRatio: 1.52,
          },
        ],
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk.mock.calls[0][1][0]).toEqual(
        expect.objectContaining({ noSpeechProbability: 0.03, avgLogProbability: -0.31, compressionRatio: 1.52 }),
      );
    });

    it('should persist a segment the thresholds would reject rather than discarding it', async () => {
      // Storing is what makes retuning a query. A row dropped here would need inference re-run
      // across the library to get back, so ingest keeps everything and the reader decides.
      mocks.machineLearning.transcribe.mockResolvedValue({
        language: 'en',
        segments: [
          {
            start: 0,
            end: 4,
            text: 'Subtitles by the Amara.org community',
            language: 'en',
            languageConfidence: 0.99,
            noSpeechProbability: 0.98,
            avgLogProbability: -2.4,
            compressionRatio: 3.1,
          },
        ],
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk.mock.calls[0][1]).toHaveLength(1);
      expect(mocks.transcript.appendChunk.mock.calls[0][1][0]).toEqual(
        expect.objectContaining({ text: 'Subtitles by the Amara.org community', noSpeechProbability: 0.98 }),
      );
    });
  });

  describe('language resolution', () => {
    it('should store the resolved language on every segment', async () => {
      mocks.machineLearning.transcribe.mockResolvedValue({
        language: 'fr',
        segments: [
          { start: 0, end: 1, text: 'Bonjour', language: 'fr', languageConfidence: 0.98, ...speechQuality },
          { start: 1, end: 2, text: 'la la la', language: 'cy', languageConfidence: 0.2, ...speechQuality },
          { start: 2, end: 3, text: 'Hello', language: 'en', languageConfidence: 0.95, ...speechQuality },
        ],
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk.mock.calls[0][1].map((segment) => segment.language)).toEqual([
        'fr',
        'fr',
        'en',
      ]);
    });

    it('should carry the established language into the next chunk', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(70));
      mocks.machineLearning.transcribe
        .mockResolvedValueOnce({
          language: 'de',
          segments: [
            { start: 0, end: 1, text: 'Guten Tag', language: 'de', languageConfidence: 0.97, ...speechQuality },
          ],
        })
        .mockResolvedValueOnce({
          language: 'de',
          segments: [{ start: 0, end: 1, text: '...', language: 'nn', languageConfidence: 0.11, ...speechQuality }],
        });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.appendChunk.mock.calls[1][1][0].language).toBe('de');
    });

    it('should inherit the established language of an interrupted run when resuming', async () => {
      mocks.storage.stat.mockResolvedValue(audioOf(90));
      mocks.transcript.getStatus.mockResolvedValue({ transcribedAt: null, transcriptionProgressMs: 60_000 });
      mocks.transcript.getLastLanguage.mockResolvedValue('ja');
      mocks.machineLearning.transcribe.mockResolvedValue({
        language: 'ja',
        segments: [{ start: 0, end: 1, text: 'mmm', language: 'ko', languageConfidence: 0.3, ...speechQuality }],
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.transcript.getLastLanguage).toHaveBeenCalledWith('asset-id');
      expect(mocks.transcript.appendChunk.mock.calls[0][1][0].language).toBe('ja');
    });

    it('should pass a configured override to the model instead of detecting', async () => {
      mocks.systemMetadata.get.mockResolvedValue({
        machineLearning: { transcription: { language: 'es' } },
      });

      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ language: 'es' }),
      );
    });

    it('should not ask for a language when detection is automatic', async () => {
      await sut.handleTranscribe({ id: 'asset-id' });

      expect(mocks.machineLearning.transcribe).toHaveBeenCalledWith(
        expect.any(Buffer),
        expect.objectContaining({ language: null }),
      );
    });
  });
});
