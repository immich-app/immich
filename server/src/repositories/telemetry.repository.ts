import { Inject, Injectable } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { IMetricGroupRepository, ITelemetryRepository, MetricGroupOptions } from 'src/interfaces/telemetry.interface';

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
export class TelemetryRepository implements ITelemetryRepository {
  api: MetricGroupRepository;
  host: MetricGroupRepository;
  jobs: MetricGroupRepository;
  repo: MetricGroupRepository;

  constructor(metricService: MetricService, @Inject(IConfigRepository) configRepository: IConfigRepository) {
    const { telemetry } = configRepository.getEnv();
    const { apiMetrics, hostMetrics, jobMetrics, repoMetrics } = telemetry;

    this.api = new MetricGroupRepository(metricService).configure({ enabled: apiMetrics });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: hostMetrics });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: jobMetrics });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: repoMetrics });
  }
}
