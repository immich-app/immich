# Memories Rule Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rule-based Memories (`birthday` and `recent_trip`) alongside existing `on_this_day` memories with minimal fork churn, generic client rendering, and strong duplicate protection.

**Architecture:** Keep the existing `on_this_day` generation path intact and add a second server-side rule pipeline with its own `lastRuleDate` cursor so rules run only through the current day. Treat that cursor as a retry optimization, not the correctness boundary: if a rule day partially fails, do not advance it, and let persisted dedupe keys keep reruns safe. Persist `ruleId`, `dedupeKey`, `title`, `subtitle`, `score`, and context inside `memory.data`; mirror `title` and `subtitle` onto direct memory responses; let sync keep shipping the generic `data` blob so mobile only needs a generic renderer instead of per-rule UI branches.

**Tech Stack:** NestJS, Kysely, Luxon, Zod, generated OpenAPI/TypeScript SDK, SvelteKit, Flutter + Drift sync cache, native Android/iOS widget clients.

**Design doc:** `docs/plans/2026-04-23-memories-rule-engine-design.md`

---

## Pre-impl verification

- The current nightly generator in `server/src/services/memory.service.ts` precomputes `on_this_day` memories three days ahead. That is correct for anniversaries and incorrect for `birthday` / `recent_trip`, so rule memories need a separate `lastRuleDate` cursor.
- `server/src/dtos/sync.dto.ts` already defines `SyncMemoryV1.data` as `z.record(z.string(), z.unknown())`. That is the lowest-churn path for mobile: keep rule display fields inside `memory.data`, do not add new sync columns.
- There is no obvious server-side i18n layer for dynamic memory labels. In v1, rule `title` / `subtitle` should be English-first server strings. `on_this_day` keeps the current localized client fallback.
- The mobile home-screen widgets fetch `/memories` directly and currently require `data.year`. To avoid widening native widget rendering in v1, change their requests to `type=on_this_day` so widgets stay on the old memory family for now.
- `make sql` is only safe with a running DB. Do not run it against a down stack; let CI produce the diff if needed.

## File map

- `server/src/enum.ts`
  Add `MemoryType.Rule`.
- `server/src/types.ts`
  Add `RuleMemoryData`, generic memory-data typing, and `lastRuleDate`.
- `server/src/dtos/memory.dto.ts`
  Make `data` generic, add optional `title` / `subtitle`, and derive response display fields from rule payloads.
- `server/src/repositories/person.repository.ts`
  Add `getBirthdaysForDay`.
- `server/src/repositories/asset.repository.ts`
  Add rule-query helpers for person assets and location clusters.
- `server/src/repositories/memory.repository.ts`
  Add `hasRuleMemory(ownerId, ruleId, dedupeKey)`.
- `server/src/services/memory-rules/memory-rule.interface.ts`
  Shared candidate / context types.
- `server/src/services/memory-rules/birthday.rule.ts`
  Deterministic birthday rule.
- `server/src/services/memory-rules/recent-trip.rule.ts`
  Confidence-gated travel heuristic + 30-day same-place cooldown.
- `server/src/services/memory.service.ts`
  Separate cursors, rule registry, fail-soft orchestration, and daily cap.
- `server/src/services/memory.service.spec.ts`
  Unit coverage for orchestration, cap, dedupe, and fail-soft behavior.
- `server/src/services/memory-rules/birthday.rule.spec.ts`
  Birthday candidate selection tests.
- `server/src/services/memory-rules/recent-trip.rule.spec.ts`
  Trip candidate, home-confidence, country/city confidence, stable dedupe, and cooldown tests.
- `server/test/medium/specs/services/memory.service.spec.ts`
  Real-DB coverage for birthday and trip generation.
- `web/src/lib/utils.ts`
  Generic title helper: server title first, `on_this_day` fallback second.
- `web/src/lib/utils.spec.ts`
  Title helper coverage.
- `open-api/typescript-sdk/src/fetch-client.ts`
  Regenerated SDK types for generic memory data and optional `title` / `subtitle`.
- `mobile/openapi/lib/model/memory_response_dto.dart`
  Regenerated mobile API model.
- `mobile/openapi/lib/model/memory_type.dart`
  Regenerated `rule` enum value.
- `mobile/lib/domain/models/memory.model.dart`
  Make local memory data a generic JSON map with convenience getters.
- `mobile/lib/infrastructure/repositories/sync_stream.repository.dart`
  Map `MemoryType.rule` into Drift.
- `mobile/lib/presentation/widgets/memory/memory_lane.widget.dart`
  Render server title when present.
- `mobile/lib/presentation/pages/drift_memory.page.dart`
  Render server title when present.
- `mobile/test/domain/models/memory_model_test.dart`
  Generic memory-data parsing tests.
- `mobile/test/domain/repositories/sync_stream_repository_test.dart`
  Sync-store coverage for `rule` memories.
- `mobile/test/presentation/memory/memory_title_test.dart`
  Title fallback coverage for generic memories in the mobile UI.
- `mobile/android/app/src/main/kotlin/app/alextran/immich/widget/ImmichAPI.kt`
  Keep widget memories filtered to `on_this_day`.
- `mobile/ios/WidgetExtension/ImmichAPI.swift`
  Keep widget memories filtered to `on_this_day`.

## Task execution rules

- Work from `/tmp/gallery-memories-rules-exploration-20260423`.
- Use TDD at task scope: write the failing test first, confirm the failure, implement the minimal code, rerun the target tests, then commit.
- Do not run `make sql` until every server repository change is in place and the DB is confirmed running.
- Run `make open-api` once, after the server DTOs are settled.
- Commit after every task with the message shown below.

## Baseline

**Run once before Task 1.**

- [ ] **Step 1: Install dependencies in the isolated checkout**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm install --frozen-lockfile
cd mobile && flutter pub get
```

Expected: both commands succeed without lockfile changes.

- [ ] **Step 2: Verify the current memory surfaces are green**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts
pnpm --filter immich-web test -- --run src/lib/utils.spec.ts
cd mobile && flutter test test/domain/repositories/sync_stream_repository_test.dart
```

Expected: all three commands pass on the unmodified branch.

