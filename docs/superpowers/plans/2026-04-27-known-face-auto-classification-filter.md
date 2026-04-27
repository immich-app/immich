# Known-Face Auto-Classification Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-category face exclusion rules to auto-classification so selected categories skip assets containing known human faces after facial recognition has completed.

**Architecture:** Store `faceExclusion` on each classification category in system config, defaulting old categories to `off`. Classification keeps one pass per asset: when any enabled category is face-aware, it waits for face detection and facial recognition queues to drain, loads one face summary for the asset, and skips only the categories whose rule matches. Existing auto-tags remain future-only.

**Tech Stack:** NestJS 11, TypeScript, Kysely, Zod DTO schemas, BullMQ queues, Vitest, Svelte 5, generated `@immich/sdk`, Docusaurus docs.

---

## File Structure

- Modify `server/src/config.ts`: add the classification face exclusion type and category field.
- Modify `server/src/dtos/system-config.dto.ts`: add Zod enum/default for `faceExclusion`.
- Modify `server/src/repositories/classification.repository.ts`: add the asset face summary query.
- Modify `server/src/repositories/job.repository.ts`: make `waitForQueueCompletion` wait on active, waiting, and delayed jobs.
- Create `server/src/repositories/job.repository.spec.ts`: unit-test queue wait semantics.
- Modify `server/src/services/classification.service.ts`: evaluate face-aware category eligibility, queue face work on forced scans, and keep current tag/archive behavior.
- Modify `server/src/services/classification.service.spec.ts`: cover face rules and wait behavior.
- Modify `server/test/medium/specs/repositories/classification.repository.spec.ts`: cover face summary booleans against real DB rows.
- Modify `open-api/immich-openapi-specs.json`, `open-api/typescript-sdk/src/fetch-client.ts`, `mobile/openapi/lib/model/system_config_classification_category_dto.dart`, and `mobile/openapi/lib/api.dart` after the schema change.
- Modify `web/src/routes/admin/system-settings/ClassificationSettings.svelte`: add the category face exclusion control and summary badge.
- Modify `web/src/routes/admin/system-settings/ClassificationSettings.spec.ts`: cover UI persistence and default display.
- Modify `docs/docs/features/auto-classification.md` and `docs/docs/install/config-file.md`: document the new field and future-only behavior.

---

### Task 1: Add Config And DTO Support

**Files:**

- Modify: `server/src/config.ts`
- Modify: `server/src/dtos/system-config.dto.ts`
- Test: `server/src/services/system-config.service.spec.ts`
- Test: `server/src/services/classification.service.spec.ts`

- [ ] **Step 1: Write the failing DTO/default tests**

Add this import in `server/src/services/system-config.service.spec.ts` if it is not already present:

```ts
import { SystemConfigSchema } from 'src/dtos/system-config.dto';
```

Add these tests near the existing classification config tests in `server/src/services/system-config.service.spec.ts`:

```ts
it('should default missing classification faceExclusion to off', () => {
  const result = SystemConfigSchema.parse({
    ...defaults,
    classification: {
      enabled: true,
      categories: [
        {
          name: 'Nature',
          prompts: ['a landscape photo'],
          similarity: 0.28,
          action: 'tag',
          enabled: true,
        },
      ],
    },
  });

  expect(result.classification.categories[0].faceExclusion).toBe('off');
});

it('should accept all classification faceExclusion modes', () => {
  const result = SystemConfigSchema.parse({
    ...defaults,
    classification: {
      enabled: true,
      categories: [
        {
          name: 'Any Assigned Face',
          prompts: ['a test prompt'],
          similarity: 0.28,
          action: 'tag',
          enabled: true,
          faceExclusion: 'any_assigned_face',
        },
        {
          name: 'Named People',
          prompts: ['a test prompt'],
          similarity: 0.28,
          action: 'tag',
          enabled: true,
          faceExclusion: 'named_people',
        },
        {
          name: 'Named Visible People',
          prompts: ['a test prompt'],
          similarity: 0.28,
          action: 'tag',
          enabled: true,
          faceExclusion: 'named_visible_people',
        },
      ],
    },
  });

  expect(result.classification.categories.map((category) => category.faceExclusion)).toEqual([
    'any_assigned_face',
    'named_people',
    'named_visible_people',
  ]);
});
```

Update the local helper in `server/src/services/classification.service.spec.ts` so later tests can use the new field:

```ts
const makeClassificationConfig = (
  categories: Array<{
    name: string;
    prompts: string[];
    similarity: number;
    action: string;
    enabled?: boolean;
    faceExclusion?: 'off' | 'any_assigned_face' | 'named_people' | 'named_visible_people';
  }> = [],
  enabled = true,
  facialRecognitionEnabled = true,
) => ({
  classification: {
    enabled,
    categories: categories.map((c) => ({ ...c, enabled: c.enabled ?? true, faceExclusion: c.faceExclusion ?? 'off' })),
  },
  machineLearning: {
    enabled: true,
    clip: { modelName: 'test-model' },
    facialRecognition: { enabled: facialRecognitionEnabled },
  },
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
cd server
pnpm test -- --run src/services/system-config.service.spec.ts src/services/classification.service.spec.ts
```

