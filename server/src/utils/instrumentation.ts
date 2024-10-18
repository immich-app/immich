import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK, metrics, resources } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { serverVersion } from 'src/constants';

const aggregation = new metrics.ExplicitBucketHistogramAggregation(
  [0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10_000],
  true,
);

let otelSingleton: NodeSDK | undefined;

export const otelStart = (port: number) => {
  if (otelSingleton) {
    throw new Error('OpenTelemetry SDK already started');
  }
  otelSingleton = new NodeSDK({
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
  otelSingleton.start();
};

export const otelShutdown = async () => {
  if (otelSingleton) {
    await otelSingleton.shutdown();
    otelSingleton = undefined;
  }
};