- [ ] **Step 3: Confirm no generated-file work is pending**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git status --short
```

Expected: empty output.

---

### Task 1: Generic Memory Payload And Response Titles

**Files:**

- Modify: `server/src/enum.ts`
- Modify: `server/src/types.ts`
- Modify: `server/src/dtos/memory.dto.ts`
- Modify: `server/src/services/memory.service.spec.ts`

- [ ] **Step 1: Write the failing unit test for rule response titles**

Append this test to the `describe('search')` block in `server/src/services/memory.service.spec.ts`:

```ts
it('should expose server-owned title and subtitle for rule memories', async () => {
  const userId = newUuid();
  const memory = MemoryFactory.create({
    ownerId: userId,
    type: MemoryType.Rule,
    data: {
      ruleId: 'birthday',
      dedupeKey: 'birthday:person-1:2026-04-23',
      title: 'Happy birthday, Alice',
      subtitle: 'Photos from different years',
    } as any,
  });

  mocks.memory.search.mockResolvedValue([getForMemory(memory)]);

  await expect(sut.search(factory.auth({ user: { id: userId } }), {})).resolves.toEqual([
    expect.objectContaining({
      id: memory.id,
      type: MemoryType.Rule,
      title: 'Happy birthday, Alice',
      subtitle: 'Photos from different years',
    }),
  ]);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts
```

Expected: the new test fails because `MemoryType.Rule` and response `title` / `subtitle` do not exist yet.

- [ ] **Step 3: Implement the generic rule payload groundwork**

Apply these changes:

```ts
// server/src/enum.ts
export enum MemoryType {
  /** pictures taken on this day X years ago */
  OnThisDay = 'on_this_day',
  /** server-defined rule memory */
  Rule = 'rule',
}

// server/src/types.ts
export type OnThisDayData = { year: number };

export type RuleMemoryData = {
  ruleId: string;
  dedupeKey: string;
  title: string;
  subtitle?: string;
  score?: number;
  context?: Record<string, unknown>;
};

export interface MemoryDataByType {
  [MemoryType.OnThisDay]: OnThisDayData;
  [MemoryType.Rule]: RuleMemoryData;
}

export type AnyMemoryData = MemoryDataByType[MemoryType];

export type MemoriesState = {
  /** on-this-day memories have already been created through this date */
  lastOnThisDayDate?: string;
  /** rule memories have already been created through this date */
  lastRuleDate?: string;
};

// server/src/dtos/memory.dto.ts
const MemoryDataSchema = z.record(z.string(), z.unknown()).describe('Memory data');

const getMemoryDisplay = (type: MemoryType, data: Record<string, unknown>) => {
  if (type !== MemoryType.Rule) {
    return { title: undefined, subtitle: undefined };
  }

  return {
    title: typeof data.title === 'string' ? data.title : undefined,
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : undefined,
  };
};

const MemoryCreateSchema = z
  .object({
    type: MemoryTypeSchema,
    data: MemoryDataSchema,
    memoryAt: isoDatetimeToDate.describe('Memory date'),
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs to associate with memory'),
    isSaved: z.boolean().optional().describe('Is memory saved'),
    seenAt: isoDatetimeToDate.optional().describe('Date when memory was seen'),
    showAt: isoDatetimeToDate.optional().describe('Date when memory should be shown'),
    hideAt: isoDatetimeToDate.optional().describe('Date when memory should be hidden'),
  })
  .meta({ id: 'MemoryCreateDto' });

const MemoryResponseSchema = z
  .object({
    id: z.string().describe('Memory ID'),
    createdAt: isoDatetimeToDate.describe('Creation date'),
    updatedAt: isoDatetimeToDate.describe('Last update date'),
    deletedAt: isoDatetimeToDate.optional().describe('Deletion date'),
    memoryAt: isoDatetimeToDate.describe('Memory date'),
    seenAt: isoDatetimeToDate.optional().describe('Date when memory was seen'),
    showAt: isoDatetimeToDate.optional().describe('Date when memory should be shown'),
    hideAt: isoDatetimeToDate.optional().describe('Date when memory should be hidden'),
    ownerId: z.string().describe('Owner user ID'),
    type: MemoryTypeSchema,
    data: MemoryDataSchema,
    title: z.string().optional().describe('Server-defined display title'),
    subtitle: z.string().optional().describe('Server-defined display subtitle'),
    isSaved: z.boolean().describe('Is memory saved'),
    assets: z.array(AssetResponseSchema),
  })
  .meta({ id: 'MemoryResponseDto' });

export const mapMemory = (entity: Memory, auth: AuthDto): MemoryResponseDto => {
  const data = entity.data as Record<string, unknown>;
  const { title, subtitle } = getMemoryDisplay(entity.type as MemoryType, data);

  return {
    id: entity.id,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deletedAt: entity.deletedAt ?? undefined,
    memoryAt: entity.memoryAt,
    seenAt: entity.seenAt ?? undefined,
    showAt: entity.showAt ?? undefined,
    hideAt: entity.hideAt ?? undefined,
    ownerId: entity.ownerId,
    type: entity.type as MemoryType,
    data,
    title,
    subtitle,
    isSaved: entity.isSaved,
    assets: ('assets' in entity ? entity.assets : []).map((asset) => mapAsset(asset, { auth })),
  };
};
```

- [ ] **Step 4: Run the unit test and type-check**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts
pnpm --filter immich check
```

Expected: the new search test passes, and the server type-check succeeds.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add server/src/enum.ts server/src/types.ts server/src/dtos/memory.dto.ts server/src/services/memory.service.spec.ts
git commit -m "feat(server): add generic rule memory payload"
```

---

### Task 2: Add The Birthday Rule

**Files:**

- Create: `server/src/services/memory-rules/memory-rule.interface.ts`
- Create: `server/src/services/memory-rules/birthday.rule.ts`
- Create: `server/src/services/memory-rules/birthday.rule.spec.ts`
- Modify: `server/src/repositories/person.repository.ts`
- Modify: `server/src/repositories/asset.repository.ts`
- Modify: `server/test/medium/specs/services/memory.service.spec.ts`

- [ ] **Step 1: Write the failing unit and medium tests**

Create `server/src/services/memory-rules/birthday.rule.spec.ts`:

```ts
import { DateTime } from 'luxon';
import { BirthdayMemoryRule } from 'src/services/memory-rules/birthday.rule';

describe(BirthdayMemoryRule.name, () => {
  it('creates one curated birthday candidate per matching person', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-23') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-2025-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2025-2', localDateTime: new Date('2025-03-01T12:00:00Z') },
        { id: 'a-2024-1', localDateTime: new Date('2024-04-01T12:00:00Z') },
        { id: 'a-2023-1', localDateTime: new Date('2023-04-01T12:00:00Z') },
        { id: 'a-2022-1', localDateTime: new Date('2022-04-01T12:00:00Z') },
        { id: 'a-2021-1', localDateTime: new Date('2021-04-01T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as any, assetRepository as any);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      ruleId: 'birthday',
      dedupeKey: 'birthday:person-1:2026-04-23',
      title: 'Happy birthday, Alice',
      subtitle: 'Photos from different years',
      assetIds: ['a-2025-1', 'a-2025-2', 'a-2024-1', 'a-2023-1', 'a-2022-1', 'a-2021-1'],
    });
  });

  it('skips people with too few assets or only one year represented', async () => {
    const personRepository = {
      getBirthdaysForDay: vi
        .fn()
        .mockResolvedValue([{ id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-23') }]),
    };
    const assetRepository = {
      getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
        { id: 'a-1', localDateTime: new Date('2025-04-01T12:00:00Z') },
        { id: 'a-2', localDateTime: new Date('2025-03-01T12:00:00Z') },
        { id: 'a-3', localDateTime: new Date('2025-02-01T12:00:00Z') },
      ]),
    };

    const rule = new BirthdayMemoryRule(personRepository as any, assetRepository as any);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });
});
```

Append this test to `server/test/medium/specs/services/memory.service.spec.ts`:

```ts
it('creates a birthday rule memory on the birthday itself', async () => {
  const { sut, ctx } = setup();
  const assetRepo = ctx.get(AssetRepository);
  const memoryRepo = ctx.get(MemoryRepository);
  const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({
    ownerId: user.id,
    name: 'Alice',
    birthDate: new Date('1990-04-23T00:00:00Z'),
  });

  const addBirthdayAsset = async (localDateTime: string) => {
    const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
    await Promise.all([
      ctx.newExif({ assetId: asset.id, city: 'Berlin', country: 'Germany' }),
      ctx.newJobStatus({ assetId: asset.id }),
      ctx.newAssetFace({ assetId: asset.id, personId: person.id }),
      assetRepo.upsertFiles([
        { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
        { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
      ]),
    ]);
  };

  await addBirthdayAsset('2025-04-01T12:00:00Z');
  await addBirthdayAsset('2024-04-01T12:00:00Z');
  await addBirthdayAsset('2023-04-01T12:00:00Z');
  await addBirthdayAsset('2022-04-01T12:00:00Z');
  await addBirthdayAsset('2021-04-01T12:00:00Z');
  await addBirthdayAsset('2020-04-01T12:00:00Z');

  vi.setSystemTime(now.toJSDate());
  await sut.onMemoriesCreate();

  const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
  expect(memories).toEqual([
    expect.objectContaining({
      type: MemoryType.Rule,
      data: expect.objectContaining({
        ruleId: 'birthday',
        title: 'Happy birthday, Alice',
        subtitle: 'Photos from different years',
      }),
    }),
  ]);
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory-rules/birthday.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
```

Expected: the unit test fails because the rule file and repository helpers do not exist yet; the medium test fails because no birthday rule is generated.

- [ ] **Step 3: Implement the birthday rule and its query helpers**

Add these files and methods:

```ts
// server/src/services/memory-rules/memory-rule.interface.ts
import { DateTime } from 'luxon';

export interface MemoryRuleCandidate {
  ruleId: string;
  dedupeKey: string;
  title: string;
  subtitle?: string;
  score: number;
  assetIds: string[];
  memoryAt: DateTime;
  context?: Record<string, unknown>;
}

export interface MemoryRuleContext {
  ownerId: string;
  target: DateTime;
}

export interface MemoryRule {
  readonly id: string;
  evaluate(context: MemoryRuleContext): Promise<MemoryRuleCandidate[]>;
}

// server/src/repositories/person.repository.ts
@GenerateSql({ params: [DummyValue.UUID, { month: 4, day: 23 }] })
getBirthdaysForDay(ownerId: string, { month, day }: { month: number; day: number }) {
  return this.db
    .selectFrom('person')
    .select(['id', 'name', 'birthDate'])
    .where('ownerId', '=', ownerId)
    .where('isHidden', '=', false)
    .where('type', '=', 'person')
    .where('name', '!=', '')
    .where('birthDate', 'is not', null)
    .where(sql`extract(month from "birthDate")`, '=', month)
    .where(sql`extract(day from "birthDate")`, '=', day)
    .execute();
}

// server/src/repositories/asset.repository.ts
@GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.DATE] })
getMemoryAssetsForPerson(ownerId: string, personId: string, takenBefore: Date) {
  return this.db
    .selectFrom('asset')
    .select(['asset.id', 'asset.localDateTime'])
    .innerJoin('asset_face', 'asset_face.assetId', 'asset.id')
    .innerJoin('asset_job_status', 'asset_job_status.assetId', 'asset.id')
    .where('asset.ownerId', '=', ownerId)
    .where('asset_face.personId', '=', personId)
    .where('asset_face.deletedAt', 'is', null)
    .where('asset_face.isVisible', 'is', true)
    .where('asset.visibility', '=', AssetVisibility.Timeline)
    .where('asset.deletedAt', 'is', null)
    .where('asset.localDateTime', '<=', takenBefore)
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom('asset_file')
          .select('asset_file.assetId')
          .whereRef('asset_file.assetId', '=', 'asset.id')
          .where('asset_file.type', '=', AssetFileType.Preview),
      ),
    )
    .distinctOn(['asset.id'])
    .orderBy('asset.id')
    .orderBy('asset.localDateTime', 'desc')
    .limit(60)
    .execute();
}

