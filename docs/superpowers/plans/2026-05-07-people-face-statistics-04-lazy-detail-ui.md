# People Face Statistics Phase 4: Frontend Lazy Detail UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add lazy, cached face-statistics detail UI to the global people and shared-space people headers.

**Architecture:** A reusable people face-statistics info component owns the accessible info button, popover/dialog-like detail panel, loading/error states, and cache keyed by the current route scope. `UserPageLayout` gets a small trailing-description snippet so the info button stays attached to the header count. Global and shared-space pages provide only the correct loader, cache key, and visibility rules.

**Tech Stack:** Svelte 5, SvelteKit page components, `@immich/sdk`, `@immich/ui`, `svelte-i18n`, Vitest, Testing Library for Svelte.

---

## Phase Boundary

This phase owns:

- Lazy diagnostic face-statistics UI on `web/src/routes/(user)/people/+page.svelte`.
- Lazy diagnostic face-statistics UI on `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.
- A reusable component for rendering the info action and the detail split.
- Header layout support for a description-trailing action.
- Tests that prove detailed endpoints are not called until click, details are cached, scope changes invalidate cache, and error/loading states do not remove primary counts.

This phase does not own:

- Backend aggregate changes.
- Person-detail statistics UI or endpoints.
- New filters beyond the filters already supported by the current people pages.
- Local lint/build execution; CI should run broad lint/build.

## UX Contract

- The info action renders only when the header face count is honest and visible.
- Global people page:
  - Show the info action when `peopleStatistics` exists and no unsupported global name search is active.
  - The detailed request is `getPeopleFaceStatistics({ withSharedSpaces: true })`.
  - Do not show the info action while `QueryParameter.SEARCHED_PEOPLE` is active, because global name filtering is handled by `searchPerson` and the detailed endpoint does not support that client-side filter.
- Shared-space people page:
  - Show the info action when `peopleStatistics` exists.
  - The unfiltered detailed request is `getSpacePeopleFaceStatistics({ id: space.id })`.
  - The filtered detailed request during supported name search is `getSpacePeopleFaceStatistics({ id: space.id, name: trimmedSearchName })`.
- The panel rows are:
  - detected faces
  - assigned to visible people
  - assigned to hidden people
  - unassigned
- The panel uses locale number formatting.
- The panel exposes a compact `role="dialog"` surface with an accessible label. The trigger is an icon button with a useful `aria-label`.
- Loading and error states affect only the detail panel. The primary header description remains visible.
- Closing and reopening the panel with the same cache key reuses cached details and does not call the SDK again.
- Changing the cache key can reuse an already cached result for that new key, but must not show stale details from the previous key.
- Empty scopes that omit the header face count must also omit the info action.

## Cache Keys

Use stable string cache keys that include user, route scope, space ID when present, and active filters:

```ts
const globalFaceStatisticsCacheKey = $derived(`user:${authManager.user.id}:global:people:withSharedSpaces=true`);
const spaceFaceStatisticsCacheKey = $derived(
  `user:${authManager.user.id}:space:${space.id}:people:face-statistics:name=${encodeURIComponent(searchName.trim())}`,
);
```

## File Map

Expected test files:

- Add `web/src/lib/components/people/people-face-statistics-info.spec.ts`.
- Modify `web/src/lib/components/layouts/user-page-layout.spec.ts`.
- Add `web/src/lib/components/layouts/user-page-layout-description-trailing.test-wrapper.svelte`.
- Modify `web/src/routes/(user)/people/people-page.spec.ts`.
- Modify `web/src/lib/components/spaces/space-people-page.spec.ts`.

Production files:

- Add `web/src/lib/components/people/people-face-statistics-info.svelte`.
- Modify `web/src/lib/components/layouts/user-page-layout.svelte`.
- Modify `web/src/lib/components/spaces/mock-user-page-layout.test-wrapper.svelte`.
- Modify `web/src/routes/(user)/people/+page.svelte`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.
- Modify `i18n/en.json`.

## TDD Rules

- For each task, write or update tests first.
- Run the focused test and confirm the expected red failure before production edits.
- Implement only the behavior needed for the green tests.
- Preserve the Phase 3 guarantee that detailed endpoints are not called on initial render.
- Do not run local lint/build in this phase. Use CI for broad lint/build.

## Subagent Work Slices

Use one fresh implementer subagent per task. Do not run implementation subagents in parallel because the tasks touch adjacent Svelte page and layout code.

Tell every worker they are not alone in the codebase, must not revert edits made by others, and must adjust their work to compatible changes made by other workers.

---

## Task 1: Add Reusable Lazy Face-Statistics Info Component

**Files:**

- Add `web/src/lib/components/people/people-face-statistics-info.spec.ts`.
- Add `web/src/lib/components/people/people-face-statistics-info.svelte`.
- Modify `i18n/en.json`.

- [x] **Step 1: Write failing component tests**

Create `web/src/lib/components/people/people-face-statistics-info.spec.ts` with tests for:

- The trigger is an accessible icon button named `view_face_statistics_details`.
- The `loadStatistics` function is not called on initial render.
- Clicking the trigger shows `loading_face_statistics` while the request is pending.
- The trigger exposes `aria-expanded`, `aria-controls`, and keyboard activation through its button semantics.
- The open surface has `role="dialog"` and accessible name `view_face_statistics_details`.
- The details surface has `w-72` and `max-w-[calc(100vw-1rem)]` so the compact panel remains usable on narrow mobile widths.
- Escape and outside click close the open details surface.
- A successful load renders the four diagnostic rows using locale formatting.
- Closing and reopening with the same `cacheKey` does not call `loadStatistics` again.
- A new `cacheKey` causes the next open to call `loadStatistics` again and does not show stale rows.
- If a slow old request resolves after `cacheKey` changes, the old response is cached under the old key but is not displayed for the new key.
- A rejected load renders `unable_to_load_face_statistics` with `role="alert"` and leaves the trigger usable.

Use a small deferred promise helper in the spec:

```ts
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}
```

Import and call `clearPeopleFaceStatisticsInfoCache()` in `beforeEach` so the module-level cache cannot leak between tests.

Expected red failure: the component file does not exist.

- [x] **Step 2: Run component tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/components/people/people-face-statistics-info.spec.ts
```

