import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetType, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

export interface VideoHighlight {
  timestampMs: number;
  durationMs: number;
  description: string;
  score: number;
  thumbnailPath?: string;
}

@Injectable()
export class VideoHighlightsService extends BaseService {
  @OnJob({ name: JobName.VideoHighlightsQueueAll, queue: QueueName.BackgroundTask })
  async handleQueueAll({ force }: JobOf<JobName.VideoHighlightsQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      if (asset.type === AssetType.Video) {
        queue.push({ name: JobName.VideoHighlights, data: { id: asset.id } });
        if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
          await this.jobRepository.queueAll(queue);
          queue = [];
        }
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VideoHighlights, queue: QueueName.BackgroundTask })
  async handleVideoHighlights({ id }: JobOf<JobName.VideoHighlights>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForClipEncoding(id);
    if (!asset || asset.type !== AssetType.Video) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    try {
      // In full implementation:
      // 1. Extract key frames using ffmpeg scene detection
      // 2. Send frames to VLM for analysis
      // 3. Score and rank moments
      // 4. Store highlights metadata

      this.logger.verbose(`Video highlights analysis queued for asset ${id}`);

      // Placeholder for frame extraction + VLM analysis
      // const frames = await this.mediaRepository.extractKeyFrames(asset.files[0].path);
      // const analysis = await this.machineLearningRepository.analyzeVideo(frames);

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to analyze video highlights for asset ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