// server/src/services/memory-rules/birthday.rule.ts
import { DateTime } from 'luxon';
import { AssetRepository } from 'src/repositories/asset.repository';
import { PersonRepository } from 'src/repositories/person.repository';
import { MemoryRule, MemoryRuleCandidate, MemoryRuleContext } from 'src/services/memory-rules/memory-rule.interface';

export class BirthdayMemoryRule implements MemoryRule {
  readonly id = 'birthday';

  constructor(
    private personRepository: Pick<PersonRepository, 'getBirthdaysForDay'>,
    private assetRepository: Pick<AssetRepository, 'getMemoryAssetsForPerson'>,
  ) {}

  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    const people = await this.personRepository.getBirthdaysForDay(ownerId, { month: target.month, day: target.day });
    const candidates: MemoryRuleCandidate[] = [];

    for (const person of people) {
      const assets = await this.assetRepository.getMemoryAssetsForPerson(ownerId, person.id, target.endOf('day').toJSDate());
      const byYear = new Map<number, string[]>();

      for (const asset of assets) {
        const year = DateTime.fromJSDate(asset.localDateTime, { zone: 'utc' }).year;
        const ids = byYear.get(year) ?? [];
        if (ids.length < 2) {
          ids.push(asset.id);
          byYear.set(year, ids);
        }
      }

      const assetIds = [...byYear.keys()]
        .sort((a, b) => b - a)
        .flatMap((year) => byYear.get(year)!)
        .slice(0, 12);

      if (assetIds.length < 6 || byYear.size < 2) {
        continue;
      }

      candidates.push({
        ruleId: this.id,
        dedupeKey: `birthday:${person.id}:${target.toFormat('yyyy-MM-dd')}`,
        title: `Happy birthday, ${person.name}`,
        subtitle: 'Photos from different years',
        score: 100 + byYear.size * 10 + assetIds.length,
        assetIds,
        memoryAt: target,
        context: { personId: person.id, distinctYears: byYear.size },
      });
    }

    return candidates;
  }
}
```

- [ ] **Step 4: Run the unit and medium tests again**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory-rules/birthday.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
pnpm --filter immich check
```

Expected: the birthday-rule unit tests pass; the medium test still fails until Task 4 wires the rule into `MemoryService`; the server type-check should pass.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add server/src/services/memory-rules/memory-rule.interface.ts server/src/services/memory-rules/birthday.rule.ts server/src/services/memory-rules/birthday.rule.spec.ts server/src/repositories/person.repository.ts server/src/repositories/asset.repository.ts server/test/medium/specs/services/memory.service.spec.ts
git commit -m "feat(server): add birthday memory rule"
```

---

### Task 3: Add The Recent Trip Rule And Dedupe Helper

**Files:**

- Create: `server/src/services/memory-rules/recent-trip.rule.ts`
- Create: `server/src/services/memory-rules/recent-trip.rule.spec.ts`
- Modify: `server/src/repositories/asset.repository.ts`
- Modify: `server/src/repositories/memory.repository.ts`
- Modify: `server/test/medium/specs/services/memory.service.spec.ts`

- [ ] **Step 1: Write the failing unit and medium tests**

Create `server/src/services/memory-rules/recent-trip.rule.spec.ts`:

```ts
import { DateTime } from 'luxon';
import { MemoryType, AssetOrder } from 'src/enum';
import { RecentTripMemoryRule } from 'src/services/memory-rules/recent-trip.rule';

