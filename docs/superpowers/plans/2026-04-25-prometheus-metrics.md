# Prometheus Metrics Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 1 Prometheus monitoring slice: server domain metrics, queue staleness metrics, ML service metrics, Prometheus scrape config, Grafana dashboard, and docs.

**Architecture:** Keep server metrics inside the existing opt-in OpenTelemetry exporter. Add an `app` telemetry group for domain snapshot metrics, keep app aggregate SQL in a dedicated `AppMetricsRepository` to avoid high-conflict domain repository edits, use observable gauges for absolute values, publish queue metrics from the microservices worker, and expose ML metrics from the existing FastAPI app on `/metrics`.

**Tech Stack:** NestJS 11, OpenTelemetry, BullMQ, Kysely, Vitest, Python FastAPI, `prometheus-client`, uv, Grafana dashboard JSON, Docusaurus docs.

---

## File Structure

- Modify `server/src/enum.ts`: add `ImmichTelemetry.App`.
- Read `server/src/repositories/config.repository.ts`: confirm the existing telemetry parser reads from `Object.values(ImmichTelemetry)`.
- Modify `server/src/repositories/config.repository.spec.ts`: cover `app` in all/specific/exclusion telemetry config tests.
- Modify `server/src/repositories/telemetry.repository.ts`: add an `app` metric group and observable gauge support.
- Add `server/src/repositories/telemetry.repository.spec.ts`: unit coverage for observable gauge registration.
- Modify `server/test/repositories/telemetry.repository.mock.ts`: mock `app.observeGauge()`.
- Add `server/src/repositories/app-metrics.repository.ts`: typed aggregate queries for asset, user, search, state, face, and person metrics.
- Add `server/test/medium/specs/repositories/app-metrics.repository.spec.ts`: medium coverage for app telemetry aggregates.
- Modify `server/src/repositories/index.ts`: register `AppMetricsRepository`.
- Modify `server/src/repositories/job.repository.ts`: add queue count and oldest-job-age telemetry methods.
- Modify `server/test/repositories/job.repository.mock.ts`: mock the new queue telemetry method.
- Add `server/src/services/app-metrics.service.ts`: registers observable gauges and manages snapshot cache/failure behavior.
- Add `server/src/services/app-metrics.service.spec.ts`: unit coverage for gauge registration, labels, cache reuse, and failure fallback.
- Modify `server/src/services/index.ts`: include `AppMetricsService`.
- Add `machine-learning/immich_ml/metrics.py`: ML Prometheus registry, counters, histograms, gauges, and test reset helper.
- Modify `machine-learning/immich_ml/main.py`: expose `GET /metrics`, record `/predict` and model-load metrics.
- Modify `machine-learning/pyproject.toml` and `machine-learning/uv.lock`: add `prometheus-client`.
- Modify `machine-learning/test_main.py`: ML metrics tests.
- Modify `docker/prometheus.yml`: scrape the ML service.
- Add `docker/grafana-dashboard.json`: importable Phase 1 dashboard.
- Modify `docs/docs/features/monitoring.md`: explain Phase 1 metrics, ML scrape target, dashboard import, privacy, and deferred scope.
- Modify `docs/docs/install/environment-variables.md`: add `app` to telemetry include/exclude docs.

## Rebase-Friendly Implementation Notes

This plan keeps the high-conflict surface small:

- Do not add telemetry-only methods to `server/src/repositories/asset.repository.ts` or `server/src/repositories/person.repository.ts`.
- Keep app aggregate SQL in the new `server/src/repositories/app-metrics.repository.ts` file.
- Keep `AppMetricsService` standalone with explicit constructor dependencies instead of extending `BaseService`.
- Do not modify `server/test/utils.ts`; instantiate `AppMetricsService` directly in its unit test.
- Do not modify `server/test/medium.factory.ts`; instantiate `AppMetricsRepository` directly in its medium test and use `BaseService` only to create test data helpers.
- Limit unavoidable edits to registration and shared telemetry files: `server/src/enum.ts`, `server/src/repositories/index.ts`, `server/src/repositories/telemetry.repository.ts`, `server/src/services/index.ts`, and the existing mocks.

## Task 1: Telemetry App Group And Observable Gauge Support

**Files:**

- Modify: `server/src/enum.ts`
- Modify: `server/src/repositories/config.repository.spec.ts`
- Modify: `server/src/repositories/telemetry.repository.ts`
- Add: `server/src/repositories/telemetry.repository.spec.ts`
- Modify: `server/test/repositories/telemetry.repository.mock.ts`

- [ ] **Step 1: Write failing config tests for the `app` telemetry group**

Add these expectations in `server/src/repositories/config.repository.spec.ts`:

```typescript
it('should run with telemetry app metrics enabled', () => {
  process.env.IMMICH_TELEMETRY_INCLUDE = 'app';
  const { telemetry } = getEnv();

  expect(telemetry.metrics).toEqual(new Set([ImmichTelemetry.App]));
});
```

Update the existing `IMMICH_TELEMETRY_INCLUDE=all` test to keep using:

```typescript
expect(telemetry.metrics).toEqual(new Set(Object.values(ImmichTelemetry)));
```

Update the existing `all` with `job` excluded expectation to include `ImmichTelemetry.App`:

```typescript
expect(telemetry.metrics).toEqual(
  new Set([ImmichTelemetry.Api, ImmichTelemetry.App, ImmichTelemetry.Host, ImmichTelemetry.Io, ImmichTelemetry.Repo]),
);
```

- [ ] **Step 2: Run config tests and verify they fail**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/config.repository.spec.ts
```

Expected: FAIL because `ImmichTelemetry.App` does not exist and `app` is rejected by telemetry validation.

- [ ] **Step 3: Add `ImmichTelemetry.App`**

In `server/src/enum.ts`, update the enum:

```typescript
export enum ImmichTelemetry {
  Host = 'host',
  Api = 'api',
  App = 'app',
  Io = 'io',
  Repo = 'repo',
  Job = 'job',
}
```

`ConfigRepository` builds valid telemetry types from `Object.values(ImmichTelemetry)`, so no parser rewrite is needed.

- [ ] **Step 4: Run config tests and verify they pass**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/config.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing observable gauge tests**

Create `server/src/repositories/telemetry.repository.spec.ts`:

```typescript
import { ObservableCallback } from '@opentelemetry/api';
import { MetricService } from 'nestjs-otel';
import { MetricGroupRepository } from 'src/repositories/telemetry.repository';
import { describe, expect, it, vi } from 'vitest';

