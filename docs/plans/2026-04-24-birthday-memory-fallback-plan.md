# Birthday Memory Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let birthday memories fall back to a `4`-photo single-year snapshot when the multi-year throwback path does not qualify, while keeping multi-year birthdays preferred.

**Architecture:** Keep all changes server-side. Preserve the existing throwback path in `BirthdayMemoryRule`, add a snapshot fallback path that only runs when throwback fails, and verify the new score ordering through unit and medium tests. The fallback path cannot reuse the current `2`-assets-per-year cap, or a single-year `4`-photo birthday can never qualify; instead, fallback should reuse the same repository query but select the `4` most recent qualifying assets overall. To keep birthday memories preferred without changing service orchestration, birthday scores should move into a dedicated band above the current `recent_trip` maximum, with throwback still above fallback.

**Tech Stack:** NestJS, Luxon, Vitest, medium Vitest integration tests, Kysely-backed repositories.

---

## File map

- Modify: `server/src/services/memory-rules/birthday.rule.ts`
  Keep the throwback path intact and add the snapshot fallback path plus explicit score ordering.
- Modify: `server/src/services/memory-rules/birthday.rule.spec.ts`
  Add focused rule-level coverage for fallback qualification, fallback rejection below threshold, and throwback preference.
- Modify: `server/src/services/memory.service.spec.ts`
  Add a service-level ranking regression proving fallback birthday wins when only one daily rule slot remains.
- Modify: `server/test/medium/specs/services/memory.service.spec.ts`
  Add a real-DB regression for the live Pierre shape: `4` face-linked photos from one year produce a birthday rule memory with the fallback subtitle.

## Preconditions

- Work from `/home/pierre/dev/gallery/.worktrees/memories-rules-exploration`.
- Keep untracked `.tmp/` and `web/.tmp/` untouched.
- Do not change repository queries, DTOs, web code, or mobile code in this task.

## Task 1: Add Birthday Rule Fallback And Rule-Level Coverage

**Files:**

- Modify: `server/src/services/memory-rules/birthday.rule.spec.ts`
- Modify: `server/src/services/memory-rules/birthday.rule.ts`

- [ ] **Step 1: Write the failing rule tests**

Append these tests to `server/src/services/memory-rules/birthday.rule.spec.ts`:

```ts
it('creates a snapshot fallback birthday candidate from four single-year assets', async () => {
  const personRepository = {
    getBirthdaysForDay: vi
      .fn()
      .mockResolvedValue([{ id: 'person-1', name: 'Pierre', birthDate: new Date('2025-04-24T00:00:00Z') }]),
  };
  const assetRepository = {
    getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
      { id: 'a-4', localDateTime: new Date('2026-04-18T15:25:11.543Z') },
      { id: 'a-3', localDateTime: new Date('2026-04-18T15:25:09.803Z') },
      { id: 'a-2', localDateTime: new Date('2026-04-18T15:25:08.244Z') },
      { id: 'a-1', localDateTime: new Date('2026-04-18T15:25:07.335Z') },
    ]),
  };

  const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
  const [candidate] = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
  });

  expect(candidate).toMatchObject({
    ruleId: 'birthday',
    dedupeKey: 'birthday:person-1:2026-04-24',
    title: 'Happy birthday, Pierre',
    subtitle: 'Recent photos of Pierre',
    score: 254,
    assetIds: ['a-4', 'a-3', 'a-2', 'a-1'],
    context: { personId: 'person-1', distinctYears: 1 },
  });
});

it('skips the snapshot fallback when only three single-year assets qualify', async () => {
  const personRepository = {
    getBirthdaysForDay: vi
      .fn()
      .mockResolvedValue([{ id: 'person-1', name: 'Pierre', birthDate: new Date('2025-04-24T00:00:00Z') }]),
  };
  const assetRepository = {
    getMemoryAssetsForPerson: vi.fn().mockResolvedValue([
      { id: 'a-3', localDateTime: new Date('2026-04-18T15:25:09.803Z') },
      { id: 'a-2', localDateTime: new Date('2026-04-18T15:25:08.244Z') },
      { id: 'a-1', localDateTime: new Date('2026-04-18T15:25:07.335Z') },
    ]),
  };

  const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);

  await expect(
    rule.evaluate({
      ownerId: 'user-1',
      target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
    }),
  ).resolves.toEqual([]);
});

it('prefers the throwback path over the snapshot fallback when multiple years qualify', async () => {
  const personRepository = {
    getBirthdaysForDay: vi
      .fn()
      .mockResolvedValue([{ id: 'person-1', name: 'Alice', birthDate: new Date('1990-04-24T00:00:00Z') }]),
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

  const rule = new BirthdayMemoryRule(personRepository as never, assetRepository as never);
  const candidates = await rule.evaluate({
    ownerId: 'user-1',
    target: DateTime.fromISO('2026-04-24', { zone: 'utc' }),
  });

  expect(candidates).toEqual([
    expect.objectContaining({
      subtitle: 'Photos from different years',
      score: 356,
      assetIds: ['a-2025-1', 'a-2025-2', 'a-2024-1', 'a-2023-1', 'a-2022-1', 'a-2021-1'],
    }),
  ]);
});
```

