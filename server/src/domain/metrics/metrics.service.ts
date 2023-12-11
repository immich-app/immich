import { Inject, Injectable } from '@nestjs/common';
import { serverVersion } from '../domain.constant';
import { IMetricsRepository, SharedMetrics } from '../repositories/metrics.repository';
import { MetricsDto } from './metrics.dto';

@Injectable()
export class MetricsService {
  constructor(@Inject(IMetricsRepository) private repository: IMetricsRepository) {}

  async shareMetrics(metrics: SharedMetrics) {
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