Expected: `system-config.service.spec.ts` fails because `faceExclusion` is not present on parsed categories.

- [ ] **Step 3: Add the config type**

In `server/src/config.ts`, add this exported type near the other config types:

```ts
export type ClassificationFaceExclusion = 'off' | 'any_assigned_face' | 'named_people' | 'named_visible_people';
```

In the `SystemConfig['classification']['categories']` item type, add:

```ts
faceExclusion: ClassificationFaceExclusion;
```

- [ ] **Step 4: Add the DTO schema default**

In `server/src/dtos/system-config.dto.ts`, add this schema immediately before `SystemConfigClassificationCategorySchema`:

```ts
const ClassificationFaceExclusionSchema = z
  .enum(['off', 'any_assigned_face', 'named_people', 'named_visible_people'])
  .default('off')
  .describe('Face exclusion rule for this classification category')
  .meta({ id: 'ClassificationFaceExclusion' });
```

Then add this field to `SystemConfigClassificationCategorySchema`:

```ts
    faceExclusion: ClassificationFaceExclusionSchema,
```

- [ ] **Step 5: Run the focused tests**

Run:

```bash
cd server
pnpm test -- --run src/services/system-config.service.spec.ts src/services/classification.service.spec.ts
```

Expected: both files pass.

- [ ] **Step 6: Commit**

Run:

```bash
git add server/src/config.ts server/src/dtos/system-config.dto.ts server/src/services/system-config.service.spec.ts server/src/services/classification.service.spec.ts
git commit -m "feat(server): add classification face exclusion config"
```

---

### Task 2: Add Asset Face Summary Query

**Files:**

- Modify: `server/src/repositories/classification.repository.ts`
- Test: `server/test/medium/specs/repositories/classification.repository.spec.ts`

- [ ] **Step 1: Write the failing medium tests**

Add `SourceType` to the enum import in `server/test/medium/specs/repositories/classification.repository.spec.ts`:

```ts
import { AssetVisibility, SourceType } from 'src/enum';
```

Add this `describe` block before `removeAutoTagAssignments`:

```ts
describe('getFaceSummary', () => {
  it('should return false booleans for an asset without assigned faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });

    await ctx.newAssetFace({ assetId: asset.id, personId: null });

    await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
      hasAssignedFace: false,
      hasNamedPerson: false,
      hasNamedVisiblePerson: false,
    });
  });

  it('should detect assigned, named, and visible named human faces', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: false, type: 'person' });

    await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
      hasAssignedFace: true,
      hasNamedPerson: true,
      hasNamedVisiblePerson: true,
    });
  });

  it('should detect hidden named people but exclude them from visible named people', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', isHidden: true, type: 'person' });

    await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
      hasAssignedFace: true,
      hasNamedPerson: true,
      hasNamedVisiblePerson: false,
    });
  });

  it('should treat assigned unnamed people as assigned but not named', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: '   ', isHidden: false, type: 'person' });

    await ctx.newAssetFace({ assetId: asset.id, personId: person.id });

    await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
      hasAssignedFace: true,
      hasNamedPerson: false,
      hasNamedVisiblePerson: false,
    });
  });

  it('should ignore invisible deleted and pet rows', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id });
    const { person } = await ctx.newPerson({ ownerId: user.id, name: 'Alice', type: 'person' });
    const { person: pet } = await ctx.newPerson({ ownerId: user.id, name: 'Spot', type: 'pet', species: 'dog' });

    await ctx.newAssetFace({ assetId: asset.id, personId: person.id, isVisible: false });
    await ctx.newAssetFace({ assetId: asset.id, personId: person.id, deletedAt: new Date() });
    await ctx.newAssetFace({ assetId: asset.id, personId: pet.id, sourceType: SourceType.MachineLearning });

    await expect(sut.getFaceSummary(asset.id)).resolves.toEqual({
      hasAssignedFace: false,
      hasNamedPerson: false,
      hasNamedVisiblePerson: false,
    });
  });
});
```

- [ ] **Step 2: Run the medium test to verify it fails**

Run:

```bash
cd server
pnpm test:medium -- --run test/medium/specs/repositories/classification.repository.spec.ts
```

Expected: FAIL with `sut.getFaceSummary is not a function`.

- [ ] **Step 3: Add the repository method**

In `server/src/repositories/classification.repository.ts`, add this exported interface above the class:

```ts
export interface ClassificationFaceSummary {
  hasAssignedFace: boolean;
  hasNamedPerson: boolean;
  hasNamedVisiblePerson: boolean;
}
```

Add this method to `ClassificationRepository`:

