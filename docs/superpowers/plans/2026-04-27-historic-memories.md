# Historic Memories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/memories` page where users can browse retained generated memories, with generated memory cleanup configurable to 365 days by default and 0 meaning keep forever.

**Architecture:** Keep the existing `/memories` API and add only the missing retention configuration, UI browse page, and routing glue. The historic page fetches retained memories independently, while the existing `/memory` viewer gains a history source mode so historic links work without replacing the today-only carousel state.

**Tech Stack:** NestJS, Kysely, Zod DTOs, generated OpenAPI TypeScript SDK, Svelte 5, SvelteKit, Vitest, @testing-library/svelte, Playwright E2E.

**Addendum 2026-04-28:** Generated memory rule enablement is also config-driven. `SystemConfig.memories` includes `birthday` and `recentTrips`, both defaulting to `true`, and the Memories admin settings render switches for both rule families. Server tests cover defaults, config-file values, update persistence, and disabled-rule generation; web tests cover rendering and saving the switches.

---

## File Structure

- Modify: `server/src/config.ts`  
  Responsibility: add `SystemConfig.memories.retentionDays` with default `365`.

- Modify: `server/src/dtos/system-config.dto.ts`  
  Responsibility: validate `memories.retentionDays` as an integer `>= 0` and expose it through `SystemConfigDto`.

- Modify: `server/src/repositories/memory.repository.ts`  
  Responsibility: accept configured retention days in `cleanup()`, keep invalid memory-asset cleanup unchanged, skip memory record deletion when retention is `0`.

- Modify: `server/src/services/memory.service.ts`  
  Responsibility: read system config with cache disabled before cleanup and pass `retentionDays` to the repository.

- Modify: `server/src/services/system-config.service.spec.ts`  
  Responsibility: prove config merge/defaults and validation for memory retention.

- Modify: `server/src/services/memory.service.spec.ts`  
  Responsibility: prove cleanup uses configured retention.

- Modify: `server/test/medium/specs/repositories/memory.repository.spec.ts`  
  Responsibility: prove retention cleanup deletes only eligible unsaved memory records and still removes invalid memory-asset links.

- Modify: `open-api/immich-openapi-specs.json`  
  Responsibility: include the generated `SystemConfigMemoriesDto` schema.

- Modify: `open-api/typescript-sdk/src/fetch-client.ts`  
  Responsibility: expose `SystemConfigDto.memories` to web TypeScript.

- Create: `web/src/routes/admin/system-settings/MemoriesSettings.svelte`  
  Responsibility: render admin retention input and save only `memories` config.

- Create: `web/src/routes/admin/system-settings/MemoriesSettings.spec.ts`
  Responsibility: prove the admin retention field renders the configured value and uses the existing settings form copy.

- Modify: `web/src/routes/admin/system-settings/+page.svelte`  
  Responsibility: add the Memories settings accordion.

- Modify: `i18n/en.json`  
  Responsibility: add admin field copy and memories page labels.

- Modify: `web/src/lib/route.ts`  
  Responsibility: split `Route.memories()` for `/memories` from `Route.memoryViewer()` for `/memory`.

- Modify: `web/src/lib/route.spec.ts`  
  Responsibility: prove `/memories`, `/memory?id=...`, and history viewer URLs.

- Modify: `web/src/lib/managers/navigation-items.ts`  
  Responsibility: send Library > Memories and command palette navigation to `/memories`.

- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`  
  Responsibility: update the navigation route regression from `/memory` to `/memories`.

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`  
  Responsibility: update the daily carousel links to use `Route.memoryViewer()`.

- Create: `web/src/lib/utils/memory-viewer-source.ts`  
  Responsibility: build memory-asset context from an arbitrary memory list so the viewer can use either today's manager list or a history list.

- Modify: `web/src/lib/managers/memory-manager.svelte.ts`  
  Responsibility: reuse memory-viewer source helpers for today's memory list without changing public behavior.

- Modify: `web/src/routes/(user)/memory/[[photos=photos]]/[[assetId=id]]/memory-viewer.svelte`  
  Responsibility: load `/memories` into local state when `source=history` is present and use that list for navigation/actions.

- Create: `web/src/routes/(user)/memories/memory-index-utils.ts`  
  Responsibility: filter empty memories, sort by `showAt ?? createdAt`, group by shown/generated month, and run local search/saved filters.

- Create: `web/src/routes/(user)/memories/memory-index-utils.spec.ts`  
  Responsibility: prove sorting, grouping, empty-asset filtering, saved filtering, and search coverage.

- Create: `web/src/routes/(user)/memories/memory-card.svelte`  
  Responsibility: render a photo-first memory card with a collage cover and subtle saved overlay.

- Create: `web/src/routes/(user)/memories/memory-card.spec.ts`  
  Responsibility: prove card title/metadata, saved indicator, collage thumbnails, and viewer link.

- Create: `web/src/routes/(user)/memories/+page.ts`  
  Responsibility: authenticate the route and set page metadata.

- Create: `web/src/routes/(user)/memories/+page.svelte`  
  Responsibility: fetch retained memories, show compact search and All/Saved controls, render grouped cards, and show loading/error/empty states.

- Create: `web/src/routes/(user)/memories/page.spec.ts`  
  Responsibility: prove page fetch, grouping, filtering, empty and error states with component-level tests.

- Modify: `e2e/src/ui/generators/memory/model-objects.ts`  
  Responsibility: allow generated memories to carry `showAt`, `createdAt`, `title`, `subtitle`, and `isSaved` values for history tests.

- Create: `e2e/src/ui/specs/memory/memory-index.e2e-spec.ts`  
  Responsibility: visit `/memories`, verify grouped memory cards, filter saved memories, and click through to the existing viewer.

## Task 1: Server Retention Configuration And Cleanup

**Files:**

- Modify: `server/src/config.ts`
- Modify: `server/src/dtos/system-config.dto.ts`
- Modify: `server/src/services/system-config.service.spec.ts`
- Modify: `server/src/services/memory.service.ts`
- Modify: `server/src/services/memory.service.spec.ts`
- Modify: `server/src/repositories/memory.repository.ts`
- Modify: `server/test/medium/specs/repositories/memory.repository.spec.ts`

- [ ] **Step 1: Add failing system config tests**

In `server/src/services/system-config.service.spec.ts`, add `memories` to `partialConfig` and `updatedConfig`:

```typescript
const partialConfig = {
  ffmpeg: { crf: 30 },
  oauth: { autoLaunch: true },
  trash: { days: 10 },
  user: { deleteDelay: 15 },
  memories: { retentionDays: 0 },
} satisfies DeepPartial<SystemConfig>;
```

Add this block to `updatedConfig` near `nightlyTasks`:

```typescript
  memories: {
    retentionDays: 0,
  },
```

Add these tests inside `describe('getConfig', () => { ... })` after the existing number transform test:

```typescript
it('should default generated memory retention to 365 days', async () => {
  mocks.systemMetadata.get.mockResolvedValue({});

  await expect(sut.getSystemConfig()).resolves.toMatchObject({
    memories: {
      retentionDays: 365,
    },
  });
});

it('should accept zero generated memory retention', async () => {
  mocks.config.getEnv.mockReturnValue(mockEnvData({ configFile: 'immich-config.json' }));
  mocks.systemMetadata.readFile.mockResolvedValue(JSON.stringify({ memories: { retentionDays: 0 } }));

  await expect(sut.getSystemConfig()).resolves.toMatchObject({
    memories: {
      retentionDays: 0,
    },
  });
});
```

Add this object to the validation `tests` array:

```typescript
      {
        should: 'reject negative generated memory retention',
        config: { memories: { retentionDays: -1 } },
        throws: '[memories.retentionDays] Too small: expected number to be >=0',
      },
```

- [ ] **Step 2: Run config tests and verify they fail**

Run:

