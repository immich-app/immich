import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, JOBS_ASSET_PAGINATION_SIZE, JobName, QueueName } from '../job';
import {
  DatabaseLock,
  IAssetRepository,
  IDatabaseRepository,
  IJobRepository,
  IMachineLearningRepository,
  ISearchRepository,
  ISystemConfigRepository,
  WithoutProperty,
} from '../repositories';
import { SystemConfigCore } from '../system-config';

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

  async handleQueueEncodeClip({ force }: IBaseJob) {
    const { machineLearning } = await this.configCore.getConfig();
    if (!machineLearning.enabled || !machineLearning.clip.enabled) {
      return true;
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

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    await this.repository.upsert({ assetId: asset.id }, clipEmbedding);

    return true;
  }
}
