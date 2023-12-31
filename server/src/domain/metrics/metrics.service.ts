import { Inject, Injectable } from '@nestjs/common';
import { isDev, serverVersion } from '../domain.constant';
import { JobName } from '../job';
import { ISystemConfigRepository } from '../repositories';
import { IJobRepository } from '../repositories/job.repository';
import { IMetricsRepository } from '../repositories/metrics.repository';
import { FeatureFlag, SystemConfigCore } from '../system-config';
import { MetricsDto } from './metrics.dto';

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
    if (!(await this.configCore.hasFeature(FeatureFlag.METRICS))) {
      return;
    }

    // TODO
    // if (isDev) {
    //   return;
    // }

    await this.jobRepository.queue({ name: JobName.METRICS });
  }

  async handleSendMetrics() {
    const metrics = await this.getMetrics();

    await this.repository.sendMetrics(metrics);
    return true;
  }

  async getMetrics() {
    const metrics = new MetricsDto();

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

    return metrics;
  }
}