```ts
  async getFaceSummary(assetId: string): Promise<ClassificationFaceSummary> {
    const row = await this.db
      .selectFrom('asset_face')
      .innerJoin('person', 'person.id', 'asset_face.personId')
      .select([
        sql<boolean>`count(*) > 0`.as('hasAssignedFace'),
        sql<boolean>`count(*) filter (where btrim("person"."name") != '') > 0`.as('hasNamedPerson'),
        sql<boolean>`count(*) filter (where btrim("person"."name") != '' and "person"."isHidden" is false) > 0`.as(
          'hasNamedVisiblePerson',
        ),
      ])
      .where('asset_face.assetId', '=', assetId)
      .where('asset_face.deletedAt', 'is', null)
      .where('asset_face.isVisible', 'is', true)
      .where('asset_face.personId', 'is not', null)
      .where('person.type', '=', 'person')
      .executeTakeFirst();

    return {
      hasAssignedFace: row?.hasAssignedFace ?? false,
      hasNamedPerson: row?.hasNamedPerson ?? false,
      hasNamedVisiblePerson: row?.hasNamedVisiblePerson ?? false,
    };
  }
```

The file already imports `sql` from Kysely. If it does not after rebasing, use:

```ts
import { Kysely, sql } from 'kysely';
```

- [ ] **Step 4: Run the medium test**

Run:

```bash
cd server
pnpm test:medium -- --run test/medium/specs/repositories/classification.repository.spec.ts
```

Expected: PASS for `classification.repository.spec.ts`.

- [ ] **Step 5: Commit**

Run:

```bash
git add server/src/repositories/classification.repository.ts server/test/medium/specs/repositories/classification.repository.spec.ts
git commit -m "feat(server): summarize faces for classification"
```

---

### Task 3: Make Queue Waiting Use Pending Counts

**Files:**

- Modify: `server/src/repositories/job.repository.ts`
- Create: `server/src/repositories/job.repository.spec.ts`
- Test: `server/src/services/person.service.spec.ts`
- Test: `server/src/repositories/job.repository.spec.ts`

- [ ] **Step 1: Write the failing JobRepository unit tests**

Create `server/src/repositories/job.repository.spec.ts`:

```ts
import { ModuleRef } from '@nestjs/core';
import { QueueName } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobCounts } from 'src/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const emptyCounts = (): JobCounts => ({
  active: 0,
  completed: 0,
  failed: 0,
  delayed: 0,
  waiting: 0,
  paused: 0,
});

const setup = (counts: JobCounts[]) => {
  const queue = {
    getJobCounts: vi.fn().mockResolvedValue(emptyCounts()),
    isPaused: vi.fn().mockResolvedValue(false),
  };

  for (const value of counts) {
    queue.getJobCounts.mockResolvedValueOnce(value);
  }

  const moduleRef = { get: vi.fn().mockReturnValue(queue) } as unknown as ModuleRef;
  const logger = {
    setContext: vi.fn(),
    verbose: vi.fn(),
    warn: vi.fn(),
  } as unknown as LoggingRepository;

  const sut = new JobRepository(moduleRef, {} as ConfigRepository, {} as EventRepository, logger);

  return { sut, queue, logger };
};

describe(JobRepository.name, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return immediately when queues have no active waiting or delayed jobs', async () => {
    const { sut, queue } = setup([emptyCounts()]);

    await sut.waitForQueueCompletion(QueueName.FaceDetection);

    expect(queue.getJobCounts).toHaveBeenCalledTimes(1);
  });

  it('should wait while a queue has waiting jobs', async () => {
    const { sut, queue } = setup([{ ...emptyCounts(), waiting: 1 }, emptyCounts()]);

    const promise = sut.waitForQueueCompletion(QueueName.FaceDetection);
    expect(queue.getJobCounts).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(queue.getJobCounts).toHaveBeenCalledTimes(2);
  });

  it('should wait while a queue has delayed jobs', async () => {
    const { sut, queue } = setup([{ ...emptyCounts(), delayed: 1 }, emptyCounts()]);

    const promise = sut.waitForQueueCompletion(QueueName.FacialRecognition);
    expect(queue.getJobCounts).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(queue.getJobCounts).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the repository test to verify it fails**

Run:

```bash
cd server
pnpm test -- --run src/repositories/job.repository.spec.ts
```

Expected: FAIL because the current helper checks only active jobs and does not wait on waiting or delayed jobs.

- [ ] **Step 3: Update `waitForQueueCompletion`**

In `server/src/repositories/job.repository.ts`, replace the current `waitForQueueCompletion` method with:

```ts
  async waitForQueueCompletion(...queues: QueueName[]): Promise<void> {
    const getPending = async () => {
      const results = await Promise.all(
        queues.map(async (name) => {
          const [counts, paused] = await Promise.all([this.getJobCounts(name), this.isPaused(name)]);
          const pending = counts.active + counts.waiting + counts.delayed;
          return { counts, name, paused, pending };
        }),
      );

      return results.filter(({ pending }) => pending > 0);
    };

    let pending = await getPending();

    while (pending.length > 0) {
      const blocked = pending[0];
      const message =
        `Waiting for ${blocked.name} queue to finish ` +
        `(${blocked.counts.active} active, ${blocked.counts.waiting} waiting, ${blocked.counts.delayed} delayed)`;

      if (blocked.paused) {
        this.logger.warn(`${message}; queue is paused`);
      } else {
        this.logger.verbose(`${message}...`);
      }

      await setTimeout(1000);
      pending = await getPending();
    }
  }
