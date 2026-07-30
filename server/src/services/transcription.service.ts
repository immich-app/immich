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

    const audioPath = join(tmpdir(), `${randomUUID()}.wav`);
    try {
      await this.mediaRepository.extractAudio(asset.originalPath, audioPath);
      const { language, segments } = await this.machineLearningRepository.transcribe(
        audioPath,
        machineLearning.transcription,
      );

      await this.transcriptRepository.upsert(
        id,
        segments.map((segment) => ({
          assetId: id,
          startTime: segment.start,
          endTime: segment.end,
          text: segment.text,
        })),
      );

      this.logger.debug(`Transcribed ${segments.length} segment(s) for asset ${id} (language: ${language})`);
    } finally {
      await rm(audioPath, { force: true });
    }

    await this.assetRepository.upsertJobStatus({ assetId: id, transcribedAt: new Date() });

    return JobStatus.Success;
  }
}