describe(RecentTripMemoryRule.name, () => {
  it('creates a recent-trip candidate for a strong non-home cluster', async () => {
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
            dayCount: 3,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-17T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          { id: 'asset-1' },
          { id: 'asset-2' },
          { id: 'asset-3' },
          { id: 'asset-4' },
          { id: 'asset-5' },
          { id: 'asset-6' },
          { id: 'asset-7' },
        ]),
    };
    const memoryRepository = {
      search: vi.fn().mockResolvedValue([]),
    };

    const rule = new RecentTripMemoryRule(assetRepository as any, memoryRepository as any);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(memoryRepository.search).toHaveBeenCalledWith('user-1', {
      type: MemoryType.Rule,
      size: 20,
      order: AssetOrder.Desc,
    });
    expect(candidate).toMatchObject({
      ruleId: 'recent_trip',
      dedupeKey: 'recent_trip:france:paris:2026-04-23',
      title: 'Recent trip to Paris, France',
      subtitle: '9 photos over 3 days',
      assetIds: ['asset-1', 'asset-2', 'asset-3', 'asset-4', 'asset-5', 'asset-6', 'asset-7'],
    });
  });

  it('skips clusters that are too small or still inside the same-place cooldown', async () => {
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
            assetCount: 5,
            dayCount: 1,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-15T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = {
      search: vi.fn().mockResolvedValue([
        {
          type: MemoryType.Rule,
          memoryAt: new Date('2026-04-10T00:00:00Z'),
          data: { ruleId: 'recent_trip', context: { placeKey: 'france:paris' } },
        },
      ]),
    };

    const rule = new RecentTripMemoryRule(assetRepository as any, memoryRepository as any);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });

  it('creates a country-level trip when the country changed but city metadata is missing', async () => {
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
            city: null,
            assetCount: 8,
            dayCount: 2,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-16T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi
        .fn()
        .mockResolvedValue([
          { id: 'asset-1' },
          { id: 'asset-2' },
          { id: 'asset-3' },
          { id: 'asset-4' },
          { id: 'asset-5' },
          { id: 'asset-6' },
          { id: 'asset-7' },
        ]),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as any, memoryRepository as any);
    const [candidate] = await rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
    });

    expect(candidate).toMatchObject({
      ruleId: 'recent_trip',
      title: 'Recent trip to France',
      subtitle: '8 photos over 2 days',
    });
  });

  it('skips same-country clusters when city metadata is missing or not trustworthy', async () => {
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
            country: 'Germany',
            city: null,
            assetCount: 9,
            dayCount: 3,
            firstDate: new Date('2026-04-15T00:00:00Z'),
            lastDate: new Date('2026-04-17T00:00:00Z'),
          },
        ]),
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as any, memoryRepository as any);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });

  it('skips when the baseline home location is ambiguous', async () => {
    const assetRepository = {
      getMemoryLocationClusters: vi
        .fn()
        .mockResolvedValueOnce([
          {
            country: 'Germany',
            city: 'Berlin',
            assetCount: 10,
            dayCount: 6,
            firstDate: new Date('2026-01-01T00:00:00Z'),
            lastDate: new Date('2026-03-20T00:00:00Z'),
          },
          {
            country: 'Austria',
            city: 'Vienna',
            assetCount: 9,
            dayCount: 6,
            firstDate: new Date('2026-01-05T00:00:00Z'),
            lastDate: new Date('2026-03-18T00:00:00Z'),
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
      getMemoryAssetsForLocation: vi.fn(),
    };
    const memoryRepository = { search: vi.fn().mockResolvedValue([]) };

    const rule = new RecentTripMemoryRule(assetRepository as any, memoryRepository as any);
    await expect(
      rule.evaluate({
        ownerId: 'user-1',
        target: DateTime.fromISO('2026-04-23', { zone: 'utc' }),
      }),
    ).resolves.toEqual([]);
  });
});
```

Append these tests to `server/test/medium/specs/services/memory.service.spec.ts`:

```ts
it('creates a recent-trip rule memory for a dense non-home cluster', async () => {
  const { sut, ctx } = setup();
  const assetRepo = ctx.get(AssetRepository);
  const memoryRepo = ctx.get(MemoryRepository);
  const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
  const { user } = await ctx.newUser();

  const addTripAsset = async ({
    localDateTime,
    city,
    country,
  }: {
    localDateTime: string;
    city: string;
    country: string;
  }) => {
    const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
    await Promise.all([
      ctx.newExif({ assetId: asset.id, city, country }),
      ctx.newJobStatus({ assetId: asset.id }),
      assetRepo.upsertFiles([
        { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
        { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
      ]),
    ]);
  };

  await addTripAsset({ localDateTime: '2026-01-15T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-01-22T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-02-01T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-02-10T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-02-18T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-03-01T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-03-12T12:00:00Z', city: 'Berlin', country: 'Germany' });
  await addTripAsset({ localDateTime: '2026-04-15T10:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-15T18:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-16T10:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-16T18:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-17T10:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-17T18:00:00Z', city: 'Paris', country: 'France' });
  await addTripAsset({ localDateTime: '2026-04-18T10:00:00Z', city: 'Paris', country: 'France' });

  vi.setSystemTime(now.toJSDate());
  await sut.onMemoriesCreate();

  const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
  expect(memories).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: MemoryType.Rule,
        data: expect.objectContaining({
          ruleId: 'recent_trip',
          title: 'Recent trip to Paris, France',
        }),
      }),
    ]),
  );
});

it('does not create a recent-trip rule memory for weak signals', async () => {
  const { sut, ctx } = setup();
  const assetRepo = ctx.get(AssetRepository);
  const memoryRepo = ctx.get(MemoryRepository);
  const now = DateTime.fromObject({ year: 2026, month: 4, day: 23 }, { zone: 'utc' }) as DateTime<true>;
  const { user } = await ctx.newUser();

  const addWeakAsset = async (localDateTime: string, city: string, country: string) => {
    const { asset } = await ctx.newAsset({ ownerId: user.id, localDateTime });
    await Promise.all([
      ctx.newExif({ assetId: asset.id, city, country }),
      ctx.newJobStatus({ assetId: asset.id }),
      assetRepo.upsertFiles([
        { assetId: asset.id, type: AssetFileType.Preview, path: `/preview-${asset.id}.jpg` },
        { assetId: asset.id, type: AssetFileType.Thumbnail, path: `/thumb-${asset.id}.jpg` },
      ]),
    ]);
  };

  await addWeakAsset('2026-02-01T12:00:00Z', 'Berlin', 'Germany');
  await addWeakAsset('2026-03-01T12:00:00Z', 'Berlin', 'Germany');
  await addWeakAsset('2026-04-15T10:00:00Z', 'Paris', 'France');
  await addWeakAsset('2026-04-15T18:00:00Z', 'Paris', 'France');
  await addWeakAsset('2026-04-16T10:00:00Z', 'Paris', 'France');

  vi.setSystemTime(now.toJSDate());
  await sut.onMemoriesCreate();

  const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
  expect(memories).toEqual([]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory-rules/recent-trip.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
```

Expected: both commands fail because the trip rule, location helpers, and dedupe helper do not exist yet.

- [ ] **Step 3: Implement the recent-trip rule and dedupe lookup**

Apply these additions:

```ts
// server/src/repositories/asset.repository.ts
@GenerateSql({ params: [DummyValue.UUID, { takenAfter: DummyValue.DATE, takenBefore: DummyValue.DATE }] })
getMemoryLocationClusters(ownerId: string, { takenAfter, takenBefore }: { takenAfter: Date; takenBefore: Date }) {
  return this.db
    .selectFrom('asset')
    .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
    .select([
      'asset_exif.country as country',
      'asset_exif.city as city',
      sql<number>`count(*)::int`.as('assetCount'),
      sql<number>`count(distinct (asset."localDateTime" at time zone 'UTC')::date)::int`.as('dayCount'),
      sql<Date>`min(asset."localDateTime")`.as('firstDate'),
      sql<Date>`max(asset."localDateTime")`.as('lastDate'),
    ])
    .where('asset.ownerId', '=', ownerId)
    .where('asset.visibility', '=', AssetVisibility.Timeline)
    .where('asset.deletedAt', 'is', null)
    .where('asset.localDateTime', '>=', takenAfter)
    .where('asset.localDateTime', '<=', takenBefore)
    .where('asset_exif.country', 'is not', null)
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom('asset_file')
          .select('asset_file.assetId')
          .whereRef('asset_file.assetId', '=', 'asset.id')
          .where('asset_file.type', '=', AssetFileType.Preview),
      ),
    )
    .groupBy(['asset_exif.country', 'asset_exif.city'])
    .orderBy('assetCount', 'desc')
    .execute();
}

@GenerateSql({
  params: [DummyValue.UUID, { country: DummyValue.STRING, city: DummyValue.STRING, takenAfter: DummyValue.DATE, takenBefore: DummyValue.DATE }],
})
getMemoryAssetsForLocation(
  ownerId: string,
  { country, city, takenAfter, takenBefore }: { country: string; city: string | null; takenAfter: Date; takenBefore: Date },
) {
  return this.db
    .selectFrom('asset')
    .select(['asset.id'])
    .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
    .where('asset.ownerId', '=', ownerId)
    .where('asset.visibility', '=', AssetVisibility.Timeline)
    .where('asset.deletedAt', 'is', null)
    .where('asset.localDateTime', '>=', takenAfter)
    .where('asset.localDateTime', '<=', takenBefore)
    .where('asset_exif.country', '=', country)
    .$if(city !== null, (qb) => qb.where('asset_exif.city', '=', city!))
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
    .limit(20)
    .execute();
}

// server/src/repositories/memory.repository.ts
@GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, DummyValue.STRING] })
async hasRuleMemory(ownerId: string, ruleId: string, dedupeKey: string) {
  const result = await this.db
    .selectFrom('memory')
    .select('id')
    .where('ownerId', '=', ownerId)
    .where('type', '=', MemoryType.Rule)
    .where(sql<string>`memory.data->>'ruleId'`, '=', ruleId)
    .where(sql<string>`memory.data->>'dedupeKey'`, '=', dedupeKey)
    .where('deletedAt', 'is', null)
    .executeTakeFirst();

  return !!result;
}

