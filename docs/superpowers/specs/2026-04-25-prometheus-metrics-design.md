# Prometheus Metrics Phase 1 Design

## Context

Discussion #426 requests richer Prometheus metrics for Gallery monitoring, including storage per user,
asset counts, embedding coverage, queue staleness, face/person stats, ML service latency, and an
ergonomic Grafana dashboard.

Gallery already has an opt-in OpenTelemetry/Prometheus exporter in the server:

- `IMMICH_TELEMETRY_INCLUDE` enables telemetry groups.
- API metrics are exported on `IMMICH_API_METRICS_PORT`, default `8081`.
- Microservices metrics are exported on `IMMICH_MICROSERVICES_METRICS_PORT`, default `8082`.
- Existing custom metrics cover user totals and live job counters.
- Existing docs and compose files include Prometheus and Grafana setup, but not a curated Gallery dashboard.

Phase 1 should deliver a useful end-to-end monitoring slice instead of implementing every metric from the discussion at once.

## Goals

- Add a practical server metrics snapshot for asset, storage, search coverage, face/person, trash,
  external-library, queue health, and queue staleness.
- Add a Prometheus `/metrics` endpoint to the Python machine-learning service for request and model-load metrics.
- Update Prometheus scrape configuration to include the ML service.
- Provide a ready-to-import Grafana dashboard for the Phase 1 metrics.
- Keep metric cardinality controlled and avoid exposing user names, emails, paths, search text, IP addresses, or request payloads.
- Document Phase 1 clearly, including deferred metrics.

## Non-Goals

- Do not expose auth attempts or failures by IP address in Phase 1.
- Do not expose user display names, emails, storage labels, original paths, or filenames as metric labels.
- Do not implement upload throughput per user in Phase 1.
- Do not implement face-score or CLIP-score distributions in Phase 1.
- Do not implement duplicate quality metrics, video transcode quality metrics, new memory metrics,
  geocoding/OCR coverage, cache hit/miss internals, or DB bloat metrics in Phase 1.
- Do not add new custom CPU, memory, GPU, or network metrics in Phase 1. The dashboard may use the
  existing `host` telemetry group where it is already available.
- Do not require a separate sidecar for ML metrics.

## Phase Plan

Phase 1 is a thin vertical slice:

1. Server app metrics for high-value totals and coverage.
2. ML service metrics on the existing FastAPI port.
3. Prometheus config that scrapes API, microservices, and ML.
4. One curated Grafana dashboard.
5. Monitoring docs updated with the Phase 1 metric list and deferred scope.

Later phases can deepen individual domains once the first dashboard is useful in real deployments.

## Architecture

The server implementation extends the existing telemetry system rather than creating a new monitoring endpoint.

Server metrics remain opt-in. If `IMMICH_TELEMETRY_INCLUDE` is empty, no server Prometheus endpoint is
started. If telemetry is enabled, the new app snapshot metrics are published through the existing
server OpenTelemetry metric service. Snapshot values must be exported with observable or settable
gauge instruments, not the existing additive `MetricGroupRepository.addToGauge()` helper, because
these metrics represent absolute counts instead of deltas.

The server app aggregate SQL should live in a dedicated `AppMetricsRepository` rather than adding
telemetry-only methods to high-churn domain repositories such as `AssetRepository` and
`PersonRepository`. This keeps the feature additive, reduces upstream rebase conflicts, and still
keeps SQL in a typed, testable repository boundary. `AppMetricsService` should be a standalone
service with explicit dependencies instead of extending `BaseService`, which avoids changing global
service test helpers for this feature.

The implementation should introduce an `app` telemetry group for these domain metrics so admins can
enable them separately from HTTP API request metrics. `IMMICH_TELEMETRY_INCLUDE=all` includes `app`.
Queue metrics remain part of the `job` telemetry group.

The ML service exposes Prometheus text output from `GET /metrics` on the existing FastAPI app and port. Metrics are updated in-process around `/predict` and model loading. Prometheus scrapes `immich-machine-learning:3003/metrics` in addition to the existing API and microservices targets.

