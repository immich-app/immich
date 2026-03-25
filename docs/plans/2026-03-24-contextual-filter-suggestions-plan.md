# Contextual Filter Suggestions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make filter suggestions context-aware — selecting a date range narrows people, location, and camera suggestions to only values present in that period.

**Architecture:** Temporal filters (year/month) scope all other filter sections via `takenAfter`/`takenBefore` params added to existing suggestion endpoints. The temporal picker itself is already bidirectionally scoped via TimelineManager. FilterPanel becomes self-contained with debounced re-fetch on temporal changes.

**Tech Stack:** NestJS 11, Kysely, Svelte 5 (runes), Vitest, Playwright, `@immich/sdk` (generated)

**Design doc:** `docs/plans/2026-03-24-contextual-filter-suggestions-design.md`

---

## Task 1: Add temporal fields to SpaceScopeOptions and getExifField

**Files:**

- Modify: `server/src/repositories/search.repository.ts:167-169` (SpaceScopeOptions)
- Modify: `server/src/repositories/search.repository.ts:518-550` (getExifField)

**Step 1: Write the failing test**

In `server/src/services/search.service.spec.ts`, add tests after the existing `getSearchSuggestions` describe block (~line 99). These tests verify temporal fields thread through to the repository:

```typescript
it('should pass temporal fields to getCountries', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getCountries.mockResolvedValue(['Germany']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.COUNTRY,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

it('should pass temporal fields to getStates', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getStates.mockResolvedValue(['Bavaria']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.STATE,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getStates).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

// Repeat the same pattern for CITY, CAMERA_MAKE, CAMERA_MODEL, CAMERA_LENS_MODEL:
// Each test passes takenAfter/takenBefore in the DTO and asserts the corresponding
// repository method (getCities, getCameraMakes, getCameraModels, getCameraLensModels)
// receives them via expect.objectContaining({ takenAfter, takenBefore }).

it('should pass temporal fields to getCities', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getCities.mockResolvedValue(['Berlin']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.CITY,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCities).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

it('should pass temporal fields to getCameraMakes', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getCameraMakes.mockResolvedValue(['Canon']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.CAMERA_MAKE,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCameraMakes).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

it('should pass temporal fields to getCameraModels', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getCameraModels.mockResolvedValue(['EOS R5']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.CAMERA_MODEL,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCameraModels).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

it('should pass temporal fields to getCameraLensModels', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  mocks.search.getCameraLensModels.mockResolvedValue(['RF 50mm']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.CAMERA_LENS_MODEL,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCameraLensModels).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter, takenBefore }),
  );
});

it('should pass spaceId + temporal fields together', async () => {
  const takenAfter = new Date('2024-01-01');
  const takenBefore = new Date('2025-01-01');
  const spaceId = 'space-uuid';
  mocks.search.getCountries.mockResolvedValue(['Germany']);
  mocks.partner.getAll.mockResolvedValue([]);
  mocks.access.checkAccess.mockResolvedValue(new Set([spaceId]));

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.COUNTRY,
    spaceId,
    takenAfter,
    takenBefore,
  });

  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ spaceId, takenAfter, takenBefore }),
  );
});

it('should not pass temporal fields when not provided', async () => {
  mocks.search.getCountries.mockResolvedValue(['Germany']);
  mocks.partner.getAll.mockResolvedValue([]);

  await sut.getSearchSuggestions(authStub.user1, {
    includeNull: false,
    type: SearchSuggestionType.COUNTRY,
  });

  expect(mocks.search.getCountries).toHaveBeenCalledWith(
    [authStub.user1.user.id],
    expect.objectContaining({ takenAfter: undefined, takenBefore: undefined }),
  );
});
```