- [x] **Step 3: Implement the component and text keys**

Add these English keys near the existing `face` keys in `i18n/en.json`:

```json
"assigned_to_hidden_people": "Assigned to hidden people",
"assigned_to_visible_people": "Assigned to visible people",
"detected_faces": "Detected faces",
"loading_face_statistics": "Loading face statistics",
"unable_to_load_face_statistics": "Unable to load face statistics",
"unassigned": "Unassigned",
"view_face_statistics_details": "View face statistics details"
```

Add `web/src/lib/components/people/people-face-statistics-info.svelte`:

```svelte
<script lang="ts" module>
  import type { PeopleFaceStatisticsResponseDto } from '@immich/sdk';

  const statisticsCache = new Map<string, PeopleFaceStatisticsResponseDto>();

  export const clearPeopleFaceStatisticsInfoCache = () => statisticsCache.clear();
</script>

<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { locale } from '$lib/stores/preferences.store';
  import { IconButton } from '@immich/ui';
  import { mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    cacheKey: string;
    loadStatistics: () => Promise<PeopleFaceStatisticsResponseDto>;
  }

  let { cacheKey, loadStatistics }: Props = $props();

  let isOpen = $state(false);
  let isLoading = $state(false);
  let error = $state(false);
  let statistics = $state<PeopleFaceStatisticsResponseDto | undefined>();
  let activeCacheKey = $state(cacheKey);

  const formatNumber = (value: number) => value.toLocaleString($locale);

  const syncCacheKey = () => {
    if (activeCacheKey === cacheKey) {
      return;
    }

    activeCacheKey = cacheKey;
    statistics = statisticsCache.get(cacheKey);
    error = false;
    isLoading = false;
  };

  $effect(() => {
    syncCacheKey();
    if (isOpen && !statistics && !isLoading) {
      void loadDetails();
    }
  });

  async function loadDetails() {
    syncCacheKey();
    const requestCacheKey = cacheKey;
    const cached = statisticsCache.get(requestCacheKey);
    if (cached) {
      statistics = cached;
      return;
    }

    isLoading = true;
    error = false;
    try {
      const loadedStatistics = await loadStatistics();
      statisticsCache.set(requestCacheKey, loadedStatistics);
      if (cacheKey === requestCacheKey) {
        statistics = loadedStatistics;
      }
    } catch {
      if (cacheKey === requestCacheKey) {
        statistics = undefined;
        error = true;
      }
    } finally {
      if (cacheKey === requestCacheKey) {
        isLoading = false;
      }
    }
  }

  async function toggleDetails() {
    isOpen = !isOpen;
    if (isOpen && !statistics && !isLoading) {
      await loadDetails();
    }
  }

  const closeDetails = () => {
    isOpen = false;
  };
</script>

<div
  class="relative inline-flex"
  data-testid="people-face-statistics-info"
  use:clickOutside={{ onOutclick: closeDetails, onEscape: closeDetails }}
>
  <IconButton
    aria-controls="people-face-statistics-details"
    aria-expanded={isOpen}
    aria-label={$t('view_face_statistics_details')}
    color="secondary"
    icon={mdiInformationOutline}
    onclick={() => void toggleDetails()}
    shape="round"
    size="small"
    title={$t('view_face_statistics_details')}
    variant="ghost"
  />

  {#if isOpen}
    <div
      aria-label={$t('view_face_statistics_details')}
      class="absolute start-0 top-9 z-10 w-72 max-w-[calc(100vw-1rem)] rounded-lg border border-gray-200 bg-white p-3 text-sm shadow-lg dark:border-gray-700 dark:bg-immich-dark-gray"
      data-testid="people-face-statistics-details"
      id="people-face-statistics-details"
      role="dialog"
    >
      {#if isLoading}
        <p class="text-gray-500 dark:text-gray-300" role="status">{$t('loading_face_statistics')}</p>
      {:else if error}
        <p class="text-red-600 dark:text-red-400" role="alert">{$t('unable_to_load_face_statistics')}</p>
      {:else if statistics}
        <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
          <dt class="text-gray-500 dark:text-gray-300">{$t('detected_faces')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.detectedFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('assigned_to_visible_people')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.assignedVisibleFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('assigned_to_hidden_people')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.assignedHiddenFaceCount)}</dd>
          <dt class="text-gray-500 dark:text-gray-300">{$t('unassigned')}</dt>
          <dd class="font-medium tabular-nums">{formatNumber(statistics.unassignedFaceCount)}</dd>
        </dl>
      {/if}
    </div>
  {/if}
</div>
```

