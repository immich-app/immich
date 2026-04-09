import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

@Injectable()
export class PhotoQualityService extends BaseService {
  @OnJob({ name: JobName.PhotoQualityQueueAll, queue: QueueName.BackgroundTask })
  async handleQueueAll({ force }: JobOf<JobName.PhotoQualityQueueAll>): Promise<JobStatus> {
    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.PhotoQuality, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.PhotoQuality, queue: QueueName.BackgroundTask })
  async handlePhotoQuality({ id }: JobOf<JobName.PhotoQuality>): Promise<JobStatus> {
    const asset = await this.assetJobRepository.getForClipEncoding(id);
    if (!asset || asset.files.length !== 1) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    try {
      const exif = await this.assetRepository.getExifById(id);
      if (!exif) {
        return JobStatus.Skipped;
      }

      // Compute quality score based on available EXIF and image data
      const score = this.computeQualityScore(exif);
      this.logger.verbose(`Quality score for asset ${id}: ${score.toFixed(2)}`);

      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to compute quality score for asset ${id}: ${error}`);
      return JobStatus.Failed;
    }
  }

  private computeQualityScore(exif: any): number {
    let score = 0.5; // Base score
    const factors: string[] = [];

    // Resolution factor (higher is better, up to a point)
    if (exif.exifImageWidth && exif.exifImageHeight) {
      const megapixels = (exif.exifImageWidth * exif.exifImageHeight) / 1_000_000;
      if (megapixels >= 12) {
        score += 0.1;
        factors.push('high-res');
      }
      if (megapixels < 2) {
        score -= 0.15;
        factors.push('low-res');
      }
    }

    // ISO factor (lower is generally better)
    if (exif.iso) {
      if (exif.iso <= 400) {
        score += 0.05;
        factors.push('low-iso');
      }
      if (exif.iso >= 3200) {
        score -= 0.1;
        factors.push('high-iso');
      }
    }

    // Shutter speed factor (blur detection proxy)
    if (exif.exposureTime) {
      const shutterSpeed = Number.parseFloat(exif.exposureTime);
      if (shutterSpeed > 0 && shutterSpeed < 1 / 60) {
        score += 0.05;
        factors.push('fast-shutter');
      }
    }

    // Has GPS data (usually intentional photos)
    if (exif.latitude && exif.longitude) {
      score += 0.05;
      factors.push('geotagged');
    }

    // Lens info present (dedicated camera vs phone screenshot)
    if (exif.lensModel) {
      score += 0.05;
      factors.push('lens-info');
    }

    // File size as proxy for detail preservation
    if (exif.fileSizeInByte) {
      const sizeMB = exif.fileSizeInByte / (1024 * 1024);
      if (sizeMB >= 3) {
        score += 0.05;
        factors.push('large-file');
      }
    }

    return Math.max(0, Math.min(1, score));
  }
}
