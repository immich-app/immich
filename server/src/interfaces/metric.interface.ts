import { MetricOptions } from '@opentelemetry/api';

export interface CustomMetricOptions extends MetricOptions {
  enabled?: boolean;
}

export const IMetricRepository = 'IMetricRepository';

export interface IMetricRepository {
  addToCounter(name: string, value: number, options?: CustomMetricOptions): void;
  updateGauge(name: string, value: number, options?: CustomMetricOptions): void;
  updateHistogram(name: string, value: number, options?: CustomMetricOptions): void;
}
