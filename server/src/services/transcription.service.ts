import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isTranscriptionEnabled } from 'src/utils/misc';
import {
  AudioChunk,
  getChunkByteRange,
  getInferenceTimeout,
  getPcmDuration,
  planChunks,
  planResume,
  SILENCE_MIN_DURATION,
  SILENCE_THRESHOLD_DB,
} from 'src/utils/transcription';

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
  async handleTranscribe({ id }: JobOf<JobName.AssetTranscribe>): Promise<JobStatus> {
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

    if (!asset.audioStream) {
      this.logger.debug(`Skipping transcription for asset ${id}: no audio stream`);
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
      const chunks = planChunks({
        duration: getPcmDuration(size),
        silences,
        targetDuration: transcription.chunkDuration,
      });

      // A recorded offset means an earlier run got part of the way through. The plan is recomputed
      // from scratch rather than replayed, so a change to the chunk size or the silence thresholds
      // between the failure and this retry is harmless.
      const status = await this.transcriptRepository.getStatus(id);
      const progressMs = status?.transcriptionProgressMs;
      let pending: AudioChunk[];
      if (progressMs === undefined || progressMs === null) {
        await this.transcriptRepository.reset(id);
        pending = chunks;
      } else {
        pending = planResume(chunks, progressMs / 1000);
        if (pending.length < chunks.length) {
          this.logger.debug(`Resuming transcription of asset ${id} at ${progressMs}ms`);
        }
      }

      for (const chunk of pending) {
        await this.transcribeChunk(id, audioPath, size, chunk, transcription);
      }
    } finally {
      await rm(audioPath, { force: true });
    }

    await this.assetRepository.upsertJobStatus({ assetId: id, transcribedAt: new Date() });

    return JobStatus.Success;
  }

  private async transcribeChunk(
    id: string,
    audioPath: string,
    size: number,
    chunk: AudioChunk,
    transcription: { modelName: string; threads: number; timeoutMultiplier: number },
  ) {
    const progressMs = Math.round(chunk.end * 1000);
    const { position, length } = getChunkByteRange(chunk, size);
    if (length === 0) {
      await this.transcriptRepository.appendChunk(id, [], progressMs);
      return;
    }

    const audio = await this.storageRepository.readFile(audioPath, {
      buffer: Buffer.allocUnsafe(length),
      position,
      length,
    });

    const { language, segments } = await this.machineLearningRepository.transcribe(audio, {
      modelName: transcription.modelName,
      threads: transcription.threads,
      timeout: getInferenceTimeout(chunk, transcription.timeoutMultiplier),
    });

    // Segment times are relative to the chunk; shift them onto the asset's timeline. The end is
    // clamped because a model can overrun the audio it was given by a fraction of a second.
    await this.transcriptRepository.appendChunk(
      id,
      segments.map((segment) => ({
        assetId: id,
        startTime: chunk.start + segment.start,
        endTime: Math.min(chunk.start + segment.end, chunk.end),
        text: segment.text,
      })),
      progressMs,
    );

    this.logger.debug(
      `Transcribed ${segments.length} segment(s) for asset ${id} at ${chunk.start.toFixed(1)}-${chunk.end.toFixed(1)}s (language: ${language})`,
    );
  }
}
