# People Face Statistics Phase 3: Frontend Overview Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every code task. Use superpowers:verification-before-completion before claiming this phase is done. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the overview detected-face count in the global people and shared-space people headers, using only the cheap overview statistics endpoints added in Phase 1.

**Architecture:** SvelteKit page loads fetch people rows and overview statistics independently, so a statistics failure does not prevent the people list from rendering. Page components format one shared header description from visible people count plus optional detected-face count. The global page hides the face count while an unsupported client-side name search is active. The shared-space page passes its supported `name` filter to the shared-space overview statistics endpoint.

**Tech Stack:** Svelte 5, SvelteKit page loads, `@immich/sdk` generated client, `svelte-i18n`, Vitest, Testing Library for Svelte, existing Gallery web test mocks.

---

## Phase Boundary

This phase owns:

- Global people overview header text on `web/src/routes/(user)/people/+page.svelte`.
- Global people page load for `GET /people/statistics`.
- Shared-space people overview header text on `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.
- Shared-space people page-load and search refresh behavior for overview statistics.
- Header layout resilience in `UserPageLayout` so longer count text remains visible on mobile.
- Web tests proving overview stats are used and lazy detailed endpoints are not called during initial render.

This phase does not own:

- Info icon, popover, dialog, sheet, or any lazy detailed UI.
- Calls to `getPeopleFaceStatistics` or `getSpacePeopleFaceStatistics` from production web code.
- Person-detail statistics UI.
- Backend aggregate changes.
- OpenAPI or SDK generation, except if CI shows the generated SDK from earlier phases is stale.

## Header Contract

- Header person count remains the visible people count: `total - hidden`.
- Header face count uses overview `detectedFaceCount`, which means all detected in-scope faces, including visible-assigned, hidden-assigned, and unassigned faces.
- Header format is:

```text
(<visible people>) \u00b7 <detected faces> faces
```

Example rendered text:

```text
(60) \u00b7 2,901 faces
```

- Use singular text for exactly one face:

```text
(1) \u00b7 1 face
```

- If global statistics are unavailable because the overview request failed, keep rendering the people list and omit only the face count because the global list endpoint still returns trusted `total` and `hidden` counts.
- If shared-space statistics are unavailable because the overview request failed, keep rendering the people list and controls but omit the whole aggregate header description. `getSpacePeople` returns paginated rows, not trusted aggregate totals.
- If there are zero visible people but `detectedFaceCount > 0`, render the header description as `(0) \u00b7 N faces`. This covers all-hidden and unassigned-face scopes.
- If there are zero visible people and zero detected faces with no active search, omit the description, preserving the existing empty-state header behavior.

## Supported Filter Matrix

Global people page:

- Supported overview statistics query: `{ withSharedSpaces: true }`.
- Existing active client-side name search comes from `QueryParameter.SEARCHED_PEOPLE` and uses `searchPerson`, not `GET /people`.
- Because `GET /people/statistics` does not support the global name search filter, hide the face count while `searchName` is active. Keep the searched people count, for example `(1)`, so the UI does not present the unfiltered global face total as a filtered total.
- Do not pass unsupported similarity filters such as `closestPersonId` or `closestAssetId` from this page.

Shared-space people page:

- Supported overview statistics query on initial load: `{ id: params.spaceId }`.
- Supported active search query: `{ id: space.id, name: trimmedSearchName }`.
- Continue ignoring pagination for aggregate statistics. `limit` and `offset` belong to `getSpacePeople`, not `getSpacePeopleStatistics`.
- When the search name is cleared, refresh overview statistics with `{ id: space.id }`.

## File Map

Expected test files:

- Add `web/src/lib/utils/people-statistics.spec.ts`.
- Add `web/src/routes/(user)/people/page-load.spec.ts`.
- Modify `web/src/routes/(user)/people/people-page.spec.ts`.
- Add `web/src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts`.
- Modify `web/src/lib/components/spaces/space-people-page.spec.ts`.
- Add `web/src/lib/components/layouts/user-page-layout.spec.ts`.

Production files likely touched:

- Add `web/src/lib/utils/people-statistics.ts`.
- Modify `web/src/routes/(user)/people/+page.ts`.
- Modify `web/src/routes/(user)/people/+page.svelte`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.
- Modify `web/src/lib/components/layouts/user-page-layout.svelte`.
- Modify `i18n/en.json` for generic `face` and `faces` keys if no suitable generic keys already exist.

## TDD Rules

- Start each task with failing tests.
- Run the focused test command and confirm it fails for the expected missing-function, missing-field, or stale-description reason.
- Implement only enough production code to make that task green.
- Add edge-case tests before broadening behavior.
- Keep Phase 4 out of this phase: no production import or call of detailed face-statistics SDK functions.
- Commit only after the whole Phase 3 plan is green and reviewed.

## Subagent Work Slices

Use subagents only for independent slices with disjoint write ownership:

- Worker A owns `web/src/lib/utils/people-statistics.ts`, `web/src/lib/utils/people-statistics.spec.ts`, and any required generic i18n keys.
- Worker B owns global people load/header tests and code under `web/src/routes/(user)/people/`.
- Worker C owns shared-space people load/header tests and code under `web/src/routes/(user)/spaces/[spaceId]/people/` plus `web/src/lib/components/spaces/space-people-page.spec.ts`.
- Worker D owns `web/src/lib/components/layouts/user-page-layout.svelte` and `web/src/lib/components/layouts/user-page-layout.spec.ts`.

Tell every worker they are not alone in the codebase, must not revert edits made by others, and must adjust to compatible changes made by other workers.

---

## Task 1: Add Shared Header Formatting Utility

**Files:**

- Add `web/src/lib/utils/people-statistics.spec.ts`.
- Add `web/src/lib/utils/people-statistics.ts`.
- Modify `i18n/en.json` if generic `face` and `faces` keys are missing.

- [x] **Step 1: Write failing formatter tests**

Create `web/src/lib/utils/people-statistics.spec.ts` with tests for:

- Visible people plus plural detected faces formats as `(60) \u00b7 2,901 faces`.
- Singular detected face formats as `(1) \u00b7 1 face`.
- Locale formatting is honored for both people and face counts.
- With `includeFaceCount: false`, the formatter returns only the people count, for example `(1)`.
- With no stats and no unsupported filter, the formatter can return just `(10)` when the caller has a trusted people count.
- Zero visible people with zero detected faces returns `undefined` when `showZeroPeople` is false.
- Zero visible people with detected faces returns `(0) \u00b7 42 faces` when `showZeroPeople` is true.
- Null or undefined detected-face count never renders `undefined faces` or `NaN faces`.

Expected red failure: the utility file does not exist.

- [x] **Step 2: Run formatter tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/utils/people-statistics.spec.ts
```

