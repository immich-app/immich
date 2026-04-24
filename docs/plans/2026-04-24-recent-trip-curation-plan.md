# Recent Trip Memory Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curate `recent_trip` memories down to a tighter `6-8` photo recap for most trips, up to `10` for longer trips, while collapsing burst-adjacent shots and preserving chronological trip coverage.

**Architecture:** Keep trip detection in `RecentTripMemoryRule` unchanged and add a deterministic curation pass after the winning location cluster has been selected. Expand the location asset query to return `localDateTime` and the full trip pool, then preserve the curated chronology through `MemoryRepository` readback by ordering memory assets on `localDateTime` instead of `fileCreatedAt`.

**Tech Stack:** NestJS, Luxon, Vitest, medium Vitest integration tests, Kysely, generated SQL snapshots.

---

## File map

- Modify: `server/src/services/memory-rules/recent-trip.rule.ts`
  Add burst collapse, adaptive target sizing, day-coverage selection, and chronological curation helpers.
- Modify: `server/src/services/memory-rules/recent-trip.rule.spec.ts`
  Add rule-level curation coverage and update existing mocks to return `localDateTime`.
- Modify: `server/src/repositories/asset.repository.ts`
  Return `MemoryAsset` rows from `getMemoryAssetsForLocation(...)` and remove the raw `limit 20` cap.
- Regenerate: `server/src/queries/asset.repository.sql`
  Snapshot the repository query change after rebuilding the server.
- Modify: `server/src/repositories/memory.repository.ts`
  Order memory asset readback by `asset.localDateTime asc` instead of `asset.fileCreatedAt asc`.
- Modify: `server/test/medium/specs/services/memory.service.spec.ts`
  Add a real-DB regression for curated recent-trip output and readback order.
- Regenerate: `server/src/queries/memory.repository.sql`
  Snapshot the memory repository ordering change after rebuilding the server.

## Preconditions

- Work from `/home/pierre/dev/gallery/.worktrees/memories-trip-curation`.
- Keep the birthday PR branch and worktree untouched.
- Build the server before running `pnpm --dir server sync:sql`, because `sync:sql` uses `dist/bin/sync-sql.js`.
- Do not change web code, mobile code, DTO shapes, or trip qualification thresholds.

## Task 1: Add Rule-Level Trip Curation

**Files:**

- Modify: `server/src/services/memory-rules/recent-trip.rule.spec.ts`
- Modify: `server/src/services/memory-rules/recent-trip.rule.ts`
- Modify: `server/src/repositories/asset.repository.ts`
- Regenerate: `server/src/queries/asset.repository.sql`

- [ ] **Step 1: Write the failing rule tests**

Add a local helper near the top of `server/src/services/memory-rules/recent-trip.rule.spec.ts` so all trip asset mocks include timestamps:

```ts
const makeAsset = (id: string, localDateTime: string) => ({
  id,
  localDateTime: new Date(localDateTime),
});
```

Update the existing `getMemoryAssetsForLocation` mocks to use `makeAsset(...)` instead of `{ id: 'asset-1' }`, then append these focused curation tests:

