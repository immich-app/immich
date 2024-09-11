import { Inject, Injectable } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnEmit } from 'src/decorators';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
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
import { getAssetFiles } from 'src/utils/asset.util';
import { getCLIPModelInfo, isSmartSearchEnabled } from 'src/utils/misc';
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

  @OnEmit({ event: 'app.bootstrap' })
  async onBootstrap(app: ArgOf<'app.bootstrap'>) {
    if (app !== 'microservices') {
      return;
    }

    const config = await this.configCore.getConfig({ withCache: false });
    await this.init(config);
  }

  @OnEmit({ event: 'config.validate' })
  onConfigValidate({ newConfig }: ArgOf<'config.validate'>) {
    try {
      getCLIPModelInfo(newConfig.machineLearning.clip.modelName);
    } catch {
      throw new Error(
        `Unknown CLIP model: ${newConfig.machineLearning.clip.modelName}. Please check the model name for typos and confirm this is a supported model.`,
      );
    }
  }

  @OnEmit({ event: 'config.update' })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'config.update'>) {
    await this.init(newConfig, oldConfig);
  }

  private async init(newConfig: SystemConfig, oldConfig?: SystemConfig) {
    if (!isSmartSearchEnabled(newConfig.machineLearning)) {
      return;
    }

    await this.databaseRepository.withLock(DatabaseLock.CLIPDimSize, async () => {
      const { dimSize } = getCLIPModelInfo(newConfig.machineLearning.clip.modelName);
      const dbDimSize = await this.repository.getDimensionSize();
      this.logger.verbose(`Current database CLIP dimension size is ${dbDimSize}`);

      const modelChange =
        oldConfig && oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName;
      const dimSizeChange = dbDimSize !== dimSize;
      if (!modelChange && !dimSizeChange) {
        return;
      }

      const { isPaused } = await this.jobRepository.getQueueStatus(QueueName.SMART_SEARCH);
      if (!isPaused) {
        await this.jobRepository.pause(QueueName.SMART_SEARCH);
      }
      await this.jobRepository.waitForQueueCompletion(QueueName.SMART_SEARCH);

      if (dimSizeChange) {
        this.logger.log(
          `Dimension size of model ${newConfig.machineLearning.clip.modelName} is ${dimSize}, but database expects ${dbDimSize}.`,
        );
        this.logger.log(`Updating database CLIP dimension size to ${dimSize}.`);
        await this.repository.setDimensionSize(dimSize);
        this.logger.log(`Successfully updated database CLIP dimension size from ${dbDimSize} to ${dimSize}.`);
      } else {
        await this.repository.deleteAllSearchEmbeddings();
      }

      if (!isPaused) {
        await this.jobRepository.resume(QueueName.SMART_SEARCH);
      }
    });
  }

  async handleQueueEncodeClip({ force }: IBaseJob): Promise<JobStatus> {
    const { machineLearning } = await this.configCore.getConfig({ withCache: false });
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
    const { machineLearning } = await this.configCore.getConfig({ withCache: true });
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.SKIPPED;
    }

    const [asset] = await this.assetRepository.getByIds([id], { files: true });
    if (!asset) {
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      return JobStatus.SKIPPED;
    }

    const { previewFile } = getAssetFiles(asset.files);
    if (!previewFile) {
      return JobStatus.FAILED;
    }

    const embedding = await this.machineLearning.encodeImage(
      machineLearning.url,
      previewFile.path,
      machineLearning.clip,
    );

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    await this.repository.upsert(asset.id, embedding);

    return JobStatus.SUCCESS;
  }
}
