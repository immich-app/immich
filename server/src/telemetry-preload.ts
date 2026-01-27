import '@opentelemetry/api';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import type { SpanProcessor, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { AggregationType, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import {
  ATTR_VCS_REPOSITORY_REF_REVISION,
  ATTR_VCS_REPOSITORY_URL_FULL,
} from '@opentelemetry/semantic-conventions/incubating';
import { isMainThread } from 'node:worker_threads';
import { BullMQOtel } from 'bullmq-otel';

export const bullMQTelemetry = new BullMQOtel('immich-jobs');

const ignoredRoutes = new Set(['/api/server/ping']);
const ignoredCallbacks = new Set(['pingServer']);

class FilteringSpanProcessor implements SpanProcessor {
  constructor(private delegate: SpanProcessor) {}

  onStart(span: ReadableSpan, context: unknown): void {
    (this.delegate.onStart as (span: ReadableSpan, context: unknown) => void)(span, context);
  }

  onEnd(span: ReadableSpan): void {
    const route = span.attributes['http.route'] || span.attributes['http.target'];
    if (typeof route === 'string' && ignoredRoutes.has(route)) {
      return;
    }

    const callback = span.attributes['nestjs.callback'];
    if (typeof callback === 'string' && ignoredCallbacks.has(callback)) {
      return;
    }

    this.delegate.onEnd(span);
  }

  shutdown(): Promise<void> {
    return this.delegate.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.delegate.forceFlush();
  }
}

// Detect worker type to determine metrics port:
// - Forked child (API worker): process.send exists, use IMMICH_API_METRICS_PORT
// - Worker thread (microservices): !isMainThread, use IMMICH_MICROSERVICES_METRICS_PORT
// - Main process: don't start metrics (avoid port conflicts with workers)
const isForkedChild = typeof process.send === 'function';
const isWorkerThread = !isMainThread;
const isWorkerProcess = isForkedChild || isWorkerThread;

const telemetryInclude = process.env.IMMICH_TELEMETRY_INCLUDE;
const tracingEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const metricsEnabled = telemetryInclude && telemetryInclude.length > 0;

// Only start SDK in worker processes (not main/supervisor process)
if (isWorkerProcess && (tracingEndpoint || metricsEnabled)) {
  const workerType = isForkedChild ? 'api' : 'microservices';

  const attributes: Record<string, string> = {
    [ATTR_SERVICE_NAME]: `immich-${workerType}`,
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || 'dev',
  };

  if (process.env.IMMICH_ENV) {
    attributes['deployment.environment.name'] = process.env.IMMICH_ENV;
  }

  if (process.env.IMMICH_SOURCE_COMMIT) {
    attributes[ATTR_VCS_REPOSITORY_REF_REVISION] = process.env.IMMICH_SOURCE_COMMIT;
  }

  if (process.env.IMMICH_REPOSITORY_URL) {
    attributes[ATTR_VCS_REPOSITORY_URL_FULL] = process.env.IMMICH_REPOSITORY_URL;
  }

  if (process.env.IMMICH_BUILD) {
    attributes['immich.build'] = process.env.IMMICH_BUILD;
  }

  if (process.env.IMMICH_SOURCE_REF) {
    attributes['immich.source_ref'] = process.env.IMMICH_SOURCE_REF;
  }

  if (process.env.IMMICH_BUILD_IMAGE) {
    attributes['immich.build_image'] = process.env.IMMICH_BUILD_IMAGE;
  }

  const resource = resourceFromAttributes(attributes);

  const aggregationBoundaries = [
    0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10, 25, 50, 75, 100, 250, 500, 750, 1000, 2500, 5000, 7500, 10_000,
  ];

  // Use appropriate port based on worker type
  const defaultPort = isForkedChild ? '8081' : '8082';
  const portEnvVar = isForkedChild ? 'IMMICH_API_METRICS_PORT' : 'IMMICH_MICROSERVICES_METRICS_PORT';
  const metricsPort = Number.parseInt(process.env[portEnvVar] || defaultPort, 10);

  const traceExporter = tracingEndpoint ? new OTLPTraceExporter({ url: `${tracingEndpoint}/v1/traces` }) : undefined;
  const spanProcessor = traceExporter ? new FilteringSpanProcessor(new BatchSpanProcessor(traceExporter)) : undefined;

  const metricReaders = [];
  if (metricsEnabled) {
    metricReaders.push(new PrometheusExporter({ port: metricsPort }));
  }
  if (tracingEndpoint) {
    metricReaders.push(
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: `${tracingEndpoint}/v1/metrics` }),
      }),
    );
  }

  const sdk = new NodeSDK({
    resource,
    spanProcessors: spanProcessor ? [spanProcessor] : undefined,
    metricReaders: metricReaders.length > 0 ? metricReaders : undefined,
    views: metricsEnabled
      ? [
          {
            instrumentName: '*',
            instrumentUnit: 'ms',
            aggregation: {
              type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
              options: { boundaries: aggregationBoundaries },
            },
          },
        ]
      : undefined,
    contextManager: new AsyncLocalStorageContextManager(),
    instrumentations: [new HttpInstrumentation(), new IORedisInstrumentation(), new NestInstrumentation()],
  });

  sdk.start();
}