Adjust class names if Svelte or Tailwind checks require it, but preserve the test-visible roles, labels, cache behavior, and row text.

- [x] **Step 4: Run component tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/components/people/people-face-statistics-info.spec.ts
```

## Task 2: Extend UserPageLayout With A Description-Trailing Slot

**Files:**

- Modify `web/src/lib/components/layouts/user-page-layout.spec.ts`.
- Add `web/src/lib/components/layouts/user-page-layout-description-trailing.test-wrapper.svelte`.
- Modify `web/src/lib/components/layouts/user-page-layout.svelte`.
- Modify `web/src/lib/components/spaces/mock-user-page-layout.test-wrapper.svelte`.

- [x] **Step 1: Write failing layout tests**

Add `web/src/lib/components/layouts/user-page-layout-description-trailing.test-wrapper.svelte`:

```svelte
<UserPageLayout title="People" description="(60) \u00b7 2,901 faces">
  {#snippet descriptionTrailing()}
    <button type="button">Info</button>
  {/snippet}
</UserPageLayout>
```

Extend `web/src/lib/components/layouts/user-page-layout.spec.ts` with a test that renders this wrapper.

Assert:

- `screen.getByTestId('page-header-description-trailing')` exists.
- The trailing button is next to the description in the title row.
- The trailing container has `shrink-0` so the info action does not collapse before the title truncates.
- The title row still has `min-w-0 overflow-hidden`, the title still truncates, and the description remains `whitespace-nowrap`.

Expected red failure: `descriptionTrailing` is not a recognized/rendered snippet.

- [x] **Step 2: Run layout tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/components/layouts/user-page-layout.spec.ts
```

- [x] **Step 3: Implement the slot**

Update `UserPageLayout` props to include:

```ts
descriptionTrailing?: Snippet;
```

Render it immediately after the description paragraph:

```svelte
{#if descriptionTrailing}
  <div class="shrink-0" data-testid="page-header-description-trailing">
    {@render descriptionTrailing()}
  </div>
{/if}
```

Update `web/src/lib/components/spaces/mock-user-page-layout.test-wrapper.svelte` to accept and render the same snippet in tests:

```svelte
{#if descriptionTrailing}
  <div data-testid="layout-description-trailing">
    {@render descriptionTrailing()}
  </div>
{/if}
```

- [x] **Step 4: Run layout tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/components/layouts/user-page-layout.spec.ts
```

## Task 3: Integrate Lazy Details On The Global People Page

**Files:**

- Modify `web/src/routes/(user)/people/people-page.spec.ts`.
- Modify `web/src/routes/(user)/people/+page.svelte`.

- [x] **Step 1: Write failing global page tests**

Add tests to `people-page.spec.ts` for:

- Set `authManager.setUser(userAdminFactory.build({ id: 'current-user-id' }))` and `authManager.setPreferences(preferencesFactory.build())` in `beforeEach`, because the cache key includes the authenticated user.
- Import and call `clearPeopleFaceStatisticsInfoCache()` in `beforeEach`.
- When overview stats exist and no global search is active, the info button is rendered with accessible name `view_face_statistics_details`.
- Initial render still does not call `sdkMock.getPeopleFaceStatistics`.
- Clicking info calls `getPeopleFaceStatistics({ withSharedSpaces: true })` and renders all four detail rows.
- Closing and reopening the info UI uses cached details and does not call the SDK a second time.
- Changing the authenticated user invalidates the cache key and loads details separately.
- When the detail request rejects, the error text renders and the header description still contains the primary face count.
- During unsupported global name search, the info button is hidden and the detailed endpoint is not called.
- When `peopleStatistics` is `null`, the info button is hidden.
- When `peopleStatistics` is `{ total: 0, hidden: 0, detectedFaceCount: 0 }`, the info button is hidden because no face count is visible in the header.

Expected red failure: no info button exists.

- [x] **Step 2: Run global page tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/people-page.spec.ts' -t "face statistics|detailed|unsupported global name search"
```

- [x] **Step 3: Implement global integration**

In `+page.svelte`:

- Import `PeopleFaceStatisticsInfo`.
- Import `authManager` from `$lib/managers/auth-manager.svelte`.
- Import `getPeopleFaceStatistics` from `@immich/sdk`.
- Add:

```ts
let showFaceStatisticsInfo = $derived(!!overviewStatistics && !hasUnsupportedStatsFilter && !!headerDescription);
let globalFaceStatisticsCacheKey = $derived(`user:${authManager.user.id}:global:people:withSharedSpaces=true`);
const loadGlobalFaceStatistics = () => getPeopleFaceStatistics({ withSharedSpaces: true });
```

Render the component through the new layout snippet:

```svelte
{#snippet descriptionTrailing()}
  {#if showFaceStatisticsInfo}
    <PeopleFaceStatisticsInfo cacheKey={globalFaceStatisticsCacheKey} loadStatistics={loadGlobalFaceStatistics} />
  {/if}
{/snippet}
```

Keep the existing `description={headerDescription}` behavior unchanged.

- [x] **Step 4: Run global page tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/people-page.spec.ts'
```

## Task 4: Integrate Lazy Details On The Shared-Space People Page

**Files:**

- Modify `web/src/lib/components/spaces/space-people-page.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.

- [x] **Step 1: Write failing shared-space page tests**

Add tests to `space-people-page.spec.ts` for:

- Import and call `clearPeopleFaceStatisticsInfoCache()` in `beforeEach`.
- When overview stats exist, the info button is rendered with accessible name `view_face_statistics_details`.
- Initial render still does not call `sdkMock.getSpacePeopleFaceStatistics`.
- Clicking info calls `getSpacePeopleFaceStatistics({ id: 'space-1' })` and renders all four detail rows.
- Closing and reopening the info UI uses cached details and does not call the SDK a second time.
- During supported name search, clicking info calls `getSpacePeopleFaceStatistics({ id: 'space-1', name: 'Ali' })`.
- Changing the search from empty to `Ali` invalidates the cache key, so the filtered details load separately and stale unfiltered rows are not displayed.
- Changing the authenticated user invalidates the cache key and loads details separately.
- When the detail request rejects, the error text renders and the header description still contains the primary face count.
- When `peopleStatistics` is `null`, the info button is hidden.
- When `peopleStatistics` is `{ total: 0, hidden: 0, detectedFaceCount: 0 }`, the info button is hidden because no face count is visible in the header.

Expected red failure: no info button exists.

- [x] **Step 2: Run shared-space page tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/components/spaces/space-people-page.spec.ts -t "face statistics|detailed|search"
```

- [x] **Step 3: Implement shared-space integration**

In `+page.svelte`:

- Import `PeopleFaceStatisticsInfo`.
- Import `getSpacePeopleFaceStatistics` from `@immich/sdk`.
- Add:

```ts
let showFaceStatisticsInfo = $derived(!!peopleStatistics && !!headerDescription);
let spaceFaceStatisticsCacheKey = $derived(
  `user:${authManager.user.id}:space:${space.id}:people:face-statistics:name=${encodeURIComponent(searchName.trim())}`,
);
const loadSpaceFaceStatistics = () => getSpacePeopleFaceStatistics(getStatisticsQuery());
```

Render the component through the new layout snippet:

```svelte
{#snippet descriptionTrailing()}
  {#if showFaceStatisticsInfo}
    <PeopleFaceStatisticsInfo cacheKey={spaceFaceStatisticsCacheKey} loadStatistics={loadSpaceFaceStatistics} />
  {/if}
{/snippet}
```

Keep the existing shared-space header description behavior unchanged.

- [x] **Step 4: Run shared-space page tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/components/spaces/space-people-page.spec.ts
```

## Task 5: Focused Verification And Self-Review

- [x] **Step 1: Run Phase 4 focused tests**

```bash
pnpm --dir web exec vitest --run \
  src/lib/components/people/people-face-statistics-info.spec.ts \
  src/lib/components/layouts/user-page-layout.spec.ts \
  'src/routes/(user)/people/people-page.spec.ts' \
  src/lib/components/spaces/space-people-page.spec.ts
```

- [x] **Step 2: Run frontend type and Svelte checks**

```bash
pnpm --dir web check:typescript
pnpm --dir web check:svelte
```

- [x] **Step 3: Verify lazy endpoint usage**

```bash
rg -n "getPeopleFaceStatistics|getSpacePeopleFaceStatistics" web/src/routes web/src/lib
```

Expected:

- Production imports only in the two people page components.
- Tests may reference the functions for positive click assertions and negative initial-render assertions.
- No page-load file imports either detailed endpoint.

- [x] **Step 4: Verify whitespace**

```bash
git diff --check
```

- [x] **Step 5: Review changed UI text and behavior**

```bash
git diff -- web/src i18n/en.json docs/superpowers/plans/2026-05-07-people-face-statistics-04-lazy-detail-ui.md
```

Check:

- The info action is accessible.
- The detailed endpoint is lazy only.
- Cache keys include route scope, space ID when present, and active name filter where supported.
- Global unsupported search hides the info action.
- Shared-space supported search passes `name` to detailed statistics.
- Loading and error states do not remove the primary header description.
- Local lint/build were not run; CI handles them.

## Edge Cases Checklist

- Empty global scope with no face count: no info action.
- Global stats unavailable: no info action, people list still renders.
- Global unsupported search: no face count and no info action.
- Global click: one detailed request, then cached reopen.
- Shared-space stats unavailable: no info action, people list and controls still render.
- Shared-space unfiltered click: one detailed request for `{ id }`.
- Shared-space name search click: detailed request includes `{ id, name }`.
- Shared-space search change: cached unfiltered details do not display for filtered details.
- Detail request failure: error appears only in the detail panel.
- Locale formatting applies to all four detail rows.
- Initial render of both pages does not call detailed endpoints.
