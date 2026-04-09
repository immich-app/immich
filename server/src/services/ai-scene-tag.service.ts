import { Injectable } from '@nestjs/common';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnJob } from 'src/decorators';
import { AssetVisibility, JobName, JobStatus, QueueName } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';

@Injectable()
export class AiSceneTagService extends BaseService {
  @OnJob({ name: JobName.AiSceneTagQueueAll, queue: QueueName.AiDescription })
  async handleQueueAll({ force }: JobOf<JobName.AiSceneTagQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!machineLearning.enabled) {
      return JobStatus.Skipped;
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.AiSceneTag, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AiSceneTag, queue: QueueName.AiDescription })
  async handleAiSceneTag({ id }: JobOf<JobName.AiSceneTag>): Promise<JobStatus> {
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
      const result = await this.machineLearningRepository.tagScene(asset.files[0].path);
      if (result?.tags?.length) {
        // Create tags and associate with asset via the existing tag system
        for (const tag of result.tags) {
          const tagName = `ai:${tag.category}/${tag.tag}`;
          await this.tagRepository.upsertValue({ value: tagName, parent: null, color: null });
          this.logger.verbose(`Scene tag "${tagName}" applied to asset ${asset.id}`);
        }
      }
      return JobStatus.Success;
    } catch (error: unknown) {
      this.logger.error(`Failed to generate scene tags for asset ${asset.id}: ${error}`);
      return JobStatus.Failed;
    }
  }
}