// server/src/services/memory-rules/recent-trip.rule.ts
import { AssetOrder, MemoryType } from 'src/enum';
import { AssetRepository } from 'src/repositories/asset.repository';
import { MemoryRepository } from 'src/repositories/memory.repository';
import { MemoryRule, MemoryRuleCandidate, MemoryRuleContext } from 'src/services/memory-rules/memory-rule.interface';

export class RecentTripMemoryRule implements MemoryRule {
  readonly id = 'recent_trip';
  private static readonly HOME_DOMINANCE_RATIO = 1.25;

  constructor(
    private assetRepository: Pick<AssetRepository, 'getMemoryLocationClusters' | 'getMemoryAssetsForLocation'>,
    private memoryRepository: Pick<MemoryRepository, 'search'>,
  ) {}

  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    const recentFrom = target.minus({ days: 30 }).startOf('day');
    const baselineFrom = recentFrom.minus({ days: 90 });
    const baselineTo = recentFrom.minus({ days: 1 }).endOf('day');

    const [baseline, recent, recentRuleMemories] = await Promise.all([
      this.assetRepository.getMemoryLocationClusters(ownerId, {
        takenAfter: baselineFrom.toJSDate(),
        takenBefore: baselineTo.toJSDate(),
      }),
      this.assetRepository.getMemoryLocationClusters(ownerId, {
        takenAfter: recentFrom.toJSDate(),
        takenBefore: target.endOf('day').toJSDate(),
      }),
      this.memoryRepository.search(ownerId, {
        type: MemoryType.Rule,
        size: 20,
        order: AssetOrder.Desc,
      }),
    ]);

    const [home, runnerUp] = baseline;
    if (!home?.country) {
      return [];
    }

    const isAmbiguousHome =
      !!runnerUp &&
      runnerUp.country !== home.country &&
      runnerUp.assetCount >= home.assetCount / RecentTripMemoryRule.HOME_DOMINANCE_RATIO;
    if (isAmbiguousHome) {
      return [];
    }

    const candidate = recent.find((item) => {
      if (item.assetCount < 7 || item.dayCount < 2) {
        return false;
      }

      if (item.country !== home.country) {
        return true;
      }

      return !!home.city && !!item.city && item.city !== home.city;
    });

    if (!candidate) {
      return [];
    }

    const placeKey = `${candidate.country}:${candidate.city ?? ''}`.toLowerCase();
    const isCoolingDown = recentRuleMemories.some((memory) => {
      const data = memory.data as Record<string, unknown>;
      if (data.ruleId !== this.id) {
        return false;
      }

      const context = data.context as Record<string, unknown> | undefined;
      const seenPlaceKey = typeof context?.placeKey === 'string' ? context.placeKey : undefined;
      return seenPlaceKey === placeKey && DateTime.fromJSDate(memory.memoryAt) >= target.minus({ days: 30 });
    });

    if (isCoolingDown) {
      return [];
    }

    const assetIds = (
      await this.assetRepository.getMemoryAssetsForLocation(ownerId, {
        country: candidate.country,
        city: candidate.city,
        takenAfter: recentFrom.toJSDate(),
        takenBefore: target.endOf('day').toJSDate(),
      })
    ).map(({ id }) => id);

    const placeLabel = candidate.city ? `${candidate.city}, ${candidate.country}` : candidate.country;
    const dedupeDay = target.toFormat('yyyy-MM-dd');

    return [
      {
        ruleId: this.id,
        dedupeKey: `recent_trip:${placeKey}:${dedupeDay}`,
        title: `Recent trip to ${placeLabel}`,
        subtitle: `${candidate.assetCount} photos over ${candidate.dayCount} days`,
        score: 50 + candidate.dayCount * 5 + Math.min(candidate.assetCount, 20),
        assetIds,
        memoryAt: target,
        context: {
          placeKey,
          placeLabel,
          country: candidate.country,
          city: candidate.city,
          assetCount: candidate.assetCount,
          dayCount: candidate.dayCount,
          tripWindowStart: candidate.firstDate.toISOString(),
          tripWindowEnd: candidate.lastDate.toISOString(),
        },
      },
    ];
  }
}
```

- [ ] **Step 4: Run the unit and medium tests again**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory-rules/recent-trip.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
pnpm --filter immich check
```

Expected: the recent-trip unit tests pass; the medium tests still fail until Task 4 wires the rule into `MemoryService`; server type-check stays green.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add server/src/services/memory-rules/recent-trip.rule.ts server/src/services/memory-rules/recent-trip.rule.spec.ts server/src/repositories/asset.repository.ts server/src/repositories/memory.repository.ts server/test/medium/specs/services/memory.service.spec.ts
git commit -m "feat(server): add recent trip memory rule"
```

---

### Task 4: Wire Rule Generation Into MemoryService

**Files:**

- Modify: `server/src/services/memory.service.ts`
- Modify: `server/src/services/memory.service.spec.ts`
- Modify: `server/test/medium/specs/services/memory.service.spec.ts`

- [ ] **Step 1: Write the failing orchestration tests**

Append these tests to the `describe('onMemoriesCreate')` block in `server/src/services/memory.service.spec.ts`:

```ts
it('should only evaluate rules through today, not future precompute dates', async () => {
  const user = factory.userAdmin();
  vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));
  mocks.user.getList.mockResolvedValue([user]);
  mocks.systemMetadata.get.mockResolvedValue({
    lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
    lastRuleDate: '2026-04-20T00:00:00.000Z',
  });
  mocks.asset.getByDayOfYear.mockResolvedValue([]);

  const birthdayRule = { id: 'birthday', evaluate: vi.fn().mockResolvedValue([]) };
  vi.spyOn(sut as any, 'getMemoryRules').mockReturnValue([birthdayRule]);

  await sut.onMemoriesCreate();

  expect(birthdayRule.evaluate.mock.calls.map(([input]) => input.target.toISODate())).toEqual([
    '2026-04-21',
    '2026-04-22',
    '2026-04-23',
  ]);
});