- [ ] **Step 2: Run the rule tests to verify the fallback cases fail**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/birthday.rule.spec.ts
```

Expected:

- the new `snapshot fallback` test fails because the rule currently requires `6` assets across `2` years
- the new `three single-year assets` test may pass already
- the existing throwback test still passes

- [ ] **Step 3: Implement the minimal birthday-rule change**

Replace the body of `evaluate()` in `server/src/services/memory-rules/birthday.rule.ts` with the following structure:

```ts
  async evaluate({ ownerId, target }: MemoryRuleContext): Promise<MemoryRuleCandidate[]> {
    const people = await this.personRepository.getBirthdaysForDay(ownerId, { month: target.month, day: target.day });
    const candidates: MemoryRuleCandidate[] = [];

    for (const person of people) {
      const assets = await this.assetRepository.getMemoryAssetsForPerson(
        ownerId,
        person.id,
        target.endOf('day').toJSDate(),
      );
      const byYear = new Map<number, string[]>();

      for (const asset of assets) {
        const year = DateTime.fromJSDate(asset.localDateTime, { zone: 'utc' }).year;
        const ids = byYear.get(year) ?? [];
        if (ids.length < 2) {
          ids.push(asset.id);
          byYear.set(year, ids);
        }
      }

      const throwbackAssetIds = [...byYear.keys()]
        .toSorted((a, b) => b - a)
        .flatMap((year) => byYear.get(year) ?? [])
        .slice(0, 12);

      if (throwbackAssetIds.length >= 6 && byYear.size >= 2) {
        candidates.push({
          ruleId: this.id,
          dedupeKey: `birthday:${person.id}:${target.toFormat('yyyy-MM-dd')}`,
          title: `Happy birthday, ${person.name}`,
          subtitle: 'Photos from different years',
          score: 300 + byYear.size * 10 + throwbackAssetIds.length,
          assetIds: throwbackAssetIds,
          memoryAt: target,
          context: { personId: person.id, distinctYears: byYear.size },
        });
        continue;
      }

      const fallbackAssetIds = [...assets]
        .toSorted((left, right) => right.localDateTime.getTime() - left.localDateTime.getTime())
        .slice(0, 4)
        .map(({ id }) => id);

      if (fallbackAssetIds.length < 4) {
        continue;
      }

      candidates.push({
        ruleId: this.id,
        dedupeKey: `birthday:${person.id}:${target.toFormat('yyyy-MM-dd')}`,
        title: `Happy birthday, ${person.name}`,
        subtitle: `Recent photos of ${person.name}`,
        score: 250 + fallbackAssetIds.length,
        assetIds: fallbackAssetIds,
        memoryAt: target,
        context: { personId: person.id, distinctYears: byYear.size },
      });
    }

    return candidates;
  }
```

- [ ] **Step 4: Re-run the rule tests**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/birthday.rule.spec.ts
```

Expected:

- all tests in `birthday.rule.spec.ts` pass
- the fallback test shows `score: 254`
- the throwback-preference test still returns only one candidate

- [ ] **Step 5: Commit the rule change**

```bash
git add server/src/services/memory-rules/birthday.rule.ts server/src/services/memory-rules/birthday.rule.spec.ts
git commit -m "feat(server): add birthday memory fallback"
```