```ts
it('curates a burst-heavy trip down to seven chronological assets', async () => {
  const assetRepository = {
    getMemoryLocationClusters: vi
      .fn()
      .mockResolvedValueOnce([
        {
          country: 'Germany',
          city: 'Berlin',
          assetCount: 20,
          dayCount: 12,
          firstDate: new Date('2026-01-01T00:00:00Z'),
          lastDate: new Date('2026-03-20T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          country: 'France',
          city: 'Paris',
          assetCount: 12,
          dayCount: 3,
          firstDate: new Date('2026-04-15T00:00:00Z'),
          lastDate: new Date('2026-04-17T00:00:00Z'),
        },
      ]),
    getMemoryAssetsForLocation: vi
      .fn()
      .mockResolvedValue([
        makeAsset('a-1', '2026-04-15T10:00:00Z'),
        makeAsset('a-2', '2026-04-15T10:01:00Z'),
        makeAsset('a-3', '2026-04-15T10:05:00Z'),
        makeAsset('a-4', '2026-04-15T10:06:00Z'),
        makeAsset('a-5', '2026-04-15T12:00:00Z'),
        makeAsset('a-6', '2026-04-16T09:00:00Z'),
        makeAsset('a-7', '2026-04-16T09:01:00Z'),
        makeAsset('a-8', '2026-04-16T15:00:00Z'),
        makeAsset('a-9', '2026-04-17T08:00:00Z'),
        makeAsset('a-10', '2026-04-17T08:01:00Z'),
        makeAsset('a-11', '2026-04-17T13:00:00Z'),
        makeAsset('a-12', '2026-04-17T17:00:00Z'),
      ]),
  };
  const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

  const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
  const [candidate] = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
  });

  expect(candidate).toMatchObject({
    title: 'Recent trip to Paris, France',
    subtitle: '12 photos over 3 days',
    assetIds: ['a-1', 'a-3', 'a-5', 'a-6', 'a-9', 'a-11', 'a-12'],
  });
});

it('collapses adjacent assets inside the two-minute burst window', async () => {
  const assetRepository = {
    getMemoryLocationClusters: vi
      .fn()
      .mockResolvedValueOnce([
        {
          country: 'Germany',
          city: 'Berlin',
          assetCount: 20,
          dayCount: 12,
          firstDate: new Date('2026-01-01T00:00:00Z'),
          lastDate: new Date('2026-03-20T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          country: 'France',
          city: 'Paris',
          assetCount: 8,
          dayCount: 2,
          firstDate: new Date('2026-04-15T00:00:00Z'),
          lastDate: new Date('2026-04-16T00:00:00Z'),
        },
      ]),
    getMemoryAssetsForLocation: vi
      .fn()
      .mockResolvedValue([
        makeAsset('a-1', '2026-04-15T10:00:00Z'),
        makeAsset('a-2', '2026-04-15T10:01:00Z'),
        makeAsset('a-3', '2026-04-15T10:03:00Z'),
        makeAsset('a-4', '2026-04-15T10:06:00Z'),
        makeAsset('a-5', '2026-04-16T09:00:00Z'),
        makeAsset('a-6', '2026-04-16T09:01:00Z'),
        makeAsset('a-7', '2026-04-16T13:00:00Z'),
      ]),
  };
  const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

  const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
  const [candidate] = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
  });

  expect(candidate?.assetIds).toEqual(['a-1', 'a-4', 'a-5', 'a-7']);
});

it('keeps a small well-spaced representative pool intact', async () => {
  const assetRepository = {
    getMemoryLocationClusters: vi
      .fn()
      .mockResolvedValueOnce([
        {
          country: 'Germany',
          city: 'Berlin',
          assetCount: 20,
          dayCount: 12,
          firstDate: new Date('2026-01-01T00:00:00Z'),
          lastDate: new Date('2026-03-20T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          country: 'France',
          city: 'Paris',
          assetCount: 9,
          dayCount: 2,
          firstDate: new Date('2026-04-15T00:00:00Z'),
          lastDate: new Date('2026-04-16T00:00:00Z'),
        },
      ]),
    getMemoryAssetsForLocation: vi
      .fn()
      .mockResolvedValue([
        makeAsset('a-1', '2026-04-15T08:00:00Z'),
        makeAsset('a-2', '2026-04-15T10:30:00Z'),
        makeAsset('a-3', '2026-04-15T14:00:00Z'),
        makeAsset('a-4', '2026-04-16T09:00:00Z'),
        makeAsset('a-5', '2026-04-16T12:00:00Z'),
        makeAsset('a-6', '2026-04-16T18:00:00Z'),
      ]),
  };
  const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

  const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
  const [candidate] = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
  });

  expect(candidate?.assetIds).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-6']);
});

it('caps a long trip at ten assets while preserving the trip endpoints', async () => {
  const assetRepository = {
    getMemoryLocationClusters: vi
      .fn()
      .mockResolvedValueOnce([
        {
          country: 'Germany',
          city: 'Berlin',
          assetCount: 20,
          dayCount: 12,
          firstDate: new Date('2026-01-01T00:00:00Z'),
          lastDate: new Date('2026-03-20T00:00:00Z'),
        },
      ])
      .mockResolvedValueOnce([
        {
          country: 'France',
          city: 'Paris',
          assetCount: 21,
          dayCount: 11,
          firstDate: new Date('2026-04-01T00:00:00Z'),
          lastDate: new Date('2026-04-11T00:00:00Z'),
        },
      ]),
    getMemoryAssetsForLocation: vi
      .fn()
      .mockResolvedValue([
        makeAsset('a-1', '2026-04-01T09:00:00Z'),
        makeAsset('a-2', '2026-04-02T09:00:00Z'),
        makeAsset('a-3', '2026-04-03T09:00:00Z'),
        makeAsset('a-4', '2026-04-04T09:00:00Z'),
        makeAsset('a-5', '2026-04-05T09:00:00Z'),
        makeAsset('a-6', '2026-04-06T09:00:00Z'),
        makeAsset('a-7', '2026-04-07T09:00:00Z'),
        makeAsset('a-8', '2026-04-08T09:00:00Z'),
        makeAsset('a-9', '2026-04-09T09:00:00Z'),
        makeAsset('a-10', '2026-04-10T09:00:00Z'),
        makeAsset('a-11', '2026-04-11T09:00:00Z'),
      ]),
  };
  const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

  const rule = new RecentTripMemoryRule(assetRepository as never, memoryRepository as never);
  const [candidate] = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
  });

  expect(candidate?.assetIds).toEqual(['a-1', 'a-2', 'a-3', 'a-4', 'a-5', 'a-7', 'a-8', 'a-9', 'a-10', 'a-11']);
});
```

