import { Inject, Injectable } from '@nestjs/common';
import { serverVersion } from '../domain.constant';
import { JobName } from '../job';
import { IJobRepository } from '../repositories/job.repository';
import { IMetricsRepository, SharedMetrics } from '../repositories/metrics.repository';
import { MetricsDto } from './metrics.dto';

@Injectable()
export class MetricsService {
  constructor(
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMetricsRepository) private repository: IMetricsRepository,
  ) {}

  async handleQueueMetrics() {
    // TODO config for what metrics should be fetched and if any at all

    await this.jobRepository.queue({ name: JobName.METRICS, data: { assetCount: true, serverInfo: true } });
  }

  async handleMetrics(metrics: SharedMetrics) {
    const metricsPayload = new MetricsDto();
    if (metrics.serverInfo) {
      metricsPayload.serverInfo.version = serverVersion.toString();
      metricsPayload.serverInfo.cpuCount = this.repository.getCpuCount();
      metricsPayload.serverInfo.cpuModel = this.repository.getCpuModel();
      metricsPayload.serverInfo.memoryCount = this.repository.getMemoryCount();
    }

    if (metrics.assetCount) {
      metricsPayload.assetCount.image = await this.repository.getImageCount();
      metricsPayload.assetCount.video = await this.repository.getVideoCount();
      metricsPayload.assetCount.total = await this.repository.getAssetCount();
    }

    await this.repository.sendMetrics(metricsPayload);
    return true;
  }
}