**Step 2: Run tests to verify they fail**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`
Expected: FAIL — `SearchSuggestionRequestDto` doesn't accept `takenAfter`/`takenBefore`, and `getCountries` only receives `{ spaceId }`.

**Step 3: Implement the changes**

In `server/src/repositories/search.repository.ts`, add temporal fields to `SpaceScopeOptions` (line 167):

```typescript
export interface SpaceScopeOptions {
  spaceId?: string;
  takenAfter?: Date;
  takenBefore?: Date;
}
```

In the same file, add temporal filtering to `getExifField` (after the existing space scoping `.$if` block, around line 548):

```typescript
.$if(!!options?.takenAfter, (qb) =>
  qb.where('asset.fileCreatedAt', '>=', options!.takenAfter!),
)
.$if(!!options?.takenBefore, (qb) =>
  qb.where('asset.fileCreatedAt', '<', options!.takenBefore!),
)
```

**Step 4: Update all repository methods to forward full options to getExifField**

Each method currently destructures and passes only `{ spaceId }`. Change them to pass
the full options object:

`getCountries` (line 461): Already passes `options` directly — no change needed.

`getStates` (line 467-473): Change destructuring and getExifField call:

```typescript
async getStates(userIds: string[], options: GetStatesOptions): Promise<string[]> {
  const res = await this.getExifField('state', userIds, options)
    .$if(!!options.country, (qb) => qb.where('country', '=', options.country!))
    .execute();
  return res.map((r) => r.state!);
}
```

`getCities` (line 476-483): Same pattern:

```typescript
async getCities(userIds: string[], options: GetCitiesOptions): Promise<string[]> {
  const res = await this.getExifField('city', userIds, options)
    .$if(!!options.country, (qb) => qb.where('country', '=', options.country!))
    .$if(!!options.state, (qb) => qb.where('state', '=', options.state!))
    .execute();
  return res.map((r) => r.city!);
}
```

`getCameraMakes` (line 486-493): Same pattern:

```typescript
async getCameraMakes(userIds: string[], options: GetCameraMakesOptions): Promise<string[]> {
  const res = await this.getExifField('make', userIds, options)
    .$if(!!options.model, (qb) => qb.where('model', '=', options.model!))
    .$if(!!options.lensModel, (qb) => qb.where('lensModel', '=', options.lensModel!))
    .execute();
  return res.map((r) => r.make!);
}
```

`getCameraModels` (line 496-503): Same pattern:

```typescript
async getCameraModels(userIds: string[], options: GetCameraModelsOptions): Promise<string[]> {
  const res = await this.getExifField('model', userIds, options)
    .$if(!!options.make, (qb) => qb.where('make', '=', options.make!))
    .$if(!!options.lensModel, (qb) => qb.where('lensModel', '=', options.lensModel!))
    .execute();
  return res.map((r) => r.model!);
}
```

`getCameraLensModels` (line 506-514): Same pattern:

```typescript
async getCameraLensModels(userIds: string[], options: GetCameraLensModelsOptions): Promise<string[]> {
  const res = await this.getExifField('lensModel', userIds, options)
    .$if(!!options.make, (qb) => qb.where('make', '=', options.make!))
    .$if(!!options.model, (qb) => qb.where('model', '=', options.model!))
    .execute();
  return res.map((r) => r.lensModel!);
}
```

**Step 5: Add temporal fields to SearchSuggestionRequestDto**

In `server/src/dtos/search.dto.ts`, add to `SearchSuggestionRequestDto` (after line 340):

```typescript
@ValidateDate({ optional: true })
takenAfter?: Date;

@ValidateDate({ optional: true })
takenBefore?: Date;
```

**Step 6: Update search service to pass temporal fields for getCountries**

In `server/src/services/search.service.ts` line 178, change:

```typescript
// Before:
return this.searchRepository.getCountries(userIds, { spaceId: dto.spaceId });

// After:
return this.searchRepository.getCountries(userIds, {
  spaceId: dto.spaceId,
  takenAfter: dto.takenAfter,
  takenBefore: dto.takenBefore,
});
```

**Step 7: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`
Expected: PASS

**Step 8: Run full server tests + lint**

Run: `cd server && pnpm test`
Then: `cd server && npx prettier --write src/dtos/search.dto.ts src/repositories/search.repository.ts src/services/search.service.ts`
Then: `make lint-server`

**Step 9: Commit**

```bash
git add server/src/dtos/search.dto.ts server/src/repositories/search.repository.ts server/src/services/search.service.ts server/src/services/search.service.spec.ts
git commit -m "feat: add temporal scoping to search suggestion queries"
```

---

## Task 2: Add temporal filtering to space people endpoint

**Files:**

- Create: `server/src/dtos/shared-space.dto.ts` (add `SpacePeopleQueryDto` — or add to existing file if it exists)
- Modify: `server/src/controllers/shared-space.controller.ts:261-270`
- Modify: `server/src/services/shared-space.service.ts:550-576`
- Modify: `server/src/repositories/shared-space.repository.ts:456-521`
- Test: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write the failing test**

Find the existing `getSpacePeople` tests in `shared-space.service.spec.ts` and add:

```typescript
it('should filter people by temporal range', async () => {
  // Setup: mock space with face recognition enabled
  // Mock repository to return persons
  // Call getSpacePeople with takenAfter/takenBefore
  // Assert repository method receives temporal params
});

it('should return all people when no temporal params provided', async () => {
  // Setup: same mock
  // Call getSpacePeople without temporal params
  // Assert backward compatibility — uses getPersonsBySpaceId (not temporal method)
});

it('should exclude person with zero face assets in date range', async () => {
  // Setup: mock space with face recognition enabled
  // Mock getPersonsBySpaceIdWithTemporalFilter to return only persons with faces in range
  // Call getSpacePeople with narrow takenAfter/takenBefore
  // Assert person with faces only outside range is NOT in results (excluded entirely,
  // not returned with count 0)
});
```

Adapt to the existing test patterns in the file — use `mocks.sharedSpace.*` or whatever
the mock convention is.

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`

**Step 3: Create SpacePeopleQueryDto**

Check if `server/src/dtos/shared-space.dto.ts` exists. If not, find where existing
space DTOs live. Add:

```typescript
export class SpacePeopleQueryDto {
  @ValidateDate({ optional: true })
  takenAfter?: Date;