- [ ] **Step 2: Run the rule spec to verify it fails**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/recent-trip.rule.spec.ts
```

Expected:

- the new curation tests fail because the rule still returns the raw asset IDs
- the long-trip test fails because the rule does not cap output at `10`

- [ ] **Step 3: Implement the curation helpers and widen the repository contract**

Update `server/src/services/memory-rules/recent-trip.rule.ts` to import `MemoryAsset` and route the selected trip pool through a curation helper:

```ts
import { AssetRepository, MemoryAsset, MemoryLocationCluster } from 'src/repositories/asset.repository';

export class RecentTripMemoryRule implements MemoryRule {
  readonly id = 'recent_trip';
  private static readonly HOME_DOMINANCE_RATIO = 1.25;
  private static readonly BURST_WINDOW_MS = 2 * 60 * 1000;
  private static readonly SMALL_TRIP_MAX = 6;

  // constructor unchanged

  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    // existing detection code unchanged

    const locationAssets = await this.assetRepository.getMemoryAssetsForLocation(ownerId, {
      country: candidate.country,
      city: candidate.city,
      takenAfter: recentFrom.toJSDate(),
      takenBefore: target.endOf('day').toJSDate(),
    });
    const assetIds = this.curateTripAssets(locationAssets);

    // candidate construction unchanged except assetIds now comes from curateTripAssets(...)
  }

  private curateTripAssets(assets: MemoryAsset[]): string[] {
    const representatives = this.collapseBurstAssets(assets);
    if (representatives.length <= RecentTripMemoryRule.SMALL_TRIP_MAX) {
      return representatives.map(({ id }) => id);
    }

    const dayBuckets = this.groupAssetsByDay(representatives);
    const targetSize = this.getTripTargetSize(dayBuckets.length, representatives.length);
    const selected = this.pickDayCoverage(dayBuckets, targetSize);
    const selectedIds = new Set(selected.map(({ id }) => id));

    if (selected.length < targetSize) {
      const remaining = representatives.filter(({ id }) => !selectedIds.has(id));
      selected.push(...this.pickEvenlySpaced(remaining, targetSize - selected.length));
    }

    return selected
      .toSorted((left, right) => left.localDateTime.getTime() - right.localDateTime.getTime())
      .map(({ id }) => id);
  }

  private collapseBurstAssets(assets: MemoryAsset[]): MemoryAsset[] {
    const representatives: MemoryAsset[] = [];
    let previous: MemoryAsset | undefined;

    for (const asset of assets) {
      if (
        !previous ||
        asset.localDateTime.getTime() - previous.localDateTime.getTime() > RecentTripMemoryRule.BURST_WINDOW_MS
      ) {
        representatives.push(asset);
      }
      previous = asset;
    }

    return representatives;
  }

  private groupAssetsByDay(assets: MemoryAsset[]): MemoryAsset[][] {
    const byDay = new Map<string, MemoryAsset[]>();

    for (const asset of assets) {
      const dayKey = DateTime.fromJSDate(asset.localDateTime, { zone: 'utc' }).toISODate()!;
      const dayAssets = byDay.get(dayKey) ?? [];
      dayAssets.push(asset);
      byDay.set(dayKey, dayAssets);
    }

    return [...byDay.values()];
  }

  private getTripTargetSize(dayCount: number, representativeCount: number) {
    if (representativeCount <= RecentTripMemoryRule.SMALL_TRIP_MAX) {
      return representativeCount;
    }

    if (dayCount >= 5 || representativeCount >= 18) {
      return 10;
    }

    if (dayCount >= 4 || representativeCount >= 12) {
      return 8;
    }

    return 7;
  }

  private pickDayCoverage(dayBuckets: MemoryAsset[][], targetSize: number): MemoryAsset[] {
    const buckets = dayBuckets.length <= targetSize ? dayBuckets : this.pickEvenlySpaced(dayBuckets, targetSize);
    return buckets.map((assets) => assets[Math.floor((assets.length - 1) / 2)]!);
  }

  private pickEvenlySpaced<T>(items: T[], count: number): T[] {
    if (count <= 0 || items.length === 0) {
      return [];
    }

    if (count >= items.length) {
      return [...items];
    }

    if (count === 1) {
      return [items[Math.floor((items.length - 1) / 2)]!];
    }

    const indexes = Array.from({ length: count }, (_, index) => Math.round((index * (items.length - 1)) / (count - 1)));

    return indexes.map((index) => items[index]!);
  }
}
```

Update `server/src/repositories/asset.repository.ts` so `getMemoryAssetsForLocation(...)` returns `MemoryAsset[]` with timestamps and no raw-pool cap:

```ts
  getMemoryAssetsForLocation(
    ownerId: string,
    {
      country,
      city,
      takenAfter,
      takenBefore,
    }: { country: string; city: string | null; takenAfter: Date; takenBefore: Date },
  ): Promise<MemoryAsset[]> {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.localDateTime'])
      .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
      .where('asset.ownerId', '=', ownerId)
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .where('asset.localDateTime', '>=', takenAfter)
      .where('asset.localDateTime', '<=', takenBefore)
      .where('asset_exif.country', '=', country)
      .$if(city !== null, (qb) => qb.where('asset_exif.city', '=', city))
      .$if(city === null, (qb) => qb.where('asset_exif.city', 'is', null))
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('asset_file')
            .select('asset_file.assetId')
            .whereRef('asset_file.assetId', '=', 'asset.id')
            .where('asset_file.type', '=', AssetFileType.Preview),
        ),
      )
      .orderBy('asset.localDateTime', 'asc')
      .execute();
  }
