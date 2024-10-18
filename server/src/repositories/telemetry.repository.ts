import { Inject, Injectable } from '@nestjs/common';
import { MetricOptions } from '@opentelemetry/api';
import { contextBase } from '@opentelemetry/sdk-node';
import { ClassConstructor } from 'class-transformer';
import { snakeCase, startCase } from 'lodash';
import { MetricService } from 'nestjs-otel';
import { copyMetadataFromFunctionToFunction } from 'nestjs-otel/lib/opentelemetry.utils';
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

  constructor(
    metricService: MetricService,
    @Inject(IConfigRepository) private configRepository: IConfigRepository,
  ) {
    const { telemetry } = this.configRepository.getEnv();
    const { apiMetrics, hostMetrics, jobMetrics, repoMetrics } = telemetry;

    this.api = new MetricGroupRepository(metricService).configure({ enabled: apiMetrics });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: hostMetrics });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: jobMetrics });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: repoMetrics });
  }

  setup({ repositories }: { repositories: ClassConstructor<unknown>[] }) {
    const { telemetry } = this.configRepository.getEnv();
    if (!telemetry.enabled || !telemetry.repoMetrics || process.env.OTEL_SDK_DISABLED) {
      return;
    }

    for (const Repository of repositories) {
      this.wrap(Repository);
    }
  }

  private wrap(Repository: ClassConstructor<unknown>) {
    const unit = 'ms';
    const valueType = contextBase.ValueType.DOUBLE;
    const className = Repository.constructor.name as string;
    const descriptors = Object.getOwnPropertyDescriptors(Repository.prototype);
    for (const [propName, descriptor] of Object.entries(descriptors)) {
      const isMethod = typeof descriptor.value == 'function' && propName !== 'constructor';
      if (!isMethod) {
        continue;
      }

      const method = descriptor.value;
      const propertyName = String(propName);
      const metricName = `${snakeCase(className).replaceAll(/_(?=(repository)|(controller)|(provider)|(service)|(module))/g, '.')}.${snakeCase(propertyName)}.duration`;
      const metricDescription = `The elapsed time in ${unit} for the ${startCase(className)} to ${startCase(propertyName).toLowerCase()}`;

      let histogram: contextBase.Histogram | undefined;

      descriptor.value = function (...args: any[]) {
        const start = performance.now();
        const result = method.apply(this, args);

        void Promise.resolve(result)
          .then(() => {
            const end = performance.now();
            if (!histogram) {
              histogram = contextBase.metrics
                .getMeter('immich')
                .createHistogram(metricName, { description: metricDescription, unit, valueType });
            }
            histogram.record(end - start, {});
          })
          .catch(() => {
            // noop
          });

        return result;
      };

      copyMetadataFromFunctionToFunction(method, descriptor.value);
      Object.defineProperty(Repository.prototype, propName, descriptor);
    }
  }
}