describe(MetricGroupRepository.name, () => {
  const newMetricService = () => {
    const observableGauge = { addCallback: vi.fn() };
    const metricService = {
      getCounter: vi.fn(),
      getUpDownCounter: vi.fn(),
      getHistogram: vi.fn(),
      getObservableGauge: vi.fn().mockReturnValue(observableGauge),
    } as unknown as MetricService;

    return { metricService, observableGauge };
  };

  it('registers observable gauges when enabled', () => {
    const { metricService, observableGauge } = newMetricService();
    const callback: ObservableCallback = vi.fn();

    new MetricGroupRepository(metricService).configure({ enabled: true }).observeGauge('immich.assets.total', callback);

    expect(metricService.getObservableGauge).toHaveBeenCalledWith('immich.assets.total', undefined);
    expect(observableGauge.addCallback).toHaveBeenCalledWith(callback);
  });

  it('does not register observable gauges when disabled', () => {
    const { metricService, observableGauge } = newMetricService();
    const callback: ObservableCallback = vi.fn();

    new MetricGroupRepository(metricService)
      .configure({ enabled: false })
      .observeGauge('immich.assets.total', callback);

    expect(metricService.getObservableGauge).not.toHaveBeenCalled();
    expect(observableGauge.addCallback).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: Run telemetry repository tests and verify they fail**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/telemetry.repository.spec.ts
```

Expected: FAIL because `MetricGroupRepository.observeGauge()` does not exist.

- [ ] **Step 7: Add observable gauge support and the `app` metric group**

In `server/src/repositories/telemetry.repository.ts`, import `ObservableCallback`:

```typescript
import { MetricOptions, ObservableCallback } from '@opentelemetry/api';
```

Add this method to `MetricGroupRepository`:

```typescript
observeGauge(name: string, callback: ObservableCallback, options?: MetricOptions): void {
  if (this.enabled) {
    this.metricService.getObservableGauge(name, options).addCallback(callback);
  }
}
```

Add `app` to `TelemetryRepository`:

```typescript
app: MetricGroupRepository;
```

Configure it in the constructor:

```typescript
this.api = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Api) });
this.app = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.App) });
this.host = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Host) });
this.jobs = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Job) });
this.repo = new MetricGroupRepository(metricService).configure({ enabled: metrics.has(ImmichTelemetry.Repo) });
```

- [ ] **Step 8: Update the telemetry repository mock**

In `server/test/repositories/telemetry.repository.mock.ts`, add `observeGauge` to `newMetricGroupMock()`:

```typescript
const newMetricGroupMock = () => {
  return {
    addToCounter: vitest.fn(),
    addToGauge: vitest.fn(),
    addToHistogram: vitest.fn(),
    configure: vitest.fn(),
    observeGauge: vitest.fn(),
  };
};
```

Add the `app` group in `newTelemetryRepositoryMock()`:

```typescript
return {
  setup: vitest.fn(),
  api: newMetricGroupMock(),
  app: newMetricGroupMock(),
  host: newMetricGroupMock(),
  jobs: newMetricGroupMock(),
  repo: newMetricGroupMock(),
};
```

- [ ] **Step 9: Run Task 1 tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/config.repository.spec.ts src/repositories/telemetry.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 1**

Run:

```bash
git add server/src/enum.ts server/src/repositories/config.repository.spec.ts server/src/repositories/telemetry.repository.ts server/src/repositories/telemetry.repository.spec.ts server/test/repositories/telemetry.repository.mock.ts
git commit -m "feat(server): add app telemetry gauges"
```

## Task 2: Server App Metrics Repository

**Files:**

- Add: `server/src/repositories/app-metrics.repository.ts`
- Add: `server/test/medium/specs/repositories/app-metrics.repository.spec.ts`
- Modify: `server/src/repositories/index.ts`

- [ ] **Step 1: Write failing medium tests for app metric aggregates**

Create `server/test/medium/specs/repositories/app-metrics.repository.spec.ts`:

```typescript
import { Kysely } from 'kysely';
import { AssetType, AssetVisibility } from 'src/enum';
import { AppMetricsRepository } from 'src/repositories/app-metrics.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { DB } from 'src/schema';
import { BaseService } from 'src/services/base.service';
import { newMediumService } from 'test/medium.factory';
import { newEmbedding } from 'test/small.factory';
import { getKyselyDB } from 'test/utils';

let defaultDatabase: Kysely<DB>;

const setup = (db?: Kysely<DB>) => {
  const database = db || defaultDatabase;
  const { ctx } = newMediumService(BaseService, {
    database,
    real: [],
    mock: [LoggingRepository],
  });
  return { ctx, sut: new AppMetricsRepository(database) };
};

beforeAll(async () => {
  defaultDatabase = await getKyselyDB();
});

describe(AppMetricsRepository.name, () => {
  describe('getMetrics', () => {
    it('returns low-cardinality asset, user, search, state, face, and person metrics', async () => {
      const { ctx, sut } = setup();
      const { user: user1 } = await ctx.newUser();
      const { user: user2 } = await ctx.newUser();

      const { asset: image1 } = await ctx.newAsset({
        ownerId: user1.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: video1 } = await ctx.newAsset({
        ownerId: user1.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Timeline,
      });
      const { asset: image2 } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Timeline,
        isExternal: true,
      });
      const { asset: hidden } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Image,
        visibility: AssetVisibility.Hidden,
      });
      const { asset: trashed } = await ctx.newAsset({
        ownerId: user2.id,
        type: AssetType.Video,
        visibility: AssetVisibility.Timeline,
      });
      const { person: person1 } = await ctx.newPerson({ ownerId: user1.id, name: 'Alice' });
      const { person: person2 } = await ctx.newPerson({ ownerId: user1.id, name: 'Bob' });

      await Promise.all([
        ctx.newExif({ assetId: image1.id, fileSizeInByte: 100 }),
        ctx.newExif({ assetId: video1.id, fileSizeInByte: 200 }),
        ctx.newExif({ assetId: image2.id, fileSizeInByte: 300 }),
        ctx.newExif({ assetId: hidden.id, fileSizeInByte: 400 }),
        ctx.newExif({ assetId: trashed.id, fileSizeInByte: 500 }),
        ctx.database.insertInto('smart_search').values({ assetId: image1.id, embedding: newEmbedding() }).execute(),
        ctx.newAssetFace({ assetId: image1.id, personId: person1.id, isVisible: true }),
        ctx.newAssetFace({ assetId: image1.id, personId: person1.id, isVisible: true }),
        ctx.newAssetFace({ assetId: video1.id, personId: person2.id, isVisible: true }),
        ctx.newAssetFace({ assetId: video1.id, personId: person2.id, isVisible: false }),
        ctx.newAssetFace({ assetId: video1.id, personId: null, isVisible: true }),
        ctx.newAssetFace({ assetId: hidden.id, personId: person2.id, isVisible: true }),
        ctx.newAssetFace({ assetId: trashed.id, personId: person2.id, isVisible: true }),
        ctx.softDeleteAsset(trashed.id),
      ]);

      const result = await sut.getMetrics();

      expect(result.asset.assetsByType).toEqual(
        expect.arrayContaining([
          { type: AssetType.Image, count: 2, storageBytes: 400 },
          { type: AssetType.Video, count: 1, storageBytes: 200 },
        ]),
      );
      expect(result.asset.usersByType).toEqual(
        expect.arrayContaining([
          { userId: user1.id, type: AssetType.Image, count: 1, storageBytes: 100 },
          { userId: user1.id, type: AssetType.Video, count: 1, storageBytes: 200 },
          { userId: user2.id, type: AssetType.Image, count: 1, storageBytes: 300 },
        ]),
      );
      expect(result.asset.search).toEqual({ eligibleAssets: 3, embeddedAssets: 1 });
      expect(result.asset.state).toEqual({ externalAssets: 1, trashAssets: 1 });
      expect(result.person).toEqual({ faces: 4, people: 2 });
    });
  });
});
```

- [ ] **Step 2: Run the app metrics repository medium test and verify it fails**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/app-metrics.repository.spec.ts
```

Expected: FAIL because `AppMetricsRepository` does not exist.

- [ ] **Step 3: Add the app metrics repository**

