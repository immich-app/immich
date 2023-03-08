import { MACHINE_LEARNING_ENABLED } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetJob, IJobRepository, JobName } from '../job';
import { IMachineLearningRepository } from './machine-learning.interface';
import { ISmartInfoRepository } from './smart-info.repository';

@Injectable()
export class SmartInfoService {
  private logger = new Logger(SmartInfoService.name);

  constructor(
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISmartInfoRepository) private repository: ISmartInfoRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
  ) {}

  async handleTagImage(data: IAssetJob) {
    const { asset } = data;

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return;
    }

    try {
      const tags = await this.machineLearning.tagImage({ thumbnailPath: asset.resizePath });
      if (tags.length > 0) {
        await this.repository.upsert({ assetId: asset.id, tags });
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [asset.id] } });
      }
    } catch (error: any) {
      this.logger.error(`Unable to run image tagging pipeline: ${asset.id}`, error?.stack);
    }
  }

  async handleDetectObjects(data: IAssetJob) {
    const { asset } = data;

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return;
    }

    try {
      const objects = await this.machineLearning.detectObjects({ thumbnailPath: asset.resizePath });
      if (objects.length > 0) {
        await this.repository.upsert({ assetId: asset.id, objects });
        await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [asset.id] } });
      }
    } catch (error: any) {
      this.logger.error(`Unable run object detection pipeline: ${asset.id}`, error?.stack);
    }
  }

  async handleEncodeClip(data: IAssetJob) {
    const { asset } = data;

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return;
    }

    try {
      const clipEmbedding = await this.machineLearning.encodeImage({ thumbnailPath: asset.resizePath });
      await this.repository.upsert({ assetId: asset.id, clipEmbedding: clipEmbedding });
      await this.jobRepository.queue({ name: JobName.SEARCH_INDEX_ASSET, data: { ids: [asset.id] } });
    } catch (error: any) {
      this.logger.error(`Unable run clip encoding pipeline: ${asset.id}`, error?.stack);
    }
  }
}
