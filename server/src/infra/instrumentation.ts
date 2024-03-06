import { serverVersion } from '@app/domain/domain.constant';
import { Histogram, MetricOptions, ValueType, metrics } from '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { Resource } from '@opentelemetry/resources';
import { ExplicitBucketHistogramAggregation, View } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { snakeCase, startCase } from 'lodash';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';
import { copyMetadataFromFunctionToFunction } from 'nestjs-otel/lib/opentelemetry.utils';
import { performance } from 'node:perf_hooks';
import { excludePaths } from './infra.config';
import { DecorateAll } from './infra.utils';

const aggregation = new ExplicitBucketHistogramAggregation(
  [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
  true,
);

export const otelSDK = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: `immich`,
    [SemanticResourceAttributes.SERVICE_VERSION]: serverVersion.toString(),
  }),
  metricReader: new PrometheusExporter({ port: 8081 }),
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [
    new HttpInstrumentation(),
    new IORedisInstrumentation(),
    new NestInstrumentation(),
    new PgInstrumentation(),
  ],
  views: [new View({ aggregation, instrumentName: '*', instrumentUnit: 'ms' })],
});

export const otelConfig: OpenTelemetryModuleOptions = {
  metrics: {
    hostMetrics: process.env.OTEL_SDK_DISABLED !== 'true',
    apiMetrics: {
      enable: process.env.OTEL_SDK_DISABLED !== 'true',
      ignoreRoutes: excludePaths,
    },
  },
};

function ExecutionTimeHistogram({ description, unit = 'ms', valueType = ValueType.DOUBLE }: MetricOptions = {}) {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    if (process.env.OTEL_SDK_DISABLED === 'true') {
      return;
    }

    const method = descriptor.value;
    const className = target.constructor.name as string;
    const propertyName = String(propertyKey);
    const metricName = `${snakeCase(className).replaceAll(/_(?=(repository)|(controller)|(provider)|(service)|(module))/g, '.')}.${snakeCase(propertyName)}.duration`;

    const metricDescription =
      description ??
      `The elapsed time in ${unit} for the ${startCase(className)} to ${startCase(propertyName).toLowerCase()}`;

    let histogram: Histogram | undefined;

    descriptor.value = function (...args: any[]) {
      const start = performance.now();
      const result = method.apply(this, args);

      void Promise.resolve(result)
        .then(() => {
          const end = performance.now();
          if (!histogram) {
            histogram = metrics
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