```bash
pnpm --filter immich exec vitest run src/services/system-config.service.spec.ts
```

Expected: fails because `SystemConfig` and `SystemConfigSchema` do not define `memories`.

- [ ] **Step 3: Add memories config type, default, and DTO schema**

In `server/src/config.ts`, add this section to `SystemConfig` after `nightlyTasks`:

```typescript
memories: {
  retentionDays: number;
}
```

Add this default object after `nightlyTasks` in `defaults`:

```typescript
  memories: {
    retentionDays: 365,
  },
```

In `server/src/dtos/system-config.dto.ts`, add this schema after `SystemConfigNightlyTasksSchema`:

```typescript
const SystemConfigMemoriesSchema = z
  .object({
    retentionDays: z.coerce.number().int().min(0).describe('Retention days'),
  })
  .meta({ id: 'SystemConfigMemoriesDto' });
```

Add it to `SystemConfigSchema` after `nightlyTasks`:

```typescript
    memories: SystemConfigMemoriesSchema,
```

- [ ] **Step 4: Run config tests and verify they pass**

Run:

```bash
pnpm --filter immich exec vitest run src/services/system-config.service.spec.ts
```

Expected: all tests in `system-config.service.spec.ts` pass.

- [ ] **Step 5: Add failing memory service cleanup tests**

In `server/src/services/memory.service.spec.ts`, import `defaults`:

```typescript
import { defaults } from 'src/config';
```

Replace the existing cleanup test with:

```typescript
describe('onMemoryCleanup', () => {
  it('should clean up memories using the configured retention period', async () => {
    mocks.systemMetadata.get.mockResolvedValue({ memories: { retentionDays: 0 } });
    mocks.memory.cleanup.mockResolvedValue([]);

    await sut.onMemoriesCleanup();

    expect(mocks.memory.cleanup).toHaveBeenCalledWith(0);
  });

  it('should use the default memory retention period when unset', async () => {
    mocks.systemMetadata.get.mockResolvedValue({});
    mocks.memory.cleanup.mockResolvedValue([]);

    await sut.onMemoriesCleanup();

    expect(mocks.memory.cleanup).toHaveBeenCalledWith(defaults.memories.retentionDays);
  });
});
```

- [ ] **Step 6: Run memory service tests and verify they fail**

Run:

```bash
pnpm --filter immich exec vitest run src/services/memory.service.spec.ts
```

Expected: fails because `onMemoriesCleanup()` still calls `cleanup()` without arguments.

- [ ] **Step 7: Pass retention from service to repository**

In `server/src/services/memory.service.ts`, replace `onMemoriesCleanup()` with:

```typescript
  @OnJob({ name: JobName.MemoryCleanup, queue: QueueName.BackgroundTask })
  async onMemoriesCleanup() {
    const config = await this.getConfig({ withCache: false });
    await this.memoryRepository.cleanup(config.memories.retentionDays);
  }
```

- [ ] **Step 8: Run memory service tests and verify they pass**

Run:

```bash
pnpm --filter immich exec vitest run src/services/memory.service.spec.ts
```

Expected: all tests in `memory.service.spec.ts` pass.

- [ ] **Step 9: Add failing repository cleanup tests**

In `server/test/medium/specs/repositories/memory.repository.spec.ts`, update the enum import:

```typescript
import { AssetVisibility, MemoryType } from 'src/enum';
```

Add these helper functions near `setup()`:

```typescript
const selectMemoryIds = (ctx: ReturnType<typeof setup>['ctx']) =>
  ctx.database.selectFrom('memory').select('id').orderBy('id').execute();

const selectMemoryAssetRows = (ctx: ReturnType<typeof setup>['ctx']) =>
  ctx.database.selectFrom('memory_asset').select(['assetId', 'memoriesId']).execute();
```

Add this `describe('cleanup')` block before `describe('hasRuleMemory')`:

```typescript
describe('cleanup', () => {
  it('should delete only unsaved memories older than the retention period', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const oldDate = new Date('2024-01-01T00:00:00Z');
    const newDate = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(new Date('2026-04-27T00:00:00Z'));

    const { result: oldUnsaved } = await ctx.newMemory({ ownerId: user.id, createdAt: oldDate, isSaved: false });
    const { result: newUnsaved } = await ctx.newMemory({ ownerId: user.id, createdAt: newDate, isSaved: false });
    const { result: oldSaved } = await ctx.newMemory({ ownerId: user.id, createdAt: oldDate, isSaved: true });

    await sut.cleanup(365);

    await expect(selectMemoryIds(ctx)).resolves.toEqual(
      expect.arrayContaining([{ id: newUnsaved.id }, { id: oldSaved.id }]),
    );
    await expect(selectMemoryIds(ctx)).resolves.not.toContainEqual({ id: oldUnsaved.id });
  });

  it('should not delete memory records when retention is zero', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const oldDate = new Date('2024-01-01T00:00:00Z');
    vi.setSystemTime(new Date('2026-04-27T00:00:00Z'));

    const { result: memory } = await ctx.newMemory({ ownerId: user.id, createdAt: oldDate, isSaved: false });

    await sut.cleanup(0);

    await expect(selectMemoryIds(ctx)).resolves.toContainEqual({ id: memory.id });
  });

  it('should still remove memory asset links for assets outside the timeline when retention is zero', async () => {
    const { ctx, sut } = setup();
    const { user } = await ctx.newUser();
    const { asset } = await ctx.newAsset({ ownerId: user.id, visibility: AssetVisibility.Archive });
    const { result: memory } = await ctx.newMemory({ ownerId: user.id, isSaved: false });
    await ctx.newMemoryAsset({ memoryId: memory.id, assetId: asset.id });

    await sut.cleanup(0);

    await expect(selectMemoryAssetRows(ctx)).resolves.toEqual([]);
    await expect(selectMemoryIds(ctx)).resolves.toContainEqual({ id: memory.id });
  });
});
```

- [ ] **Step 10: Run repository tests and verify they fail**

Run:

```bash
pnpm --filter immich exec vitest run test/medium/specs/repositories/memory.repository.spec.ts
```

Expected: fails because `MemoryRepository.cleanup()` has no `retentionDays` parameter and still uses 30 days.

- [ ] **Step 11: Implement repository cleanup retention**

In `server/src/repositories/memory.repository.ts`, replace `cleanup()` with:

```typescript
  async cleanup(retentionDays: number) {
    await this.db
      .deleteFrom('memory_asset')
      .using('asset')
      .whereRef('memory_asset.assetId', '=', 'asset.id')
      .where('asset.visibility', '!=', AssetVisibility.Timeline)
      .execute();

    if (retentionDays === 0) {
      return [];
    }

    return this.db
      .deleteFrom('memory')
      .where('createdAt', '<', DateTime.now().minus({ days: retentionDays }).toJSDate())
      .where('isSaved', '=', false)
      .execute();
  }
```

- [ ] **Step 12: Run server tests and commit**

Run:

```bash
pnpm --filter immich exec vitest run src/services/system-config.service.spec.ts src/services/memory.service.spec.ts test/medium/specs/repositories/memory.repository.spec.ts
```

Expected: all listed server tests pass.

Commit:

```bash
git add server/src/config.ts server/src/dtos/system-config.dto.ts server/src/services/system-config.service.spec.ts server/src/services/memory.service.ts server/src/services/memory.service.spec.ts server/src/repositories/memory.repository.ts server/test/medium/specs/repositories/memory.repository.spec.ts
git commit -m "feat: configure memory retention cleanup"
```

## Task 2: OpenAPI SDK And Admin Retention Settings

**Files:**

- Modify: `open-api/immich-openapi-specs.json`
- Modify: `open-api/typescript-sdk/src/fetch-client.ts`
- Create: `web/src/routes/admin/system-settings/MemoriesSettings.svelte`
- Create: `web/src/routes/admin/system-settings/MemoriesSettings.spec.ts`
- Modify: `web/src/routes/admin/system-settings/+page.svelte`
- Modify: `i18n/en.json`

