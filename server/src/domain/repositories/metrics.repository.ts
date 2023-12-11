import { MetricsDto } from '../metrics';

export const IMetricsRepository = 'IMetricsRepository';

export interface SharedMetrics {
  serverInfo: boolean;
  assetCount: boolean;
}

export interface IMetricsRepository {
  getAssetCount(): Promise<number>;
  getCpuCount(): number;
  getCpuModel(): string;
  getMemoryCount(): number;
  getImageCount(): Promise<number>;
  getVideoCount(): Promise<number>;
  sendMetrics(payload: MetricsDto): Promise<void>;
}