  @ValidateDate({ optional: true })
  takenBefore?: Date;
}
```

**Step 4: Update the controller**

In `server/src/controllers/shared-space.controller.ts` line 268, add `@Query()`:

```typescript
getSpacePeople(
  @Auth() auth: AuthDto,
  @Param() { id }: UUIDParamDto,
  @Query() query: SpacePeopleQueryDto,
): Promise<SharedSpacePersonResponseDto[]> {
  return this.service.getSpacePeople(auth, id, query);
}
```

**Step 5: Create new repository method for temporally-scoped person query**

In `server/src/repositories/shared-space.repository.ts`, add a new method:

```typescript
getPersonsBySpaceIdWithTemporalFilter(
  spaceId: string,
  options?: { takenAfter?: Date; takenBefore?: Date },
) {
  return this.db
    .selectFrom('shared_space_person')
    .selectAll('shared_space_person')
    .where('shared_space_person.spaceId', '=', asUuid(spaceId))
    .$if(!!options?.takenAfter || !!options?.takenBefore, (qb) =>
      qb.where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_person_face')
            .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.faceId')
            .innerJoin('asset', 'asset.id', 'asset_face.assetId')
            .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
            .$if(!!options?.takenAfter, (qb2) =>
              qb2.where('asset.fileCreatedAt', '>=', options!.takenAfter!),
            )
            .$if(!!options?.takenBefore, (qb2) =>
              qb2.where('asset.fileCreatedAt', '<', options!.takenBefore!),
            ),
        ),
      ),
    )
    .orderBy('name', 'asc')
    .execute();
}
```

**Step 6: Update the service method**

In `server/src/services/shared-space.service.ts`, update `getSpacePeople` to accept
and pass temporal params:

```typescript
async getSpacePeople(
  auth: AuthDto,
  spaceId: string,
  query?: SpacePeopleQueryDto,
): Promise<SharedSpacePersonResponseDto[]> {
  await this.requireMembership(auth, spaceId);

  const space = await this.sharedSpaceRepository.getById(spaceId);
  if (!space?.faceRecognitionEnabled) {
    return [];
  }

  const hasTemporal = query?.takenAfter || query?.takenBefore;
  const persons = hasTemporal
    ? await this.sharedSpaceRepository.getPersonsBySpaceIdWithTemporalFilter(spaceId, query)
    : await this.sharedSpaceRepository.getPersonsBySpaceId(spaceId);

  // ... rest unchanged (aliases, loop, mapSpacePerson)
}
```

**Step 7: Run tests**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: PASS

**Step 8: Format + lint + commit**

```bash
npx prettier --write server/src/dtos/ server/src/controllers/shared-space.controller.ts server/src/services/shared-space.service.ts server/src/repositories/shared-space.repository.ts
make lint-server
git add server/src/
git commit -m "feat: add temporal filtering to space people endpoint"
```

---

## Task 3: Regenerate OpenAPI spec and TypeScript SDK

**Files:**

- Generated: `open-api/immich-openapi-specs.json`
- Generated: `open-api/typescript-sdk/src/fetch-client.ts` (or similar)

**Step 1: Build server**

Run: `cd server && pnpm build`

**Step 2: Regenerate specs**

Run: `cd server && pnpm sync:open-api`

**Step 3: Regenerate TypeScript SDK**

Run: `make open-api-typescript`

**Step 4: Verify the new params appear in the SDK**

Grep the generated SDK for `takenAfter` in the search suggestions function and
`SpacePeopleQuery` or similar in the space people function.

**Step 5: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI specs for temporal suggestion params"
```

---

## Task 4: Fix pre-existing cascade bugs (city + camera model)

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte:305-325`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte:153-179`

**Step 1: Write the failing test**

In existing web filter tests (find via `glob web/src/**/*filter*spec*`), or create
`web/src/lib/components/filter-panel/__tests__/cascade-fix.spec.ts`:

```typescript
import { render } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
// Import LocationFilter or FilterPanel as needed

describe('cascade bug fix', () => {
  it('should pass country to onCityFetch', async () => {
    const onCityFetch = vi.fn().mockResolvedValue(['Berlin', 'Munich']);
    // Render LocationFilter with countries=['Germany'], expand Germany
    // Assert onCityFetch was called with 'Germany'
    expect(onCityFetch).toHaveBeenCalledWith('Germany');
  });

  it('should pass make to onModelFetch', async () => {
    const onModelFetch = vi.fn().mockResolvedValue(['EOS R5', 'EOS R6']);
    // Render CameraFilter with makes=['Canon'], expand Canon
    // Assert onModelFetch was called with 'Canon'
    expect(onModelFetch).toHaveBeenCalledWith('Canon');
  });
});
```

Adapt to the actual component Props and rendering patterns. Check existing filter
tests for examples.

