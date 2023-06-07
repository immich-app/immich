import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository, WithoutProperty } from '../asset';
import { MACHINE_LEARNING_BATCH_SIZE, MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { batched, notNull, usePagination } from '../domain.util';
import { IBaseJob, IBulkEntityJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
import { IMachineLearningRepository } from './machine-learning.interface';
import { ISmartInfoRepository } from './smart-info.repository';

@Injectable()
export class SmartInfoService {
  private logger = new Logger(SmartInfoService.name);

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISmartInfoRepository) private repository: ISmartInfoRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
  ) {}

  async handleQueueObjectTagging({ force }: IBaseJob) {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.OBJECT_TAGS);
    });

    for await (const assets of assetPagination) {
      const pageIDs = assets.filter((asset) => asset.resizePath).map((asset) => asset.id);

      for (const ids of batched(pageIDs, MACHINE_LEARNING_BATCH_SIZE)) {
        await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: { ids } });
      }
    }

    return true;
  }

  async handleClassifyImage({ ids }: IBulkEntityJob) {
    if (!MACHINE_LEARNING_ENABLED || !ids) {
      return false;
    }

    const assets = await this.assetRepository.getByIds(ids);
    const imagePaths = assets
      .map((asset) => asset.resizePath)
      .filter(notNull)
      .filter((resizePath) => resizePath.length > 0);

    if (imagePaths.length === 0) {
      return false;
    }
    const batchTags = await this.machineLearning.classifyImage({ imagePaths });

    let addedTags = false;
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const tags = batchTags[i];

      if (tags) {
        await this.repository.upsert({ assetId: asset.id, tags });
        addedTags = true;
      }
    }

    return addedTags;
  }

  async handleQueueEncodeClip({ force }: IBaseJob) {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.CLIP_ENCODING);
    });

    for await (const assets of assetPagination) {
      const pageIDs = assets.filter((asset) => asset.resizePath).map((asset) => asset.id);

      for (const ids of batched(pageIDs, MACHINE_LEARNING_BATCH_SIZE)) {
        await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: { ids } });
      }
    }

    return true;
  }

  async handleEncodeClip({ ids }: IBulkEntityJob) {
    if (!MACHINE_LEARNING_ENABLED || !ids) {
      return false;
    }

    const assets = await this.assetRepository.getByIds(ids);
    const imagePaths = assets
      .map((asset) => asset.resizePath)
      .filter(notNull)
      .filter((resizePath) => resizePath.length > 0);

    if (imagePaths.length === 0) {
      return false;
    }
    const batchEmbeddings = await this.machineLearning.encodeImage({ imagePaths });

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const clipEmbedding = batchEmbeddings[i];

      await this.repository.upsert({ assetId: asset.id, clipEmbedding });
    }

    return true;
  }
}
