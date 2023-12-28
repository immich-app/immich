import { MetricsDto } from '../metrics';

export const IMetricsRepository = 'IMetricsRepository';

export interface IMetricsRepository {
  getAssetCount(): Promise<number>;
  getCpuCount(): number;
  getCpuModel(): string;
  getMemory(): number;
  getImageCount(): Promise<number>;
  getVideoCount(): Promise<number>;
  sendMetrics(payload: Partial<MetricsDto>): Promise<void>;
}
