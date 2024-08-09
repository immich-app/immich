import { Attributes, MetricOptions } from '@opentelemetry/api';
import { contextBase } from '@opentelemetry/sdk-node';

export const IMetricRepository = 'IMetricRepository';

export interface MetricGroupOptions {
  enabled: boolean;
}

export interface IMetricGroupRepository {
  addToCounter(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void;
  addToGauge(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void;
  addToHistogram(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void;
  configure(options: MetricGroupOptions): this;
  createObservableGauge(name: string, options?: MetricOptions): contextBase.ObservableGauge<Attributes>;
}

export interface IMetricRepository {
  api: IMetricGroupRepository;
  host: IMetricGroupRepository;
  jobs: IMetricGroupRepository;
  repo: IMetricGroupRepository;
  user: IMetricGroupRepository;
}