Grafana uses Prometheus as its data source. The dashboard is shipped as JSON in the repository and documented as importable by users. Compose comments can point users at the dashboard, but Phase 1 does not need full Grafana provisioning unless it fits cleanly with existing compose patterns.

## Server Metrics

Phase 1 server metrics:

| Metric                                   | Type  | Labels            | Description                                                                                         |
| ---------------------------------------- | ----- | ----------------- | --------------------------------------------------------------------------------------------------- |
| `immich.assets.total`                    | Gauge | `type`            | Non-deleted timeline asset count by asset type: `image`, `video`, `audio`, `other`.                 |
| `immich.assets.storage_bytes`            | Gauge | `type`            | Total file bytes by asset type.                                                                     |
| `immich.users.storage_bytes`             | Gauge | `user_id`, `type` | Per-user storage bytes by asset type.                                                               |
| `immich.users.assets.total`              | Gauge | `user_id`, `type` | Per-user non-deleted timeline asset count by asset type.                                            |
| `immich.search.embedding_coverage_ratio` | Gauge | none              | Assets with smart-search embedding divided by eligible image/video assets.                          |
| `immich.faces.total`                     | Gauge | none              | Visible, non-deleted face count.                                                                    |
| `immich.people.total`                    | Gauge | none              | People with at least one visible, non-deleted face.                                                 |
| `immich.assets.trash.total`              | Gauge | none              | Trashed asset count.                                                                                |
| `immich.assets.external.total`           | Gauge | none              | External-library asset count.                                                                       |
| `immich.queues.jobs`                     | Gauge | `queue`, `status` | BullMQ counts by queue and status: `active`, `waiting`, `delayed`, `failed`, `completed`, `paused`. |
| `immich.queues.oldest_job_age_seconds`   | Gauge | `queue`, `status` | Age in seconds of the oldest job for staleness-oriented statuses: `waiting`, `delayed`, `failed`.   |

Per-user labels use `user_id` only. They must not include names, emails, storage labels, or quota labels. This keeps the dashboard useful while avoiding readable personal data in Prometheus.

The server snapshot should use low-cardinality labels only. Asset `type`, queue `queue`, queue
`status`, and `user_id` are allowed in Phase 1. File paths, filenames, search terms, IP addresses,
model inputs, and exception messages are not allowed as labels.

OpenTelemetry instrument names may use dot-separated names for consistency with existing code, but
Grafana and documentation must query the actual Prometheus-exported names after sanitization, such as
`immich_assets_total`.

## ML Metrics

Phase 1 ML metrics:

| Metric                             | Type      | Labels                   | Description                                                           |
| ---------------------------------- | --------- | ------------------------ | --------------------------------------------------------------------- |
| `immich_ml_requests_total`         | Counter   | `task`, `type`, `status` | Count of `/predict` requests by requested model task/type and status. |
| `immich_ml_request_duration_ms`    | Histogram | `task`, `type`, `status` | End-to-end `/predict` duration in milliseconds.                       |
| `immich_ml_active_requests`        | Gauge     | none                     | Number of in-flight prediction requests.                              |
| `immich_ml_model_cache_entries`    | Gauge     | `task`, `type`           | Loaded or cached model count by task/type.                            |
| `immich_ml_model_load_duration_ms` | Histogram | `task`, `type`, `status` | Model load duration in milliseconds.                                  |

`status` should use a bounded set such as `success`, `error`, and `validation_error`. It must not include exception text.

For requests that include multiple entries, the implementation should record one metric observation per requested task/type. If task/type parsing fails, record the request under `task="unknown"` and `type="unknown"` with `status="validation_error"`.

## Data Flow

Server metrics are exposed from a cached snapshot.

The snapshot collector refreshes at most once every 30 to 60 seconds. Prometheus scrapes can happen
more often, but they should serve the cached values unless the cache is stale. This avoids turning
frequent scrapes into repeated aggregate database scans. Phase 1 should not add indexes
preemptively; the initial queries should rely on existing asset, face, visibility, deletion, and
smart-search indexes, with query tuning deferred until real deployments show a bottleneck.

`AppMetricsRepository` fetches:

- Aggregated asset and storage counts from the database.
- Per-user asset and storage counts from the database.
- Smart-search embedding coverage from the asset and smart-search tables.
- Face/person totals from face and person tables.
- Trash and external-library totals from asset fields.