Create `server/src/repositories/app-metrics.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { Kysely, SelectQueryBuilder } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';

export interface AssetTelemetryByType {
  type: AssetType;
  count: number;
  storageBytes: number;
}

export interface UserAssetTelemetryByType extends AssetTelemetryByType {
  userId: string;
}

export interface SearchTelemetryMetrics {
  eligibleAssets: number;
  embeddedAssets: number;
}

export interface AssetStateTelemetryMetrics {
  externalAssets: number;
  trashAssets: number;
}

export interface AssetTelemetryMetrics {
  assetsByType: AssetTelemetryByType[];
  usersByType: UserAssetTelemetryByType[];
  search: SearchTelemetryMetrics;
  state: AssetStateTelemetryMetrics;
}

export interface PersonTelemetryMetrics {
  faces: number;
  people: number;
}

export interface AppMetricsSnapshot {
  asset: AssetTelemetryMetrics;
  person: PersonTelemetryMetrics;
}

@Injectable()
export class AppMetricsRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  async getMetrics(): Promise<AppMetricsSnapshot> {
    const [asset, person] = await Promise.all([this.getAssetMetrics(), this.getPersonMetrics()]);
    return { asset, person };
  }

  private visibleTimelineAssets<O extends object>(qb: SelectQueryBuilder<DB, 'asset', O>) {
    return qb.where('asset.deletedAt', 'is', null).where('asset.visibility', '=', AssetVisibility.Timeline);
  }

  private async getAssetMetrics(): Promise<AssetTelemetryMetrics> {
    const assetsByType = await this.visibleTimelineAssets(
      this.db
        .selectFrom('asset')
        .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
        .select(['asset.type'])
        .select((eb) => [
          eb.fn.countAll<number>().as('count'),
          eb.fn.coalesce(eb.fn.sum<number>('asset_exif.fileSizeInByte'), eb.lit(0)).as('storageBytes'),
        ])
        .groupBy('asset.type'),
    ).execute();

    const usersByType = await this.visibleTimelineAssets(
      this.db
        .selectFrom('asset')
        .leftJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
        .select(['asset.ownerId as userId', 'asset.type'])
        .select((eb) => [
          eb.fn.countAll<number>().as('count'),
          eb.fn.coalesce(eb.fn.sum<number>('asset_exif.fileSizeInByte'), eb.lit(0)).as('storageBytes'),
        ])
        .groupBy(['asset.ownerId', 'asset.type']),
    ).execute();

    const search = await this.visibleTimelineAssets(
      this.db
        .selectFrom('asset')
        .leftJoin('smart_search', 'smart_search.assetId', 'asset.id')
        .select((eb) => [
          eb.fn.countAll<number>().as('eligibleAssets'),
          eb.fn.count<number>('smart_search.assetId').as('embeddedAssets'),
        ])
        .where('asset.type', 'in', [AssetType.Image, AssetType.Video]),
    ).executeTakeFirstOrThrow();

    const state = await this.db
      .selectFrom('asset')
      .select((eb) => [
        eb.fn.countAll<number>().filterWhere('asset.deletedAt', 'is not', null).as('trashAssets'),
        eb.fn
          .countAll<number>()
          .filterWhere((eb) => eb.and([eb('asset.deletedAt', 'is', null), eb('asset.isExternal', '=', true)]))
          .as('externalAssets'),
      ])
      .executeTakeFirstOrThrow();

    return {
      assetsByType: assetsByType.map((item) => ({
        type: item.type,
        count: Number(item.count),
        storageBytes: Number(item.storageBytes),
      })),
      usersByType: usersByType.map((item) => ({
        userId: item.userId,
        type: item.type,
        count: Number(item.count),
        storageBytes: Number(item.storageBytes),
      })),
      search: {
        eligibleAssets: Number(search.eligibleAssets),
        embeddedAssets: Number(search.embeddedAssets),
      },
      state: {
        externalAssets: Number(state.externalAssets),
        trashAssets: Number(state.trashAssets),
      },
    };
  }

  private async getPersonMetrics(): Promise<PersonTelemetryMetrics> {
    const result = await this.db
      .selectFrom('asset_face')
      .innerJoin('asset', 'asset.id', 'asset_face.assetId')
      .select((eb) => [
        eb.fn.countAll<number>().as('faces'),
        eb.fn
          .count<number>(eb.fn('distinct', ['asset_face.personId']))
          .filterWhere('asset_face.personId', 'is not', null)
          .as('people'),
      ])
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .executeTakeFirstOrThrow();

    return {
      faces: Number(result.faces),
      people: Number(result.people),
    };
  }
}
```

- [ ] **Step 4: Register `AppMetricsRepository`**

In `server/src/repositories/index.ts`, add the import:

```typescript
import { AppMetricsRepository } from 'src/repositories/app-metrics.repository';
```

Add it to `repositories` near `AppRepository`:

```typescript
AppMetricsRepository,
AppRepository,
```

- [ ] **Step 5: Run the app metrics repository medium test and verify it passes**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/app-metrics.repository.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

Run:

```bash
git add server/src/repositories/app-metrics.repository.ts server/src/repositories/index.ts server/test/medium/specs/repositories/app-metrics.repository.spec.ts
git commit -m "feat(server): collect app metric aggregates"
```

## Task 3: Queue Telemetry And App Metrics Service

**Files:**

- Modify: `server/src/repositories/job.repository.ts`
- Add: `server/src/repositories/job.repository.spec.ts`
- Modify: `server/test/repositories/job.repository.mock.ts`
- Add: `server/src/services/app-metrics.service.ts`
- Add: `server/src/services/app-metrics.service.spec.ts`
- Modify: `server/src/services/index.ts`

- [ ] **Step 1: Write failing unit tests for queue telemetry**

Create `server/src/repositories/job.repository.spec.ts`:

```typescript
import { ModuleRef } from '@nestjs/core';
import { QueueName } from 'src/enum';
import { JobRepository } from 'src/repositories/job.repository';
import { describe, expect, it, vi } from 'vitest';

describe(JobRepository.name, () => {
  const setup = () => {
    const queue = {
      getJobCounts: vi.fn(),
      getJobs: vi.fn(),
    };
    const moduleRef = { get: vi.fn().mockReturnValue(queue) } as unknown as ModuleRef;
    const logger = { setContext: vi.fn(), error: vi.fn(), warn: vi.fn(), verbose: vi.fn() };
    const sut = new JobRepository(moduleRef, {} as never, {} as never, logger as never);
    return { sut, queue };
  };

  it('returns queue counts and oldest job ages', async () => {
    const { sut, queue } = setup();
    const now = new Date('2026-04-25T12:00:00Z').getTime();
    queue.getJobCounts.mockResolvedValue({
      active: 1,
      completed: 2,
      failed: 3,
      delayed: 4,
      waiting: 5,
      paused: 6,
    });
    queue.getJobs.mockResolvedValue([{ timestamp: now - 120_000 }]);

    const result = await sut.getTelemetryMetrics(now);

    expect(result.counts).toEqual(
      expect.arrayContaining([
        { queue: QueueName.ThumbnailGeneration, status: 'active', count: 1 },
        { queue: QueueName.ThumbnailGeneration, status: 'completed', count: 2 },
        { queue: QueueName.ThumbnailGeneration, status: 'failed', count: 3 },
        { queue: QueueName.ThumbnailGeneration, status: 'delayed', count: 4 },
        { queue: QueueName.ThumbnailGeneration, status: 'waiting', count: 5 },
        { queue: QueueName.ThumbnailGeneration, status: 'paused', count: 6 },
      ]),
    );
    expect(result.oldestJobAges).toEqual(
      expect.arrayContaining([
        { queue: QueueName.ThumbnailGeneration, status: 'waiting', ageSeconds: 120 },
        { queue: QueueName.ThumbnailGeneration, status: 'delayed', ageSeconds: 120 },
        { queue: QueueName.ThumbnailGeneration, status: 'failed', ageSeconds: 120 },
      ]),
    );
    expect(queue.getJobs).toHaveBeenCalledWith('waiting', 0, 0, true);
    expect(queue.getJobs).toHaveBeenCalledWith('delayed', 0, 0, true);
    expect(queue.getJobs).toHaveBeenCalledWith('failed', 0, 0, true);
  });
});
```

In `server/src/services/app-metrics.service.spec.ts`, start with service-level tests that use direct
`AppMetricsRepository` and `JobRepository.getTelemetryMetrics()` mocks:

