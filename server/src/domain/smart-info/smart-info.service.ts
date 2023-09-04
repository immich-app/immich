import { Inject, Injectable } from '@nestjs/common';
import { IAssetRepository, WithoutProperty } from '../asset';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, IJobRepository, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';
import { ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { IMachineLearningRepository } from './machine-learning.interface';
import { ISmartInfoRepository } from './smart-info.repository';

@Injectable()
export class SmartInfoService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ISmartInfoRepository) private repository: ISmartInfoRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
  }

  async handleQueueObjectTagging({ force }: IBaseJob) {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.classification.enabled) {
      return true;
    }

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
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.classification.enabled) {
      return true;
    }

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset.resizePath) {
      return false;
    }

    const tags = await this.machineLearning.classifyImage(
      machineLearning.url,
      { imagePath: asset.resizePath },
      machineLearning.classification,
    );
    await this.repository.upsert({ assetId: asset.id, tags });

    return true;
  }

  async handleQueueEncodeClip({ force }: IBaseJob) {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return true;
    }

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
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return true;
    }

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset.resizePath) {
      return false;
    }

    const clipEmbedding = await this.machineLearning.encodeImage(
      machineLearning.url,
      { imagePath: asset.resizePath },
      machineLearning.clip,
    );

    await this.repository.upsert({ assetId: asset.id, clipEmbedding: clipEmbedding });

    return true;
  }
}