```

- [ ] **Step 4: Run the focused tests**

Run:

```bash
cd server
pnpm test -- --run src/repositories/job.repository.spec.ts src/services/person.service.spec.ts
```

Expected: both files pass.

- [ ] **Step 5: Commit**

Run:

```bash
git add server/src/repositories/job.repository.ts server/src/repositories/job.repository.spec.ts
git commit -m "fix(server): wait for pending queue jobs"
```

---

### Task 4: Apply Face Exclusion In Classification Service

**Files:**

- Modify: `server/src/services/classification.service.ts`
- Modify: `server/src/services/classification.service.spec.ts`
- Test: `server/src/services/classification.service.spec.ts`

- [ ] **Step 1: Write failing service tests**

In `server/src/services/classification.service.spec.ts`, add these tests inside `describe('handleClassify', () => { ... })` after the disabled category tests:

```ts
it('should not wait for face queues or load face summary when all enabled categories are face exclusion off', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
  mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Sunsets' } as any);
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'Sunsets',
        prompts: ['sunset sky'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'off',
      },
    ]),
  );

  await sut.handleClassify({ id: 'asset-1' });

  expect(mocks.job.waitForQueueCompletion).not.toHaveBeenCalled();
  expect(mocks.classification.getFaceSummary).not.toHaveBeenCalled();
});

it('should skip any_assigned_face category when the asset has an assigned face', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
  mocks.classification.getFaceSummary.mockResolvedValue({
    hasAssignedFace: true,
    hasNamedPerson: false,
    hasNamedVisiblePerson: false,
  });
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'any_assigned_face',
      },
      {
        name: 'Screenshots',
        prompts: ['a screenshot'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'off',
      },
    ]),
  );

  await sut.handleClassify({ id: 'asset-1' });

  expect(mocks.job.waitForQueueCompletion).toHaveBeenCalledWith(QueueName.FaceDetection, QueueName.FacialRecognition);
  expect(mocks.job.waitForQueueCompletion.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.classification.getFaceSummary.mock.invocationCallOrder[0],
  );
  expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
  expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a screenshot', { modelName: 'test-model' });
});

it('should skip named_people category only when a named person exists', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
  mocks.classification.getFaceSummary.mockResolvedValue({
    hasAssignedFace: true,
    hasNamedPerson: false,
    hasNamedVisiblePerson: false,
  });
  mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/People' } as any);
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'named_people',
      },
    ]),
  );

  await sut.handleClassify({ id: 'asset-1' });

  expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a portrait', { modelName: 'test-model' });
  expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-id', assetId: 'asset-1' }]);
});

it('should skip named_people category when a named person exists', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.classification.getFaceSummary.mockResolvedValue({
    hasAssignedFace: true,
    hasNamedPerson: true,
    hasNamedVisiblePerson: true,
  });
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'named_people',
      },
    ]),
  );

  const result = await sut.handleClassify({ id: 'asset-1' });

  expect(result).toBe(JobStatus.Skipped);
  expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
  expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
  expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
});

it('should ignore hidden named people for named_visible_people', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
  mocks.classification.getFaceSummary.mockResolvedValue({
    hasAssignedFace: true,
    hasNamedPerson: true,
    hasNamedVisiblePerson: false,
  });
  mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/People' } as any);
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'named_visible_people',
      },
    ]),
  );

  await sut.handleClassify({ id: 'asset-1' });

  expect(mocks.tag.upsertAssetIds).toHaveBeenCalledWith([{ tagId: 'tag-id', assetId: 'asset-1' }]);
});

it('should skip named_visible_people category when a visible named person exists', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.classification.getFaceSummary.mockResolvedValue({
    hasAssignedFace: true,
    hasNamedPerson: true,
    hasNamedVisiblePerson: true,
  });
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'named_visible_people',
      },
    ]),
  );

  const result = await sut.handleClassify({ id: 'asset-1' });

  expect(result).toBe(JobStatus.Skipped);
  expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
  expect(mocks.tag.upsertAssetIds).not.toHaveBeenCalled();
  expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
});