- [ ] **Step 1: Generate OpenAPI and SDK changes**

Run:

```bash
make open-api-typescript
```

Expected: `open-api/immich-openapi-specs.json` includes `SystemConfigMemoriesDto`, `open-api/typescript-sdk/src/fetch-client.ts` includes `SystemConfigDto.memories`, and `open-api/typescript-sdk/build/` is regenerated for local web tests.

- [ ] **Step 2: Add admin copy**

In `i18n/en.json`, add these keys inside the top-level `"admin"` object near the nightly task strings:

```json
    "memories_settings": "Memories",
    "memories_settings_description": "Manage generated memory history",
    "memory_retention_setting": "Memory retention",
    "memory_retention_setting_description": "Number of days to keep generated memories. Set to 0 to keep memories forever.",
```

- [ ] **Step 3: Add failing admin settings component test**

Create `web/src/routes/admin/system-settings/MemoriesSettings.spec.ts`:

```typescript
import TestWrapper from '$lib/components/TestWrapper.svelte';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import type { SystemConfigDto } from '@immich/sdk';
import type { Component } from 'svelte';
import MemoriesSettings from './MemoriesSettings.svelte';

const config = {
  memories: {
    retentionDays: 365,
  },
} as SystemConfigDto;

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: {
    value: {
      configFile: false,
    },
  },
}));

vi.mock('$lib/managers/system-config-manager.svelte', () => ({
  systemConfigManager: {
    value: config,
    cloneValue: vi.fn(() => structuredClone(config)),
  },
}));

vi.mock('$lib/components/shared-components/settings/SystemConfigButtonRow.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/noop-component.svelte');
  return { default: MockComponent };
});

describe('MemoriesSettings', () => {
  it('should render the retention field with the current configured value', () => {
    render(TestWrapper as Component<{ component: typeof MemoriesSettings; componentProps: Record<string, never> }>, {
      component: MemoriesSettings,
      componentProps: {},
    });

    expect(screen.getByLabelText('admin.memory_retention_setting')).toHaveValue(365);
    expect(screen.getByText('admin.memory_retention_setting_description')).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run admin settings component test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/routes/admin/system-settings/MemoriesSettings.spec.ts
```

Expected: fails because `MemoriesSettings.svelte` does not exist.

- [ ] **Step 5: Create the Memories settings component**

Create `web/src/routes/admin/system-settings/MemoriesSettings.svelte`:

```svelte
<script lang="ts">
  import SettingButtonsRow from '$lib/components/shared-components/settings/SystemConfigButtonRow.svelte';
  import SettingInputField from '$lib/components/shared-components/settings/setting-input-field.svelte';
  import { SettingInputFieldType } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { systemConfigManager } from '$lib/managers/system-config-manager.svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  const disabled = $derived(featureFlagsManager.value.configFile);
  const config = $derived(systemConfigManager.value);
  let configToEdit = $state(systemConfigManager.cloneValue());
</script>

<div class="mt-2">
  <div in:fade={{ duration: 500 }}>
    <form autocomplete="off" class="mx-4 mt-4" onsubmit={(event) => event.preventDefault()}>
      <div class="ms-4 mt-4 flex flex-col gap-4">
        <SettingInputField
          inputType={SettingInputFieldType.NUMBER}
          label={$t('admin.memory_retention_setting')}
          description={$t('admin.memory_retention_setting_description')}
          bind:value={configToEdit.memories.retentionDays}
          min={0}
          required={true}
          {disabled}
          isEdited={configToEdit.memories.retentionDays !== config.memories.retentionDays}
        />
      </div>

      <SettingButtonsRow bind:configToEdit keys={['memories']} {disabled} />
    </form>
  </div>
</div>
```

- [ ] **Step 6: Add Memories settings to the admin accordion**

In `web/src/routes/admin/system-settings/+page.svelte`, add:

```typescript
import MemoriesSettings from './MemoriesSettings.svelte';
```

Add `mdiHistory` to the `@mdi/js` import:

```typescript
    mdiHistory,
```

Add this object immediately after the Nightly Tasks settings item:

```typescript
    {
      component: MemoriesSettings,
      title: $t('admin.memories_settings'),
      subtitle: $t('admin.memories_settings_description'),
      key: 'memories',
      icon: mdiHistory,
    },
```

- [ ] **Step 7: Run admin settings tests, typecheck, and commit**

Run:

```bash
pnpm --dir web exec vitest run src/routes/admin/system-settings/MemoriesSettings.spec.ts
pnpm --filter immich-web exec svelte-check --fail-on-warnings
```

Expected: no type errors for `configToEdit.memories.retentionDays` or settings imports.

Commit:

```bash
git add open-api/immich-openapi-specs.json open-api/typescript-sdk/src/fetch-client.ts i18n/en.json web/src/routes/admin/system-settings/MemoriesSettings.svelte web/src/routes/admin/system-settings/MemoriesSettings.spec.ts web/src/routes/admin/system-settings/+page.svelte
git commit -m "feat: expose memory retention setting"
```

Note: `open-api/typescript-sdk/build/` is intentionally ignored by git. The OpenAPI generation step builds it for local tests, but do not add it to the commit.

## Task 3: Route Split And History Viewer Source

**Files:**

- Modify: `web/src/lib/route.ts`
- Modify: `web/src/lib/route.spec.ts`
- Modify: `web/src/lib/managers/navigation-items.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Create: `web/src/lib/utils/memory-viewer-source.ts`
- Modify: `web/src/lib/managers/memory-manager.svelte.ts`
- Modify: `web/src/routes/(user)/memory/[[photos=photos]]/[[assetId=id]]/memory-viewer.svelte`

- [ ] **Step 1: Add failing route helper tests**

In `web/src/lib/route.spec.ts`, add this block:

```typescript
describe(Route.memories.name, () => {
  it('should return the historic memories index route', () => {
    expect(Route.memories()).toBe('/memories');
  });
});

describe(Route.memoryViewer.name, () => {
  it('should return the memory viewer route', () => {
    expect(Route.memoryViewer()).toBe('/memory');
  });

  it('should include the selected asset id', () => {
    expect(Route.memoryViewer({ id: 'asset-id' })).toBe('/memory?id=asset-id');
  });

  it('should include the history source when requested', () => {
    expect(Route.memoryViewer({ id: 'asset-id', source: 'history' })).toBe('/memory?id=asset-id&source=history');
  });
});
```

- [ ] **Step 2: Run route tests and verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/lib/route.spec.ts
```

Expected: fails because `Route.memories()` still points to `/memory` and `Route.memoryViewer()` does not exist.

- [ ] **Step 3: Implement route split**

In `web/src/lib/route.ts`, replace the memories helper with:

```typescript
  // memories
  memories: () => '/memories',
  memoryViewer: (params?: { id?: string; source?: 'history' }) => '/memory' + asQueryString(params),
```

- [ ] **Step 4: Update daily carousel and navigation routes**

In `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`, change the carousel item `href`:

```typescript
      href: Route.memoryViewer({ id: memory.assets[0].id }),
```

In `web/src/lib/managers/navigation-items.ts`, import `Route` if it is not already imported:

```typescript
import { Route } from '$lib/route';
```

Change the Memories navigation item:

```typescript
    route: Route.memories(),
```

In `web/src/lib/managers/global-search-manager.svelte.spec.ts`, update the live catalog route expectations around the memories regression test:

```typescript
// NAVIGATION_ITEMS defines memories.route as '/memories'. The live value must win.
expect(goto).toHaveBeenCalledWith('/memories');
expect(goto).not.toHaveBeenCalledWith('/old-memories-path');
```

- [ ] **Step 5: Add memory viewer source helper tests**