```typescript
import { ObservableCallback, ObservableResult } from '@opentelemetry/api';
import { AssetType, ImmichWorker, QueueName } from 'src/enum';
import { AppMetricsRepository } from 'src/repositories/app-metrics.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { AppMetricsService } from 'src/services/app-metrics.service';
import { newTelemetryRepositoryMock } from 'test/repositories/telemetry.repository.mock';
import { beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

const observe = async (callback: ObservableCallback) => {
  const result = { observe: vi.fn() } as unknown as ObservableResult;
  await callback(result);
  return result.observe as ReturnType<typeof vi.fn>;
};

type AppMetricsServiceMocks = {
  logger: Mocked<Pick<LoggingRepository, 'setContext' | 'warn'>>;
  config: Mocked<Pick<ConfigRepository, 'getWorker'>>;
  telemetry: ReturnType<typeof newTelemetryRepositoryMock>;
  appMetrics: Mocked<Pick<AppMetricsRepository, 'getMetrics'>>;
  job: Mocked<Pick<JobRepository, 'getTelemetryMetrics'>>;
};

describe(AppMetricsService.name, () => {
  let sut: AppMetricsService;
  let mocks: AppMetricsServiceMocks;
  let appCallbacks: Map<string, ObservableCallback>;
  let jobCallbacks: Map<string, ObservableCallback>;

  beforeEach(() => {
    mocks = {
      logger: { setContext: vi.fn(), warn: vi.fn() },
      config: { getWorker: vi.fn() },
      telemetry: newTelemetryRepositoryMock(),
      appMetrics: { getMetrics: vi.fn() },
      job: { getTelemetryMetrics: vi.fn() },
    };
    sut = new AppMetricsService(
      mocks.logger as unknown as LoggingRepository,
      mocks.config as unknown as ConfigRepository,
      mocks.telemetry as unknown as TelemetryRepository,
      mocks.appMetrics as unknown as AppMetricsRepository,
      mocks.job as unknown as JobRepository,
    );
    appCallbacks = new Map();
    jobCallbacks = new Map();
    mocks.telemetry.app.observeGauge.mockImplementation((name, callback) => {
      appCallbacks.set(name, callback);
    });
    mocks.telemetry.jobs.observeGauge.mockImplementation((name, callback) => {
      jobCallbacks.set(name, callback);
    });
  });

  it('registers app gauges on the API worker', () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);

    sut.onBootstrap();

    expect(appCallbacks.has('immich.assets.total')).toBe(true);
    expect(appCallbacks.has('immich.users.storage_bytes')).toBe(true);
    expect(jobCallbacks.size).toBe(0);
  });

  it('registers queue gauges on the microservices worker', () => {
    mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);

    sut.onBootstrap();

    expect(jobCallbacks.has('immich.queues.jobs')).toBe(true);
    expect(jobCallbacks.has('immich.queues.oldest_job_age_seconds')).toBe(true);
    expect(appCallbacks.size).toBe(0);
  });
});
```

- [ ] **Step 2: Run the app metrics tests and verify they fail**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/services/app-metrics.service.spec.ts
```

Expected: FAIL because `JobRepository.getTelemetryMetrics()` and `AppMetricsService` do not exist.

- [ ] **Step 3: Add queue telemetry types and repository method**

In `server/src/repositories/job.repository.ts`, add these exports near the other queue types:

```typescript
export type QueueTelemetryStatus = 'active' | 'completed' | 'failed' | 'delayed' | 'waiting' | 'paused';
export type QueueTelemetryStalenessStatus = 'waiting' | 'delayed' | 'failed';

export interface QueueTelemetryJobCount {
  queue: QueueName;
  status: QueueTelemetryStatus;
  count: number;
}

export interface QueueTelemetryOldestJobAge {
  queue: QueueName;
  status: QueueTelemetryStalenessStatus;
  ageSeconds: number;
}

export interface QueueTelemetryMetrics {
  counts: QueueTelemetryJobCount[];
  oldestJobAges: QueueTelemetryOldestJobAge[];
}
```

Add this method inside `JobRepository`:

```typescript
async getTelemetryMetrics(now = Date.now()): Promise<QueueTelemetryMetrics> {
  const countStatuses: QueueTelemetryStatus[] = ['active', 'completed', 'failed', 'delayed', 'waiting', 'paused'];
  const stalenessStatuses: QueueTelemetryStalenessStatus[] = ['waiting', 'delayed', 'failed'];
  const counts: QueueTelemetryJobCount[] = [];
  const oldestJobAges: QueueTelemetryOldestJobAge[] = [];

  for (const queue of Object.values(QueueName)) {
    const queueCounts = await this.getJobCounts(queue);
    for (const status of countStatuses) {
      counts.push({ queue, status, count: Number(queueCounts[status] ?? 0) });
    }

    for (const status of stalenessStatuses) {
      const [job] = await this.getQueue(queue).getJobs(status, 0, 0, true);
      oldestJobAges.push({
        queue,
        status,
        ageSeconds: job ? Math.max(0, Math.floor((now - job.timestamp) / 1000)) : 0,
      });
    }
  }

  return { counts, oldestJobAges };
}
```

- [ ] **Step 4: Update the job repository mock**

In `server/test/repositories/job.repository.mock.ts`, add:

```typescript
getTelemetryMetrics: vitest.fn(),
```

- [ ] **Step 5: Implement `AppMetricsService`**

Create `server/src/services/app-metrics.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ObservableCallback, ObservableResult } from '@opentelemetry/api';
import { OnEvent } from 'src/decorators';
import { ImmichWorker } from 'src/enum';
import { AppMetricsRepository, AppMetricsSnapshot } from 'src/repositories/app-metrics.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { QueueTelemetryMetrics } from 'src/repositories/job.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';

const SNAPSHOT_TTL_MS = 60_000;

@Injectable()
export class AppMetricsService {
  private appSnapshot?: AppMetricsSnapshot;
  private appSnapshotAttemptedAt?: number;
  private appRefresh?: Promise<AppMetricsSnapshot | undefined>;
  private queueSnapshot?: QueueTelemetryMetrics;
  private queueSnapshotAttemptedAt?: number;
  private queueRefresh?: Promise<QueueTelemetryMetrics | undefined>;
  private registered = false;

  constructor(
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private telemetryRepository: TelemetryRepository,
    private appMetricsRepository: AppMetricsRepository,
    private jobRepository: JobRepository,
  ) {
    this.logger.setContext(AppMetricsService.name);
  }

  @OnEvent({ name: 'AppBootstrap' })
  onBootstrap() {
    if (this.registered) {
      return;
    }
    this.registered = true;

    switch (this.configRepository.getWorker()) {
      case ImmichWorker.Api: {
        this.registerAppGauges();
        break;
      }
      case ImmichWorker.Microservices: {
        this.registerQueueGauges();
        break;
      }
    }
  }