## Task 2: Lock Ranking Through The Memory Service

**Files:**

- Modify: `server/src/services/memory.service.spec.ts`

- [ ] **Step 1: Write the failing service-level ranking test**

Append this test to the `describe('onMemoriesCreate')` block in `server/src/services/memory.service.spec.ts`:

```ts
it('prefers a fallback birthday candidate over recent trip when only one rule slot remains', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-04-24T12:00:00Z'));

  const user = factory.userAdmin();
  mocks.user.getList.mockResolvedValue([user]);
  mocks.systemMetadata.get.mockResolvedValue({
    lastOnThisDayDate: '2026-04-26T00:00:00.000Z',
    lastRuleDate: '2026-04-23T00:00:00.000Z',
  });
  mocks.asset.getByDayOfYear.mockResolvedValue([]);
  mocks.memory.search.mockResolvedValue([
    getForMemory(
      MemoryFactory.create({
        ownerId: user.id,
        type: MemoryType.Rule,
        memoryAt: new Date('2026-04-24T00:00:00Z'),
        data: {
          ruleId: 'existing',
          dedupeKey: 'existing',
          title: 'Existing',
        } satisfies RuleMemoryData,
      }),
    ),
  ]);
  mocks.memory.hasRuleMemory.mockResolvedValue(false);
  mocks.memory.create.mockResolvedValue(MemoryFactory.create() as any);

  const birthdayRule = {
    id: 'birthday',
    evaluate: vi.fn().mockResolvedValue([
      {
        ruleId: 'birthday',
        dedupeKey: 'birthday:person-1:2026-04-24',
        title: 'Happy birthday, Pierre',
        subtitle: 'Recent photos of Pierre',
        score: 254,
        assetIds: ['a-1', 'a-2', 'a-3', 'a-4'],
        memoryAt: DateTime.fromISO('2026-04-24T00:00:00Z'),
      },
    ]),
  };
  const recentTripRule = {
    id: 'recent_trip',
    evaluate: vi.fn().mockResolvedValue([
      {
        ruleId: 'recent_trip',
        dedupeKey: 'recent_trip:germany:nurnberg:2026-04-24',
        title: 'Recent trip to Nürnberg, Germany',
        subtitle: '20 photos over 30 days',
        score: 220,
        assetIds: ['t-1', 't-2', 't-3'],
        memoryAt: DateTime.fromISO('2026-04-24T00:00:00Z'),
      },
    ]),
  };

  vi.spyOn(sut as never, 'getMemoryRules').mockReturnValue([recentTripRule, birthdayRule] as never);

  await sut.onMemoriesCreate();

  expect(mocks.memory.create).toHaveBeenCalledTimes(1);
  expect(mocks.memory.create).toHaveBeenCalledWith(
    expect.objectContaining({
      ownerId: user.id,
      type: MemoryType.Rule,
      data: expect.objectContaining({
        ruleId: 'birthday',
        title: 'Happy birthday, Pierre',
        subtitle: 'Recent photos of Pierre',
        score: 254,
      }),
    }),
    new Set(['a-1', 'a-2', 'a-3', 'a-4']),
  );

  vi.useRealTimers();
});
```

- [ ] **Step 2: Run the focused service test**

Run:

```bash
pnpm --dir server test --run src/services/memory.service.spec.ts
```

Expected:

- the new ranking test fails before Task 1 is implemented
- after Task 1, it passes without further production changes

- [ ] **Step 3: Lock the score contract if the test still fails**

If the new test still fails after Task 1, keep the fallback score line in `server/src/services/memory-rules/birthday.rule.ts` exactly as:

```ts
        score: 250 + fallbackAssetIds.length,
```

Do not raise the throwback score above its current formula:

```ts
          score: 300 + byYear.size * 10 + throwbackAssetIds.length,
```