it('should keep only the top two surviving rule candidates after dedupe and fail soft', async () => {
  const user = factory.userAdmin();
  vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));
  mocks.user.getList.mockResolvedValue([user]);
  mocks.systemMetadata.get.mockResolvedValue({
    lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
    lastRuleDate: '2026-04-22T00:00:00.000Z',
  });
  mocks.asset.getByDayOfYear.mockResolvedValue([]);
  mocks.memory.search.mockResolvedValue([]);
  mocks.memory.hasRuleMemory.mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

  const failingRule = { id: 'broken', evaluate: vi.fn().mockRejectedValue(new Error('boom')) };
  const scoringRule = {
    id: 'scoring',
    evaluate: vi.fn().mockResolvedValue([
      {
        ruleId: 'birthday',
        dedupeKey: 'k-1',
        title: 'First',
        score: 100,
        assetIds: ['asset-1'],
        memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
      },
      {
        ruleId: 'birthday',
        dedupeKey: 'k-2',
        title: 'Second',
        score: 90,
        assetIds: ['asset-2'],
        memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
      },
      {
        ruleId: 'birthday',
        dedupeKey: 'k-3',
        title: 'Third',
        score: 10,
        assetIds: ['asset-3'],
        memoryAt: DateTime.fromISO('2026-04-23T00:00:00Z'),
      },
    ]),
  };

  vi.spyOn(sut as any, 'getMemoryRules').mockReturnValue([failingRule, scoringRule]);

  await sut.onMemoriesCreate();

  expect(mocks.memory.create).toHaveBeenCalledTimes(2);
  expect(mocks.memory.hasRuleMemory.mock.calls).toEqual([
    [user.id, 'birthday', 'k-1'],
    [user.id, 'birthday', 'k-2'],
    [user.id, 'birthday', 'k-3'],
  ]);
  expect(mocks.memory.create.mock.calls[0][0].data).toMatchObject({ title: 'First', dedupeKey: 'k-1' });
  expect(mocks.memory.create.mock.calls[1][0].data).toMatchObject({ title: 'Third', dedupeKey: 'k-3' });
});

it('should not advance the rule cursor when any owner run fails', async () => {
  const userA = factory.userAdmin();
  const userB = factory.userAdmin();
  vi.setSystemTime(new Date('2026-04-23T12:00:00Z'));
  mocks.user.getList.mockResolvedValue([userA, userB]);
  mocks.systemMetadata.get.mockResolvedValue({
    lastOnThisDayDate: '2026-04-25T00:00:00.000Z',
    lastRuleDate: '2026-04-22T00:00:00.000Z',
  });
  mocks.asset.getByDayOfYear.mockResolvedValue([]);

  vi.spyOn(sut as any, 'createRuleMemories')
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error('boom'));

  await sut.onMemoriesCreate();

  expect(mocks.systemMetadata.set).not.toHaveBeenCalledWith(
    SystemMetadataKey.MemoriesState,
    expect.objectContaining({ lastRuleDate: '2026-04-23T00:00:00.000Z' }),
  );
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
```

Expected: the service unit tests fail because there is no rule cursor, no registry, and no orchestration; the medium birthday/trip tests still fail.

- [ ] **Step 3: Implement separate rule orchestration in `MemoryService`**

Update `server/src/services/memory.service.ts` with this structure:

```ts
import { BirthdayMemoryRule } from 'src/services/memory-rules/birthday.rule';
import { MemoryRule } from 'src/services/memory-rules/memory-rule.interface';
import { RecentTripMemoryRule } from 'src/services/memory-rules/recent-trip.rule';

const DAYS = 3;
const MAX_RULE_MEMORIES_PER_DAY = 2;

@Injectable()
export class MemoryService extends BaseService {
  @OnJob({ name: JobName.MemoryGenerate, queue: QueueName.BackgroundTask })
  async onMemoriesCreate() {
    const users = await this.userRepository.getList({ withDeleted: false });

    await this.databaseRepository.withLock(DatabaseLock.MemoryCreation, async () => {
      const today = DateTime.utc().startOf('day');
      const state = (await this.systemMetadataRepository.get(SystemMetadataKey.MemoriesState)) ?? {};
      const onThisDayStart = today.minus({ days: DAYS });
      const lastOnThisDayDate = state.lastOnThisDayDate ? DateTime.fromISO(state.lastOnThisDayDate) : onThisDayStart;
      const lastRuleDate = state.lastRuleDate ? DateTime.fromISO(state.lastRuleDate) : today.minus({ days: DAYS + 1 });

      for (let i = 0; i <= DAYS * 2; i++) {
        const target = onThisDayStart.plus({ days: i });
        if (lastOnThisDayDate >= target) {
          continue;
        }

        try {
          await Promise.all(users.map((owner) => this.createOnThisDayMemories(owner.id, target)));
        } catch (error) {
          this.logger.error(`Failed to create on-this-day memories for ${target.toISO()}: ${error}`);
        }

        state.lastOnThisDayDate = target.toISO();
        await this.systemMetadataRepository.set(SystemMetadataKey.MemoriesState, state);
      }

      for (let target = lastRuleDate.plus({ days: 1 }); target <= today; target = target.plus({ days: 1 })) {
        const results = await Promise.allSettled(users.map((owner) => this.createRuleMemories(owner.id, target)));
        const failures = results.filter((result) => result.status === 'rejected');
        if (failures.length > 0) {
          for (const failure of failures) {
            this.logger.error(`Failed to create rule memories for ${target.toISO()}: ${failure.reason}`);
          }

          break;
        }

        state.lastRuleDate = target.toISO();
        await this.systemMetadataRepository.set(SystemMetadataKey.MemoriesState, state);
      }
    });
  }

  protected getMemoryRules(): MemoryRule[] {
    return [
      new BirthdayMemoryRule(this.personRepository, this.assetRepository),
      new RecentTripMemoryRule(this.assetRepository, this.memoryRepository),
    ];
  }

  private async createRuleMemories(ownerId: string, target: DateTime) {
    const existingRuleMemories = await this.memoryRepository.search(ownerId, {
      type: MemoryType.Rule,
      for: target.toJSDate(),
    });
    const remainingSlots = Math.max(0, MAX_RULE_MEMORIES_PER_DAY - existingRuleMemories.length);

    if (remainingSlots === 0) {
      return;
    }

    const results = await Promise.allSettled(this.getMemoryRules().map((rule) => rule.evaluate({ ownerId, target })));
    const candidates = results.flatMap((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }

      this.logger.warn(`Failed memory rule evaluation: ${result.reason}`);
      return [];
    });

    const showAt = target.startOf('day').toJSDate();
    const hideAt = target.endOf('day').toJSDate();
    let inserted = 0;

    for (const candidate of candidates.sort((a, b) => b.score - a.score)) {
      if (inserted >= remainingSlots) {
        break;
      }

      const exists = await this.memoryRepository.hasRuleMemory(ownerId, candidate.ruleId, candidate.dedupeKey);
      if (exists) {
        continue;
      }

      await this.memoryRepository.create(
        {
          ownerId,
          type: MemoryType.Rule,
          data: {
            ruleId: candidate.ruleId,
            dedupeKey: candidate.dedupeKey,
            title: candidate.title,
            subtitle: candidate.subtitle,
            score: candidate.score,
            context: candidate.context,
          },
          memoryAt: candidate.memoryAt.toJSDate(),
          showAt,
          hideAt,
        },
        new Set(candidate.assetIds),
      );

      inserted++;
    }
  }
}
```

- [ ] **Step 4: Run the service unit tests and the medium memory-service tests**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts src/services/memory-rules/birthday.rule.spec.ts src/services/memory-rules/recent-trip.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
pnpm --filter immich check
```

