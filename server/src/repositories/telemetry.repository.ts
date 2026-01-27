import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MetricOptions } from '@opentelemetry/api';
import { contextBase } from '@opentelemetry/sdk-node';
import { ClassConstructor } from 'class-transformer';
import { snakeCase, startCase } from 'lodash';
import { MetricService } from 'nestjs-otel';
import { copyMetadataFromFunctionToFunction } from 'nestjs-otel/lib/opentelemetry.utils';
import { ImmichTelemetry, MetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

type MetricGroupOptions = { enabled: boolean };

export class MetricGroupRepository {
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

// OpenTelemetry SDK is now initialized in telemetry-preload.ts
// which runs before any modules are imported. This ensures the
// global meter provider is available for nestjs-otel.

export const bootstrapTelemetry = (_port: number) => {
  // No-op: SDK is initialized in telemetry-preload.ts
};

export const teardownTelemetry = async () => {
  // No-op: SDK shutdown is handled by process exit
};

@Injectable()
export class TelemetryRepository {
  api: MetricGroupRepository;
  host: MetricGroupRepository;
  jobs: MetricGroupRepository;
  repo: MetricGroupRepository;

  constructor(
    private metricService: MetricService,
    private reflect: Reflector,
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    const { telemetry } = this.configRepository.getEnv();
    const { metrics } = telemetry;

    this.api = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Api) });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Host) });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Job) });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Repo) });
  }

  setup({ repositories }: { repositories: ClassConstructor<unknown>[] }) {
    const { telemetry } = this.configRepository.getEnv();
    const { metrics } = telemetry;
    if (!metrics.has(ImmichTelemetry.Repo)) {
      return;
    }

    for (const Repository of repositories) {
      const isEnabled = this.reflect.get(MetadataKey.TelemetryEnabled, Repository) ?? true;
      if (!isEnabled) {
        this.logger.debug(`Telemetry disabled for ${Repository.name}`);
        continue;
      }

      this.wrap(Repository);
    }
  }

  private wrap(Repository: ClassConstructor<unknown>) {
    const className = Repository.name;
    const descriptors = Object.getOwnPropertyDescriptors(Repository.prototype);
    const unit = 'ms';

    for (const [propName, descriptor] of Object.entries(descriptors)) {
      const isMethod = typeof descriptor.value == 'function' && propName !== 'constructor';
      if (!isMethod) {
        continue;
      }

      const method = descriptor.value;
      const propertyName = snakeCase(String(propName));
      const metricName = `${snakeCase(className).replaceAll(/_(?=(repository)|(controller)|(provider)|(service)|(module))/g, '.')}.${propertyName}.duration`;

      const histogram = this.metricService.getHistogram(metricName, {
        prefix: 'immich',
        description: `The elapsed time in ${unit} for the ${startCase(className)} to ${propertyName.toLowerCase()}`,
        unit,
        valueType: contextBase.ValueType.DOUBLE,
      });

      descriptor.value = function (...args: any[]) {
        const start = performance.now();
        const result = method.apply(this, args);

        void Promise.resolve(result)
          .then(() => histogram.record(performance.now() - start, {}))
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
