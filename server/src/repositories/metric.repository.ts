import { MetricService } from 'nestjs-otel';
import { CustomMetricOptions, IMetricRepository } from 'src/interfaces/metric.interface';

export class MetricRepository implements IMetricRepository {
  constructor(private readonly metricService: MetricService) {}

  addToCounter(name: string, value: number, options?: CustomMetricOptions): void {
    if (options?.enabled === false) {
      return;
    }

    this.metricService.getCounter(name, options).add(value);
  }

  updateGauge(name: string, value: number, options?: CustomMetricOptions): void {
    if (options?.enabled === false) {
      return;
    }

    this.metricService.getUpDownCounter(name, options).add(value);
  }

  updateHistogram(name: string, value: number, options?: CustomMetricOptions): void {
    if (options?.enabled === false) {
      return;
    }

    this.metricService.getHistogram(name, options).record(value);
  }
}
