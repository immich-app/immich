import { Injectable } from '@nestjs/common';
import { Attributes, MetricOptions, metrics } from '@opentelemetry/api';
import { contextBase } from '@opentelemetry/sdk-node';
import { MetricService } from 'nestjs-otel';
import { IMetricGroupRepository, IMetricRepository, MetricGroupOptions } from 'src/interfaces/metric.interface';
import { apiMetrics, hostMetrics, ioMetrics, jobMetrics, userMetrics } from 'src/utils/instrumentation';

class MetricGroupRepository implements IMetricGroupRepository {
  private enabled = false;
  constructor(private metricService: MetricService) {}

  addToCounter(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void {
    if (this.enabled) {
      this.metricService.getCounter(name, options).add(value, attributes);
    }
  }

  addToGauge(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void {
    if (this.enabled) {
      this.metricService.getUpDownCounter(name, options).add(value, attributes);
    }
  }

  addToHistogram(name: string, value: number, options?: MetricOptions, attributes?: Attributes): void {
    if (this.enabled) {
      this.metricService.getHistogram(name, options).record(value, attributes);
    }
  }

  createObservableGauge(name: string, options?: MetricOptions): contextBase.ObservableGauge<Attributes> {
    return metrics.getMeter('immich').createObservableGauge(name, options);
  }

  configure(options: MetricGroupOptions): this {
    this.enabled = options.enabled;
    return this;
  }
}

@Injectable()
export class MetricRepository implements IMetricRepository {
  api: MetricGroupRepository;
  host: MetricGroupRepository;
  jobs: MetricGroupRepository;
  repo: MetricGroupRepository;
  user: MetricGroupRepository;

  constructor(metricService: MetricService) {
    this.api = new MetricGroupRepository(metricService).configure({ enabled: apiMetrics });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: hostMetrics });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: jobMetrics });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: ioMetrics });
    this.user = new MetricGroupRepository(metricService).configure({ enabled: userMetrics });
  }
}
