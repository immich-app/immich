import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

@Injectable()
export class AiDateEstimationService extends BaseService {
  @OnJob({ name: JobName.AiDateEstimateQueueAll, queue: QueueName.AiDescription })
  async handleQueueAll({ force }: JobOf<JobName.AiDateEstimateQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.AiDateEstimate, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AiDateEstimate, queue: QueueName.AiDescription })
  async handleAiDateEstimate({ id }: JobOf<JobName.AiDateEstimate>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForClipEncoding(id);
    if (!asset || asset.files.length !== 1) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    // Skip assets that already have EXIF dates
    const exif = await this.assetRepository.getExifById(id);
    if (exif?.dateTimeOriginal) {
      return JobStatus.Skipped;
    }

    try {
      const result = await this.machineLearningRepository.estimateDate(asset.files[0].path);
      if (result?.estimatedYear) {
        // Store the estimate in the ai_metadata table
        await this.assetRepository.update({
          id: asset.id,
          exifInfo: {
            description: exif?.description
              ? `${exif.description}\n[AI Date Estimate: ~${result.estimatedYear}, confidence: ${result.confidence}]`
              : `[AI Date Estimate: ~${result.estimatedYear}, confidence: ${result.confidence}]`,
          },
        });
        this.logger.verbose(`AI date estimate for asset ${asset.id}: ~${result.estimatedYear}`);
      }
      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to estimate date for asset ${asset.id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
