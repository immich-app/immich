import { Inject, Injectable } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { JOBS_ASSET_PAGINATION_SIZE, JobName, QueueName } from 'src/domain/job/job.constants';
import { IBaseJob, IEntityJob } from 'src/domain/job/job.interface';
import { IAssetRepository, WithoutProperty } from 'src/domain/repositories/asset.repository';
import { DatabaseLock, IDatabaseRepository } from 'src/domain/repositories/database.repository';
import { IJobRepository, JobStatus } from 'src/domain/repositories/job.repository';
import { IMachineLearningRepository } from 'src/domain/repositories/machine-learning.repository';
import { ISearchRepository } from 'src/domain/repositories/search.repository';
import { ISystemConfigRepository } from 'src/domain/repositories/system-config.repository';
import { ImmichLogger } from 'src/infra/logger';
import { usePagination } from 'src/utils';

@Injectable()
export class SmartInfoService {
  private configCore: SystemConfigCore;
  private logger = new ImmichLogger(SmartInfoService.name);

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private repository: ISearchRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async init() {
    await this.jobRepository.pause(QueueName.SMART_SEARCH);

    await this.jobRepository.waitForQueueCompletion(QueueName.SMART_SEARCH);

    const { machineLearning } = await this.configCore.getConfig();

    await this.databaseRepository.withLock(DatabaseLock.CLIPDimSize, () =>
      this.repository.init(machineLearning.clip.modelName),
    );

    await this.jobRepository.resume(QueueName.SMART_SEARCH);
  }

  async handleQueueEncodeClip({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.repository.deleteAllSearchEmbeddings();
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.SMART_SEARCH);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.SMART_SEARCH, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleEncodeClip({ id }: IEntityJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return JobStatus.SKIPPED;
    }

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return JobStatus.FAILED;
    }

    if (!asset.resizePath) {
      return JobStatus.FAILED;
    }

    const clipEmbedding = await this.machineLearning.encodeImage(
      machineLearning.url,
      { imagePath: asset.resizePath },
      machineLearning.clip,
    );

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    await this.repository.upsert({ assetId: asset.id }, clipEmbedding);

    return JobStatus.SUCCESS;
  }
}