- [x] **Step 3: Implement the formatter**

Add `web/src/lib/utils/people-statistics.ts` with a small pure helper. Use ASCII source text and emit the separator as `'\u00b7'`.

Suggested contract:

```ts
type FormatPeopleHeaderDescriptionOptions = {
  visiblePeopleCount: number;
  detectedFaceCount?: number | null;
  locale?: string;
  faceSingular: string;
  facePlural: string;
  includeFaceCount?: boolean;
  showZeroPeople?: boolean;
};

export const formatPeopleHeaderDescription = ({
  visiblePeopleCount,
  detectedFaceCount,
  locale,
  faceSingular,
  facePlural,
  includeFaceCount = true,
  showZeroPeople = false,
}: FormatPeopleHeaderDescriptionOptions): string | undefined => {
  if (visiblePeopleCount === 0 && !showZeroPeople) {
    return undefined;
  }

  const peopleText = `(${visiblePeopleCount.toLocaleString(locale)})`;
  if (!includeFaceCount || detectedFaceCount === null || detectedFaceCount === undefined) {
    return peopleText;
  }

  const faceLabel = detectedFaceCount === 1 ? faceSingular : facePlural;
  return `${peopleText} \u00b7 ${detectedFaceCount.toLocaleString(locale)} ${faceLabel}`;
};
```

If `i18n/en.json` lacks generic keys, add:

```json
"face": "face",
"faces": "faces"
```

