# Monitoring

Immich exposes performance metrics so an instance can be observed locally. The integration is primarily Prometheus metrics, though exporting traces is also possible because the instrumentation uses OpenTelemetry.

This is an opt-in feature. Nothing is sent anywhere beyond what you configure — see [Monitor Immich](/administration/monitor-immich) to turn it on.

## How Prometheus collects metrics

Prometheus is a tool that collects metrics from a number of sources you configure. It operates in a "pull" strategy - that is, it periodically requests metrics from each defined source. This means that the source doesn't send anything until it's requested. It also means that the source -- immich, in this case -- has to expose an endpoint for Prometheus to target when it requests metrics.

## Kinds of metric

These metrics come in a variety of forms:

- Counters, which can only increase. Example: the number of times an endpoint has been called.
- Gauges, which can increase or decrease within a certain range. Example: CPU utilization.
- Histograms, where each observation is assigned to a certain number of "buckets". Example: response time, where each bucket is a number of milliseconds. This one is a bit more complicated.
  - Buckets in this case are _cumulative_; that is, an observation is placed not only into the smallest bucket that contains it, but also to all buckets larger than this. For example, if a histogram has three buckets for 1ms, 5ms and 10ms, an observation of 3ms will be bucketed into both 5ms and 10ms.

The metrics in immich are grouped into API (endpoint calls and response times), host (memory and CPU utilization), and IO (internal database queries, image processing, and so on). Each group of metrics can be enabled or disabled independently.

## Structured logging

By default Immich writes human-readable console logs. It can instead emit one JSON object per log line, which is what log aggregation systems such as Grafana Loki, the ELK stack, Datadog, or Splunk expect to ingest. The field names and an example are in [Logging](/reference/logging#log-format).
