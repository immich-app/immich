import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE, VIDEO_SEGMENT_DURATION_SECONDS } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetFileType, AssetType, AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { VideoSegmentUpsert } from 'src/repositories/video-segment.repository';
import { JobItem, JobOf } from 'src/types';
import { isSmartSearchEnabled } from 'src/utils/misc';

@Injectable()
export class VideoSegmentationService extends BaseService {
  private readonly segmentDuration = VIDEO_SEGMENT_DURATION_SECONDS;

  @OnJob({ name: JobName.AssetSegmentVideoQueueAll, queue: QueueName.VideoSegmentation })
  async handleQueueAll({ force }: JobOf<JobName.AssetSegmentVideoQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForVideoSegmentation(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.AssetSegmentVideo, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    if (queue.length > 0) {
      await this.jobRepository.queueAll(queue);
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetSegmentVideo, queue: QueueName.VideoSegmentation })
  async handleSegment({ id }: JobOf<JobName.AssetSegmentVideo>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForVideoSegmentation(id);
    if (!asset || asset.type !== AssetType.Video) {
      return JobStatus.Skipped;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    const previewFile = (asset.files ?? []).find((file) => file.type === AssetFileType.Preview);
    const videoPath = previewFile?.path ?? asset.originalPath;
    if (!videoPath) {
      this.logger.warn(`Video asset ${id} is missing a preview or original path for segmentation`);
      return JobStatus.Skipped;
    }

    let durationSeconds = this.parseDuration(asset.duration);
    try {
      const info = await this.mediaRepository.probe(videoPath);
      durationSeconds = info.format.duration || durationSeconds;
    } catch (error) {
      this.logger.warn(`Failed to probe video for asset ${id}: ${error}`);
    }

    if (!durationSeconds || Number.isNaN(durationSeconds) || durationSeconds <= 0) {
      this.logger.warn(`Unable to determine duration for asset ${id}, skipping segmentation`);
      return JobStatus.Skipped;
    }

    const step = Math.max(this.segmentDuration, 1);
    const segmentCount = Math.max(1, Math.ceil(durationSeconds / step));
    const tempDir = tmpdir();
    const segments: VideoSegmentUpsert[] = [];

    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
      const startTime = segmentIndex * step;
      const endTime = Math.min(startTime + step, durationSeconds);
      const timestamp = startTime + (endTime - startTime) / 2;
      const framePath = join(tempDir, `immich-segment-${asset.id}-${segmentIndex}-${randomUUID()}.jpg`);

      try {
        await this.mediaRepository.captureFrame(videoPath, timestamp, framePath);
        const embedding = await this.machineLearningRepository.encodeImage(framePath, machineLearning.clip);
        segments.push({ segmentIndex, startTime, endTime, embedding });
      } catch (error) {
        this.logger.warn(`Failed to capture segment ${segmentIndex} for asset ${id}: ${error}`);
      } finally {
        await fs.unlink(framePath).catch(() => {});
      }
    }

    await this.videoSegmentRepository.replace(asset.id, segments);
    return JobStatus.Success;
  }

  private parseDuration(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const parts = value.split(':');
    if (parts.length !== 3) {
      const numeric = Number.parseFloat(value);
      return Number.isFinite(numeric) ? numeric : 0;
    }

    const [hours, minutes, seconds] = parts;
    const sec = Number.parseFloat(seconds);
    const min = Number.parseInt(minutes);
    const hr = Number.parseInt(hours);
    if (!Number.isFinite(sec) || !Number.isFinite(min) || !Number.isFinite(hr)) {
      return 0;
    }

    return hr * 3600 + min * 60 + sec;
  }
}