- [x] **Step 4: Run formatter tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/utils/people-statistics.spec.ts
```

## Task 2: Load Global Overview Statistics Without Blocking The People List

**Files:**

- Add `web/src/routes/(user)/people/page-load.spec.ts`.
- Modify `web/src/routes/(user)/people/+page.ts`.

- [x] **Step 1: Write failing global page-load tests**

Create `web/src/routes/(user)/people/page-load.spec.ts` using existing `sdkMock`, `authenticate`, and `getFormatter` mock patterns. Cover:

- `authenticate(url)` is called.
- `getAllPeople({ withHidden: true, withSharedSpaces: true })` is called.
- `getPeopleStatistics({ withSharedSpaces: true })` is called.
- Returned data includes `peopleStatistics: { total, hidden, detectedFaceCount }`.
- `getPeopleFaceStatistics` is not called.
- If `getPeopleStatistics` rejects, `load` still returns the people list, `peopleStatistics: null`, and metadata.
- If `getAllPeople` rejects, `load` still rejects, preserving existing list failure behavior.
- No unsupported URL search parameter is forwarded to `getPeopleStatistics`.

Expected red failure: `getPeopleStatistics` is not imported or called by `+page.ts`.

- [x] **Step 2: Run global page-load tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/page-load.spec.ts'
```

- [x] **Step 3: Implement global page load**

Update `web/src/routes/(user)/people/+page.ts` to:

- Import `getPeopleStatistics`.
- Fetch people and overview statistics without letting a statistics failure fail the whole page.
- Return `peopleStatistics` as either the DTO response or `null`.
- Keep `meta.title` unchanged.

Implementation shape:

```ts
const [people, peopleStatistics] = await Promise.all([
  getAllPeople({ withHidden: true, withSharedSpaces: true }),
  getPeopleStatistics({ withSharedSpaces: true }).catch(() => null),
]);
```

- [x] **Step 4: Run global page-load tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/page-load.spec.ts'
```

## Task 3: Render Global People Header Face Count

**Files:**

- Modify `web/src/routes/(user)/people/people-page.spec.ts`.
- Modify `web/src/routes/(user)/people/+page.svelte`.

- [x] **Step 1: Write failing global page component tests**

Extend `renderPage` so test data includes `peopleStatistics` by default:

```ts
peopleStatistics: {
  total: people.length,
  hidden: people.filter((person) => person.isHidden).length,
  detectedFaceCount: 0,
},
```

Add tests for:

- Header renders visible people and detected faces, for example `(10) \u00b7 2,901 faces`, when `peopleStatistics` is present.
- Header derives visible people from `total - hidden`, not loaded row count.
- All-hidden scope with detected faces renders `(0) \u00b7 42 faces`.
- Empty scope with `detectedFaceCount: 0` and no search omits the description.
- When `peopleStatistics` is `null`, the page still renders people and falls back to the trusted list endpoint count without a face count, for example `(10)`.
- Initial render never calls `sdkMock.getPeopleFaceStatistics`.
- Unsupported global name search keeps only the searched people count and hides the face count. Example: stats contain `2,901` faces, search result has one person, header description is `(1)` and does not contain `faces`.

Expected red failure: component still renders only `(${countVisiblePeople})`.

- [x] **Step 2: Run global component tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/people-page.spec.ts' -t "count|face|search"
```

- [x] **Step 3: Implement global header rendering**

Update `web/src/routes/(user)/people/+page.svelte` to:

- Import `formatPeopleHeaderDescription`.
- Derive `overviewStatistics = data.peopleStatistics`.
- Derive `hasUnsupportedStatsFilter = !!searchName.trim()`.
- Keep `countVisiblePeople` as the existing searched count during name search, otherwise use the trusted aggregate `data.peopleStatistics ?? data.people`.
- Render face count only when stats exist and `hasUnsupportedStatsFilter` is false.
- Set `showZeroPeople` when there is an active search or `detectedFaceCount > 0`.
- Pass `$t('face')` and `$t('faces')` to the formatter.

The description expression should be a derived value, not inline string assembly in markup.

- [x] **Step 4: Run global component tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/people/people-page.spec.ts'
```

## Task 4: Load Shared-Space Overview Statistics Without Blocking The People List

**Files:**

- Add `web/src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.ts`.

- [x] **Step 1: Write failing shared-space page-load tests**

Create `web/src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts`. Cover:

- `authenticate(url)` is called.
- `getSpace({ id: params.spaceId })`, `getMembers({ id: params.spaceId })`, and `getSpacePeople({ id: params.spaceId, limit: 100 })` are called.
- `getSpacePeopleStatistics({ id: params.spaceId })` is called.
- Returned data includes `peopleStatistics.detectedFaceCount`.
- `getSpacePeopleFaceStatistics` is not called.
- If `getSpacePeopleStatistics` rejects, `load` still returns `space`, `members`, `people`, `peopleStatistics: null`, and metadata.
- If `getSpacePeople` rejects, `load` still rejects, preserving existing list failure behavior.

Expected red failure: the generated DTO shape requires `detectedFaceCount` and/or stats failure still rejects the whole load.

- [x] **Step 2: Run shared-space page-load tests and verify red**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts'
```