**Step 2: Run test to verify it fails**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/cascade-fix.spec.ts`

**Step 3: Fix the cascade callbacks in filter-panel.svelte**

At line 305, change `onCityFetch`:

```typescript
onCityFetch={async (country) => {
  if (config.providers.locations) {
    const result = await getSearchSuggestions({
      $type: SearchSuggestionType.City,
      country,
      spaceId: /* pass through from config or derive from context */,
    });
    return result.filter(Boolean) as string[];
  }
  return [];
}}
```

At line 319, change `onModelFetch`:

```typescript
onModelFetch={async (make) => {
  if (config.providers.cameras) {
    const result = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraModel,
      make,
      spaceId: /* pass through */,
    });
    return result.filter(Boolean) as string[];
  }
  return [];
}}
```

**Note:** The exact API calls depend on how the page wires things. The cascade
callbacks may need to move to the page-level `FilterPanelConfig` as dedicated
provider functions, or `FilterPanelConfig` may need a `context` object with `spaceId`.
Read the page component and adapt. The key fix is: **use the parent value parameter**
in the server call.

**Step 4: Run test to verify it passes**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/cascade-fix.spec.ts`

**Step 5: Format + lint + commit**

```bash
npx prettier --write web/src/lib/components/filter-panel/
make lint-web
git add web/src/
git commit -m "fix: pass parent value in cascade callbacks (city + camera model)"
```

---

## Task 5: Add FilterContext type and update provider signatures

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.ts`
- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`
- Modify: `web/src/lib/components/filter-panel/location-filter.svelte`
- Modify: `web/src/lib/components/filter-panel/camera-filter.svelte`

**Step 1: Add FilterContext type**

In `web/src/lib/components/filter-panel/filter-panel.ts`, add:

```typescript
export type FilterContext = {
  takenAfter?: string;
  takenBefore?: string;
};
```

Update `FilterPanelConfig.providers` signatures:

```typescript
providers: {
  people?: (context?: FilterContext) => Promise<PersonOption[]>;
  locations?: (context?: FilterContext) => Promise<LocationOption[]>;
  cameras?: (context?: FilterContext) => Promise<CameraOption[]>;
  tags?: () => Promise<TagOption[]>; // tags unchanged — deferred
};
```

Add a helper to build `FilterContext` from `FilterState`:

```typescript
export function buildFilterContext(state: FilterState): FilterContext | undefined {
  if (!state.selectedYear) {
    return undefined;
  }
  if (state.selectedMonth) {
    const year = state.selectedYear;
    const month = state.selectedMonth;
    // Use Date.UTC to ensure UTC midnight, not local timezone
    return {
      takenAfter: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
      takenBefore: new Date(Date.UTC(year, month, 1)).toISOString(),
    };
  }
  return {
    takenAfter: new Date(Date.UTC(state.selectedYear, 0, 1)).toISOString(),
    takenBefore: new Date(Date.UTC(state.selectedYear + 1, 0, 1)).toISOString(),
  };
}
```

**Step 2: Update cascade callback signatures**

In `location-filter.svelte`, update Props:

```typescript
interface Props {
  countries: string[];
  selectedCountry?: string;
  selectedCity?: string;
  onCityFetch: (country: string, context?: FilterContext) => Promise<string[]>;
  onSelectionChange: (country?: string, city?: string) => void;
  context?: FilterContext;
}
```

Update the `$effect` that fetches cities (line 16-26) to depend on `context` and
guard on `expandedCountry`:

```typescript
$effect(() => {
  const ctx = context; // track reactivity
  if (expandedCountry) {
    loadingCities = true;
    void onCityFetch(expandedCountry, ctx).then((result) => {
      cities = result;
      loadingCities = false;
    });
  }
});
```

Same pattern for `camera-filter.svelte`:

```typescript
interface Props {
  makes: string[];
  selectedMake?: string;
  selectedModel?: string;
  onModelFetch: (make: string, context?: FilterContext) => Promise<string[]>;
  onSelectionChange: (make?: string, model?: string) => void;
  context?: FilterContext;
}
```

Update its `$effect` similarly.

**Step 3: Update filter-panel.svelte to pass context to child components**

Pass `context={filterContext}` prop to `LocationFilter` and `CameraFilter`. The
`filterContext` is derived from the current temporal filter state.

**Step 4: Run web tests**

Run: `cd web && pnpm test`

**Step 5: Format + lint + commit**

```bash
npx prettier --write web/src/lib/components/filter-panel/
make lint-web
git add web/src/lib/components/filter-panel/
git commit -m "feat: add FilterContext type and update provider/cascade signatures"
```

---

## Task 6: Implement debounced re-fetch in FilterPanel