  private registerAppGauges() {
    this.observeAppGauge('immich.assets.total', (snapshot, result) => {
      for (const item of snapshot.asset.assetsByType) {
        result.observe(item.count, { type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.assets.storage_bytes', (snapshot, result) => {
      for (const item of snapshot.asset.assetsByType) {
        result.observe(item.storageBytes, { type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.users.assets.total', (snapshot, result) => {
      for (const item of snapshot.asset.usersByType) {
        result.observe(item.count, { user_id: item.userId, type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.users.storage_bytes', (snapshot, result) => {
      for (const item of snapshot.asset.usersByType) {
        result.observe(item.storageBytes, { user_id: item.userId, type: item.type.toLowerCase() });
      }
    });
    this.observeAppGauge('immich.search.embedding_coverage_ratio', (snapshot, result) => {
      const { eligibleAssets, embeddedAssets } = snapshot.asset.search;
      result.observe(eligibleAssets === 0 ? 1 : embeddedAssets / eligibleAssets);
    });
    this.observeAppGauge('immich.faces.total', (snapshot, result) => result.observe(snapshot.person.faces));
    this.observeAppGauge('immich.people.total', (snapshot, result) => result.observe(snapshot.person.people));
    this.observeAppGauge('immich.assets.trash.total', (snapshot, result) =>
      result.observe(snapshot.asset.state.trashAssets),
    );
    this.observeAppGauge('immich.assets.external.total', (snapshot, result) =>
      result.observe(snapshot.asset.state.externalAssets),
    );
  }

  private registerQueueGauges() {
    this.observeQueueGauge('immich.queues.jobs', (snapshot, result) => {
      for (const item of snapshot.counts) {
        result.observe(item.count, { queue: item.queue, status: item.status });
      }
    });
    this.observeQueueGauge('immich.queues.oldest_job_age_seconds', (snapshot, result) => {
      for (const item of snapshot.oldestJobAges) {
        result.observe(item.ageSeconds, { queue: item.queue, status: item.status });
      }
    });
  }

  private observeAppGauge(
    name: string,
    observeSnapshot: (snapshot: AppMetricsSnapshot, result: ObservableResult) => void,
  ) {
    const callback: ObservableCallback = async (result) => {
      const snapshot = await this.getAppSnapshot();
      if (snapshot) {
        observeSnapshot(snapshot, result);
      }
    };
    this.telemetryRepository.app.observeGauge(name, callback);
  }

  private observeQueueGauge(
    name: string,
    observeSnapshot: (snapshot: QueueTelemetryMetrics, result: ObservableResult) => void,
  ) {
    const callback: ObservableCallback = async (result) => {
      const snapshot = await this.getQueueSnapshot();
      if (snapshot) {
        observeSnapshot(snapshot, result);
      }
    };
    this.telemetryRepository.jobs.observeGauge(name, callback);
  }

  private async getAppSnapshot(): Promise<AppMetricsSnapshot | undefined> {
    if (this.appSnapshotAttemptedAt !== undefined && Date.now() - this.appSnapshotAttemptedAt < SNAPSHOT_TTL_MS) {
      return this.appSnapshot;
    }
    this.appRefresh ??= this.refreshAppSnapshot();
    try {
      return await this.appRefresh;
    } finally {
      this.appRefresh = undefined;
    }
  }

  private async refreshAppSnapshot(): Promise<AppMetricsSnapshot | undefined> {
    try {
      this.appSnapshot = await this.appMetricsRepository.getMetrics();
    } catch (error: Error | unknown) {
      this.logger.warn(`Unable to refresh app metrics snapshot: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.appSnapshotAttemptedAt = Date.now();
    }
    return this.appSnapshot;
  }

  private async getQueueSnapshot(): Promise<QueueTelemetryMetrics | undefined> {
    if (this.queueSnapshotAttemptedAt !== undefined && Date.now() - this.queueSnapshotAttemptedAt < SNAPSHOT_TTL_MS) {
      return this.queueSnapshot;
    }
    this.queueRefresh ??= this.refreshQueueSnapshot();
    try {
      return await this.queueRefresh;
    } finally {
      this.queueRefresh = undefined;
    }
  }

  private async refreshQueueSnapshot(): Promise<QueueTelemetryMetrics | undefined> {
    try {
      this.queueSnapshot = await this.jobRepository.getTelemetryMetrics();
    } catch (error: Error | unknown) {
      this.logger.warn(`Unable to refresh queue metrics snapshot: ${error instanceof Error ? error.message : error}`);
    } finally {
      this.queueSnapshotAttemptedAt = Date.now();
    }
    return this.queueSnapshot;
  }
}
```

- [ ] **Step 6: Add `AppMetricsService` to service registration**

In `server/src/services/index.ts`, import and register it:

```typescript
import { AppMetricsService } from 'src/services/app-metrics.service';
```

Place `AppMetricsService` in `services` near `ApiService`:

```typescript
ApiService,
AppMetricsService,
AssetMediaService,
```

- [ ] **Step 7: Expand `AppMetricsService` tests for labels/cache/failure**

Add these tests to `server/src/services/app-metrics.service.spec.ts`:

```typescript
it('observes app metrics with user_id labels only', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
  mocks.appMetrics.getMetrics.mockResolvedValue({
    asset: {
      assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
      usersByType: [{ userId: 'user-1', type: AssetType.Image, count: 2, storageBytes: 400 }],
      search: { eligibleAssets: 4, embeddedAssets: 3 },
      state: { trashAssets: 1, externalAssets: 1 },
    },
    person: { faces: 8, people: 2 },
  });

  sut.onBootstrap();
  const observed = await observe(appCallbacks.get('immich.users.storage_bytes')!);

  expect(observed).toHaveBeenCalledWith(400, { user_id: 'user-1', type: 'image' });
  expect(JSON.stringify(observed.mock.calls)).not.toContain('userName');
  expect(JSON.stringify(observed.mock.calls)).not.toContain('email');
});

it('serves the cached app snapshot inside the ttl', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
  mocks.appMetrics.getMetrics
    .mockResolvedValueOnce({
      asset: {
        assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
        usersByType: [],
        search: { eligibleAssets: 4, embeddedAssets: 3 },
        state: { trashAssets: 1, externalAssets: 1 },
      },
      person: { faces: 8, people: 2 },
    })
    .mockResolvedValueOnce({
      asset: {
        assetsByType: [{ type: AssetType.Image, count: 9, storageBytes: 900 }],
        usersByType: [],
        search: { eligibleAssets: 9, embeddedAssets: 9 },
        state: { trashAssets: 0, externalAssets: 0 },
      },
      person: { faces: 9, people: 3 },
    });
  vi.useFakeTimers();

  sut.onBootstrap();
  await observe(appCallbacks.get('immich.assets.total')!);
  const observed = await observe(appCallbacks.get('immich.assets.total')!);

  expect(mocks.appMetrics.getMetrics).toHaveBeenCalledTimes(1);
  expect(observed).toHaveBeenCalledWith(2, { type: 'image' });
  vi.useRealTimers();
});

it('keeps the previous app snapshot when refresh fails', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
  mocks.appMetrics.getMetrics
    .mockResolvedValueOnce({
      asset: {
        assetsByType: [{ type: AssetType.Image, count: 2, storageBytes: 400 }],
        usersByType: [],
        search: { eligibleAssets: 4, embeddedAssets: 3 },
        state: { trashAssets: 1, externalAssets: 1 },
      },
      person: { faces: 8, people: 2 },
    })
    .mockRejectedValueOnce(new Error('database down'));
  vi.useFakeTimers();

  sut.onBootstrap();
  await observe(appCallbacks.get('immich.assets.total')!);
  vi.advanceTimersByTime(61_000);
  const observed = await observe(appCallbacks.get('immich.assets.total')!);

  expect(observed).toHaveBeenCalledWith(2, { type: 'image' });
  vi.useRealTimers();
});

it('omits app metric series when the first refresh fails', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
  mocks.appMetrics.getMetrics.mockRejectedValue(new Error('database down'));

  sut.onBootstrap();
  const observed = await observe(appCallbacks.get('immich.assets.total')!);

  expect(observed).not.toHaveBeenCalled();
  expect(mocks.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Unable to refresh app metrics snapshot'));
});

it('throttles first-refresh failures inside the ttl', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Api);
  mocks.appMetrics.getMetrics.mockRejectedValue(new Error('database down'));
  vi.useFakeTimers();

  sut.onBootstrap();
  await observe(appCallbacks.get('immich.assets.total')!);
  const observed = await observe(appCallbacks.get('immich.assets.total')!);

  expect(observed).not.toHaveBeenCalled();
  expect(mocks.appMetrics.getMetrics).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});

it('observes queue counts and oldest job age', async () => {
  mocks.config.getWorker.mockReturnValue(ImmichWorker.Microservices);
  mocks.job.getTelemetryMetrics.mockResolvedValue({
    counts: [{ queue: QueueName.ThumbnailGeneration, status: 'waiting', count: 5 }],
    oldestJobAges: [{ queue: QueueName.ThumbnailGeneration, status: 'waiting', ageSeconds: 120 }],
  });

  sut.onBootstrap();
  const counts = await observe(jobCallbacks.get('immich.queues.jobs')!);
  const ages = await observe(jobCallbacks.get('immich.queues.oldest_job_age_seconds')!);

  expect(counts).toHaveBeenCalledWith(5, { queue: QueueName.ThumbnailGeneration, status: 'waiting' });
  expect(ages).toHaveBeenCalledWith(120, { queue: QueueName.ThumbnailGeneration, status: 'waiting' });
});
```

- [ ] **Step 8: Run app metrics tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/services/app-metrics.service.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Run focused server unit tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/config.repository.spec.ts src/repositories/job.repository.spec.ts src/repositories/telemetry.repository.spec.ts src/services/app-metrics.service.spec.ts src/services/telemetry.service.spec.ts
```

Expected: PASS.

- [ ] **Step 10: Commit Task 3**

Run:

```bash
git add server/src/repositories/job.repository.ts server/src/repositories/job.repository.spec.ts server/test/repositories/job.repository.mock.ts server/src/services/app-metrics.service.ts server/src/services/app-metrics.service.spec.ts server/src/services/index.ts
git commit -m "feat(server): publish prometheus app metrics"
```

## Task 4: Machine Learning Prometheus Metrics

**Files:**

- Modify: `machine-learning/pyproject.toml`
- Modify: `machine-learning/uv.lock`
- Add: `machine-learning/immich_ml/metrics.py`
- Modify: `machine-learning/immich_ml/main.py`
- Modify: `machine-learning/test_main.py`

- [ ] **Step 1: Add `prometheus-client` dependency**

In `machine-learning/pyproject.toml`, add to `[project].dependencies`:

```toml
"prometheus-client>=0.21.0,<1.0",
```

Run:

```bash
cd machine-learning && uv lock
```

Expected: `machine-learning/uv.lock` updates with `prometheus-client`.

- [ ] **Step 2: Write failing ML metrics tests**

Append this test class to `machine-learning/test_main.py`:

```python
class TestPrometheusMetrics:
    def test_metrics_endpoint_returns_prometheus_text(self, deployed_app: TestClient) -> None:
        from immich_ml.metrics import reset_metrics_for_tests

        reset_metrics_for_tests()
        response = deployed_app.get("/metrics")

        assert response.status_code == 200
        assert "text/plain" in response.headers["content-type"]
        assert "immich_ml_active_requests" in response.text

    def test_predict_records_success_metrics(self, deployed_app: TestClient, mocker: MockerFixture) -> None:
        from immich_ml.metrics import reset_metrics_for_tests

        reset_metrics_for_tests()
        mocker.patch("immich_ml.main.run_inference", new_callable=mock.AsyncMock, return_value={"clip": "embedding"})
        entries = {"clip": {"textual": {"modelName": "ViT-B-32__openai"}}}

        response = deployed_app.post("/predict", data={"entries": orjson.dumps(entries).decode(), "text": "hello"})
        metrics = deployed_app.get("/metrics").text

        assert response.status_code == 200
        assert 'immich_ml_requests_total{status="success",task="clip",type="textual"} 1.0' in metrics
        assert 'immich_ml_request_duration_ms_count{status="success",task="clip",type="textual"} 1.0' in metrics
        assert "immich_ml_active_requests 0.0" in metrics

    def test_predict_records_validation_failure_with_unknown_labels(self, deployed_app: TestClient) -> None:
        from immich_ml.metrics import reset_metrics_for_tests

        reset_metrics_for_tests()

        response = deployed_app.post("/predict", data={"entries": "{", "text": "hello"})
        metrics = deployed_app.get("/metrics").text

        assert response.status_code == 422
        assert 'immich_ml_requests_total{status="validation_error",task="unknown",type="unknown"} 1.0' in metrics

    @pytest.mark.asyncio
    async def test_model_load_records_success_and_retry_metrics(self, deployed_app: TestClient) -> None:
        from immich_ml.metrics import reset_metrics_for_tests

        reset_metrics_for_tests()
        mock_model = mock.Mock(spec=InferenceModel)
        mock_model.model_name = "test_model_name"
        mock_model.model_type = ModelType.VISUAL
        mock_model.model_task = ModelTask.SEARCH
        mock_model.load.side_effect = [OSError, None]
        mock_model.loaded = False
        mock_model.load_attempts = 0

        await load(mock_model)
        metrics = deployed_app.get("/metrics").text

        assert 'immich_ml_model_load_duration_ms_count{status="error",task="clip",type="visual"} 1.0' in metrics
        assert 'immich_ml_model_load_duration_ms_count{status="success",task="clip",type="visual"} 1.0' in metrics
```

- [ ] **Step 3: Run ML metrics tests and verify they fail**

Run:

```bash
cd machine-learning && uv run pytest test_main.py -k PrometheusMetrics -q
```

Expected: FAIL because `immich_ml.metrics` and `/metrics` do not exist.

- [ ] **Step 4: Add the ML metrics module**

Create `machine-learning/immich_ml/metrics.py`:

```python
from __future__ import annotations

import time
from collections.abc import Iterable

from prometheus_client import CollectorRegistry, Counter, Gauge, Histogram, generate_latest

from .schemas import InferenceEntries, ModelTask, ModelType

registry = CollectorRegistry()

REQUESTS = Counter(
    "immich_ml_requests_total",
    "Machine-learning prediction requests.",
    ["task", "type", "status"],
    registry=registry,
)

REQUEST_DURATION = Histogram(
    "immich_ml_request_duration_ms",
    "Machine-learning prediction request duration in milliseconds.",
    ["task", "type", "status"],
    buckets=(10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, float("inf")),
    registry=registry,
)

ACTIVE_REQUESTS = Gauge(
    "immich_ml_active_requests",
    "In-flight machine-learning prediction requests.",
    registry=registry,
)

MODEL_CACHE_ENTRIES = Gauge(
    "immich_ml_model_cache_entries",
    "Machine-learning model cache entries.",
    ["task", "type"],
    registry=registry,
)

MODEL_LOAD_DURATION = Histogram(
    "immich_ml_model_load_duration_ms",
    "Machine-learning model load duration in milliseconds.",
    ["task", "type", "status"],
    buckets=(10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 30000, float("inf")),
    registry=registry,
)


def labels_from_entries(entries: InferenceEntries) -> list[tuple[str, str]]:
    without_deps, with_deps = entries
    labels: list[tuple[str, str]] = []
    for entry in [*without_deps, *with_deps]:
        task = entry["task"].value if isinstance(entry["task"], ModelTask) else str(entry["task"])
        model_type = entry["type"].value if isinstance(entry["type"], ModelType) else str(entry["type"])
        labels.append((task, model_type))
    return labels or [("unknown", "unknown")]


def record_predict(labels: Iterable[tuple[str, str]], status: str, started: float) -> None:
    duration_ms = (time.perf_counter() - started) * 1000
    for task, model_type in labels:
        REQUESTS.labels(task=task, type=model_type, status=status).inc()
        REQUEST_DURATION.labels(task=task, type=model_type, status=status).observe(duration_ms)


def record_validation_error(started: float) -> None:
    record_predict([("unknown", "unknown")], "validation_error", started)


def record_model_load(task: str, model_type: str, status: str, started: float) -> None:
    MODEL_LOAD_DURATION.labels(task=task, type=model_type, status=status).observe((time.perf_counter() - started) * 1000)


def set_model_cache_entries(labels: Iterable[tuple[str, str]]) -> None:
    MODEL_CACHE_ENTRIES.clear()
    counts: dict[tuple[str, str], int] = {}
    for label in labels:
        counts[label] = counts.get(label, 0) + 1
    for (task, model_type), count in counts.items():
        MODEL_CACHE_ENTRIES.labels(task=task, type=model_type).set(count)


def render() -> bytes:
    return generate_latest(registry)


def reset_metrics_for_tests() -> None:
    REQUESTS.clear()
    REQUEST_DURATION.clear()
    ACTIVE_REQUESTS.set(0)
    MODEL_CACHE_ENTRIES.clear()
    MODEL_LOAD_DURATION.clear()
```

- [ ] **Step 5: Wire ML metrics into FastAPI**

In `machine-learning/immich_ml/main.py`, add imports:

```python
from fastapi import Depends, FastAPI, File, Form, HTTPException, Response
from prometheus_client import CONTENT_TYPE_LATEST

from . import metrics
```

Update `update_state()`:

```python
def update_state() -> Iterator[None]:
    global active_requests, last_called
    active_requests += 1
    metrics.ACTIVE_REQUESTS.inc()
    last_called = time.time()
    try:
        yield
    finally:
        active_requests -= 1
        metrics.ACTIVE_REQUESTS.dec()
```

Add the endpoint after `/ping`:

```python
@app.get("/metrics")
def prometheus_metrics() -> Response:
    cache_labels = [
        (model.model_task.value, model.model_type.value)
        for model in model_cache.cache._cache.values()
        if isinstance(model, InferenceModel)
    ]
    metrics.set_model_cache_entries(cache_labels)
    return Response(metrics.render(), media_type=CONTENT_TYPE_LATEST)
```

Update `get_entries()` error handling:

```python
def get_entries(entries: str = Form()) -> InferenceEntries:
    started = time.perf_counter()
    try:
        request: PipelineRequest = orjson.loads(entries)
        without_deps: list[InferenceEntry] = []
        with_deps: list[InferenceEntry] = []
        for task, types in request.items():
            for type, entry in types.items():
                parsed: InferenceEntry = {
                    "name": entry["modelName"],
                    "task": task,
                    "type": type,
                    "options": entry.get("options", {}),
                }
                dep = get_model_deps(parsed["name"], type, task)
                (with_deps if dep else without_deps).append(parsed)
        return without_deps, with_deps
    except (orjson.JSONDecodeError, ValidationError, KeyError, AttributeError) as e:
        metrics.record_validation_error(started)
        log.error(f"Invalid request format: {e}")
        raise HTTPException(422, "Invalid request format.")
```

Update `predict()`:

```python
async def predict(
    entries: InferenceEntries = Depends(get_entries),
    image: bytes | None = File(default=None),
    text: str | None = Form(default=None),
) -> Any:
    started = time.perf_counter()
    metric_labels = metrics.labels_from_entries(entries)
    try:
        if image is not None:
            inputs: Image | str = await run(lambda: decode_pil(image))
        elif text is not None:
            inputs = text
        else:
            raise HTTPException(400, "Either image or text must be provided")
        response = await run_inference(inputs, entries)
        metrics.record_predict(metric_labels, "success", started)
        return ORJSONResponse(response)
    except Exception:
        metrics.record_predict(metric_labels, "error", started)
        raise
```

Update `load()` to record model load duration:

```python
async def load(model: InferenceModel) -> InferenceModel:
    if model.loaded:
        return model

    def _load(model: InferenceModel) -> InferenceModel:
        if model.load_attempts > 1:
            raise HTTPException(500, f"Failed to load model '{model.model_name}'")
        with lock:
            try:
                model.load()
            except FileNotFoundError as e:
                if model.model_format == ModelFormat.ONNX:
                    raise e
                log.warning(
                    f"{model.model_format.upper()} is available, but model '{model.model_name}' does not support it.",
                    exc_info=e,
                )
                model.model_format = ModelFormat.ONNX
                model.load()
        return model

    started = time.perf_counter()
    try:
        result = await run(_load, model)
        metrics.record_model_load(model.model_task.value, model.model_type.value, "success", started)
        return result
    except (OSError, InvalidProtobuf, BadZipFile, NoSuchFile):
        metrics.record_model_load(model.model_task.value, model.model_type.value, "error", started)
        log.warning(f"Failed to load {model.model_type.replace('_', ' ')} model '{model.model_name}'. Clearing cache.")
        model.clear_cache()
        retry_started = time.perf_counter()
        try:
            result = await run(_load, model)
            metrics.record_model_load(model.model_task.value, model.model_type.value, "success", retry_started)
            return result
        except Exception:
            metrics.record_model_load(model.model_task.value, model.model_type.value, "error", retry_started)
            raise
```

Preserve the existing retry behavior in `load()` while adding timing. If a retry succeeds after clearing cache, record `status="error"` for the failed load attempt and add a second `status="success"` observation around the retry.

- [ ] **Step 6: Run ML metrics tests**

Run:

```bash
cd machine-learning && uv run pytest test_main.py -k PrometheusMetrics -q
```

Expected: PASS.

- [ ] **Step 7: Run ML lint for touched files**

Run:

```bash
cd machine-learning && uv run ruff check immich_ml/main.py immich_ml/metrics.py test_main.py
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

Run:

```bash
git add machine-learning/pyproject.toml machine-learning/uv.lock machine-learning/immich_ml/metrics.py machine-learning/immich_ml/main.py machine-learning/test_main.py
git commit -m "feat(ml): expose prometheus metrics"
```

## Task 5: Prometheus Config, Grafana Dashboard, And Docs

**Files:**

- Modify: `docker/prometheus.yml`
- Add: `docker/grafana-dashboard.json`
- Modify: `docs/docs/features/monitoring.md`
- Modify: `docs/docs/install/environment-variables.md`

- [ ] **Step 1: Update Prometheus scrape config**

Modify `docker/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: immich_api
    static_configs:
      - targets: ['immich-server:8081']

  - job_name: immich_microservices
    static_configs:
      - targets: ['immich-server:8082']

  - job_name: immich_machine_learning
    metrics_path: /metrics
    static_configs:
      - targets: ['immich-machine-learning:3003']
```

- [ ] **Step 2: Add a valid dashboard JSON**

Create `docker/grafana-dashboard.json` with this structure, then add one panel for every expression listed below before committing:

```json
{
  "annotations": { "list": [] },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 0,
  "links": [],
  "panels": [
    {
      "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
      "fieldConfig": { "defaults": { "unit": "short" }, "overrides": [] },
      "gridPos": { "h": 4, "w": 6, "x": 0, "y": 0 },
      "id": 1,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
        "textMode": "auto",
        "wideLayout": true
      },
      "targets": [{ "expr": "sum(immich_assets_total)", "refId": "A" }],
      "title": "Assets",
      "type": "stat"
    },
    {
      "datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" },
      "fieldConfig": { "defaults": { "unit": "bytes" }, "overrides": [] },
      "gridPos": { "h": 4, "w": 6, "x": 6, "y": 0 },
      "id": 2,
      "options": {
        "colorMode": "value",
        "graphMode": "area",
        "justifyMode": "auto",
        "orientation": "auto",
        "reduceOptions": { "calcs": ["lastNotNull"], "fields": "", "values": false },
        "textMode": "auto",
        "wideLayout": true
      },
      "targets": [{ "expr": "sum(immich_assets_storage_bytes)", "refId": "A" }],
      "title": "Storage",
      "type": "stat"
    }
  ],
  "refresh": "30s",
  "schemaVersion": 39,
  "tags": ["gallery", "immich", "prometheus"],
  "templating": {
    "list": [
      {
        "current": {},
        "hide": 0,
        "includeAll": false,
        "label": "Prometheus",
        "name": "DS_PROMETHEUS",
        "options": [],
        "query": "prometheus",
        "refresh": 1,
        "regex": "",
        "type": "datasource"
      }
    ]
  },
  "time": { "from": "now-6h", "to": "now" },
  "timezone": "browser",
  "title": "Gallery Monitoring",
  "uid": "gallery-monitoring",
  "version": 1,
  "weekStart": ""
}
```

Add these additional panels in the same file before committing:

```text
Storage by type: sum by (type) (immich_assets_storage_bytes)
Per-user storage: topk(10, sum by (user_id) (immich_users_storage_bytes))
Assets by type: sum by (type) (immich_assets_total)
Users: immich_users_total
Embedding coverage: immich_search_embedding_coverage_ratio
Queue depth: sum by (queue, status) (immich_queues_jobs)
Oldest stale jobs: max by (queue, status) (immich_queues_oldest_job_age_seconds)
Active ML requests: immich_ml_active_requests
ML request rate: sum by (task, type, status) (rate(immich_ml_requests_total[5m]))
ML p95 latency: histogram_quantile(0.95, sum by (le, task, type) (rate(immich_ml_request_duration_ms_bucket[5m])))
Model cache entries: sum by (task, type) (immich_ml_model_cache_entries)
Faces and people: immich_faces_total, immich_people_total
```

Use Prometheus-exported underscore names in dashboard expressions.

- [ ] **Step 3: Validate dashboard JSON and required expressions**

Run:

```bash
jq empty docker/grafana-dashboard.json
for expr in \
  'sum(immich_assets_total)' \
  'sum(immich_assets_storage_bytes)' \
  'sum by (type) (immich_assets_storage_bytes)' \
  'topk(10, sum by (user_id) (immich_users_storage_bytes))' \
  'sum by (type) (immich_assets_total)' \
  'immich_users_total' \
  'immich_search_embedding_coverage_ratio' \
  'sum by (queue, status) (immich_queues_jobs)' \
  'max by (queue, status) (immich_queues_oldest_job_age_seconds)' \
  'immich_ml_active_requests' \
  'sum by (task, type, status) (rate(immich_ml_requests_total[5m]))' \
  'histogram_quantile(0.95, sum by (le, task, type) (rate(immich_ml_request_duration_ms_bucket[5m])))' \
  'sum by (task, type) (immich_ml_model_cache_entries)' \
  'immich_faces_total' \
  'immich_people_total'; do
  jq -e --arg expr "$expr" '[.. | objects | .expr? // empty] | index($expr)' docker/grafana-dashboard.json >/dev/null
done
```

Expected: no output and exit code 0 for every command.

- [ ] **Step 4: Update monitoring docs**

In `docs/docs/features/monitoring.md`, update the metrics section to include:

```markdown
### Phase 1 Gallery Metrics

Gallery adds a small set of application metrics on top of the standard OpenTelemetry metrics:

- Asset counts and storage by type.
- Per-user asset and storage metrics labeled by `user_id` only.
- Smart-search embedding coverage.
- Face and person totals.
- Trash and external-library totals.
- Queue counts and oldest waiting, delayed, and failed job age.
- Machine-learning request counts, latency histograms, active requests, model cache entries, and model load latency.

Per-user metrics intentionally use `user_id` only. Names, emails, filenames, paths, search text, IP addresses, and request payloads are not exported as labels.
```

Update the Prometheus example to mention the ML target:

```yaml
- job_name: immich_machine_learning
  metrics_path: /metrics
  static_configs:
    - targets: ['immich-machine-learning:3003']
```

Add a Grafana import note:

```markdown
Gallery ships a starter dashboard at `docker/grafana-dashboard.json`. In Grafana, open **Dashboards > New > Import**, upload the JSON file, and select your Prometheus data source.
```

Add a deferred-scope paragraph:

```markdown
Phase 1 does not add auth/IP metrics, upload throughput, face/CLIP score distributions, duplicate metrics, video transcode quality metrics, DB bloat metrics, geocoding/OCR coverage, new memory metrics, cache hit/miss internals, or custom CPU/memory/GPU/network metrics beyond existing host and infrastructure exporters. Those need separate product and privacy decisions.
```

- [ ] **Step 5: Update environment variable docs**

In `docs/docs/install/environment-variables.md`, update the Prometheus telemetry rows so `app` is included:

```markdown
| `IMMICH_TELEMETRY_INCLUDE` | Collect these telemetries. List of `host`, `api`, `app`, `io`, `repo`, `job`. Note: You can also specify `all` to enable all | | server | api, microservices |
| `IMMICH_TELEMETRY_EXCLUDE` | Do not collect these telemetries. List of `host`, `api`, `app`, `io`, `repo`, `job` | | server | api, microservices |
```

- [ ] **Step 6: Run docs formatting**

Run:

```bash
pnpm --dir docs exec prettier --check docs/features/monitoring.md docs/install/environment-variables.md ../docker/prometheus.yml ../docker/grafana-dashboard.json
```

Expected: PASS. If it fails, run the same command with `--write`, then re-run `--check`.

- [ ] **Step 7: Commit Task 5**

Run:

```bash
git add docker/prometheus.yml docker/grafana-dashboard.json docs/docs/features/monitoring.md docs/docs/install/environment-variables.md
git commit -m "docs: add prometheus dashboard"
```

## Task 6: Final Verification

**Files:**

- Verify all files changed by Tasks 1-5.

- [ ] **Step 1: Run focused server unit tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.mjs --run src/repositories/config.repository.spec.ts src/repositories/job.repository.spec.ts src/repositories/telemetry.repository.spec.ts src/services/app-metrics.service.spec.ts src/services/telemetry.service.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run focused server medium repository tests**

Run:

```bash
pnpm --dir server exec vitest --config test/vitest.config.medium.mjs --run test/medium/specs/repositories/app-metrics.repository.spec.ts
```

Expected: PASS. If the medium test database is unavailable, stop and bring up the repo's medium-test database before continuing.

- [ ] **Step 3: Run server type check**

Run:

```bash
pnpm --dir server check
```

Expected: PASS.

- [ ] **Step 4: Run ML metrics tests and lint**

Run:

```bash
cd machine-learning && uv run pytest test_main.py -k PrometheusMetrics -q
cd machine-learning && uv run ruff check immich_ml/main.py immich_ml/metrics.py test_main.py
```

Expected: PASS for both commands.

- [ ] **Step 5: Validate dashboard JSON and docs formatting**

Run:

```bash
jq empty docker/grafana-dashboard.json
for expr in \
  'sum(immich_assets_total)' \
  'sum(immich_assets_storage_bytes)' \
  'sum by (type) (immich_assets_storage_bytes)' \
  'topk(10, sum by (user_id) (immich_users_storage_bytes))' \
  'sum by (type) (immich_assets_total)' \
  'immich_users_total' \
  'immich_search_embedding_coverage_ratio' \
  'sum by (queue, status) (immich_queues_jobs)' \
  'max by (queue, status) (immich_queues_oldest_job_age_seconds)' \
  'immich_ml_active_requests' \
  'sum by (task, type, status) (rate(immich_ml_requests_total[5m]))' \
  'histogram_quantile(0.95, sum by (le, task, type) (rate(immich_ml_request_duration_ms_bucket[5m])))' \
  'sum by (task, type) (immich_ml_model_cache_entries)' \
  'immich_faces_total' \
  'immich_people_total'; do
  jq -e --arg expr "$expr" '[.. | objects | .expr? // empty] | index($expr)' docker/grafana-dashboard.json >/dev/null
done
pnpm --dir docs exec prettier --check docs/features/monitoring.md docs/install/environment-variables.md ../docker/prometheus.yml ../docker/grafana-dashboard.json
```

Expected: PASS.

- [ ] **Step 6: Run final status check**

Run:

```bash
git status --short --branch
git log --oneline origin/main..HEAD
```

Expected: branch is ahead with the design commit plus implementation commits, and no unstaged changes remain.