Create `web/src/lib/utils/memory-viewer-source.ts` with the implementation in Step 7, then create `web/src/lib/utils/memory-viewer-source.spec.ts` with:

```typescript
import { AssetTypeEnum, AssetVisibility, MemoryType, type AssetResponseDto, type MemoryResponseDto } from '@immich/sdk';
import { describe, expect, it } from 'vitest';
import { findMemoryAsset, removeAssetsFromMemoryList } from './memory-viewer-source';

const asset = (id: string): AssetResponseDto =>
  ({
    id,
    ownerId: 'user-id',
    type: AssetTypeEnum.Image,
    fileCreatedAt: '2026-04-23T12:00:00.000Z',
    localDateTime: '2026-04-23T12:00:00.000Z',
    isFavorite: false,
    isTrashed: false,
    visibility: AssetVisibility.Timeline,
    thumbhash: null,
    duration: null,
    exifInfo: null,
    people: [],
    tags: [],
  }) as AssetResponseDto;

const memory = (id: string, assetIds: string[]): MemoryResponseDto =>
  ({
    id,
    ownerId: 'user-id',
    type: MemoryType.OnThisDay,
    data: { year: 2024 },
    isSaved: false,
    memoryAt: '2024-04-23T00:00:00.000Z',
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
    assets: assetIds.map(asset),
  }) as MemoryResponseDto;

describe('memory viewer source', () => {
  it('should find the selected asset with previous and next memory context', () => {
    const memories = [memory('m1', ['a1']), memory('m2', ['a2', 'a3']), memory('m3', ['a4'])];

    expect(findMemoryAsset(memories, 'a2')).toMatchObject({
      memoryIndex: 1,
      assetIndex: 0,
      memory: { id: 'm2' },
      asset: { id: 'a2' },
      previousMemory: { id: 'm1' },
      nextMemory: { id: 'm3' },
      previous: { asset: { id: 'a1' } },
      next: { asset: { id: 'a3' } },
    });
  });

  it('should default to the first asset when no selected asset is found', () => {
    const memories = [memory('m1', ['a1'])];

    expect(findMemoryAsset(memories, 'missing')).toMatchObject({
      memory: { id: 'm1' },
      asset: { id: 'a1' },
    });
  });

  it('should remove assets and drop empty memories', () => {
    const memories = [memory('m1', ['a1']), memory('m2', ['a2', 'a3'])];

    expect(removeAssetsFromMemoryList(memories, ['a1', 'a2'])).toEqual([
      expect.objectContaining({
        id: 'm2',
        assets: [expect.objectContaining({ id: 'a3' })],
      }),
    ]);
  });
});
```

- [ ] **Step 6: Run helper tests and verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/lib/utils/memory-viewer-source.spec.ts
```

Expected: fails until the helper implementation is added.

- [ ] **Step 7: Implement memory viewer source helpers**

Create `web/src/lib/utils/memory-viewer-source.ts`:

```typescript
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { toTimelineAsset } from '$lib/utils/timeline-util';
import type { MemoryResponseDto } from '@immich/sdk';

type MemoryIndex = {
  memoryIndex: number;
  assetIndex: number;
};

export type MemoryAssetSource = MemoryIndex & {
  memory: MemoryResponseDto;
  asset: TimelineAsset;
  previousMemory?: MemoryResponseDto;
  previous?: MemoryAssetSource;
  next?: MemoryAssetSource;
  nextMemory?: MemoryResponseDto;
};

export const buildMemoryAssets = (memories: MemoryResponseDto[]): MemoryAssetSource[] => {
  const memoryAssets: MemoryAssetSource[] = [];
  let previous: MemoryAssetSource | undefined;

  for (const [memoryIndex, memory] of memories.entries()) {
    for (const [assetIndex, asset] of memory.assets.entries()) {
      const current = {
        memory,
        memoryIndex,
        previousMemory: memories[memoryIndex - 1],
        nextMemory: memories[memoryIndex + 1],
        asset: toTimelineAsset(asset),
        assetIndex,
        previous,
      };

      memoryAssets.push(current);

      if (previous) {
        previous.next = current;
      }

      previous = current;
    }
  }

  return memoryAssets;
};

export const findMemoryAsset = (memories: MemoryResponseDto[], assetId: string | undefined) => {
  const memoryAssets = buildMemoryAssets(memories);
  return memoryAssets.find((memoryAsset) => memoryAsset.asset.id === assetId) ?? memoryAssets[0];
};

export const removeAssetsFromMemoryList = (memories: MemoryResponseDto[], ids: string[]) => {
  const idSet = new Set(ids);
  return memories
    .map((memory) => ({
      ...memory,
      assets: memory.assets.filter((asset) => !idSet.has(asset.id)),
    }))
    .filter((memory) => memory.assets.length > 0);
};
```

- [ ] **Step 8: Reuse helper in the memory manager**

In `web/src/lib/managers/memory-manager.svelte.ts`, remove the local `MemoryIndex` type and import:

```typescript
import { findMemoryAsset, removeAssetsFromMemoryList, type MemoryAssetSource } from '$lib/utils/memory-viewer-source';
```

Change the exported type:

```typescript
export type MemoryAsset = MemoryAssetSource;
```

Remove the `memoryAssets` derived block and update methods:

```typescript
  getMemoryAsset(assetId: string | undefined) {
    return findMemoryAsset(this.memories, assetId);
  }

  hideAssetsFromMemory(ids: string[]) {
    this.memories = removeAssetsFromMemoryList(this.memories, ids);
  }
```

- [ ] **Step 9: Add history source support to the viewer**

In `web/src/routes/(user)/memory/[[photos=photos]]/[[assetId=id]]/memory-viewer.svelte`, add imports:

```typescript
import { findMemoryAsset, removeAssetsFromMemoryList, type MemoryAssetSource } from '$lib/utils/memory-viewer-source';
import { deleteMemory, removeMemoryAssets, searchMemories, updateMemory, type MemoryResponseDto } from '@immich/sdk';
```

Replace the `current` state type:

```typescript
let current = $state<MemoryAssetSource | undefined>(undefined);
```

Add history source state after `current`:

```typescript
let historyMemories = $state<MemoryResponseDto[]>([]);
let historyMemoriesLoading: Promise<void> | undefined = undefined;
const isHistorySource = $derived(page.url.searchParams.get('source') === 'history');
const activeMemories = $derived(isHistorySource ? historyMemories : memoryManager.memories);
```

Add the local history loader:

```typescript
const loadHistoryMemories = async () => {
  if (!historyMemoriesLoading) {
    historyMemoriesLoading = searchMemories({}).then((memories) => {
      historyMemories = memories.filter((memory) => memory.assets.length > 0);
    });
  }

  await historyMemoriesLoading;
};
```

Update `loadFromParams()`:

```typescript
const loadFromParams = (page: Page | NavigationTarget | null) => {
  const assetId = page?.params?.assetId ?? page?.url.searchParams.get(QueryParameter.ID) ?? undefined;
  return isHistorySource ? findMemoryAsset(historyMemories, assetId) : memoryManager.getMemoryAsset(assetId);
};
```

Update the empty-memory check in `init()`:

```typescript
if (activeMemories.length === 0) {
  return handlePromiseError(goto(Route.photos()));
}
```

Replace action handlers so history source updates local state and today source delegates to `memoryManager`:

```typescript
const handleDeleteOrArchiveAssets = (ids: string[]) => {
  if (!current) {
    return;
  }

  if (isHistorySource) {
    historyMemories = removeAssetsFromMemoryList(historyMemories, ids);
  } else {
    memoryManager.hideAssetsFromMemory(ids);
  }

  init(page);
};

