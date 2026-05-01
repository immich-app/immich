# Monitoring

## Overview

Gallery provides a variety of performance metrics to allow for local monitoring and insights. This integration is primarily in the form of Prometheus metrics. However, exporting traces is also possible due to the use of OpenTelemetry instrumentation.

:::note
This is an opt-in feature intended for you to monitor gallery's performance. This data isn't sent anywhere beyond what you've configured.
:::

## Prometheus

Prometheus is a tool that collects metrics from a number of sources you configure. It operates in a "pull" strategy - that is, it periodically requests metrics from each defined source. This means that the source doesn't send anything until it's requested. It also means that the source -- gallery, in this case -- has to expose an endpoint for Prometheus to target when it requests metrics.

### Metrics

These metrics come in a variety of forms:

- Counters, which can only increase. Example: the number of times an endpoint has been called.
- Gauges, which can increase or decrease within a certain range. Example: CPU utilization.
- Histograms, where each observation is assigned to a certain number of "buckets". Example: response time, where each bucket is a number of milliseconds. This one is a bit more complicated.
  - Buckets in this case are _cumulative_; that is, an observation is placed not only into the smallest bucket that contains it, but also to all buckets larger than this. For example, if a histogram has three buckets for 1ms, 5ms and 10ms, an observation of 3ms will be bucketed into both 5ms and 10ms.

The metrics in gallery are grouped into API (endpoint calls and response times), host (memory and CPU utilization), app (Gallery domain metrics), IO (internal database queries, image processing, and so on), repo, and job metrics. Each group of metrics can be enabled or disabled independently.

### Gallery Metrics

Gallery adds application metrics on top of the standard OpenTelemetry metrics:

- Asset counts and storage by type.
- Per-user asset and storage metrics labeled by `user_id` only.
- Smart-search embedding coverage.
- Face and person totals.
- Trash and external-library totals.
- Queue counts and oldest waiting, delayed, and failed job age.
- Machine-learning request counts, latency histograms, active requests, model cache entries, and model load latency.

Per-user metrics intentionally use `user_id` only. Names, emails, filenames, paths, search text, IP addresses, and request payloads are not exported as labels.

The dashboard and examples use the Prometheus-exported metric names:

| Metric                                   | Telemetry group  | Labels                         | Description                                                        |
| :--------------------------------------- | :--------------- | :----------------------------- | :----------------------------------------------------------------- |
| `immich_users_total`                     | `api`            | none                           | Total users.                                                       |
| `immich_assets_total`                    | `app`            | `type`                         | Non-deleted timeline assets by type.                               |
| `immich_assets_storage_bytes`            | `app`            | `type`                         | Total asset file bytes by type.                                    |
| `immich_users_assets_total`              | `app`            | `user_id`, `type`              | Non-deleted timeline assets by user and type.                      |
| `immich_users_storage_bytes`             | `app`            | `user_id`, `type`              | Asset file bytes by user and type.                                 |
| `immich_search_embedding_coverage_ratio` | `app`            | none                           | Share of eligible image/video assets with smart-search embeddings. |
| `immich_faces_total`                     | `app`            | none                           | Visible, non-deleted face count.                                   |
| `immich_people_total`                    | `app`            | none                           | People with at least one visible, non-deleted face.                |
| `immich_assets_trash_total`              | `app`            | none                           | Trashed asset count.                                               |
| `immich_assets_external_total`           | `app`            | none                           | External-library asset count.                                      |
| `immich_queues_jobs`                     | `job`            | `queue`, `status`              | Queue depth by queue and status.                                   |
| `immich_queues_oldest_job_age_seconds`   | `job`            | `queue`, `status`              | Age of the oldest waiting, delayed, or failed job.                 |
| `immich_ml_requests_total`               | machine learning | `task`, `type`, `status`       | Machine-learning `/predict` request count.                         |
| `immich_ml_request_duration_ms`          | machine learning | `task`, `type`, `status`, `le` | Machine-learning `/predict` latency histogram.                     |
| `immich_ml_active_requests`              | machine learning | none                           | In-flight machine-learning prediction requests.                    |
| `immich_ml_model_cache_entries`          | machine learning | `task`, `type`                 | Loaded or cached model count.                                      |
| `immich_ml_model_load_duration_ms`       | machine learning | `task`, `type`, `status`, `le` | Model load latency histogram.                                      |

