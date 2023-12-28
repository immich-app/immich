import { Inject, Injectable } from '@nestjs/common';
import _ from 'lodash';
import { serverVersion } from '../domain.constant';
import { JobName } from '../job';
import { ISystemConfigRepository } from '../repositories';
import { IJobRepository } from '../repositories/job.repository';
import { IMetricsRepository } from '../repositories/metrics.repository';
import { FeatureFlag, SystemConfigCore, SystemConfigMetricsDto } from '../system-config';
import { Metrics, MetricsDto } from './metrics.dto';

@Injectable()
export class MetricsService {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMetricsRepository) private repository: IMetricsRepository,
    @Inject(ISystemConfigRepository) systemConfigRepository: ISystemConfigRepository,
  ) {
    this.configCore = SystemConfigCore.create(systemConfigRepository);
  }

  async handleQueueMetrics() {
    if (await this.configCore.hasFeature(FeatureFlag.METRICS)) {
      await this.jobRepository.queue({ name: JobName.METRICS });
    }
  }

  async handleSendMetrics() {
    const metricsConfig = await this.configCore.getConfig().then((config) => config.metrics);
    const metrics = await this.getMetrics(metricsConfig);

    await this.repository.sendMetrics(metrics);
    return true;
  }

  async getMetrics(config: SystemConfigMetricsDto) {
    const metrics: Metrics = new MetricsDto();

    metrics.serverInfo = {
      cpuCount: this.repository.getCpuCount(),
      cpuModel: this.repository.getCpuModel(),
      memory: this.repository.getMemory(),
      version: serverVersion.toString(),
    };

    metrics.assetCount = {
      image: await this.repository.getImageCount(),
      video: await this.repository.getVideoCount(),
      total: await this.repository.getAssetCount(),
    };

    return _.pick(metrics, this.getKeys(config));
  }

  private getKeys(config: SystemConfigMetricsDto) {
    const result = [];
    const keys = _.keys(config) as Array<keyof SystemConfigMetricsDto>;
    for (const key of keys) {
      const subConfig = _.get(config, key);
      if (typeof subConfig === 'boolean') {
        continue;
      }

      const keys = _.keys(_.pickBy(subConfig)).map((value) => `${key}.${value}`);
      result.push(...keys);
    }

    return result;
  }
}
