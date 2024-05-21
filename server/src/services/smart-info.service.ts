import { Inject, Injectable } from '@nestjs/common';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import {
  IBaseJob,
  IEntityJob,
  IJobRepository,
  JOBS_ASSET_PAGINATION_SIZE,
  JobName,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMachineLearningRepository } from 'src/interfaces/machine-learning.interface';
import { ISearchRepository } from 'src/interfaces/search.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { isSmartSearchEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class SmartInfoService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISearchRepository) private repository: ISearchRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(SmartInfoService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
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
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    if (force) {
      await this.repository.deleteAllSearchEmbeddings();
    }

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, { isVisible: true })
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
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      return JobStatus.SKIPPED;
    }

    if (!asset.previewPath) {
      return JobStatus.FAILED;
    }

    const clipEmbedding = await this.machineLearning.encodeImage(
      machineLearning.url,
      { imagePath: asset.previewPath },
      machineLearning.clip,
    );

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    await this.repository.upsert(asset.id, clipEmbedding);

    return JobStatus.SUCCESS;
  }
}
