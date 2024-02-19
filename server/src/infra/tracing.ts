import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { AsyncLocalStorageContextManager } from '@opentelemetry/context-async-hooks';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OpenTelemetryModuleOptions } from 'nestjs-otel/lib/interfaces';

const otelSDK = new NodeSDK({
  metricReader: new PrometheusExporter({
    port: 8081,
  }),
  spanProcessor: new BatchSpanProcessor(new OTLPTraceExporter({ url: 'immich-prometheus:9090' })),
  contextManager: new AsyncLocalStorageContextManager(),
  instrumentations: [getNodeAutoInstrumentations()],
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