This is the core frontend behavior — when temporal filters change, re-fetch all
suggestion providers with the temporal context.

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`

**Step 1: Write the failing tests**

Create `web/src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts`:

Test cases (adapt to actual component rendering patterns):

1. **Re-fetch on temporal change** — mount FilterPanel with mock providers, simulate
   year selection, assert providers re-called with `FilterContext`.
2. **Year-only selection triggers re-fetch** — select year without month, assert
   full-year bounds (`takenAfter: 2024-01-01T00:00:00.000Z`,
   `takenBefore: 2025-01-01T00:00:00.000Z`).
3. **Debounce behavior** — rapidly change temporal, assert providers called once after
   200ms.
4. **AbortController cancellation** — start slow provider fetch (delayed mock), change
   temporal before it resolves. Assert first fetch aborted, only second results applied.
5. **Combined debounce + abort** — change temporal, let debounce fire and fetch start,
   then change temporal again before fetch resolves. Assert debounce timer resets, first
   request aborted, only second results applied.
6. **Abort race condition** — start fetch, trigger abort at same moment response
   arrives. Assert no stale data applied (signal check on response handling).
7. **Non-temporal changes do not trigger re-fetch** — change rating/mediaType/sortOrder,
   assert providers NOT re-called.
8. **Clear filters bypasses debounce** — set temporal, clear all, assert immediate
   re-fetch with no context (no 200ms wait).
9. **Error handling on re-fetch** — mock provider that rejects. Assert section keeps
   showing previous suggestions unchanged (no opacity change, no error UI).
10. **Temporal range mapping** — select year 2024, assert provider receives exact UTC
    ISO strings. Select June 2024, assert month bounds.
11. **Component unmount cleanup** — mount FilterPanel, trigger temporal change (starting
    debounced fetch), unmount before it resolves. Assert no errors or state updates
    after unmount.

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts`

**Step 3: Implement the debounced re-fetch**

In `filter-panel.svelte`, add state tracking and the re-fetch effect:

```typescript
// Track previous temporal state for change detection
let prevContext: FilterContext | undefined = $state();
let abortController: AbortController | undefined = $state();
let isRefetching = $state(false);

// Derive current temporal context
const filterContext = $derived(buildFilterContext(filters));

// Debounced re-fetch effect
$effect(() => {
  const ctx = filterContext; // track dependency
  const prevCtx = prevContext;

  // Skip initial load (prevContext is undefined on first render)
  if (prevCtx === undefined && ctx === undefined) {
    prevContext = ctx;
    return;
  }

  // Detect if this is a clear action (had temporal, now doesn't)
  const isClearing = prevCtx !== undefined && ctx === undefined;
  prevContext = ctx;

  // Abort any in-flight requests
  abortController?.abort();
  abortController = new AbortController();
  const currentController = abortController;

  const doRefetch = () => {
    if (currentController.signal.aborted) return;
    isRefetching = true;

    const promises = [];
    if (config.providers.people && config.sections.includes('people')) {
      promises.push(
        config.providers
          .people(ctx)
          .then((result) => {
            if (!currentController.signal.aborted) people = result;
          })
          .catch((error) => {
            if (!currentController.signal.aborted) console.error('People refetch failed:', error);
          }),
      );
    }
    if (config.providers.locations && config.sections.includes('location')) {
      promises.push(
        config.providers
          .locations(ctx)
          .then((result) => {
            if (!currentController.signal.aborted) {
              countries = result.filter((l) => l.type === 'country').map((l) => l.value);
            }
          })
          .catch((error) => {
            if (!currentController.signal.aborted) console.error('Locations refetch failed:', error);
          }),
      );
    }
    if (config.providers.cameras && config.sections.includes('camera')) {
      promises.push(
        config.providers
          .cameras(ctx)
          .then((result) => {
            if (!currentController.signal.aborted) {
              cameraMakes = result.filter((c) => c.type === 'make').map((c) => c.value);
            }
          })
          .catch((error) => {
            if (!currentController.signal.aborted) console.error('Cameras refetch failed:', error);
          }),
      );
    }

    void Promise.allSettled(promises).then(() => {
      if (!currentController.signal.aborted) isRefetching = false;
    });
  };

  if (isClearing) {
    doRefetch(); // bypass debounce
  } else {
    const timeout = setTimeout(doRefetch, 200);
    return () => clearTimeout(timeout); // $effect cleanup
  }
});

// Cleanup on unmount
$effect(() => {
  return () => abortController?.abort();
});
```

**Important implementation notes for the re-fetch code above:**

- The `.catch` handlers must NOT set `isRefetching = false` individually. On error,
  keep stale data unchanged — no opacity fade, no error UI (design requirement). The
  `Promise.allSettled` handler at the end resets `isRefetching` after all settle.
- The CSS opacity transition uses a 150ms delay, so errors that resolve quickly
  (which most network errors do) will never trigger visible opacity change.
- Cascade child auto-clear: After cameraMakes update, `CameraFilter`'s `$effect`
  re-fetches models for the expanded make. If `selectedModel` is not in the new model
  list, `CameraFilter` should call `onSelectionChange(selectedMake, undefined)` to
  clear the child. Same logic applies to `LocationFilter` for orphaned cities.

**Step 4: Add CSS for opacity fade during re-fetch**

Add a CSS class and apply it to sections while `isRefetching` is true:

```css
.refetching {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  transition-delay: 150ms; /* skip fade for fast responses */
}
```

Apply the class conditionally to each filter section wrapper.