const handleDeleteMemoryAsset = async () => {
  if (!current) {
    return;
  }

  if (isHistorySource) {
    if (current.memory.assets.length === 1) {
      await deleteMemory({ id: current.memory.id });
      historyMemories = historyMemories.filter((memory) => memory.id !== current!.memory.id);
    } else {
      await removeMemoryAssets({ id: current.memory.id, bulkIdsDto: { ids: [current.asset.id] } });
      historyMemories = removeAssetsFromMemoryList(historyMemories, [current.asset.id]);
    }
  } else {
    await memoryManager.deleteAssetFromMemory(current.asset.id);
  }

  init(page);
};

const handleDeleteMemory = async () => {
  if (!current) {
    return;
  }

  if (isHistorySource) {
    await deleteMemory({ id: current.memory.id });
    historyMemories = historyMemories.filter((memory) => memory.id !== current!.memory.id);
  } else {
    await memoryManager.deleteMemory(current.memory.id);
  }

  toastManager.primary($t('removed_memory'));
  init(page);
};

const handleSaveMemory = async () => {
  if (!current) {
    return;
  }

  const newSavedState = !current.memory.isSaved;

  if (isHistorySource) {
    await updateMemory({ id: current.memory.id, memoryUpdateDto: { isSaved: newSavedState } });
    current.memory.isSaved = newSavedState;
  } else {
    await memoryManager.updateMemorySaved(current.memory.id, newSavedState);
  }

  toastManager.primary(newSavedState ? $t('added_to_favorites') : $t('removed_from_favorites'));
  init(page);
};
```

Update the `afterNavigate()` callback to load the correct source:

```typescript
afterNavigate(({ from, to }) => {
  const ready = isHistorySource ? loadHistoryMemories() : memoryManager.ready();

  ready.then(
    () => {
      let target;
      if (to?.params?.assetId) {
        target = to;
      } else if (from?.params?.assetId) {
        target = from;
      } else {
        target = page;
      }

      init(target);
      initPlayer();
    },
    (error) => {
      console.error(`Error loading memories: ${error}`);
    },
  );
});
```

- [ ] **Step 10: Run route/viewer tests and commit**

Run:

```bash
pnpm --dir web exec vitest run src/lib/route.spec.ts src/lib/utils/memory-viewer-source.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/routes/'(user)'/photos/'[[assetId=id]]'/photos-page.spec.ts
```

Expected: route and helper tests pass; existing photos page tests still pass.

Commit:

```bash
git add web/src/lib/route.ts web/src/lib/route.spec.ts web/src/lib/managers/navigation-items.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/routes/'(user)'/photos/'[[assetId=id]]'/+page.svelte web/src/lib/utils/memory-viewer-source.ts web/src/lib/utils/memory-viewer-source.spec.ts web/src/lib/managers/memory-manager.svelte.ts web/src/routes/'(user)'/memory/'[[photos=photos]]'/'[[assetId=id]]'/memory-viewer.svelte
git commit -m "feat: split memories route and support history viewer"
```

## Task 4: Memories Index Utilities And Card

**Files:**

- Create: `web/src/routes/(user)/memories/memory-index-utils.ts`
- Create: `web/src/routes/(user)/memories/memory-index-utils.spec.ts`
- Create: `web/src/routes/(user)/memories/memory-card.svelte`
- Create: `web/src/routes/(user)/memories/memory-card.spec.ts`
- Modify: `i18n/en.json`

- [ ] **Step 1: Add page copy**

In `i18n/en.json`, add these top-level keys near the existing `memories` and `memory` keys:

```json
  "memory_assets_count": "{count, plural, one {# photo} other {# photos}}",
  "memory_filter_all": "All",
  "memory_filter_saved": "Saved",
  "memory_type_on_this_day": "On this day",
  "memories_empty": "No memories are available yet.",
  "memories_error": "Unable to load memories",
  "memories_search_placeholder": "Search memories",
```

- [ ] **Step 2: Add failing index utility tests**

Create `web/src/routes/(user)/memories/memory-index-utils.spec.ts`:

```typescript
import { MemoryType, type MemoryResponseDto } from '@immich/sdk';
import { describe, expect, it } from 'vitest';
import { buildMemoryIndexItems, filterMemoryIndexItems, groupMemoryIndexItems } from './memory-index-utils';

const translate = (key: string, options?: { values?: Record<string, unknown> }) => {
  if (key === 'years_ago') {
    return `${options?.values?.years} years ago`;
  }
  if (key === 'memory_type_on_this_day') {
    return 'On this day';
  }
  return key;
};

const memory = (overrides: Partial<MemoryResponseDto>): MemoryResponseDto =>
  ({
    id: 'memory-id',
    ownerId: 'user-id',
    type: MemoryType.OnThisDay,
    data: { year: 2024 },
    isSaved: false,
    memoryAt: '2024-04-23T00:00:00.000Z',
    createdAt: '2026-04-20T00:00:00.000Z',
    updatedAt: '2026-04-20T00:00:00.000Z',
    assets: [{ id: 'asset-id' }],
    ...overrides,
  }) as MemoryResponseDto;