- [x] **Step 3: Implement shared-space page load**

Update `web/src/routes/(user)/spaces/[spaceId]/people/+page.ts` so only the statistics request is allowed to fail independently:

```ts
const [space, members, people, peopleStatistics] = await Promise.all([
  getSpace({ id: params.spaceId }),
  getMembers({ id: params.spaceId }),
  getSpacePeople({ id: params.spaceId, limit: 100 }),
  getSpacePeopleStatistics({ id: params.spaceId }).catch(() => null),
]);
```

- [x] **Step 4: Run shared-space page-load tests and verify green**

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts'
```

## Task 5: Render Shared-Space People Header Face Count And Preserve Search Semantics

**Files:**

- Modify `web/src/lib/components/spaces/space-people-page.spec.ts`.
- Modify `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte`.

- [x] **Step 1: Write failing shared-space component tests**

Update default test statistics to include `detectedFaceCount`, and allow `peopleStatistics: null` in `renderPage`.

Add or update tests for:

- Header renders visible people and detected faces, for example `(10) \u00b7 1,980 faces`.
- Header derives visible people from `peopleStatistics.total - peopleStatistics.hidden`.
- All-hidden scope with detected faces renders `(0) \u00b7 42 faces`.
- Empty scope with zero detected faces and no search omits the description.
- `peopleStatistics: null` still renders the people list and omits the whole aggregate header description; it must not render a misleading loaded-row count such as `(100)`.
- `peopleStatistics: null` keeps search and editor visibility controls usable when loaded people exist.
- Searching passes `{ id: 'space-1', name: 'Ali' }` to `getSpacePeopleStatistics` and renders the returned filtered face count.
- Clearing search refreshes statistics with `{ id: 'space-1' }` and removes the name filter.
- Search refresh keeps the people list updated even if the statistics request rejects, then omits the face count instead of showing stale or unfiltered stats.
- Hiding a person increments `hidden` while preserving `detectedFaceCount` in the header.
- Initial render never calls `sdkMock.getSpacePeopleFaceStatistics`.

Expected red failure: component still renders only `(${countVisiblePeople})`, test fixtures lack `detectedFaceCount`, and stats refresh uses `Promise.all`.

- [x] **Step 2: Run shared-space component tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/components/spaces/space-people-page.spec.ts -t "count|face|search|hide"
```

- [x] **Step 3: Implement shared-space header rendering and stats refresh resilience**

Update `web/src/routes/(user)/spaces/[spaceId]/people/+page.svelte` to:

- Import `formatPeopleHeaderDescription`.
- Type `peopleStatistics` as `SharedSpacePeopleStatisticsResponseDto | null`.
- Initialize `peopleStatistics` from `data.peopleStatistics`.
- Derive `countVisiblePeople` from stats when available; otherwise do not present it as an aggregate header count or loaded-row fallback.
- Build a shared `headerDescription` using the formatter.
- Include the face count whenever stats are available, including during supported `name` searches.
- Use `showZeroPeople` when search is active or `detectedFaceCount > 0`.
- Guard existing places that read `peopleStatistics.total` or `peopleStatistics.hidden`.
- Keep search and editor visibility controls based on loaded people and member permissions when stats are unavailable, not only on `peopleStatistics.total`.
- Update `handleHide` to preserve `detectedFaceCount` and no-op the aggregate update when stats are unavailable.
- Change `refreshPeople` and `searchPeople` so a stats failure does not discard successful people results. Use `Promise.allSettled` or equivalent separate awaits, update people when `getSpacePeople` succeeds, set `peopleStatistics = null` when `getSpacePeopleStatistics` fails, and keep existing error handling for the failed request.

