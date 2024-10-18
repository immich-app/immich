import { Inject, Injectable } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { IMetricGroupRepository, IMetricRepository, MetricGroupOptions } from 'src/interfaces/metric.interface';

class MetricGroupRepository implements IMetricGroupRepository {
  private enabled = false;

  constructor(private metricService: MetricService) {}

  addToCounter(name: string, value: number, options?: MetricOptions): void {
    if (this.enabled) {
      this.metricService.getCounter(name, options).add(value);
    }
  }

  addToGauge(name: string, value: number, options?: MetricOptions): void {
    if (this.enabled) {
      this.metricService.getUpDownCounter(name, options).add(value);
    }
  }

  addToHistogram(name: string, value: number, options?: MetricOptions): void {
    if (this.enabled) {
      this.metricService.getHistogram(name, options).record(value);
    }
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

  constructor(metricService: MetricService, @Inject(IConfigRepository) configRepository: IConfigRepository) {
    const { telemetry } = configRepository.getEnv();
    this.api = new MetricGroupRepository(metricService).configure({ enabled: telemetry.apiMetrics });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: telemetry.hostMetrics });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: telemetry.jobMetrics });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: telemetry.repoMetrics });
  }
}
