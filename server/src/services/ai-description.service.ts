import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

@Injectable()
export class AiDescriptionService extends BaseService {
  @OnJob({ name: JobName.AiDescribeQueueAll, queue: QueueName.AiDescription })
  async handleQueueAll({ force }: JobOf<JobName.AiDescribeQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.AiDescribe, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AiDescribe, queue: QueueName.AiDescription })
  async handleAiDescribe({ id }: JobOf<JobName.AiDescribe>): Promise<JobStatus> {
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

    try {
      const result = await this.machineLearningRepository.describeImage(asset.files[0].path);
      if (result?.description) {
        await this.assetRepository.update({ id: asset.id, exifInfo: { description: result.description } });
        this.logger.verbose(`AI description generated for asset ${asset.id}`);
      }
      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate AI description for asset ${asset.id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
