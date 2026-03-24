# E2E CI Speedup Design

## Problem

ARM e2e tests take ~15.5 min (web) and ~8.5 min (server). The two bottlenecks are:

1. **Docker image build from scratch every run (~5 min)** — the `cache_from` in docker-compose.yml points to upstream's `ghcr.io/immich-app/` registry, which the fork can't pull from
2. **Three Playwright suites running sequentially (~9.5 min)** — web, ui, and maintenance run back-to-back in a single job

## Optimization 1: Docker Build Layer Caching

### Approach

Add a new `docker-build-e2e` job that builds `immich-server:latest` once per architecture using `docker/build-push-action` with GitHub Actions cache backend, then shares the image as an artifact.

### New job: `docker-build-e2e`

- **Matrix:** `{runner: [ubuntu-latest, ubuntu-24.04-arm]}`
- **Actions:** `docker/setup-buildx-action` + `docker/build-push-action`
- **Cache:** `type=gha,scope=e2e-${{ runner.arch }},mode=min`
  - `mode=min` (not `mode=max`) to stay within 10GB GHA cache budget — multi-stage Dockerfile with 2 architectures could blow it otherwise
  - Scoped by `runner.arch` to separate ARM/x86 caches
- **Output:** `type=docker,dest=/tmp/immich-server.tar` (no `load: true` — mutually exclusive with `outputs`)
- **Artifact:** Upload tar with `retention-days: 1` (only needed within same workflow run)

### Downstream changes

Both `e2e-tests-server-cli` and `e2e-tests-web` gain `needs: docker-build-e2e` and replace the `--build` step with:

1. Download image artifact matching their architecture
2. `docker load < /tmp/immich-server.tar`
3. `docker compose build e2e-auth-server` (tiny Node alpine image, ~3s)
4. `docker compose up -d --wait --wait-timeout 300 ...` (no `--build`)

### Cache hit behavior

- **e2e-only or web-only PRs:** Full cache hit, build drops from ~5 min to ~1 min
- **Server-touching PRs:** Server Dockerfile stage misses cache (COPY invalidation), still takes a few minutes — same as today but with cache for unchanged stages
- **Cache eviction:** Falls back to uncached build (same as today)

## Optimization 2: Parallel Playwright Suites

### Approach

Expand `e2e-tests-web` matrix to include a `suite` dimension. Each matrix entry runs one Playwright project independently.

### Matrix structure

```yaml
strategy:
  matrix:
    runner: [ubuntu-latest, ubuntu-24.04-arm]
    suite:
      - { name: web, cmd: 'pnpm test:web' }
      - { name: ui, cmd: 'pnpm test:web:ui' }
      - { name: maintenance, cmd: 'pnpm test:web:maintenance' }
```

### Per-job flow

1. Download pre-built Docker image artifact
2. Load image + build e2e-auth-server + start Docker Compose
3. Install Playwright browsers
4. Run ONE suite via `${{ matrix.suite.cmd }}`
5. Upload Playwright report as `e2e-${{ matrix.suite.name }}-test-results-${{ matrix.runner }}`

### Impact

- 6 web e2e jobs instead of 2 (each with own Docker Compose stack)
- Wall-clock drops from sum(9.5 min) to max(5.5 min = ui on ARM)

## Expected Impact

| Metric               | Before (ARM)  | After (ARM)         |
| -------------------- | ------------- | ------------------- |
| Docker build         | ~5 min        | ~1 min (cache hit)  |
| Playwright           | ~9.5 min      | ~5.5 min (parallel) |
| **Total Web E2E**    | **~15.5 min** | **~8 min**          |
| **Total Server E2E** | **~8.5 min**  | **~5 min**          |

## Trade-offs

- Job count goes from 4 e2e jobs to 10 (2 build + 2 server + 6 web) — more runner-minutes but less wall-clock
- GHA cache is best-effort with 10GB limit — eviction is graceful fallback
- Artifact upload/download adds ~30-60s overhead per job, still net positive
- Each Playwright suite job runs its own Docker Compose stack (postgres, redis, server) — correct for isolation since suites mutate state
