import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetType, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

export interface TranscriptionSegment {
  startMs: number;
  endMs: number;
  text: string;
  confidence: number;
  speaker?: string;
}

export interface VideoTranscription {
  assetId: string;
  language: string;
  segments: TranscriptionSegment[];
  fullText: string;
}

@Injectable()
export class VideoTranscriptionService extends BaseService {
  @OnJob({ name: JobName.VideoTranscribeQueueAll, queue: QueueName.BackgroundTask })
  async handleQueueAll({ force }: JobOf<JobName.VideoTranscribeQueueAll>): Promise<JobStatus> {
    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      if (asset.type === AssetType.Video) {
        queue.push({ name: JobName.VideoTranscribe, data: { id: asset.id } });
        if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
          await this.jobRepository.queueAll(queue);
          queue = [];
        }
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VideoTranscribe, queue: QueueName.BackgroundTask })
  async handleVideoTranscribe({ id }: JobOf<JobName.VideoTranscribe>): Promise<JobStatus> {
    const asset = await this.assetJobRepository.getForClipEncoding(id);
    if (!asset || asset.type !== AssetType.Video) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    try {
      // In full implementation:
      // 1. Extract audio from video using ffmpeg
      // 2. Send to Whisper STT (local Jetson or cloud)
      // 3. Store segments with timestamps
      // 4. Make full text searchable (integrate with smart search)

      this.logger.verbose(`Video transcription queued for asset ${id}`);

      // Placeholder for audio extraction + STT
      // const audioPath = await this.mediaRepository.extractAudio(asset.files[0].path);
      // const transcription = await this.sttService.transcribe(audioPath);
      // await this.transcriptionRepository.save({ assetId: id, ...transcription });

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to transcribe video ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