**Step 5: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/contextual-refetch.spec.ts`

**Step 6: Format + lint + commit**

```bash
npx prettier --write web/src/lib/components/filter-panel/
make lint-web
git add web/src/lib/components/filter-panel/
git commit -m "feat: debounced re-fetch of filter suggestions on temporal change"
```

---

## Task 7: Orphaned selections and empty sections

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`
- Modify: `web/src/lib/components/filter-panel/people-filter.svelte`
- Modify: `web/src/lib/components/filter-panel/filter-section.svelte`

**Step 1: Write the failing tests**

Add to the contextual-refetch test file (or a new file):

1. **Orphaned selections preserved** — select a person, re-fetch with scoped
   suggestions that exclude that person. Assert person stays in `filters.personIds`
   and appears muted at top of list with `aria-selected="true"`.
2. **Orphaned selection lifecycle** — select person, apply temporal filter that orphans
   it (muted at top), deselect it, change temporal back so person reappears. Assert
   person is in normal suggestion list (not muted) and can be reselected cleanly.
3. **Empty section collapse** — mock provider returning `[]`. Assert section header
   shows `(0)` and content is collapsed. Verify no layout shifts (section header
   remains in same position).
4. **Section populated → empty → populated** — narrow then widen temporal. Assert
   section re-expands with new suggestions and `(0)` indicator is removed.
5. **Cascade child auto-clear (camera)** — select make=Canon + model=EOS R5, temporal
   scoping removes model but not make. Assert model selection cleared, make preserved.
6. **Cascade child auto-clear (location)** — select country=Germany + city=Berlin,
   temporal scoping removes Berlin but not Germany. Assert city cleared, country kept.
7. **Cascade callback receives temporal context** — select a year, then expand a
   country. Assert `onCityFetch` called with both country string AND current
   `FilterContext`.
