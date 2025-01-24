import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MetricOptions } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK, contextBase, metrics, resources } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ClassConstructor } from 'class-transformer';
import { snakeCase, startCase } from 'lodash';
import { MetricService } from 'nestjs-otel';
import { copyMetadataFromFunctionToFunction } from 'nestjs-otel/lib/opentelemetry.utils';
import { serverVersion } from 'src/constants';
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

const aggregation = new metrics.ExplicitBucketHistogramAggregation(
  [0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10_000],
  true,
);

let instance: NodeSDK | undefined;

export const bootstrapTelemetry = (port: number) => {
  if (instance) {
    throw new Error('OpenTelemetry SDK already started');
  }
  instance = new NodeSDK({
    resource: new resources.Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: `immich`,
      [SemanticResourceAttributes.SERVICE_VERSION]: serverVersion.toString(),
    }),
    metricReader: new PrometheusExporter({ port }),
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [
      new HttpInstrumentation(),
      new IORedisInstrumentation(),
      new NestInstrumentation(),
      new PgInstrumentation(),
    ],
    views: [new metrics.View({ aggregation, instrumentName: '*', instrumentUnit: 'ms' })],
  });

  instance.start();
};

export const teardownTelemetry = async () => {
  if (instance) {
    await instance.shutdown();
    instance = undefined;
  }
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

    this.api = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.API) });
    this.host = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.HOST) });
    this.jobs = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.JOB) });
    this.repo = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.REPO) });
  }

  setup({ repositories }: { repositories: ClassConstructor<unknown>[] }) {
    const { telemetry } = this.configRepository.getEnv();
    const { metrics } = telemetry;
    if (!metrics.has(ImmichTelemetry.REPO)) {
      return;
    }

    for (const Repository of repositories) {
      const isEnabled = this.reflect.get(MetadataKey.TELEMETRY_ENABLED, Repository) ?? true;
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
