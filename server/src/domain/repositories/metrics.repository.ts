import { MetricsDto } from '../metrics';

export const IMetricsRepository = 'IMetricsRepository';

export interface SharedMetrics {
  serverInfo: boolean;
  assetCount: boolean;
}

export interface IMetricsRepository {
  sendMetrics(payload: MetricsDto): Promise<void>;
}