```

- [ ] **Step 4: Re-run the rule spec**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/recent-trip.rule.spec.ts
```

Expected:

- all `recent-trip.rule.spec.ts` tests pass
- the new burst-heavy test returns exactly `7` curated IDs
- the long-trip test returns exactly `10` curated IDs
- the existing non-home and cooldown behavior remains intact

- [ ] **Step 5: Rebuild and regenerate the asset repository SQL snapshot**

Run:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected:

- `server/src/queries/asset.repository.sql` changes
- the generated query no longer limits `getMemoryAssetsForLocation(...)` to `20`
- the generated query now selects `asset."localDateTime"`

- [ ] **Step 6: Commit the rule and repository curation work**

```bash
git add \
  server/src/services/memory-rules/recent-trip.rule.ts \
  server/src/services/memory-rules/recent-trip.rule.spec.ts \
  server/src/repositories/asset.repository.ts \
  server/src/queries/asset.repository.sql
git commit -m "feat(server): curate recent trip memory assets"
```

## Task 2: Preserve Curated Order Through Memory Readback

**Files:**

- Modify: `server/test/medium/specs/services/memory.service.spec.ts`
- Modify: `server/src/repositories/memory.repository.ts`
- Regenerate: `server/src/queries/memory.repository.sql`

- [ ] **Step 1: Write the failing medium regression**