8. **Cascade re-fetch on temporal change** — expand a country (cities loaded), then
   change temporal filter. Assert `onCityFetch` re-called with same country but
   updated temporal context.

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/`

**Step 3: Implement orphaned selections**

In `people-filter.svelte` (and similarly for location/camera), when rendering the list:

- Compute orphaned items: items in `selectedPersonIds` but not in current `people` list
- Render orphaned items at top of list with muted styling (e.g., `opacity-50`) AND
  `aria-selected="true"` for accessibility (screen readers must convey active state)
- Keep them in `filters.personIds` (already the case since we don't remove them)
- Apply the same pattern in LocationFilter (orphaned country) and CameraFilter
  (orphaned make)

**Step 4: Implement cascade child auto-clear**

In the re-fetch effect (Task 6), after camera makes update, check if `filters.model`
is still in the updated makes' model lists. If the model's parent make still exists
but the model doesn't appear in the scoped results, clear `filters.model`:

```typescript
// After cameraMakes update
if (filters.model) {
  // The model list is re-fetched by CameraFilter's own $effect when context changes
  // CameraFilter should clear model if it disappears from the new model list
}
```

The cleanest approach: in `CameraFilter`, when models re-fetch and the current
`selectedModel` is not in the new list, call `onSelectionChange(selectedMake, undefined)`.

**Step 5: Implement empty sections**

In `filter-section.svelte`, add a `count` prop:

```typescript
interface Props {
  title: string;
  testId?: string;
  count?: number;
  children: Snippet;
}
```

When `count === 0`, show the header as muted with `(0)` and collapse content:

```svelte
<button class="..." class:opacity-50={count === 0} on:click={toggle}>
  {title} {#if count === 0}<span class="text-xs">(0)</span>{/if}
</button>
{#if expanded && count !== 0}
  {@render children()}
{/if}
```

Pass `count` from `filter-panel.svelte` for each section based on suggestion array
length.

**Layout shift prevention:** The section header must remain in the same position when
content collapses. Since we only hide the content (not the header), and the header
has a fixed height, this is natural. Ensure no margin/padding changes on the header
when `count === 0` — only the content area collapses.

**Step 6: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/`

**Step 7: Format + lint + commit**

```bash
npx prettier --write web/src/lib/components/filter-panel/
make lint-web
git add web/src/lib/components/filter-panel/
git commit -m "feat: orphaned selections, cascade child auto-clear, empty section collapse"
```

---

## Task 8: Update space page providers to pass FilterContext

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte:153-179`

**Step 1: Update provider functions to accept and forward FilterContext**

```typescript
const filterConfig: FilterPanelConfig = {
  sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
  providers: {
    people: async (context?: FilterContext) => {
      const people = await getSpacePeople({
        id: space.id,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      for (const p of people) {
        personNames.set(p.id, p.name || 'Unknown');
      }
      return people.map((p) => ({
        id: p.id,
        name: p.name || 'Unknown',
        thumbnailPath: p.thumbnailPath,
      }));
    },
    locations: async (context?: FilterContext) => {
      const countries = await getSearchSuggestions({
        $type: SearchSuggestionType.Country,
        spaceId: space.id,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return countries.filter(Boolean).map((c) => ({
        value: c!,
        type: 'country' as const,
      }));
    },
    cameras: async (context?: FilterContext) => {
      const makes = await getSearchSuggestions({
        $type: SearchSuggestionType.CameraMake,
        spaceId: space.id,
        takenAfter: context?.takenAfter,
        takenBefore: context?.takenBefore,
      });
      return makes.filter(Boolean).map((m) => ({
        value: m!,
        type: 'make' as const,
      }));
    },
    tags: async () => {
      // Tags unchanged — deferred from contextual scoping
      const tags = await getAllTags();
      for (const t of tags) {
        tagNames.set(t.id, t.value);
      }
      return tags.map((t) => ({ id: t.id, name: t.value }));
    },
  },
};
```

**Step 2: Update cascade callbacks in filter-panel.svelte to pass context**

The `onCityFetch` and `onModelFetch` callbacks (from Task 4) should also forward the
current `FilterContext`. Since FilterPanel now computes `filterContext` as a derived
value, pass it through:

```typescript
onCityFetch={async (country, context) => {
  const result = await getSearchSuggestions({
    $type: SearchSuggestionType.City,
    country,
    spaceId: space.id,
    takenAfter: context?.takenAfter,
    takenBefore: context?.takenBefore,
  });
  return result.filter(Boolean) as string[];
}}
```

**Note:** The cascade callbacks may need to be moved into `FilterPanelConfig` or
the page needs to provide them via a separate config property. Adapt based on
how Task 4 resolved the callback wiring.

**Step 3: Run web tests + type check**

Run: `cd web && pnpm test`
Run: `make check-web`

**Step 4: Format + lint + commit**

```bash
npx prettier --write web/src/routes/\(user\)/spaces/ web/src/lib/components/filter-panel/
make lint-web
git add web/src/
git commit -m "feat: wire space page providers to pass temporal FilterContext"
```

---

## Task 9: Regenerate SQL queries

**Files:**

- Generated: `server/src/queries/` (SQL documentation files)

**Step 1: Build server and regenerate SQL**

Run: `cd server && pnpm build`
Run: `make sql` (requires running DB — start dev stack first if needed)

**Step 2: Commit if changed**

```bash
git add server/src/queries/
git commit -m "chore: regenerate SQL query documentation"
```

---

## Task 10: Medium tests for temporal suggestion queries (if infrastructure exists)

**Files:**

- Test: `server/src/repositories/search.repository.spec.ts` (or equivalent medium test file)

**Prerequisite:** Check if medium tests exist for `search.repository.ts` by grepping
for `getCountries` or `getExifField` in `server/src/**/*.spec.ts`. If no medium test
infrastructure exists for this repository, skip this task and note it in the PR
description.

**Step 1: Write medium tests (if infrastructure exists)**

- **`getExifField` with temporal bounds**: Insert assets with known `fileCreatedAt`
  dates. Query `getCountries` with `takenAfter`/`takenBefore` and verify only
  countries from assets within the range are returned.
- **Temporal + space combined**: Insert assets in and out of a space, with varied
  dates. Verify the intersection (space AND temporal) is correct.
- **Boundary inclusivity**: Test `takenAfter` with `>=` (asset at exact boundary IS
  included) and `takenBefore` with `<` (asset at exact boundary is NOT included).
  Test `takenBefore` before all assets returns empty result.
- **All repository methods forward temporal fields**: Verify `getStates`, `getCities`,
  `getCameraMakes`, `getCameraModels`, `getCameraLensModels` all respect temporal
  bounds (not just `getCountries`), catching any destructuring bugs.

**Step 2: Run medium tests**

Run: `cd server && pnpm test:medium`

**Step 3: Commit (if tests written)**

```bash
git add server/src/
git commit -m "test: medium tests for temporal suggestion scoping"
```

---

## Task 11: E2E API tests for temporal suggestion scoping

**Note:** Task numbers shifted — old Task 10 is now Task 11.

**Files:**

- Modify or create: `e2e/src/specs/server/api/search.e2e-spec.ts` (or wherever
  existing suggestion E2E tests live)

**Step 1: Find existing search suggestion E2E tests**

Grep for `search/suggestions` or `getSearchSuggestions` in `e2e/src/`.

**Step 2: Add temporal scoping tests**

```typescript
describe('GET /search/suggestions (temporal scoping)', () => {
  // Setup: upload assets with different fileCreatedAt dates and different
  // countries/cameras. E.g.:
  // - Asset A: country=Germany, fileCreatedAt=2023-06-15
  // - Asset B: country=France, fileCreatedAt=2024-03-10

  it('should scope suggestions by takenAfter/takenBefore', async () => {
    const { body } = await request(app)
      .get('/search/suggestions')
      .query({
        type: 'country',
        takenAfter: '2024-01-01T00:00:00.000Z',
        takenBefore: '2025-01-01T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toEqual(['France']); // Only France has assets in 2024
    expect(body).not.toContain('Germany'); // Germany assets are in 2023
  });

  it('should return empty when no assets in range', async () => {
    const { body } = await request(app)
      .get('/search/suggestions')
      .query({
        type: 'country',
        takenAfter: '2020-01-01T00:00:00.000Z',
        takenBefore: '2020-12-31T00:00:00.000Z',
      })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toEqual([]);
  });

  it('should work without temporal params (backward compat)', async () => {
    const { body } = await request(app)
      .get('/search/suggestions')
      .query({ type: 'country' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toContain('Germany');
    expect(body).toContain('France');
  });

  it('should exclude asset at exact takenBefore boundary (strict <)', async () => {
    // Upload asset with fileCreatedAt exactly at boundary
    // Assert it is NOT included
  });

  it('should scope suggestions by temporal + spaceId', async () => {
    // Combine spaceId with temporal params
    // Assert intersection
  });
});

describe('GET /spaces/:id/people (temporal scoping)', () => {
  it('should filter people by temporal range', async () => {
    // Assert only people with face assets in range are returned
  });

  it('should exclude people with faces only outside range', async () => {
    // Assert person is excluded entirely
  });
});
```

Adapt to the project's E2E test conventions (test utilities, auth helpers, asset
upload helpers, etc.).

**Step 3: Run E2E API tests**

Run: `cd e2e && pnpm test`

**Step 4: Commit**

```bash
git add e2e/src/
git commit -m "test: E2E API tests for temporal suggestion scoping"
```

---

## Task 12: E2E Playwright tests for filter panel

**Files:**

- Modify or create: `e2e/src/specs/web/spaces-filter-panel.e2e-spec.ts` (or wherever
  existing filter panel Playwright tests live)

**Prerequisites:** Test data with distinct metadata per time period (different people,
locations, cameras across different years/months). Check if existing E2E seed data
covers this, or add new seed data.

**Step 1: Find existing Playwright filter tests**

Grep for `filter` or `FilterPanel` in `e2e/src/specs/web/`.

**Step 2: Add contextual scoping tests**

```typescript
test('temporal scoping narrows location suggestions', async ({ page }) => {
  // Navigate to space
  // Open filter panel
  // Select year in temporal picker
  // Open location section
  // Assert only locations from that year appear
});

test('empty camera section shows (0)', async ({ page }) => {
  // Select temporal filter that has no camera data
  // Assert camera section header shows (0)
});

test('clear filters restores full suggestions', async ({ page }) => {
  // Apply temporal filter
  // Verify narrowed suggestions
  // Click clear all
  // Verify full suggestions restored
});

test('cascade works under temporal scoping', async ({ page }) => {
  // Select year
  // Select country
  // Assert cities match both country AND year
});

test('orphaned selection visual state', async ({ page }) => {
  // Select a person
  // Apply temporal filter that excludes that person
  // Assert person chip remains visible with muted/dimmed styling
});

test('section recovery from empty', async ({ page }) => {
  // Apply temporal filter that empties camera section
  // Assert camera section shows (0)
  // Clear temporal filter
  // Assert camera section re-expands with all cameras
});
```

**Step 3: Run Playwright tests**

Run: `cd e2e && pnpm test:web`

**Step 4: Commit**

```bash
git add e2e/src/
git commit -m "test: Playwright E2E tests for contextual filter suggestions"
```

---

## Task 13: Final verification

**Step 1: Run full test suites sequentially**

```bash
cd server && pnpm test
cd web && pnpm test
make check-server
make check-web
make lint-server
make lint-web
```

**Step 2: Run E2E tests**

```bash
cd e2e && pnpm test
cd e2e && pnpm test:web
```

**Step 3: Manual smoke test (if dev stack is running)**

1. Open a space with diverse photos (different dates, locations, cameras, people)
2. Open filter panel
3. Select a year in temporal picker
4. Verify location dropdown narrows to only locations from that year
5. Verify people list narrows
6. Verify camera list narrows
7. Select a country, verify cities are scoped by both country AND year
8. Clear all filters, verify everything restores
9. Select a person, verify temporal picker updates (months grey out — this is the
   existing TimelineManager behavior)

**Step 4: Create PR**

```bash
git push -u origin feat/contextual-filter-suggestions
gh pr create --title "feat: contextual filter suggestions" --body "$(cat <<'EOF'
## Summary
- Temporal filters (year/month) now scope all other filter suggestions (people, locations, cameras)
- Existing cascades fixed: city and camera model dropdowns now correctly pass parent value to server
- Orphaned selections shown muted at top of list; empty sections collapse with (0) count
- Debounced re-fetch (200ms) with AbortController for stale request cancellation

## Design doc
`docs/plans/2026-03-24-contextual-filter-suggestions-design.md`

## Test plan
- [ ] Server unit tests: temporal threading for all suggestion types
- [ ] Server unit tests: space people temporal filtering
- [ ] Web component tests: debounce, abort, orphaned selections, empty sections, cascade fixes
- [ ] E2E API tests: temporal scoping, boundary precision, backward compat
- [ ] E2E Playwright tests: filter panel contextual behavior
- [ ] Manual smoke test on dev stack

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
