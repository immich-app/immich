import { Inject, Injectable } from '@nestjs/common';
import {
  ICommunicationRepository,
  IServerInfoRepository,
  IStorageRepository,
  ISystemConfigRepository,
  IUserRepository,
} from '../repositories';
import { IMetricsRepository, SharedMetrics } from '../repositories/metrics.repository';
import { ServerInfoService } from '../server-info';
import { MetricsDto } from './metrics.dto';

@Injectable()
export class MetricsService {
  private serverInfo: ServerInfoService;

  constructor(
    @Inject(ICommunicationRepository) communicationRepository: ICommunicationRepository,
    @Inject(IMetricsRepository) private repository: IMetricsRepository,
    @Inject(IUserRepository) userRepository: IUserRepository,
    @Inject(IServerInfoRepository) serverInfoRepository: IServerInfoRepository,
    @Inject(IStorageRepository) storageRepository: IStorageRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
  ) {
    this.serverInfo = new ServerInfoService(
      communicationRepository,
      configRepository,
      userRepository,
      serverInfoRepository,
      storageRepository,
    );
  }

  async shareMetrics(metrics: SharedMetrics) {
    const metricsPayload = new MetricsDto();
    if (metrics.serverInfo) {
      metricsPayload.serverInfo.version = this.serverInfo.getVersion().toString();
      metricsPayload.serverInfo.diskUse = (await this.serverInfo.getInfo()).diskUse;
    }

    if (metrics.assetCount) {
      const stats = await this.serverInfo.getStatistics();
      metricsPayload.assetCount.photo = stats.photos;
      metricsPayload.assetCount.video = stats.videos;
    }

    await this.repository.sendMetrics(metricsPayload);
    return true;
  }
}