Append this test after the existing `creates a recent-trip rule memory for a dense non-home cluster` case in `server/test/medium/specs/services/memory.service.spec.ts`:

```ts
it('reads back curated recent-trip assets in chronological localDateTime order', async () => {
  const { sut, ctx } = setup();
  const assetRepo = ctx.get(AssetRepository);
  const memoryRepo = ctx.get(MemoryRepository);
  const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
  const { user } = await ctx.newUser();

  const addTripAsset = async ({
    localDateTime,
    fileCreatedAt,
    city,
    country,
  }: {
    localDateTime: string;
    fileCreatedAt: string;
    city: string;
    country: string;
  }) => {
    const { asset } = await ctx.newAsset({
      ownerId: user.id,
      localDateTime: new Date(localDateTime),
      fileCreatedAt: new Date(fileCreatedAt),
    });
    await Promise.all([
      ctx.newExif({ assetId: asset.id, city, country }),
      ctx.newJobStatus({ assetId: asset.id }),
      assetRepo.upsertFiles([
        { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
        { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
      ]),
    ]);
    return asset.id;
  };

  await addTripAsset({
    localDateTime: '2026-01-15T12:00:00Z',
    fileCreatedAt: '2026-01-15T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-01-22T12:00:00Z',
    fileCreatedAt: '2026-01-22T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-02-01T12:00:00Z',
    fileCreatedAt: '2026-02-01T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-02-10T12:00:00Z',
    fileCreatedAt: '2026-02-10T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-02-18T12:00:00Z',
    fileCreatedAt: '2026-02-18T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-03-01T12:00:00Z',
    fileCreatedAt: '2026-03-01T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });
  await addTripAsset({
    localDateTime: '2026-03-12T12:00:00Z',
    fileCreatedAt: '2026-03-12T12:00:00Z',
    city: 'Berlin',
    country: 'Germany',
  });

  const expectedTripIds = [
    await addTripAsset({
      localDateTime: '2026-04-15T10:00:00Z',
      fileCreatedAt: '2026-04-16T20:00:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-15T10:01:00Z',
      fileCreatedAt: '2026-04-16T19:59:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-15T12:00:00Z',
      fileCreatedAt: '2026-04-16T19:58:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-15T12:01:00Z',
      fileCreatedAt: '2026-04-16T19:57:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-15T16:00:00Z',
      fileCreatedAt: '2026-04-16T19:56:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-16T09:00:00Z',
      fileCreatedAt: '2026-04-16T19:55:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-16T09:01:00Z',
      fileCreatedAt: '2026-04-16T19:54:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-16T13:00:00Z',
      fileCreatedAt: '2026-04-16T19:53:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-16T17:00:00Z',
      fileCreatedAt: '2026-04-16T19:52:00Z',
      city: 'Paris',
      country: 'France',
    }),
    await addTripAsset({
      localDateTime: '2026-04-16T20:00:00Z',
      fileCreatedAt: '2026-04-16T19:51:00Z',
      city: 'Paris',
      country: 'France',
    }),
  ];

  vi.setSystemTime(now.toJSDate());
  await sut.onMemoriesCreate();

  const [memory] = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
  expect(memory?.data).toMatchObject({
    ruleId: 'recent_trip',
    title: 'Recent trip to Paris, France',
  });
  expect(memory?.assets).toHaveLength(7);
  expect(memory?.assets.map(({ id }) => id)).toEqual([
    expectedTripIds[0],
    expectedTripIds[2],
    expectedTripIds[4],
    expectedTripIds[5],
    expectedTripIds[7],
    expectedTripIds[8],
    expectedTripIds[9],
  ]);
  expect(memory?.assets.map(({ localDateTime }) => localDateTime.toISOString())).toEqual([
    '2026-04-15T10:00:00.000Z',
    '2026-04-15T12:00:00.000Z',
    '2026-04-15T16:00:00.000Z',
    '2026-04-16T09:00:00.000Z',
    '2026-04-16T13:00:00.000Z',
    '2026-04-16T17:00:00.000Z',
    '2026-04-16T20:00:00.000Z',
  ]);
});
```