### Configuration

Gallery will not expose server metrics endpoints by default. To enable them, add the `IMMICH_TELEMETRY_INCLUDE=all` environment variable to your `.env` file.

:::tip
`IMMICH_TELEMETRY_INCLUDE=all` enables all server telemetry groups. For a more granular configuration, enumerate the telemetry groups that should be included as a comma separated list, for example `IMMICH_TELEMETRY_INCLUDE=api,app,job`.

The starter dashboard expects `api`, `app`, and `job`. Add `host`, `io`, and `repo` if you also want the broader OpenTelemetry metrics. You can exclude specific server groups with `IMMICH_TELEMETRY_EXCLUDE`. For more information, refer to the [environment section](/install/environment-variables.md#prometheus).
:::

The machine-learning service exposes its own `/metrics` endpoint on port `3003`. It is not controlled by `IMMICH_TELEMETRY_INCLUDE`; Prometheus collects those metrics only when you configure the machine-learning scrape target.

The next step is to configure a new or existing Prometheus instance to scrape this endpoint. The following steps assume that you do not have an existing Prometheus instance, but the steps will be similar either way.

You can start by defining a Prometheus service in the Compose file:

```yaml
immich-prometheus:
  container_name: immich_prometheus
  ports:
    # this exposes the default port for Prometheus so you can interact with it
    - 9090:9090
  image: prom/prometheus
  volumes:
    # the Prometheus configuration file - a barebones one is provided to get started
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    # a named volume defined in the bottom of the Compose file; it can also be a mounted folder
    - prometheus-data:/prometheus
```

You will also need to add `prometheus-data` to the list of volumes in the bottom of the Compose file:

```yaml
volumes:
  model-cache:
  prometheus-data:
```

The last piece is the [configuration file][prom-file]. This file defines (among other things) the sources Prometheus should target. Download it and place it in the same folder as the Compose file.

:::tip
The provided file is just a starting point. There are a ton of ways to configure Prometheus, so feel free to experiment!
:::

The provided configuration includes the machine-learning service as a separate scrape target:

```yaml
- job_name: immich_machine_learning
  metrics_path: /metrics
  static_configs:
    - targets: ['immich-machine-learning:3003']
```

After bringing down the containers with `docker compose down` and back up with `docker compose up -d`, a Prometheus instance will now collect metrics from the gallery server, microservices, and machine-learning containers. Note that we didn't need to expose any new ports for these containers - the communication is handled in the internal Docker network.

:::note
To see exactly what metrics are made available, you can additionally add `8081:8081` (API metrics) and `8082:8082` (microservices metrics) to the immich_server container's ports.
Visiting the `/metrics` endpoint for these services will show the same raw data that Prometheus collects.
The machine-learning service exposes `/metrics` on its regular `3003` service port, so expose `3003:3003` on the immich_machine_learning container if you also want to inspect those metrics from the host.
To configure these ports see [`IMMICH_API_METRICS_PORT` & `IMMICH_MICROSERVICES_METRICS_PORT`](/install/environment-variables/#general).
:::

### Usage

So after setting up Prometheus, how do you actually view the metrics? The simplest way is to use Prometheus directly. Visiting Prometheus will show you a web UI where you can search for and visualize metrics. Use **Status > Targets** to confirm that `immich_api`, `immich_microservices`, and `immich_machine_learning` are all `UP`.

## Grafana

For a dedicated tool with nice presentation, you can use Grafana instead. This connects to Prometheus (and possibly other sources) for sophisticated data visualization.

Setting up Grafana is similar to Prometheus. You can add a service for it:

```yaml
immich-grafana:
  container_name: immich_grafana
  command: ['./run.sh', '-disable-reporting'] # this is to disable Grafana's telemetry
  ports:
    - 3000:3000
  image: grafana/grafana
  volumes:
    # stores your pretty dashboards and panels
    - grafana-data:/var/lib/grafana
```

And add another volume for it:

```yaml
volumes:
  model-cache:
  prometheus-data:
  grafana-data:
```

After bringing down the services and back up again, you can now visit Grafana to view your metrics. On the first login, enter `admin` for both username and password and update your password. You can then add a Prometheus data source with the URL `http://immich-prometheus:9090`.

Gallery ships a starter dashboard at [`docker/grafana-dashboard.json`][dashboard-file]. In Grafana, open **Dashboards > New > Import**, upload the JSON file or paste its contents, and select your Prometheus data source when prompted.

### Usage

The starter dashboard covers asset totals, storage, users, queue depth, queue staleness, smart-search embedding coverage, face/person counts, and machine-learning request/model metrics.

You can edit the imported dashboard in Grafana and save your own copy. If you want repeatable setup instead of manual import, keep the dashboard JSON in your own configuration repository and provision it with [Grafana dashboard provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/#dashboards).

### Troubleshooting

If Prometheus or Grafana does not show data:

- Run `docker compose up -d` after changing `.env`; a simple restart does not apply new environment variables.
- In Prometheus, open **Status > Targets** and confirm the API, microservices, and machine-learning targets are `UP`.
- Confirm the server container has `IMMICH_TELEMETRY_INCLUDE=all` or at least `IMMICH_TELEMETRY_INCLUDE=api,app,job`.
- Confirm `./prometheus.yml` is in the same directory as your Compose file and is mounted into the Prometheus container.
- If only machine-learning panels are empty, run a smart-search, facial-recognition, or classification task so the ML service has request and model activity to report.
- If you exposed the metrics ports for inspection, check `http://localhost:8081/metrics`, `http://localhost:8082/metrics`, and `http://localhost:3003/metrics`.

### Deferred Scope

Phase 1 does not add auth/IP metrics, upload throughput, face/CLIP score distributions, duplicate metrics, video transcode quality metrics, DB bloat metrics, geocoding/OCR coverage, new memory metrics, cache hit/miss internals, or custom CPU/memory/GPU/network metrics beyond existing host and infrastructure exporters. Those need separate product and privacy decisions.

## Structured Logging

In addition to Prometheus metrics, Gallery supports structured JSON logging which is ideal for log aggregation systems like Grafana Loki, ELK Stack, Datadog, Splunk, and others.

### Configuration

By default, Gallery outputs human-readable console logs. To enable JSON logging, set the `IMMICH_LOG_FORMAT` environment variable:

```bash
IMMICH_LOG_FORMAT=json
```

:::tip
The default is `IMMICH_LOG_FORMAT=console` for human-readable logs with colors during development. For production deployments using log aggregation, use `IMMICH_LOG_FORMAT=json`.
:::

### JSON Log Format

When enabled, logs are output in structured JSON format:

```json
{"level":"log","pid":36,"timestamp":1766533331507,"message":"Initialized websocket server","context":"WebsocketRepository"}
{"level":"warn","pid":48,"timestamp":1766533331629,"message":"Unable to open /build/www/index.html, skipping SSR.","context":"ApiService"}
{"level":"error","pid":36,"timestamp":1766533331690,"message":"Failed to load plugin immich-core:","context":"Error"}
```

This format includes:

- `level`: Log level (log, warn, error, etc.)
- `pid`: Process ID
- `timestamp`: Unix timestamp in milliseconds
- `message`: Log message
- `context`: Service or component that generated the log

For more information on log formats, see [`IMMICH_LOG_FORMAT`](/install/environment-variables.md#general).

[dashboard-file]: https://raw.githubusercontent.com/open-noodle/gallery/main/docker/grafana-dashboard.json
[prom-file]: https://raw.githubusercontent.com/open-noodle/gallery/main/docker/prometheus.yml
