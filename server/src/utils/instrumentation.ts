import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK, contextBase, metrics, resources } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { snakeCase, startCase } from 'lodash';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { copyMetadataFromFunctionToFunction } from 'nestjs-otel/lib/opentelemetry.utils';
import { performance } from 'node:perf_hooks';
import { excludePaths, serverVersion } from 'src/constants';
import { DecorateAll } from 'src/decorators';

let metricsEnabled = process.env.IMMICH_METRICS === 'true';
export const hostMetrics =
  process.env.IMMICH_HOST_METRICS == null ? metricsEnabled : process.env.IMMICH_HOST_METRICS === 'true';
export const apiMetrics =
  process.env.IMMICH_API_METRICS == null ? metricsEnabled : process.env.IMMICH_API_METRICS === 'true';
export const repoMetrics =
  process.env.IMMICH_IO_METRICS == null ? metricsEnabled : process.env.IMMICH_IO_METRICS === 'true';
export const jobMetrics =
  process.env.IMMICH_JOB_METRICS == null ? metricsEnabled : process.env.IMMICH_JOB_METRICS === 'true';

metricsEnabled ||= hostMetrics || apiMetrics || repoMetrics || jobMetrics;
if (!metricsEnabled && process.env.OTEL_SDK_DISABLED === undefined) {
  process.env.OTEL_SDK_DISABLED = 'true';
}

const aggregation = new metrics.ExplicitBucketHistogramAggregation(
  [0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10_000],
  true,
);

const metricsPort = Number.parseInt(process.env.IMMICH_METRICS_PORT ?? '8081');

export const otelSDK = new NodeSDK({
  resource: new resources.Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `immich`,
    [SemanticResourceAttributes.SERVICE_VERSION]: serverVersion.toString(),
  }),
  metricReader: new PrometheusExporter({ port: metricsPort }),
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [
    new HttpInstrumentation(),
    new IORedisInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
  ],
  views: [new metrics.View({ aggregation, instrumentName: '*', instrumentUnit: 'ms' })],
});

export const otelConfig: OpenTelemetryModuleOptions = {
  metrics: {
    hostMetrics,
    apiMetrics: {
      enable: apiMetrics,
      ignoreRoutes: excludePaths,
    },
  },
};

function ExecutionTimeHistogram({
  description,
  unit = 'ms',
  valueType = contextBase.ValueType.DOUBLE,
}: contextBase.MetricOptions = {}) {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (!repoMetrics || process.env.OTEL_SDK_DISABLED) {
      return;
    }

    const method = descriptor.value;
    const className = target.constructor.name as string;
    const propertyName = String(propertyKey);
    const metricName = `${snakeCase(className).replaceAll(/_(?=(repository)|(controller)|(provider)|(service)|(module))/g, '.')}.${snakeCase(propertyName)}.duration`;

    const metricDescription =
      description ??
      `The elapsed time in ${unit} for the ${startCase(className)} to ${startCase(propertyName).toLowerCase()}`;

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
  };
}

export const Instrumentation = () => DecorateAll(ExecutionTimeHistogram());
