import { Inject, Injectable, Logger } from '@nestjs/common';
import { IAssetRepository, WithoutProperty } from '../asset';
import { MACHINE_LEARNING_ENABLED } from '../domain.constant';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
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
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleClassifyImage({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return false;
    }

    const tags = await this.machineLearning.classifyImage({ imagePath: asset.resizePath });
    if (tags.length === 0) {
      return false;
    }

    await this.repository.upsert({ assetId: asset.id, tags });

    return true;
  }

  async handleQueueEncodeClip({ force }: IBaseJob) {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.CLIP_ENCODING);
    });

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleEncodeClip({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);

    if (!MACHINE_LEARNING_ENABLED || !asset.resizePath) {
      return false;
    }

    const clipEmbedding = await this.machineLearning.encodeImage({ imagePath: asset.resizePath });
    await this.repository.upsert({ assetId: asset.id, clipEmbedding: clipEmbedding });

    return true;
  }
}
