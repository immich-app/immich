import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { ExportResult } from '@opentelemetry/core';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor, ConsoleSpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';

class CustomConsoleSpanExporter extends ConsoleSpanExporter {
  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void) {
    const logs = [];
    for (const span of spans) {
      logs.push(`[${span.spanContext().traceId}] ${span.name}: ${span.duration[0] / 1e3 + span.duration[1] / 1e6}ms`);
    }
    console.log(logs.join('\n'));

    resultCallback({ code: 0 });
  }
}
const traceExporter = new CustomConsoleSpanExporter();

const otelSDK = new NodeSDK({
  metricReader: new PrometheusExporter({
    port: 8081,
  }),
  spanProcessor: new BatchSpanProcessor(traceExporter),
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [
    new HttpInstrumentation(),
    new IORedisInstrumentation(),
    new NestInstrumentation(),
    // new PgInstrumentation(),
  ],
});

export const otelConfig: OpenTelemetryModuleOptions = {
  metrics: {
    hostMetrics: true, // Includes Host Metrics
    apiMetrics: {
      enable: true, // Includes api metrics
      ignoreRoutes: ['/favicon.ico', '/custom.css'],
      ignoreUndefinedRoutes: false, //Records metrics for all URLs, even undefined ones
    },
  },
};

export default otelSDK;