- [ ] **Step 4: Re-run the service test and the birthday rule test together**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/birthday.rule.spec.ts src/services/memory.service.spec.ts
```

Expected:

- both files pass
- the service test proves birthday wins when only one slot remains

- [ ] **Step 5: Commit the ranking regression**

```bash
git add server/src/services/memory.service.spec.ts server/src/services/memory-rules/birthday.rule.ts
git commit -m "test(server): cover birthday fallback ranking"
```

## Task 3: Add A Real-DB Pierre Regression

**Files:**

- Modify: `server/test/medium/specs/services/memory.service.spec.ts`

- [ ] **Step 1: Add the medium test for the live Pierre shape**

Append this test immediately after `it('creates a birthday rule memory on the birthday itself', ...)` in `server/test/medium/specs/services/memory.service.spec.ts`:

```ts
it('creates a fallback birthday memory from four single-year Pierre photos', async () => {
  const { sut, ctx } = setup();
  const assetRepo = ctx.get(AssetRepository);
  const memoryRepo = ctx.get(MemoryRepository);
  const now = DateTime.fromObject({ year: 2026, month: 4, day: 24 }, { zone: 'utc' }) as DateTime<true>;
  const { user } = await ctx.newUser();
  const { person } = await ctx.newPerson({
    ownerId: user.id,
    name: 'Pierre',
    birthDate: new Date('2025-04-24T00:00:00Z'),
  });

  const addPierreAsset = async (localDateTime: string) => {
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

  await addPierreAsset('2026-04-18T15:25:07.335Z');
  await addPierreAsset('2026-04-18T15:25:08.244Z');
  await addPierreAsset('2026-04-18T15:25:09.803Z');
  await addPierreAsset('2026-04-18T15:25:11.543Z');

  vi.setSystemTime(now.toJSDate());
  await sut.onMemoriesCreate();

  const memories = await memoryRepo.search(user.id, { type: MemoryType.Rule, for: now.toJSDate() });
  expect(memories).toEqual([
    expect.objectContaining({
      type: MemoryType.Rule,
      data: expect.objectContaining({
        ruleId: 'birthday',
        title: 'Happy birthday, Pierre',
        subtitle: 'Recent photos of Pierre',
      }),
      assets: expect.arrayContaining([
        expect.objectContaining({}),
        expect.objectContaining({}),
        expect.objectContaining({}),
        expect.objectContaining({}),
      ]),
    }),
  ]);
  expect(memories[0]?.assets).toHaveLength(4);
});
```

- [ ] **Step 2: Run the focused medium test file**

Run:

```bash
pnpm --dir server test:medium --run test/medium/specs/services/memory.service.spec.ts
```

Expected:

- the new Pierre regression fails before Task 1 is implemented
- after Task 1, the file passes and returns a fallback birthday memory with `4` assets

- [ ] **Step 3: If the medium test still fails, keep the fallback asset block exactly as written**

The medium regression should pass with the Task 1 implementation. If it does not, verify `server/src/services/memory-rules/birthday.rule.ts` still uses this exact fallback selection:

```ts
const fallbackAssetIds = [...assets]
  .toSorted((left, right) => right.localDateTime.getTime() - left.localDateTime.getTime())
  .slice(0, 4)
  .map(({ id }) => id);
```

Do not reintroduce the throwback `2`-per-year cap into the fallback branch.

- [ ] **Step 4: Run the full targeted verification set**

Run:

```bash
pnpm --dir server test --run src/services/memory-rules/birthday.rule.spec.ts src/services/memory.service.spec.ts
pnpm --dir server test:medium --run test/medium/specs/services/memory.service.spec.ts
```

Expected:

- both unit files pass
- the medium file passes
- no DTO, controller, or web tests need updates

- [ ] **Step 5: Commit the medium regression**

```bash
git add server/test/medium/specs/services/memory.service.spec.ts server/src/services/memory-rules/birthday.rule.ts
git commit -m "test(server): add Pierre birthday fallback regression"
```

## Self-check Against The Design

- Spec coverage:
  - fallback eligibility: Task 1
  - throwback remains preferred: Task 1
  - service-level ranking above `recent_trip`: Task 2
  - live Pierre regression: Task 3
- No placeholder scan:
  - all file paths are concrete
  - all test snippets are concrete
  - all commands are concrete
- Type consistency:
  - uses the existing `BirthdayMemoryRule`, `RuleMemoryData`, `MemoryType.Rule`, and `MemoryRepository.search()` shapes already present on `main`