it('should skip face-aware categories when facial recognition is disabled and still classify off categories', async () => {
  mocks.asset.getById.mockResolvedValue({
    id: 'asset-1',
    ownerId: 'user-1',
    visibility: AssetVisibility.Timeline,
  } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  mocks.machineLearning.encodeText.mockResolvedValue('[1,0,0]');
  mocks.tag.upsertValue.mockResolvedValue({ id: 'tag-id', value: 'Auto/Screenshots' } as any);
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig(
      [
        {
          name: 'People',
          prompts: ['a portrait'],
          similarity: 0.8,
          action: 'tag',
          faceExclusion: 'named_people',
        },
        {
          name: 'Screenshots',
          prompts: ['a screenshot'],
          similarity: 0.8,
          action: 'tag',
          faceExclusion: 'off',
        },
      ],
      true,
      false,
    ),
  );

  await sut.handleClassify({ id: 'asset-1' });

  expect(mocks.job.waitForQueueCompletion).not.toHaveBeenCalled();
  expect(mocks.classification.getFaceSummary).not.toHaveBeenCalled();
  expect(mocks.machineLearning.encodeText).toHaveBeenCalledTimes(1);
  expect(mocks.machineLearning.encodeText).toHaveBeenCalledWith('a screenshot', { modelName: 'test-model' });
});

it('should mark classified when all enabled categories require disabled facial recognition', async () => {
  mocks.asset.getById.mockResolvedValue({ id: 'asset-1', ownerId: 'user-1' } as any);
  mocks.search.getEmbedding.mockResolvedValue('[1,0,0]' as any);
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig(
      [
        {
          name: 'People',
          prompts: ['a portrait'],
          similarity: 0.8,
          action: 'tag',
          faceExclusion: 'named_people',
        },
      ],
      true,
      false,
    ),
  );

  const result = await sut.handleClassify({ id: 'asset-1' });

  expect(result).toBe(JobStatus.Skipped);
  expect(mocks.classification.setClassifiedAt).toHaveBeenCalledWith('asset-1');
  expect(mocks.machineLearning.encodeText).not.toHaveBeenCalled();
});
```

Add these tests inside `describe('handleClassifyQueueAll', () => { ... })`:

```ts
it('should queue face work before forced classification when enabled categories are face-aware', async () => {
  mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream([{ id: 'asset-1', ownerId: 'user-1' }]));
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig([
      {
        name: 'People',
        prompts: ['a portrait'],
        similarity: 0.8,
        action: 'tag',
        faceExclusion: 'named_people',
      },
    ]),
  );

  await sut.handleClassifyQueueAll({ force: true });

  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.AssetDetectFacesQueueAll,
    data: { force: true },
  });
  expect(mocks.job.queue).toHaveBeenCalledWith({
    name: JobName.FacialRecognitionQueueAll,
    data: { force: true },
  });
  expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetClassify, data: { id: 'asset-1' } }]);
});

it('should not queue face work before forced classification when facial recognition is disabled', async () => {
  mocks.classification.streamUnclassifiedAssets.mockReturnValue(makeStream([{ id: 'asset-1', ownerId: 'user-1' }]));
  sut['getConfig'] = vi.fn().mockResolvedValue(
    makeClassificationConfig(
      [
        {
          name: 'People',
          prompts: ['a portrait'],
          similarity: 0.8,
          action: 'tag',
          faceExclusion: 'named_people',
        },
      ],
      true,
      false,
    ),
  );

  await sut.handleClassifyQueueAll({ force: true });

  expect(mocks.job.queue).not.toHaveBeenCalledWith({
    name: JobName.AssetDetectFacesQueueAll,
    data: { force: true },
  });
  expect(mocks.job.queue).not.toHaveBeenCalledWith({
    name: JobName.FacialRecognitionQueueAll,
    data: { force: true },
  });
  expect(mocks.job.queueAll).toHaveBeenCalledWith([{ name: JobName.AssetClassify, data: { id: 'asset-1' } }]);
});
```

Add this regression test inside `describe('onConfigUpdate', () => { ... })` to lock in the future-only rule:

```ts
it('should not clean up tags when only face exclusion changes', async () => {
  const oldConfig = makeClassificationConfig([
    { name: 'Screenshots', prompts: ['screenshot'], similarity: 0.28, action: 'tag', faceExclusion: 'off' },
  ]);
  const newConfig = makeClassificationConfig([
    {
      name: 'Screenshots',
      prompts: ['screenshot'],
      similarity: 0.28,
      action: 'tag',
      faceExclusion: 'named_people',
    },
  ]);

  await sut.onConfigUpdate({ oldConfig, newConfig } as any);

  expect(mocks.classification.removeAutoTagAssignments).not.toHaveBeenCalled();
  expect(mocks.systemMetadata.set).toHaveBeenCalledWith(
    SystemMetadataKey.ClassificationConfigState,
    newConfig.classification,
  );
});
```

Add `QueueName` to the enum import at the top of the spec:

```ts
import { AssetVisibility, JobName, JobStatus, QueueName, SystemMetadataKey } from 'src/enum';
```

- [ ] **Step 2: Run the classification service spec to verify failures**

Run:

```bash
cd server
pnpm test -- --run src/services/classification.service.spec.ts
```

Expected: FAIL because `getFaceSummary` is not used and face queue waiting is not implemented.

- [ ] **Step 3: Add imports and helpers to ClassificationService**

In `server/src/services/classification.service.ts`, update imports:

```ts
import { type ClassificationFaceExclusion, type SystemConfig } from 'src/config';
import { type ClassificationFaceSummary } from 'src/repositories/classification.repository';
import { isFacialRecognitionEnabled } from 'src/utils/misc';
```

Add these helper methods inside `ClassificationService` before `parseEmbedding`:

```ts
  private getFaceExclusion(category: ClassificationConfig['categories'][number]): ClassificationFaceExclusion {
    return category.faceExclusion ?? 'off';
  }

  private isFaceAwareCategory(category: ClassificationConfig['categories'][number]) {
    return this.getFaceExclusion(category) !== 'off';
  }

  private matchesFaceExclusion(rule: ClassificationFaceExclusion, summary: ClassificationFaceSummary) {
    switch (rule) {
      case 'any_assigned_face': {
        return summary.hasAssignedFace;
      }
      case 'named_people': {
        return summary.hasNamedPerson;
      }
      case 'named_visible_people': {
        return summary.hasNamedVisiblePerson;
      }
      case 'off': {
        return false;
      }
    }
  }

  private async getEligibleCategories(
    categories: ClassificationConfig['categories'],
    machineLearning: SystemConfig['machineLearning'],
    assetId: string,
  ) {
    const faceAwareCategories = categories.filter((category) => this.isFaceAwareCategory(category));
    if (faceAwareCategories.length === 0) {
      return categories;
    }

    if (!isFacialRecognitionEnabled(machineLearning)) {
      return categories.filter((category) => !this.isFaceAwareCategory(category));
    }

    await this.jobRepository.waitForQueueCompletion(QueueName.FaceDetection, QueueName.FacialRecognition);
    const faceSummary = await this.classificationRepository.getFaceSummary(assetId);

    return categories.filter((category) => !this.matchesFaceExclusion(this.getFaceExclusion(category), faceSummary));
  }