describe('memory index utils', () => {
  it('should filter memories without visible assets', () => {
    const items = buildMemoryIndexItems(
      [memory({ id: 'empty', assets: [] }), memory({ id: 'visible' })],
      translate,
      'en-US',
    );

    expect(items).toHaveLength(1);
    expect(items[0].memory.id).toBe('visible');
  });

  it('should sort by showAt then createdAt newest first', () => {
    const items = buildMemoryIndexItems(
      [
        memory({ id: 'created', createdAt: '2026-03-01T00:00:00.000Z' }),
        memory({ id: 'shown', showAt: '2026-04-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' }),
      ],
      translate,
      'en-US',
    );

    expect(items.map((item) => item.memory.id)).toEqual(['shown', 'created']);
  });

  it('should group memories by shown/generated month', () => {
    const items = buildMemoryIndexItems(
      [
        memory({ id: 'april', showAt: '2026-04-01T00:00:00.000Z' }),
        memory({ id: 'march', createdAt: '2026-03-01T00:00:00.000Z' }),
      ],
      translate,
      'en-US',
    );

    expect(groupMemoryIndexItems(items, 'en-US')).toEqual([
      expect.objectContaining({
        key: '2026-04',
        label: 'April 2026',
        items: [expect.objectContaining({ memory: expect.objectContaining({ id: 'april' }) })],
      }),
      expect.objectContaining({
        key: '2026-03',
        label: 'March 2026',
        items: [expect.objectContaining({ memory: expect.objectContaining({ id: 'march' }) })],
      }),
    ]);
  });

  it('should filter saved memories', () => {
    const items = buildMemoryIndexItems(
      [memory({ id: 'saved', isSaved: true }), memory({ id: 'unsaved', isSaved: false })],
      translate,
      'en-US',
    );

    expect(filterMemoryIndexItems(items, { query: '', filter: 'saved' }).map((item) => item.memory.id)).toEqual([
      'saved',
    ]);
  });

  it('should search by title, subtitle, year, date, and type label', () => {
    const items = buildMemoryIndexItems(
      [
        memory({
          id: 'paris',
          title: 'Paris weekend',
          subtitle: 'A compact city break',
          memoryAt: '2022-04-23T00:00:00.000Z',
          showAt: '2026-04-23T00:00:00.000Z',
        }),
      ],
      translate,
      'en-US',
    );

    expect(filterMemoryIndexItems(items, { query: 'paris', filter: 'all' })).toHaveLength(1);
    expect(filterMemoryIndexItems(items, { query: 'compact', filter: 'all' })).toHaveLength(1);
    expect(filterMemoryIndexItems(items, { query: '2022', filter: 'all' })).toHaveLength(1);
    expect(filterMemoryIndexItems(items, { query: 'april', filter: 'all' })).toHaveLength(1);
    expect(filterMemoryIndexItems(items, { query: 'on this day', filter: 'all' })).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run utility tests and verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/memory-index-utils.spec.ts
```

Expected: fails because `memory-index-utils.ts` does not exist.

- [ ] **Step 4: Implement memory index utilities**

Create `web/src/routes/(user)/memories/memory-index-utils.ts`:

```typescript
import { getMemoryTitle } from '$lib/utils';
import { MemoryType, type MemoryResponseDto } from '@immich/sdk';

type Translate = (key: string, options?: { values?: Record<string, unknown> }) => string;

export type MemoryIndexFilter = 'all' | 'saved';

export type MemoryIndexItem = {
  memory: MemoryResponseDto;
  title: string;
  subtitle: string;
  shownAt: Date;
  monthKey: string;
  dateLabel: string;
  typeLabel: string;
  searchText: string;
};

export type MemoryIndexGroup = {
  key: string;
  label: string;
  items: MemoryIndexItem[];
};

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatMonthLabel = (date: Date, locale: string | undefined) =>
  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(date);

const formatDateLabel = (date: Date, locale: string | undefined) =>
  new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

const getShownDate = (memory: MemoryResponseDto) => new Date(memory.showAt ?? memory.createdAt);

const getTypeLabel = (memory: MemoryResponseDto, translate: Translate) =>
  memory.type === MemoryType.OnThisDay ? translate('memory_type_on_this_day') : translate('memory');

export const buildMemoryIndexItems = (
  memories: MemoryResponseDto[],
  translate: Translate,
  locale: string | undefined,
  now = new Date(),
): MemoryIndexItem[] =>
  memories
    .filter((memory) => memory.assets.length > 0)
    .map((memory) => {
      const shownAt = getShownDate(memory);
      const title = getMemoryTitle(memory, translate, now);
      const subtitle = memory.subtitle ?? '';
      const dateLabel = formatDateLabel(shownAt, locale);
      const typeLabel = getTypeLabel(memory, translate);
      const memoryYear = new Date(memory.memoryAt).getFullYear().toString();

      return {
        memory,
        title,
        subtitle,
        shownAt,
        monthKey: formatMonthKey(shownAt),
        dateLabel,
        typeLabel,
        searchText: [title, subtitle, memoryYear, dateLabel, typeLabel, memory.type].join(' ').toLowerCase(),
      };
    })
    .toSorted((left, right) => right.shownAt.getTime() - left.shownAt.getTime());

export const filterMemoryIndexItems = (
  items: MemoryIndexItem[],
  options: { query: string; filter: MemoryIndexFilter },
): MemoryIndexItem[] => {
  const query = options.query.trim().toLowerCase();

  return items.filter((item) => {
    if (options.filter === 'saved' && !item.memory.isSaved) {
      return false;
    }

    return query.length === 0 || item.searchText.includes(query);
  });
};

export const groupMemoryIndexItems = (items: MemoryIndexItem[], locale: string | undefined): MemoryIndexGroup[] => {
  const groups = new Map<string, MemoryIndexGroup>();

  for (const item of items) {
    let group = groups.get(item.monthKey);
    if (!group) {
      group = {
        key: item.monthKey,
        label: formatMonthLabel(item.shownAt, locale),
        items: [],
      };
      groups.set(item.monthKey, group);
    }

    group.items.push(item);
  }

  return [...groups.values()];
};
```

- [ ] **Step 5: Add memory card component test**

Create `web/src/routes/(user)/memories/memory-card.spec.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { MemoryType, type MemoryResponseDto } from '@immich/sdk';
import MemoryCard from './memory-card.svelte';
import type { MemoryIndexItem } from './memory-index-utils';

const item: MemoryIndexItem = {
  memory: {
    id: 'memory-id',
    ownerId: 'user-id',
    type: MemoryType.OnThisDay,
    data: { year: 2024 },
    isSaved: true,
    memoryAt: '2024-04-23T00:00:00.000Z',
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
    assets: [{ id: 'asset-1' }, { id: 'asset-2' }, { id: 'asset-3' }],
  } as MemoryResponseDto,
  title: '2 years ago',
  subtitle: 'Spring highlights',
  shownAt: new Date('2026-04-23T00:00:00.000Z'),
  monthKey: '2026-04',
  dateLabel: 'Apr 23, 2026',
  typeLabel: 'On this day',
  searchText: '',
};

describe('MemoryCard', () => {
  it('should render card details and link to the history viewer source', () => {
    const { container } = render(MemoryCard, { item, preload: true });

    const link = screen.getByRole('link', { name: /2 years ago/i });
    expect(link).toHaveAttribute('href', '/memory?id=asset-1&source=history');
    expect(screen.getByText('Spring highlights')).toBeInTheDocument();
    expect(screen.getByText('Apr 23, 2026')).toBeInTheDocument();
    expect(screen.getByTestId('memory-saved-indicator')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(3);
  });
});
```

- [ ] **Step 6: Run card test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/memory-card.spec.ts
```

Expected: fails because `memory-card.svelte` does not exist.

- [ ] **Step 7: Implement memory card component**

Create `web/src/routes/(user)/memories/memory-card.svelte`:

```svelte
<script lang="ts">
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiHeart } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { MemoryIndexItem } from './memory-index-utils';

  interface Props {
    item: MemoryIndexItem;
    preload?: boolean;
  }

  let { item, preload = false }: Props = $props();

  const assets = $derived(item.memory.assets.slice(0, 4));
  const firstAsset = $derived(item.memory.assets[0]);
</script>

{#if firstAsset}
  <a
    href={Route.memoryViewer({ id: firstAsset.id, source: 'history' })}
    aria-label={item.title}
    class="group relative block rounded-2xl border border-transparent p-5 hover:border-gray-200 hover:bg-gray-100 dark:hover:border-gray-800 dark:hover:bg-gray-900"
    data-testid="memory-card"
  >
    <div class="relative aspect-square overflow-hidden rounded-2xl bg-gray-200 dark:bg-immich-dark-gray">
      {#if assets.length >= 3}
        <div class="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
          {#each assets as asset, index (asset.id)}
            <img
              class="h-full w-full object-cover {index === 0 ? 'row-span-2' : ''}"
              src={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Thumbnail })}
              alt=""
              loading={preload ? 'eager' : 'lazy'}
              draggable="false"
            />
          {/each}
        </div>
      {:else}
        <img
          class="h-full w-full object-cover"
          src={getAssetMediaUrl({ id: firstAsset.id, size: AssetMediaSize.Thumbnail })}
          alt=""
          loading={preload ? 'eager' : 'lazy'}
          draggable="false"
        />
      {/if}

      {#if item.memory.isSaved}
        <div
          class="absolute end-2 top-2 rounded-full bg-white/80 p-1 text-immich-primary shadow-sm dark:bg-gray-900/80"
          data-testid="memory-saved-indicator"
        >
          <Icon icon={mdiHeart} size="16" />
        </div>
      {/if}
    </div>

    <div class="mt-4">
      <p class="line-clamp-2 w-full text-lg font-semibold leading-6 text-black group-hover:text-primary dark:text-white">
        {item.title}
      </p>

      {#if item.subtitle}
        <p class="truncate text-sm text-immich-text-gray-500 dark:text-immich-dark-fg">
          {item.subtitle}
        </p>
      {/if}

      <span class="flex flex-wrap gap-2 text-sm text-immich-text-gray-500 dark:text-immich-dark-fg">
        <p>{item.dateLabel}</p>
        <p>&middot;</p>
        <p>{$t('memory_assets_count', { values: { count: item.memory.assets.length } })}</p>
      </span>
    </div>
  </a>
{/if}
```

- [ ] **Step 8: Run utility/card tests and commit**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/memory-index-utils.spec.ts src/routes/'(user)'/memories/memory-card.spec.ts
```

Expected: all listed tests pass.

Commit:

```bash
git add i18n/en.json web/src/routes/'(user)'/memories/memory-index-utils.ts web/src/routes/'(user)'/memories/memory-index-utils.spec.ts web/src/routes/'(user)'/memories/memory-card.svelte web/src/routes/'(user)'/memories/memory-card.spec.ts
git commit -m "feat: add memory history card model"
```

## Task 5: Memories Index Page

**Files:**

- Create: `web/src/routes/(user)/memories/+page.ts`
- Create: `web/src/routes/(user)/memories/page-load.spec.ts`
- Create: `web/src/routes/(user)/memories/+page.svelte`
- Create: `web/src/routes/(user)/memories/page.spec.ts`

- [ ] **Step 1: Add failing route load test**

Create `web/src/routes/(user)/memories/page-load.spec.ts`:

```typescript
const { mockAuthenticate, mockGetFormatter } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockGetFormatter: vi.fn(),
}));

vi.mock('$lib/utils/auth', () => ({
  authenticate: mockAuthenticate,
}));

vi.mock('$lib/utils/i18n', () => ({
  getFormatter: mockGetFormatter,
}));

import { load } from './+page';

describe('Memories page load', () => {
  it('should authenticate and set the memories title', async () => {
    const url = new URL('https://gallery.test/memories');
    mockGetFormatter.mockResolvedValue((key: string) => key);

    await expect(load({ url } as Parameters<typeof load>[0])).resolves.toEqual({
      meta: {
        title: 'memories',
      },
    });

    expect(mockAuthenticate).toHaveBeenCalledWith(url);
  });
});
```

- [ ] **Step 2: Run route load test and verify it fails**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/page-load.spec.ts
```

Expected: fails because `+page.ts` does not exist.

- [ ] **Step 3: Add route load**

Create `web/src/routes/(user)/memories/+page.ts`:

```typescript
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  const $t = await getFormatter();

  return {
    meta: {
      title: $t('memories'),
    },
  };
}) satisfies PageLoad;
```

- [ ] **Step 4: Add failing page component tests**

Create `web/src/routes/(user)/memories/page.spec.ts`:

```typescript
import TestWrapper from '$lib/components/TestWrapper.svelte';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import { searchMemories, MemoryType, type MemoryResponseDto } from '@immich/sdk';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import MemoriesPage from './+page.svelte';

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return {
    ...actual,
    searchMemories: vi.fn(),
  };
});

vi.mock('$lib/components/layouts/user-page-layout.svelte', async () => {
  const { default: MockComponent } = await import('$lib/components/spaces/mock-user-page-layout.test-wrapper.svelte');
  return { default: MockComponent };
});

const memory = (overrides: Partial<MemoryResponseDto>): MemoryResponseDto =>
  ({
    id: 'memory-id',
    ownerId: 'user-id',
    type: MemoryType.OnThisDay,
    data: { year: 2024 },
    isSaved: false,
    memoryAt: '2024-04-23T00:00:00.000Z',
    createdAt: '2026-04-23T00:00:00.000Z',
    updatedAt: '2026-04-23T00:00:00.000Z',
    assets: [{ id: 'asset-id' }],
    ...overrides,
  }) as MemoryResponseDto;

function renderPage() {
  return render(
    TestWrapper as Component<{ component: typeof MemoriesPage; componentProps: { data: { meta: { title: string } } } }>,
    {
      component: MemoriesPage,
      componentProps: { data: { meta: { title: 'Memories' } } },
    },
  );
}

describe('Memories page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and render grouped memory cards', async () => {
    vi.mocked(searchMemories).mockResolvedValue([
      memory({ id: 'april', showAt: '2026-04-23T00:00:00.000Z', title: 'April memory' }),
      memory({ id: 'march', createdAt: '2026-03-01T00:00:00.000Z', title: 'March memory' }),
    ]);

    renderPage();

    expect(await screen.findByText('April memory')).toBeInTheDocument();
    expect(screen.getByText('March memory')).toBeInTheDocument();
    expect(screen.getByText('April 2026')).toBeInTheDocument();
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('should filter saved memories', async () => {
    vi.mocked(searchMemories).mockResolvedValue([
      memory({ id: 'saved', title: 'Saved memory', isSaved: true }),
      memory({ id: 'unsaved', title: 'Unsaved memory', isSaved: false }),
    ]);

    renderPage();

    expect(await screen.findByText('Saved memory')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('memory_filter_saved'));

    expect(screen.getByText('Saved memory')).toBeInTheDocument();
    expect(screen.queryByText('Unsaved memory')).not.toBeInTheDocument();
  });

  it('should filter memories by search query', async () => {
    vi.mocked(searchMemories).mockResolvedValue([
      memory({ id: 'paris', title: 'Paris weekend' }),
      memory({ id: 'garden', title: 'Garden day' }),
    ]);

    renderPage();

    expect(await screen.findByText('Paris weekend')).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('memories_search_placeholder'), 'garden');

    expect(screen.queryByText('Paris weekend')).not.toBeInTheDocument();
    expect(screen.getByText('Garden day')).toBeInTheDocument();
  });

  it('should render an empty state when there are no retained memories', async () => {
    vi.mocked(searchMemories).mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText('memories_empty')).toBeInTheDocument();
  });

  it('should render an error state when loading fails', async () => {
    vi.mocked(searchMemories).mockRejectedValue(new Error('network failed'));

    renderPage();

    expect(await screen.findByText('memories_error')).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run page tests and verify they fail**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/page.spec.ts
```

Expected: fails because `+page.svelte` does not exist.

- [ ] **Step 6: Implement the Memories page**

Create `web/src/routes/(user)/memories/+page.svelte`:

```svelte
<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import GroupTab from '$lib/elements/GroupTab.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { handleError } from '$lib/utils/handle-error';
  import { searchMemories, type MemoryResponseDto } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import MemoryCard from './memory-card.svelte';
  import {
    buildMemoryIndexItems,
    filterMemoryIndexItems,
    groupMemoryIndexItems,
    type MemoryIndexFilter,
  } from './memory-index-utils';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let memories = $state<MemoryResponseDto[]>([]);
  let isLoading = $state(true);
  let hasError = $state(false);
  let searchQuery = $state('');
  let filter = $state<MemoryIndexFilter>('all');

  const items = $derived(buildMemoryIndexItems(memories, $t, $locale));
  const filteredItems = $derived(filterMemoryIndexItems(items, { query: searchQuery, filter }));
  const groups = $derived(groupMemoryIndexItems(filteredItems, $locale));
  const visibleCount = $derived(filteredItems.length);

  onMount(async () => {
    try {
      memories = await searchMemories({});
    } catch (error) {
      hasError = true;
      handleError(error, $t('memories_error'));
    } finally {
      isLoading = false;
    }
  });
</script>

<UserPageLayout
  title={data.meta.title}
  description={isLoading || hasError ? undefined : `(${visibleCount.toLocaleString($locale)})`}
>
  {#snippet buttons()}
    <div class="flex flex-wrap place-items-center gap-2">
      <div class="h-12 w-64">
        <SearchBar
          placeholder={$t('memories_search_placeholder')}
          bind:name={searchQuery}
          showLoadingSpinner={false}
        />
      </div>
      <div class="h-12">
        <GroupTab
          label={$t('memories')}
          filters={['all', 'saved']}
          labels={[$t('memory_filter_all'), $t('memory_filter_saved')]}
          selected={filter}
          onSelect={(selected) => (filter = selected as MemoryIndexFilter)}
        />
      </div>
    </div>
  {/snippet}

  {#if isLoading}
    <div class="flex h-80 items-center justify-center">
      <LoadingSpinner />
    </div>
  {:else if hasError}
    <EmptyPlaceholder text={$t('memories_error')} class="mx-auto mt-10" />
  {:else if groups.length === 0}
    <EmptyPlaceholder text={$t('memories_empty')} class="mx-auto mt-10" />
  {:else}
    <div class="space-y-10 pb-12">
      {#each groups as group (group.key)}
        <section>
          <div class="mb-4 flex items-baseline gap-2">
            <h2 class="text-3xl font-bold text-black dark:text-white">{group.label}</h2>
            <span class="text-sm text-immich-text-gray-500 dark:text-immich-dark-fg">
              ({group.items.length.toLocaleString($locale)})
            </span>
          </div>

          <div class="grid grid-auto-fill-56 gap-y-4">
            {#each group.items as item, index (item.memory.id)}
              <MemoryCard {item} preload={index < 20} />
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</UserPageLayout>
```

- [ ] **Step 7: Run page tests and web typecheck**

Run:

```bash
pnpm --dir web exec vitest run src/routes/'(user)'/memories/page.spec.ts
pnpm --dir web exec vitest run src/routes/'(user)'/memories/page-load.spec.ts
pnpm --filter immich-web exec svelte-check --fail-on-warnings
```

Expected: the page tests pass and Svelte typecheck is clean.

- [ ] **Step 8: Commit Memories page**

Commit:

```bash
git add web/src/routes/'(user)'/memories/+page.ts web/src/routes/'(user)'/memories/+page.svelte web/src/routes/'(user)'/memories/page-load.spec.ts web/src/routes/'(user)'/memories/page.spec.ts
git commit -m "feat: add memories history page"
```

## Task 6: E2E Coverage And Final Verification

**Files:**

- Modify: `e2e/src/ui/generators/memory/model-objects.ts`
- Create: `e2e/src/ui/specs/memory/memory-index.e2e-spec.ts`

- [ ] **Step 1: Extend E2E memory generator**

In `e2e/src/ui/generators/memory/model-objects.ts`, extend `MemoryConfig`:

```typescript
export type MemoryConfig = {
  id?: string;
  ownerId: string;
  year: number;
  memoryAt: string;
  createdAt?: string;
  showAt?: string;
  title?: string;
  subtitle?: string;
  isSaved?: boolean;
};
```

Update the returned memory in `generateMemory()`:

```typescript
    createdAt: config.createdAt ?? now,
    showAt: config.showAt,
    title: config.title,
    subtitle: config.subtitle,
```

- [ ] **Step 2: Add Memories index E2E test**

Create `e2e/src/ui/specs/memory/memory-index.e2e-spec.ts`:

```typescript
import { faker } from '@faker-js/faker';
import type { MemoryResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { generateMemory } from 'src/ui/generators/memory';
import {
  createDefaultTimelineConfig,
  generateTimelineData,
  TimelineAssetConfig,
  TimelineData,
} from 'src/ui/generators/timeline';
import { setupBaseMockApiRoutes } from 'src/ui/mock-network/base-network';
import { MemoryChanges, setupMemoryMockApiRoutes } from 'src/ui/mock-network/memory-network';
import { setupTimelineMockApiRoutes, TimelineTestContext } from 'src/ui/mock-network/timeline-network';

test.describe('Memories index', () => {
  let adminUserId: string;
  let timelineRestData: TimelineData;
  let memories: MemoryResponseDto[];
  const assets: TimelineAssetConfig[] = [];
  const testContext = new TimelineTestContext();
  const memoryChanges: MemoryChanges = {
    memoryDeletions: [],
    assetRemovals: new Map(),
  };

  test.beforeAll(async () => {
    adminUserId = faker.string.uuid();
    testContext.adminId = adminUserId;
    timelineRestData = generateTimelineData({ ...createDefaultTimelineConfig(), ownerId: adminUserId });

    for (const timeBucket of timelineRestData.buckets.values()) {
      assets.push(...timeBucket);
    }

    memories = [
      generateMemory(
        {
          ownerId: adminUserId,
          year: 2024,
          memoryAt: '2024-04-23T00:00:00.000Z',
          showAt: '2026-04-23T00:00:00.000Z',
          title: 'April history',
          subtitle: 'Spring highlights',
          isSaved: true,
        },
        assets.slice(0, 3),
      ),
      generateMemory(
        {
          ownerId: adminUserId,
          year: 2023,
          memoryAt: '2023-03-12T00:00:00.000Z',
          createdAt: '2026-03-12T00:00:00.000Z',
          title: 'March history',
        },
        assets.slice(3, 6),
      ),
    ];
  });

  test.beforeEach(async ({ context }) => {
    await setupBaseMockApiRoutes(context, adminUserId);
    await setupTimelineMockApiRoutes(
      context,
      timelineRestData,
      { albumAdditions: [], assetDeletions: [], assetArchivals: [], assetFavorites: [] },
      testContext,
    );
    await setupMemoryMockApiRoutes(context, memories, memoryChanges);
  });

  test.afterEach(() => {
    memoryChanges.memoryDeletions = [];
    memoryChanges.assetRemovals.clear();
  });

  test('renders grouped memories and opens the history viewer', async ({ page }) => {
    await page.goto('/memories');

    await expect(page.getByRole('heading', { name: 'April 2026' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'March 2026' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'April history' })).toBeVisible();

    await page.getByRole('radio', { name: 'Saved' }).click();
    await expect(page.getByRole('link', { name: 'April history' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'March history' })).not.toBeVisible();

    await page.getByRole('link', { name: 'April history' }).click();
    await expect(page).toHaveURL(/\/memory\?id=.*source=history/);
    await expect(page.locator('#memory-viewer')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run E2E memory index test**

Run:

```bash
pnpm --dir e2e exec playwright test --project=web src/ui/specs/memory/memory-index.e2e-spec.ts
```

Expected: E2E test passes and verifies `/memories` click-through into `/memory?source=history`.

- [ ] **Step 4: Run focused final verification**

Run:

```bash
pnpm --filter immich exec vitest run src/services/system-config.service.spec.ts src/services/memory.service.spec.ts test/medium/specs/repositories/memory.repository.spec.ts
pnpm --dir web exec vitest run src/lib/route.spec.ts src/lib/utils/memory-viewer-source.spec.ts src/routes/'(user)'/memories/memory-index-utils.spec.ts src/routes/'(user)'/memories/memory-card.spec.ts src/routes/'(user)'/memories/page-load.spec.ts src/routes/'(user)'/memories/page.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/routes/'(user)'/photos/'[[assetId=id]]'/photos-page.spec.ts
pnpm --filter immich-web exec svelte-check --fail-on-warnings
pnpm --dir e2e exec playwright test --project=web src/ui/specs/memory/memory-index.e2e-spec.ts
```

Expected: all focused verification commands pass.

- [ ] **Step 5: Run broad verification if focused checks pass**

Run:

```bash
pnpm --filter immich test -- --run src/services/memory.service.spec.ts src/services/system-config.service.spec.ts
pnpm --dir web exec vitest run src/lib/route.spec.ts
```

Expected: server test command remains green and the route baseline remains green.

- [ ] **Step 6: Commit E2E and verification artifacts**

Commit:

```bash
git add e2e/src/ui/generators/memory/model-objects.ts e2e/src/ui/specs/memory/memory-index.e2e-spec.ts
git commit -m "test: cover memories history page"
```

## Self-Review Notes

- Spec coverage: retention default `365`, retention `0`, saved-memory preservation, invalid asset-link cleanup, `/memories` page, route split, local search, saved filter, grouping by `showAt ?? createdAt`, card links to viewer, admin setting, sidebar/command palette route, empty/loading/error states, and E2E click-through are all covered by tasks.
- Implementation adjustment: the approved design said historic cards should open the existing viewer while the current viewer uses today-only `memoryManager` state. Task 3 adds a history source mode for the viewer so historic links are viable without contaminating the today-only carousel state.
- TDD check: server cleanup, config validation, route helpers, admin settings UI, viewer source helpers, index utilities, card rendering, route load, page behavior, and E2E coverage all add or update tests before the matching implementation step.
- Non-goals preserved: no backfill, no new API endpoint, no pagination, no mobile implementation, no redesign of the full-screen viewer.
- Placeholder scan: this plan has no deferred validation and no copy-forward shorthand steps.
