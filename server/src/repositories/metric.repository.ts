import { Injectable } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';
import { IMetricGroupRepository, IMetricRepository, MetricGroupOptions } from 'src/interfaces/metric.interface';
import { apiMetrics, hostMetrics, jobMetrics, repoMetrics } from 'src/utils/instrumentation';

class MetricGroupRepository implements IMetricGroupRepository {
  private enabled = false;
  constructor(private readonly metricService: MetricService) {}

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

  configure(options: MetricGroupOptions): void {
    this.enabled = options.enabled;
  }
}

class ApiMetricRepository extends MetricGroupRepository {
  constructor(metricService: MetricService) {
    super(metricService);
    this.configure({ enabled: apiMetrics });
  }
}

class HostMetricRepository extends MetricGroupRepository {
  constructor(metricService: MetricService) {
    super(metricService);
    this.configure({ enabled: hostMetrics });
  }
}

class JobMetricRepository extends MetricGroupRepository {
  constructor(metricService: MetricService) {
    super(metricService);
    this.configure({ enabled: jobMetrics });
  }
}

class RepoMetricRepository extends MetricGroupRepository {
  constructor(metricService: MetricService) {
    super(metricService);
    this.configure({ enabled: repoMetrics });
  }
}

@Injectable()
export class MetricRepository implements IMetricRepository {
  api: ApiMetricRepository;
  host: HostMetricRepository;
  jobs: JobMetricRepository;
  repo: RepoMetricRepository;

  constructor(metricService: MetricService) {
    this.api = new ApiMetricRepository(metricService);
    this.host = new HostMetricRepository(metricService);
    this.jobs = new JobMetricRepository(metricService);
    this.repo = new RepoMetricRepository(metricService);
  }
}