- [ ] **Step 2: Run the medium spec to verify the ordering regression fails**

Run:

```bash
pnpm --dir server test:medium --run test/medium/specs/services/memory.service.spec.ts
```

Expected:

- the new medium test fails because memory asset readback still sorts on `fileCreatedAt`
- the retrieved trip asset order comes back reversed or otherwise non-chronological

- [ ] **Step 3: Order memory asset readback on `localDateTime`**

Update both asset subqueries in `server/src/repositories/memory.repository.ts`:

```ts
  search(ownerId: string, dto: MemorySearchDto) {
    return this.searchBuilder(ownerId, dto)
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('asset')
            .selectAll('asset')
            .innerJoin('memory_asset', 'asset.id', 'memory_asset.assetId')
            .whereRef('memory_asset.memoriesId', '=', 'memory.id')
            .orderBy('asset.localDateTime', 'asc')
            .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
            .where('asset.deletedAt', 'is', null),
        ).as('assets'),
      )
      .selectAll('memory')
      // rest unchanged
  }

  private getByIdBuilder(id: string) {
    return this.db
      .selectFrom('memory')
      .selectAll('memory')
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('asset')
            .selectAll('asset')
            .innerJoin('memory_asset', 'asset.id', 'memory_asset.assetId')
            .whereRef('memory_asset.memoriesId', '=', 'memory.id')
            .orderBy('asset.localDateTime', 'asc')
            .where('asset.visibility', '=', sql.lit(AssetVisibility.Timeline))
            .where('asset.deletedAt', 'is', null),
        ).as('assets'),
      )
      .where('id', '=', id)
      .where('deletedAt', 'is', null);
  }
```

- [ ] **Step 4: Re-run the medium spec**

Run:

```bash
pnpm --dir server test:medium --run test/medium/specs/services/memory.service.spec.ts
```

Expected:

- the new curated-trip medium test passes
- the existing recent-trip and birthday medium tests stay green

- [ ] **Step 5: Rebuild and regenerate the memory repository SQL snapshot**

Run:

```bash
pnpm --dir server build
pnpm --dir server sync:sql
```

Expected:

- `server/src/queries/memory.repository.sql` changes
- both memory asset subqueries now order by `asset."localDateTime" asc`

- [ ] **Step 6: Commit the readback-ordering and medium regression work**

```bash
git add \
  server/src/repositories/memory.repository.ts \
  server/test/medium/specs/services/memory.service.spec.ts \
  server/src/queries/memory.repository.sql
git commit -m "fix(server): preserve curated memory chronology"
```

## Task 3: Final Verification

**Files:**

- No new files

- [ ] **Step 1: Run the focused unit, medium, and typecheck suites**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/recent-trip.rule.spec.ts
pnpm --dir server test:medium --run test/medium/specs/services/memory.service.spec.ts
pnpm --dir server check
```

Expected:

- unit `recent_trip` spec passes
- medium memory service spec passes
- TypeScript check passes with `0` errors

- [ ] **Step 2: Confirm only the planned files changed**

Run:

```bash
git status --short
```

Expected tracked files:

```text
M server/src/repositories/asset.repository.ts
M server/src/repositories/memory.repository.ts
M server/src/services/memory-rules/recent-trip.rule.ts
M server/src/services/memory-rules/recent-trip.rule.spec.ts
M server/test/medium/specs/services/memory.service.spec.ts
M server/src/queries/asset.repository.sql
M server/src/queries/memory.repository.sql
```

If the task commits were already created as written above, `git status --short` should be empty.

- [ ] **Step 3: Confirm the plan matches the approved design**

Check manually that the final implementation does all of the following:

- `2` minute burst collapse
- adaptive `6-8`, with `10` only for longer trips
- day coverage before extra same-day moments
- chronological `localDateTime` output
- no changes to trip qualification thresholds

Expected:

- no missing spec requirements
- no extra scope beyond recent-trip curation and memory readback ordering