- [x] **Step 4: Run shared-space component tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/components/spaces/space-people-page.spec.ts
```

## Task 6: Make The Shared Header Layout Fit Longer Counts

**Files:**

- Add `web/src/lib/components/layouts/user-page-layout.spec.ts`.
- Modify `web/src/lib/components/layouts/user-page-layout.svelte`.

- [x] **Step 1: Write failing layout tests**

Create `web/src/lib/components/layouts/user-page-layout.spec.ts` with component tests that mock heavy layout children if needed. Cover:

- Rendering a title plus description `"(60) \u00b7 2,901 faces"` exposes the description text.
- The title row has `min-w-0` and `overflow-hidden` so it can share space with buttons.
- The title element has `truncate` or equivalent constrained overflow behavior.
- The description element has `shrink-0` and `whitespace-nowrap`, so the face count is not split or hidden before the title truncates.

These jsdom tests are a class-level regression guard, not a real browser layout proof. If this phase later adds Playwright or another browser harness, include a narrow mobile visual smoke check for the people header.

Expected red failure: current markup lacks the required class contract and description test id.

- [x] **Step 2: Run layout tests and verify red**

```bash
pnpm --dir web exec vitest --run src/lib/components/layouts/user-page-layout.spec.ts
```

- [x] **Step 3: Implement layout class contract**

Update `web/src/lib/components/layouts/user-page-layout.svelte`:

- Add a stable test id to the left header row, such as `data-testid="page-header-title-row"`.
- Add `min-w-0 flex-1 overflow-hidden` to the left header row.
- Add `min-w-0 truncate` to the title element while preserving `data-testid="page-header"`.
- Add `data-testid="page-header-description"` plus `shrink-0 whitespace-nowrap` to the description element.
- Preserve existing visual color, height, sidebar, button, and action behavior.

- [x] **Step 4: Run layout tests and verify green**

```bash
pnpm --dir web exec vitest --run src/lib/components/layouts/user-page-layout.spec.ts
```

## Task 7: Full Focused Verification And Self-Review

- [x] **Step 1: Run the full Phase 3 focused web test set**

```bash
pnpm --dir web exec vitest --run \
  src/lib/utils/people-statistics.spec.ts \
  'src/routes/(user)/people/page-load.spec.ts' \
  'src/routes/(user)/people/people-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/people/page-load.spec.ts' \
  src/lib/components/spaces/space-people-page.spec.ts \
  src/lib/components/layouts/user-page-layout.spec.ts
```

- [x] **Step 2: Run frontend type and Svelte checks locally**

```bash
pnpm --dir web check:typescript
pnpm --dir web check:svelte
```

- [x] **Step 3: Verify no Phase 4 production calls were introduced**

```bash
rg -n "getPeopleFaceStatistics|getSpacePeopleFaceStatistics" web/src/routes web/src/lib
```

Expected: only tests may reference these functions for negative assertions. Production Svelte and page-load files must not import or call them in Phase 3.

- [x] **Step 4: Review changed web text and colors**

```bash
git diff -- web/src i18n/en.json
```

Check that:

- Header descriptions use the shared formatter.
- Global unsupported search hides the face count.
- Shared-space supported search sends `name` to overview stats.
- Stats failures do not break people lists.
- Layout changes are scoped to the header row and do not restyle unrelated page content.

- [ ] **Step 5: Use CI for slower broad checks after push/PR**

Use CI for broad lint/build checks if they are too slow locally:

```bash
pnpm --dir web lint
pnpm --dir web build
```

Do not require a running dev server for this phase. This phase is covered by unit/component/load tests plus CI build and lint.

## Edge Cases Checklist

- Empty global people scope: no description and empty people state still renders.
- Empty shared-space people scope: no description and empty space people state still renders.
- All hidden people with detected faces: header renders `(0) \u00b7 N faces`.
- Unassigned-only detected faces in an otherwise empty visible people scope: header renders `(0) \u00b7 N faces` when overview stats report those faces.
- Global statistics request failure: people list still renders and only the face count is omitted.
- Shared-space statistics request failure: people list and controls still render, and the whole aggregate header description is omitted.
- Global name search: searched person count is shown, face count is hidden as unsupported.
- Shared-space name search: filtered people count and filtered face count are shown from `getSpacePeopleStatistics({ id, name })`.
- Search clear: stats query removes `name`.
- Pagination: aggregate header does not use loaded row count when stats exist.
- Hidden toggle: visible people count updates without resetting or losing `detectedFaceCount`.
- Singular face count: `1 face`, not `1 faces`.
- Large counts: locale formatting applies to both people and face counts.
- Mobile/header layout: description stays on one line and the title truncates first.
- Lazy detailed endpoints: not called on initial page load or render.
