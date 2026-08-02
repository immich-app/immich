import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SystemConfig } from 'src/config';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isTranscriptionEnabled } from 'src/utils/misc';
import {
  AudioChunk,
  buildTranscriptSearchText,
  getChunkByteRange,
  getInferenceTimeout,
  getJobTimeout,
  getPcmDuration,
  planChunks,
  planResume,
  resolveSegmentLanguages,
  SILENCE_MIN_DURATION,
  SILENCE_THRESHOLD_DB,
} from 'src/utils/transcription';

type TranscriptionSettings = SystemConfig['machineLearning']['transcription'];

@Injectable()
export class TranscriptionService extends BaseService {
  @OnJob({ name: JobName.AssetTranscribeQueueAll, queue: QueueName.Transcription })
  async handleQueueTranscription({ force }: JobOf<JobName.AssetTranscribeQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isTranscriptionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      await this.transcriptRepository.deleteAll();
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForTranscriptionJob(force);

    for await (const asset of assets) {
      jobs.push({ name: JobName.AssetTranscribe, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetTranscribe, queue: QueueName.Transcription })
  async handleTranscribe({ id, force }: JobOf<JobName.AssetTranscribe>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isTranscriptionEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForTranscription(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const { maxDuration } = machineLearning.transcription;
    // A queue running at concurrency one should not keep re-examining a video already known to be
    // too long, so this is recorded exactly like the no-audio case below: `transcribedAt` is set so
    // it drops out of future bulk sweeps, but distinguishably so via the flag alongside it, which is
    // what lets a forced re-run against a raised limit tell "too long" from "already transcribed"
    // instead of treating both the same way a bare `transcribedAt` would.
    if (maxDuration !== null && asset.duration !== null && asset.duration / 1000 > maxDuration) {
      this.logger.debug(`Skipping transcription for asset ${id}: duration exceeds the configured maximum`);
      await this.assetRepository.upsertJobStatus({
        assetId: id,
        transcribedAt: new Date(),
        transcriptionMaxDurationExceeded: true,
      });
      return JobStatus.Skipped;
    }

    if (!asset.audioStream) {
      // An absent audio row has two readings. Either the file was probed and has no audio track, or
      // it has never been probed by a version that records one — the tables holding stream details
      // were added empty and are filled by metadata extraction, so a library that upgraded past
      // that point without re-extracting has audio it has not written down yet.
      //
      // A video stream row separates them: any video the current extractor has seen has one. With
      // it, "no audio" is a permanent fact and is recorded as such, so bulk runs stop re-examining
      // a silent file forever — a queue that runs one job at a time should not spend every run
      // re-enqueueing tens of thousands of them. Without it the answer is not knowable yet, so the
      // asset is left alone to be picked up once its metadata has been extracted. Writing it off
      // here would silently exclude a video with perfectly good audio until someone thought to run
      // a forced re-transcription of the whole library.
      if (!asset.videoStreamId) {
        this.logger.debug(`Skipping transcription for asset ${id}: audio streams not yet extracted`);
        return JobStatus.Skipped;
      }

      this.logger.debug(`Marking asset ${id} as transcribed: no audio stream`);
      await this.assetRepository.upsertJobStatus({ assetId: id, transcribedAt: new Date() });
      return JobStatus.Skipped;
    }

    const { transcription } = machineLearning;
    const audioPath = join(tmpdir(), `${randomUUID()}.pcm`);

    try {
      const silences = await this.mediaRepository.extractAudio(asset.originalPath, audioPath, {
        silenceThreshold: SILENCE_THRESHOLD_DB,
        silenceMinDuration: SILENCE_MIN_DURATION,
      });
      const { size } = await this.storageRepository.stat(audioPath);
      const duration = getPcmDuration(size);
      const chunks = planChunks({ duration, silences, targetDuration: transcription.chunkDuration });

      // A recorded offset means an earlier run got part of the way through. The plan is recomputed
      // from scratch rather than replayed, so a change to the chunk size or the silence thresholds
      // between the failure and this retry is harmless.
      //
      // A forced run ignores the offset. That is what makes re-processing a single asset actually
      // re-transcribe it: a finished asset's offset sits at the end of the file, so honouring it
      // would leave nothing to do and the re-run would be a no-op.
      const status = force ? undefined : await this.transcriptRepository.getStatus(id);
      const progressMs = status?.transcriptionProgressMs;
      let pending: AudioChunk[];
      // The language established so far is carried from chunk to chunk so that stickiness holds
      // across boundaries, and read back from what was already written so that it holds across a
      // restart too.
      let language: string | undefined;
      if (progressMs === undefined || progressMs === null) {
        await this.transcriptRepository.reset(id);
        pending = chunks;
      } else {
        pending = planResume(chunks, progressMs / 1000);
        language = await this.transcriptRepository.getLastLanguage(id);
        if (pending.length < chunks.length) {
          this.logger.debug(`Resuming transcription of asset ${id} at ${progressMs}ms`);
        }
      }

      const deadline = Date.now() + getJobTimeout(duration, transcription.timeoutMultiplier);
      for (const chunk of pending) {
        if (Date.now() >= deadline) {
          // Reported as a failure rather than a success, because the transcript is not finished.
          // The offset of the last committed chunk stays recorded, so a later run picks up here
          // instead of starting the asset over.
          this.logger.warn(
            `Transcription of asset ${id} exceeded its time budget at ${chunk.start.toFixed(1)}s of ${duration.toFixed(1)}s`,
          );
          return JobStatus.Failed;
        }

        language = await this.transcribeChunk(id, audioPath, size, chunk, transcription, language);
      }
    } finally {
      await rm(audioPath, { force: true });
    }

    // Built once, here, rather than per chunk: search should transition from absent to fully
    // present atomically, and a video still processing must not surface as a partial hit.
    const segments = await this.transcriptRepository.getByAssetId(id);
    await this.transcriptRepository.upsertSearchText(id, buildTranscriptSearchText(segments, transcription));

    await this.assetRepository.upsertJobStatus({ assetId: id, transcribedAt: new Date() });

    return JobStatus.Success;
  }

  /** Returns the language established by the end of the chunk, for the next chunk to inherit. */
  private async transcribeChunk(
    id: string,
    audioPath: string,
    size: number,
    chunk: AudioChunk,
    transcription: TranscriptionSettings,
    previousLanguage?: string,
  ): Promise<string | undefined> {
    const progressMs = Math.round(chunk.end * 1000);
    const { position, length } = getChunkByteRange(chunk, size);
    if (length === 0) {
      await this.transcriptRepository.appendChunk(id, [], progressMs);
      return previousLanguage;
    }

    const audio = await this.storageRepository.readFile(audioPath, {
      buffer: Buffer.allocUnsafe(length),
      position,
      length,
    });

    const { segments } = await this.machineLearningRepository.transcribe(audio, {
      modelName: transcription.modelName,
      threads: transcription.threads,
      language: transcription.language,
      timeout: getInferenceTimeout(chunk, transcription.timeoutMultiplier),
    });

    const languages = resolveSegmentLanguages(segments, transcription.minLanguageConfidence, previousLanguage);

    // Segment times are relative to the chunk; shift them onto the asset's timeline. The end is
    // clamped because a model can overrun the audio it was given by a fraction of a second.
    //
    // Every segment is written, including the ones the quality signals condemn. The signals are
    // stored alongside so that the caption track can exclude them at read time, which is what
    // makes retuning the thresholds a query rather than a re-run of inference over the library.
    await this.transcriptRepository.appendChunk(
      id,
      segments.map((segment, index) => ({
        assetId: id,
        startTime: chunk.start + segment.start,
        endTime: Math.min(chunk.start + segment.end, chunk.end),
        text: segment.text,
        language: languages[index],
        noSpeechProbability: segment.noSpeechProbability,
        avgLogProbability: segment.avgLogProbability,
        compressionRatio: segment.compressionRatio,
      })),
      progressMs,
    );

    this.logger.debug(
      `Transcribed ${segments.length} segment(s) for asset ${id} at ${chunk.start.toFixed(1)}-${chunk.end.toFixed(1)}s (languages: ${[...new Set(languages)].join(', ') || 'none'})`,
    );

    // A chunk with no speech in it leaves the established language untouched rather than clearing
    // it, so a stretch of music between two people talking does not reset the transcript.
    return languages.at(-1) ?? previousLanguage;
  }
}
