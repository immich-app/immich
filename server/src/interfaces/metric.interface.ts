import { MetricOptions } from '@opentelemetry/api';

export const IMetricRepository = 'IMetricRepository';

export interface MetricGroupOptions {
  enabled: boolean;
}

export interface IMetricGroupRepository {
  addToCounter(name: string, value: number, options?: MetricOptions): void;
  addToGauge(name: string, value: number, options?: MetricOptions): void;
  addToHistogram(name: string, value: number, options?: MetricOptions): void;
  configure(options: MetricGroupOptions): this;
}

export interface IMetricRepository {
  api: IMetricGroupRepository;
  host: IMetricGroupRepository;
  jobs: IMetricGroupRepository;
  repo: IMetricGroupRepository;
}