```

- [ ] **Step 4: Use eligible categories in `handleClassify`**

In `handleClassify`, replace:

```ts
    const enabledCategories = classification.categories.filter((c) => c.enabled);
    if (enabledCategories.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const assetEmbedding = this.parseEmbedding(embedding);
    let shouldArchive = false;

    for (const category of enabledCategories) {
```

with:

```ts
    const enabledCategories = classification.categories.filter((c) => c.enabled);
    if (enabledCategories.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const eligibleCategories = await this.getEligibleCategories(enabledCategories, machineLearning, id);
    if (eligibleCategories.length === 0) {
      await this.classificationRepository.setClassifiedAt(id);
      return JobStatus.Skipped;
    }

    const assetEmbedding = this.parseEmbedding(embedding);
    let shouldArchive = false;

    for (const category of eligibleCategories) {
```

- [ ] **Step 5: Queue face work during forced scans**

In `handleClassifyQueueAll`, change the first config read from:

```ts
const { classification } = await this.getConfig({ withCache: true });
```

to:

```ts
const { classification, machineLearning } = await this.getConfig({ withCache: true });
```

Then, after the `force` reset block and before streaming unclassified assets, add:

```ts
const faceAwareCategories = classification.categories.filter(
  (category) => category.enabled && this.isFaceAwareCategory(category),
);

if (force && faceAwareCategories.length > 0 && isFacialRecognitionEnabled(machineLearning)) {
  await this.jobRepository.queue({ name: JobName.AssetDetectFacesQueueAll, data: { force: true } });
  await this.jobRepository.queue({ name: JobName.FacialRecognitionQueueAll, data: { force: true } });
}
```

- [ ] **Step 6: Run the focused service tests**

Run:

```bash
cd server
pnpm test -- --run src/services/classification.service.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add server/src/services/classification.service.ts server/src/services/classification.service.spec.ts
git commit -m "feat(server): apply classification face exclusion"
```

---

### Task 5: Regenerate OpenAPI And SDK

**Files:**

- Modify: `open-api/immich-openapi-specs.json`
- Modify: `open-api/typescript-sdk/src/fetch-client.ts`
- Modify: `mobile/openapi/lib/model/system_config_classification_category_dto.dart`
- Modify: `mobile/openapi/lib/api.dart`
- Test: generated TypeScript SDK build

- [ ] **Step 1: Regenerate OpenAPI clients**

Run:

```bash
make open-api
```

Expected: OpenAPI generation completes without errors and generated schemas include `faceExclusion`.

- [ ] **Step 2: Build the TypeScript SDK**

Run:

```bash
make build-sdk
```

Expected: `@immich/sdk` builds successfully.

- [ ] **Step 3: Inspect generated changes**

Run:

```bash
git status --short
git diff -- open-api mobile/openapi | sed -n '1,220p'
```

Expected: generated files show the new `faceExclusion` schema/property and no unrelated hand edits.

- [ ] **Step 4: Commit**

Run:

```bash
git add open-api mobile/openapi
git commit -m "chore(openapi): regenerate classification face exclusion clients"
```

---

### Task 6: Add Web Face Exclusion Control

**Files:**

- Modify: `web/src/routes/admin/system-settings/ClassificationSettings.svelte`
- Modify: `web/src/routes/admin/system-settings/ClassificationSettings.spec.ts`
- Test: `web/src/routes/admin/system-settings/ClassificationSettings.spec.ts`

- [ ] **Step 1: Write failing web tests**

In `web/src/routes/admin/system-settings/ClassificationSettings.spec.ts`, update `makeCategory` so old test data has the generated field:

```ts
  faceExclusion: 'off',
```

Add these tests before the config-file disabled test:

```ts
it('should show face exclusion dropdown when creating a category', async () => {
  render(ClassificationSettings);
  await waitFor(() => {
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByText('Add Category'));

  expect(screen.getByLabelText('Face exclusion')).toBeInTheDocument();
  expect(screen.getByLabelText('Face exclusion')).toHaveValue('off');
});

it('should save selected face exclusion for a new category', async () => {
  render(ClassificationSettings);
  await waitFor(() => {
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByText('Add Category'));
  await fireEvent.input(screen.getByLabelText('Name'), { target: { value: 'Nature' } });
  await fireEvent.input(screen.getByLabelText('Prompts (one per line)'), { target: { value: 'a landscape photo' } });
  await fireEvent.change(screen.getByLabelText('Face exclusion'), { target: { value: 'named_visible_people' } });
  await fireEvent.click(screen.getByText('Save'));

  await waitFor(() => {
    expect(updateConfig).toHaveBeenCalledWith({
      systemConfigDto: expect.objectContaining({
        classification: expect.objectContaining({
          categories: [
            expect.objectContaining({
              name: 'Nature',
              faceExclusion: 'named_visible_people',
            }),
          ],
        }),
      }),
    });
  });
});

it('should default old categories without faceExclusion to Off in the editor', async () => {
  vi.mocked(getConfig).mockResolvedValue(
    makeConfig([
      {
        name: 'Legacy',
        prompts: ['legacy prompt'],
        similarity: 0.28,
        action: Action.Tag,
        enabled: true,
      } as SystemConfigDto['classification']['categories'][number],
    ]),
  );

  render(ClassificationSettings);
  await waitFor(() => {
    expect(screen.getByText('Legacy')).toBeInTheDocument();
  });

  await fireEvent.click(screen.getByLabelText('Edit'));

  expect(screen.getByLabelText('Face exclusion')).toHaveValue('off');
});

it('should show non-Off face exclusion in the category summary', async () => {
  vi.mocked(getConfig).mockResolvedValue(makeConfig([makeCategory({ faceExclusion: 'named_people' })]));

  render(ClassificationSettings);
  await waitFor(() => {
    expect(screen.getByText('Named people')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the web spec to verify it fails**

Run:

```bash
cd web
pnpm exec vitest run src/routes/admin/system-settings/ClassificationSettings.spec.ts
```

Expected: FAIL because the Face exclusion control and summary are not rendered.

- [ ] **Step 3: Add component state and labels**

In `web/src/routes/admin/system-settings/ClassificationSettings.svelte`, add:

```ts
type FaceExclusion = NonNullable<Category['faceExclusion']>;
```

Add state next to the other form state:

```ts
let formFaceExclusion: FaceExclusion = $state('off');
```

Add labels after `actionLabels`:

```ts
const faceExclusionLabels: Record<FaceExclusion, string> = {
  off: 'Off',
  any_assigned_face: 'Any assigned face',
  named_people: 'Named people',
  named_visible_people: 'Named, visible people',
};
```

Add a normalizer helper:

```ts
const getFaceExclusion = (category: Partial<Category>): FaceExclusion => category.faceExclusion ?? 'off';
```

- [ ] **Step 4: Wire form create/edit/save state**

In `startCreate`, add:

```ts
formFaceExclusion = 'off';
```

In `startEdit`, add:

```ts
formFaceExclusion = getFaceExclusion(category);
```

In the `category` object inside `handleSave`, add:

```ts
        faceExclusion: formFaceExclusion,
```

- [ ] **Step 5: Render the dropdown**

In the form markup, place this block after the Action `<select>` block:

```svelte
        <div>
          <label for="category-face-exclusion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Face exclusion
          </label>
          <select
            id="category-face-exclusion"
            bind:value={formFaceExclusion}
            {disabled}
            class="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-immich-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="off">{faceExclusionLabels.off}</option>
            <option value="any_assigned_face">{faceExclusionLabels.any_assigned_face}</option>
            <option value="named_people">{faceExclusionLabels.named_people}</option>
            <option value="named_visible_people">{faceExclusionLabels.named_visible_people}</option>
          </select>
        </div>
```

- [ ] **Step 6: Render the summary badge**

In the category summary row, after the action badge, add:

```svelte
                {#if getFaceExclusion(category) !== 'off'}
                  <span
                    class="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                  >
                    {faceExclusionLabels[getFaceExclusion(category)]}
                  </span>
                {/if}
```

- [ ] **Step 7: Run the web spec**

Run:

```bash
cd web
pnpm exec vitest run src/routes/admin/system-settings/ClassificationSettings.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add web/src/routes/admin/system-settings/ClassificationSettings.svelte web/src/routes/admin/system-settings/ClassificationSettings.spec.ts
git commit -m "feat(web): add classification face exclusion setting"
```

---

### Task 7: Update Docs

**Files:**

- Modify: `docs/docs/features/auto-classification.md`
- Modify: `docs/docs/install/config-file.md`

- [ ] **Step 1: Update auto-classification feature docs**

In `docs/docs/features/auto-classification.md`, add this section after the category action explanation:

```md
### Face exclusion

Each category can optionally skip assets that contain known human faces. This is useful when a category should classify non-personal images, such as receipts, nature photos, or screenshots, without tagging genuine photos of people.

The **Face exclusion** setting has four modes:

| Mode                  | Behavior                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------- |
| Off                   | Classifies assets as usual.                                                                        |
| Any assigned face     | Skips the category when the asset has a visible face assigned to a person cluster.                 |
| Named people          | Skips the category when the asset has a visible face assigned to a named person.                   |
| Named, visible people | Skips the category when the asset has a visible face assigned to a named person who is not hidden. |

Face-aware categories require facial recognition. If facial recognition is disabled, Gallery skips those categories instead of treating the asset as safe to classify. Categories set to **Off** continue to run normally.

Face exclusion is future-only. Changing the setting does not remove existing `Auto/...` tags, and later face recognition, person naming, hiding, or merging does not clean up old tags automatically. Run **Scan All Libraries** after changing rules if you want assets to be evaluated again under the new settings; a forced scan can add new matches, but it still does not remove old `Auto/...` tags that are now excluded.
```

- [ ] **Step 2: Update config-file docs**

In `docs/docs/install/config-file.md`, update the classification category example to include:

```json
"faceExclusion": "off"
```

Add this field reference near the classification config explanation:

```md
`faceExclusion` controls whether the category skips assets with known human faces. Valid values are:

- `off`
- `any_assigned_face`
- `named_people`
- `named_visible_people`

Face-aware categories require facial recognition. When facial recognition is disabled, categories with a non-`off` `faceExclusion` value are skipped.
```

- [ ] **Step 3: Format docs**

Run:

```bash
pnpm --filter documentation run format:fix
```

Expected: Prettier completes and only docs formatting changes remain.

- [ ] **Step 4: Commit**

Run:

```bash
git add docs/docs/features/auto-classification.md docs/docs/install/config-file.md
git commit -m "docs: explain classification face exclusion"
```

---

### Task 8: Final Verification

**Files:**

- No planned source edits unless verification exposes a defect.

- [ ] **Step 1: Run server unit tests touched by the feature**

Run:

```bash
cd server
pnpm test -- --run src/services/classification.service.spec.ts src/services/system-config.service.spec.ts src/repositories/job.repository.spec.ts src/services/person.service.spec.ts
```

Expected: all selected server unit test files pass.

- [ ] **Step 2: Run classification repository medium test**

Run:

```bash
cd server
pnpm test:medium -- --run test/medium/specs/repositories/classification.repository.spec.ts
```

Expected: the medium repository spec passes.

- [ ] **Step 3: Run web classification settings test**

Run:

```bash
cd web
pnpm exec vitest run src/routes/admin/system-settings/ClassificationSettings.spec.ts
```

Expected: the web spec passes.

- [ ] **Step 4: Run type checks for changed packages**

Run:

```bash
make check-server
make check-web
```

Expected: both checks complete successfully.

- [ ] **Step 5: Inspect the branch**

Run:

```bash
git status --short
git log --oneline --decorate -8
```

Expected: working tree is clean, and the task commits are visible on `discussion-321-known-face-filter`.

- [ ] **Step 6: Final commit only if verification fixes were needed**

If Step 1 through Step 4 exposed fixes, commit them:

```bash
git add server/src/config.ts server/src/dtos/system-config.dto.ts server/src/repositories/classification.repository.ts server/src/repositories/job.repository.ts server/src/repositories/job.repository.spec.ts server/src/services/classification.service.ts server/src/services/classification.service.spec.ts server/src/services/system-config.service.spec.ts server/test/medium/specs/repositories/classification.repository.spec.ts web/src/routes/admin/system-settings/ClassificationSettings.svelte web/src/routes/admin/system-settings/ClassificationSettings.spec.ts docs/docs/features/auto-classification.md docs/docs/install/config-file.md open-api mobile/openapi
git commit -m "fix: stabilize classification face exclusion"
```

If no fixes were needed, do not create an empty commit.
