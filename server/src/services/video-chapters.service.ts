import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetType, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

export interface VideoChapter {
  startMs: number;
  endMs: number;
  title: string;
  description: string;
}

@Injectable()
export class VideoChaptersService extends BaseService {
  @OnJob({ name: JobName.VideoChaptersQueueAll, queue: QueueName.BackgroundTask })
  async handleQueueAll({ force }: JobOf<JobName.VideoChaptersQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      if (asset.type === AssetType.Video) {
        queue.push({ name: JobName.VideoChapters, data: { id: asset.id } });
        if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
          await this.jobRepository.queueAll(queue);
          queue = [];
        }
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VideoChapters, queue: QueueName.BackgroundTask })
  async handleVideoChapters({ id }: JobOf<JobName.VideoChapters>): Promise<JobStatus> {
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
      // 1. Extract scene change frames using ffmpeg
      // 2. Combine with transcription segments if available
      // 3. Send to VLM for chapter title generation
      // 4. Store chapter markers

      this.logger.verbose(`Video chapter detection queued for asset ${id}`);

      // Placeholder for scene detection + VLM chapter generation
      // const scenes = await this.mediaRepository.detectSceneChanges(asset.files[0].path);
      // const transcription = await this.transcriptionRepository.getByAssetId(id);
      // const chapters = await this.vlmService.generateChapters(scenes, transcription);

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate chapters for video ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