Expected: the service unit tests pass, the medium birthday/trip tests pass, and the server type-check remains green.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add server/src/services/memory.service.ts server/src/services/memory.service.spec.ts server/test/medium/specs/services/memory.service.spec.ts
git commit -m "feat(server): orchestrate rule memory generation"
```

---

### Task 5: Regenerate OpenAPI And Teach Web To Prefer Server Titles

**Files:**

- Modify: `web/src/lib/utils.ts`
- Modify: `web/src/lib/utils.spec.ts`
- Regenerate: `open-api/typescript-sdk/src/fetch-client.ts`
- Regenerate: `mobile/openapi/lib/model/memory_response_dto.dart`
- Regenerate: `mobile/openapi/lib/model/memory_type.dart`

- [ ] **Step 1: Write the failing web title tests**

Append to `web/src/lib/utils.spec.ts`:

```ts
import { getMemoryTitle } from '$lib/utils';

describe(getMemoryTitle.name, () => {
  const translate = vi.fn((key: string, payload?: { values?: Record<string, number> }) => {
    if (key === 'years_ago') {
      return `${payload?.values?.years} years ago`;
    }

    return key;
  });

  it('prefers a server-supplied title when present', () => {
    expect(
      getMemoryTitle(
        {
          type: 'rule',
          title: 'Happy birthday, Alice',
          data: { title: 'Happy birthday, Alice' },
        } as any,
        translate as any,
        new Date('2026-04-23T00:00:00Z'),
      ),
    ).toBe('Happy birthday, Alice');
  });

  it('falls back to the localized on-this-day title when no server title exists', () => {
    expect(
      getMemoryTitle(
        {
          type: 'on_this_day',
          data: { year: 2024 },
        } as any,
        translate as any,
        new Date('2026-04-23T00:00:00Z'),
      ),
    ).toBe('2 years ago');
  });
});
```

- [ ] **Step 2: Run the web test to verify it fails**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich-web test -- --run src/lib/utils.spec.ts
```

Expected: the new test fails because `getMemoryTitle` does not exist yet.

- [ ] **Step 3: Regenerate the SDKs and implement the web helper**

Run codegen first:

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
make open-api
```

Expected: `open-api/typescript-sdk/src/fetch-client.ts` and `mobile/openapi/` refresh with generic memory data and optional `title` / `subtitle`.

Then update `web/src/lib/utils.ts`:

```ts
export const getMemoryTitle = (
  memory: MemoryResponseDto,
  translate: (id: string, options?: Record<string, unknown>) => string,
  now = new Date(),
) => {
  if (memory.title) {
    return memory.title;
  }

  if (memory.type === MemoryType.OnThisDay) {
    const year =
      typeof (memory.data as Record<string, unknown>).year === 'number'
        ? ((memory.data as Record<string, unknown>).year as number)
        : undefined;

    if (year !== undefined) {
      return translate('years_ago', { values: { years: now.getFullYear() - year } });
    }
  }

  return translate('unknown');
};

export const memoryLaneTitle = derived(t, ($t) => {
  return (memory: MemoryResponseDto) => getMemoryTitle(memory, $t);
});
```

- [ ] **Step 4: Run the web test and type-check**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich-web test -- --run src/lib/utils.spec.ts
pnpm --filter immich-web check
```

Expected: the new helper tests pass, and the web type-check passes against the regenerated SDK.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add web/src/lib/utils.ts web/src/lib/utils.spec.ts open-api/typescript-sdk/src/fetch-client.ts mobile/openapi
git commit -m "feat(web): render server-defined memory titles"
```

---

### Task 6: Update Mobile Drift Rendering And Keep Widgets On `on_this_day`

**Files:**

- Create: `mobile/test/domain/models/memory_model_test.dart`
- Modify: `mobile/test/domain/repositories/sync_stream_repository_test.dart`
- Create: `mobile/test/presentation/memory/memory_title_test.dart`
- Modify: `mobile/lib/domain/models/memory.model.dart`
- Modify: `mobile/lib/infrastructure/repositories/sync_stream.repository.dart`
- Modify: `mobile/lib/presentation/widgets/memory/memory_lane.widget.dart`
- Modify: `mobile/lib/presentation/pages/drift_memory.page.dart`
- Modify: `mobile/android/app/src/main/kotlin/app/alextran/immich/widget/ImmichAPI.kt`
- Modify: `mobile/ios/WidgetExtension/ImmichAPI.swift`

- [ ] **Step 1: Write the failing Dart tests**

Create `mobile/test/domain/models/memory_model_test.dart`:

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';

void main() {
  group('MemoryData', () {
    test('parses generic rule payloads without requiring a year', () {
      final data = MemoryData.fromMap({
        'ruleId': 'birthday',
        'title': 'Happy birthday, Alice',
        'subtitle': 'Photos from different years',
      });

      expect(data.year, isNull);
      expect(data.ruleId, 'birthday');
      expect(data.title, 'Happy birthday, Alice');
      expect(data.subtitle, 'Photos from different years');
      expect(data.toMap(), containsPair('ruleId', 'birthday'));
    });

    test('keeps on-this-day year access for legacy memories', () {
      final data = MemoryData.fromMap({'year': 2024});

      expect(data.year, 2024);
      expect(data.title, isNull);
    });
  });
}
```

Append to `mobile/test/domain/repositories/sync_stream_repository_test.dart`:

```dart
test('stores rule memories from sync without requiring year data', () async {
  await sut.updateUsersV1([_createUser()]);

  await sut.updateMemoriesV1([
    SyncMemoryV1(
      createdAt: DateTime(2026, 4, 23),
      data: {
        'ruleId': 'birthday',
        'title': 'Happy birthday, Alice',
        'subtitle': 'Photos from different years',
      },
      deletedAt: null,
      hideAt: DateTime(2026, 4, 23, 23, 59),
      id: 'memory-rule-1',
      isSaved: false,
      memoryAt: DateTime(2026, 4, 23),
      ownerId: 'user-1',
      seenAt: null,
      showAt: DateTime(2026, 4, 23),
      type: MemoryType.rule,
      updatedAt: DateTime(2026, 4, 23),
    ),
  ]);

  final query = db.memoryEntity.select()..where((tbl) => tbl.id.equals('memory-rule-1'));
  final row = await query.getSingle();

  expect(row.type, MemoryTypeEnum.rule);
  expect(row.data, contains('"title":"Happy birthday, Alice"'));
});
```

Create `mobile/test/presentation/memory/memory_title_test.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';
import 'package:immich_mobile/presentation/pages/drift_memory.page.dart' as drift_page;
import 'package:immich_mobile/presentation/widgets/memory/memory_lane.widget.dart' as memory_lane;

void main() {
  testWidgets('prefers server title and falls back gracefully when year is absent', (tester) async {
    late BuildContext context;
    await tester.pumpWidget(
      MaterialApp(
        home: Builder(
          builder: (ctx) {
            context = ctx;
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    final ruleMemory = DriftMemory(
      id: 'memory-rule-1',
      type: MemoryTypeEnum.rule,
      data: const MemoryData({
        'ruleId': 'birthday',
        'title': 'Happy birthday, Alice',
      }),
      createdAt: DateTime(2026, 4, 23),
      memoryAt: DateTime(2026, 4, 23),
      showAt: DateTime(2026, 4, 23),
      hideAt: DateTime(2026, 4, 23, 23, 59),
    );

    final unknownRuleMemory = DriftMemory(
      id: 'memory-rule-2',
      type: MemoryTypeEnum.rule,
      data: const MemoryData({'ruleId': 'recent_trip'}),
      createdAt: DateTime(2026, 4, 23),
      memoryAt: DateTime(2026, 4, 23),
      showAt: DateTime(2026, 4, 23),
      hideAt: DateTime(2026, 4, 23, 23, 59),
    );

    expect(memory_lane.getMemoryTitle(context, ruleMemory), 'Happy birthday, Alice');
    expect(drift_page.getMemoryTitle(context, unknownRuleMemory), isNotEmpty);
  });
}
```