`JobRepository` fetches:

- Queue counts from BullMQ `getJobCounts()` for every `QueueName`.
- Oldest waiting, delayed, and failed job age from BullMQ job timestamps for every `QueueName`.

The collector should preserve the previous successful snapshot if a refresh fails. If no snapshot has succeeded yet, it should omit the affected custom metric series until a successful refresh. Refresh failures should be logged once per failed refresh attempt and must not break the server or the Prometheus endpoint.

ML metrics are in-process counters, gauges, and histograms. Request counters and duration histograms
are updated around `/predict`. Active request gauge increments and decrements using the existing
request state dependency. Model cache gauges are derived from the current cache contents when
`/metrics` is rendered or updated when models load, whichever is simpler and reliable.

## Grafana Dashboard

The Phase 1 dashboard should emphasize operational signal over exhaustive panels:

- Overview: total assets, storage bytes, users, embedding coverage, active ML requests.
- Storage: total bytes by type and per-user storage by `user_id`.
- Assets: total asset counts by type and per-user asset counts.
- Jobs: queue depth by queue/status, failed jobs by queue, and oldest waiting/delayed/failed job age.
- Search/AI: embedding coverage, ML request rate, ML latency percentiles, model cache entries.
- Faces: visible face count and people count.
- Exceptions or warning panels should be based on existing counters where available, not log scraping.

The dashboard should avoid panels that imply deferred metrics exist. Deferred areas can be mentioned in docs, not represented as empty dashboard panels.

## Documentation

Update the existing monitoring docs to cover:

- Enabling telemetry with `IMMICH_TELEMETRY_INCLUDE=all`.
- The `app` telemetry group for server domain metrics and the `job` telemetry group for queue metrics.
- The three scrape targets: API, microservices, and ML.
- The Phase 1 custom metric list.
- The privacy rule that per-user metrics use `user_id` only.
- Importing the bundled Grafana dashboard.
- Deferred metrics and why they are out of Phase 1.

Update `docker/prometheus.yml` to scrape:

- `immich-server:8081`
- `immich-server:8082`
- `immich-machine-learning:3003`

## Error Handling

- Server snapshot refresh failure logs a warning and keeps the previous snapshot.
- Server metric export must not throw from the Prometheus scrape path.
- ML `/metrics` must continue to work even if the model cache is empty.
- ML failed requests should increment bounded failure metrics without leaking payload contents or exception strings into labels.
- If ML metrics dependencies are unavailable during development, the implementation should either use a minimal local Prometheus text renderer or add a small dependency with tests and lockfile updates.

## Testing

Server tests:

- `AppMetricsRepository` and `AppMetricsService` return the expected asset, storage, per-user,
  embedding, face/person, trash, external, queue count, and queue staleness values.
- Per-user metric labels contain `user_id` and no user name or email.
- Snapshot cache serves previous values within the refresh window.
- Failed refresh preserves the previous successful snapshot.
- Failed first refresh omits custom app series rather than returning invalid values.
- Absolute snapshot gauges are recorded through observable/settable gauge instruments, not additive
  delta helpers.

ML tests:

- `GET /metrics` returns Prometheus text.
- Successful `/predict` updates request count and duration metrics.
- Validation failures are counted under bounded `unknown` labels.
- Active request gauge returns to zero after a request.
- Model load duration records bounded status labels.

Config/docs tests:

- `docker/prometheus.yml` contains API, microservices, and ML targets.
- Grafana dashboard JSON parses successfully.
- Relevant docs mention Phase 1 scope and user-ID-only labels.

## Acceptance Criteria

- With telemetry enabled, Prometheus can scrape API, microservices, and ML metrics.
- The dashboard imports into Grafana and renders meaningful panels against the Phase 1 metrics.
- Server custom metrics do not expose names, emails, paths, filenames, IP addresses, or payload text.
- ML metrics expose bounded labels for task/type/status only.
- Queue staleness is visible through oldest waiting, delayed, and failed job age panels.
- The server keeps serving previous custom metric values if a snapshot refresh fails.
- Unit tests cover the snapshot collector and ML metrics behavior.