- [ ] **Step 2: Run the Dart tests to verify they fail**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423/mobile
flutter test test/domain/models/memory_model_test.dart test/domain/repositories/sync_stream_repository_test.dart
flutter test test/presentation/memory/memory_title_test.dart
```

Expected: the data/sync tests fail because `MemoryData` still requires `year`, and `MemoryType.rule` is not mapped into Drift yet. The new title test may also fail until the generic title helpers exist.

- [ ] **Step 3: Implement generic mobile memory data and widget filtering**

Make these updates:

```dart
// mobile/lib/domain/models/memory.model.dart
enum MemoryTypeEnum {
  onThisDay,
  rule,
}

class MemoryData {
  final Map<String, dynamic> raw;

  const MemoryData(this.raw);

  int? get year => raw['year'] is int ? raw['year'] as int : (raw['year'] as num?)?.toInt();
  String? get ruleId => raw['ruleId'] as String?;
  String? get title => raw['title'] as String?;
  String? get subtitle => raw['subtitle'] as String?;

  Map<String, dynamic> toMap() => Map<String, dynamic>.from(raw);

  factory MemoryData.fromMap(Map<String, dynamic> map) => MemoryData(Map<String, dynamic>.from(map));

  String toJson() => json.encode(toMap());

  factory MemoryData.fromJson(String source) => MemoryData.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() => 'MemoryData(raw: $raw)';

  @override
  bool operator ==(covariant MemoryData other) {
    return const DeepCollectionEquality().equals(other.raw, raw);
  }

  @override
  int get hashCode => const DeepCollectionEquality().hash(raw);
}

// mobile/lib/infrastructure/repositories/sync_stream.repository.dart
extension on MemoryType {
  MemoryTypeEnum toMemoryType() => switch (this) {
    MemoryType.onThisDay => MemoryTypeEnum.onThisDay,
    MemoryType.rule => MemoryTypeEnum.rule,
    _ => throw Exception('Unknown MemoryType value: $this'),
  };
}

// mobile/lib/presentation/widgets/memory/memory_lane.widget.dart
String getMemoryTitle(BuildContext context, DriftMemory memory) {
  if (memory.data.title case final title?) {
    return title;
  }

  if (memory.data.year case final year?) {
    final yearsAgo = DateTime.now().year - year;
    return 'years_ago'.t(context: context, args: {'years': yearsAgo.toString()});
  }

  return 'memory'.t(context: context);
}

final title = getMemoryTitle(context, memory);

// mobile/lib/presentation/pages/drift_memory.page.dart
String getMemoryTitle(BuildContext context, DriftMemory memory) {
  if (memory.data.title case final title?) {
    return title;
  }

  if (memory.data.year case final year?) {
    final yearsAgo = DateTime.now().year - year;
    return 'years_ago'.t(context: context, args: {'years': yearsAgo.toString()});
  }

  return 'memory'.t(context: context);
}

final title = getMemoryTitle(context, memories[mIndex]);
```

Keep widgets on the old memory family by filtering their fetches:

```kotlin
// mobile/android/app/src/main/kotlin/app/alextran/immich/widget/ImmichAPI.kt
val url = buildRequestURL("/memories", listOf("for" to iso8601, "type" to "on_this_day"))
```

```swift
// mobile/ios/WidgetExtension/ImmichAPI.swift
let memoryParams = [
  URLQueryItem(name: "for", value: date.ISO8601Format()),
  URLQueryItem(name: "type", value: "on_this_day"),
]
```

- [ ] **Step 4: Run the mobile tests and analysis**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423/mobile
flutter test test/domain/models/memory_model_test.dart test/domain/repositories/sync_stream_repository_test.dart
flutter test test/presentation/memory/memory_title_test.dart
dart analyze --fatal-infos
cd android && ./gradlew :app:compileDebugKotlin
```

Expected: Flutter tests pass, `dart analyze` passes, and Android widget code compiles.

If running on macOS, also verify the iOS widget query-param change builds:

```bash
cd /tmp/gallery-memories-rules-exploration-20260423/mobile/ios
xcodebuild -workspace Runner.xcworkspace -scheme Runner -sdk iphonesimulator -quiet build
```

Expected: the iOS build succeeds; if Xcode is unavailable, record that the change was not locally compiled.

- [ ] **Step 5: Commit**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add mobile/test/domain/models/memory_model_test.dart mobile/test/domain/repositories/sync_stream_repository_test.dart mobile/test/presentation/memory/memory_title_test.dart mobile/lib/domain/models/memory.model.dart mobile/lib/infrastructure/repositories/sync_stream.repository.dart mobile/lib/presentation/widgets/memory/memory_lane.widget.dart mobile/lib/presentation/pages/drift_memory.page.dart mobile/android/app/src/main/kotlin/app/alextran/immich/widget/ImmichAPI.kt mobile/ios/WidgetExtension/ImmichAPI.swift
git commit -m "feat(mobile): render generic rule memories"
```

---

### Task 7: Regenerate SQL Snapshots And Run Final Verification

**Files:**

- Regenerate: `server/src/queries/asset.repository.sql`
- Regenerate: `server/src/queries/memory.repository.sql`
- Possibly regenerate: any other `server/src/queries/*.sql` files touched by the new `@GenerateSql` examples

- [ ] **Step 1: Regenerate SQL snapshots only if the dev DB is running**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
make sql
```

Expected: the `server/src/queries/*.sql` snapshots update for the new repository methods.

If the DB is not running, do not run `make sql`. Push the branch after Step 4, let CI produce the SQL diff, apply that diff locally, and then continue to Step 5 with the same commit message below.

- [ ] **Step 2: Run the focused server, web, and mobile verification suite**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
pnpm --filter immich test -- --run src/services/memory.service.spec.ts src/services/memory-rules/birthday.rule.spec.ts src/services/memory-rules/recent-trip.rule.spec.ts
pnpm --filter immich test:medium -- --run test/medium/specs/services/memory.service.spec.ts
pnpm --filter immich check
pnpm --filter immich-web test -- --run src/lib/utils.spec.ts
pnpm --filter immich-web check
cd /tmp/gallery-memories-rules-exploration-20260423/mobile && flutter test test/domain/models/memory_model_test.dart test/domain/repositories/sync_stream_repository_test.dart test/presentation/memory/memory_title_test.dart
cd /tmp/gallery-memories-rules-exploration-20260423/mobile && dart analyze --fatal-infos
```

Expected: all commands pass.

- [ ] **Step 3: Confirm the final diff is only the planned files**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git status --short
git diff --stat
```

Expected: only the server, web, mobile, generated OpenAPI, and generated SQL files from this plan are present.

- [ ] **Step 4: Commit the SQL snapshots and final integration cleanup**

```bash
cd /tmp/gallery-memories-rules-exploration-20260423
git add server/src/queries
git commit -m "chore(server): regenerate memory rule sql snapshots"
```

- [ ] **Step 5: Final smoke summary for the PR description**

Record these points in the PR body or handoff note:

```text
- Added generic rule memory pipeline with separate lastRuleDate cursor.
- lastRuleDate stays retry-safe: failed rule days rerun and dedupe prevents duplicates.
- Shipped birthday and recent_trip server rules.
- Rule display text lives in memory.data and mirrors to API title/subtitle.
- Web and mobile render server titles generically; on_this_day keeps localized fallback.
- Mobile widgets intentionally stay on on_this_day via type filter in v1.
- Verification: server unit + medium tests, web utils test + type-check, mobile tests + analyze.
```

No additional commit for this step.
