# Map FilterPanel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add FilterPanel to the map view so users can filter map markers by people, camera, tags, rating, favorites, media type, and time period.

**Architecture:** New fork-only server endpoint (`GET /api/gallery/map/markers`) uses `searchAssetBuilder` with map-column projection. The map page manages marker fetching and passes `mapMarkers` to `map.svelte` via its existing `$bindable` prop. FilterPanel reuses the same component from /photos and /spaces with a map-specific config (no location section, no sort toggle, new favorites toggle).

**Tech Stack:** NestJS (server), Svelte 5 (web), Kysely (DB queries), MapLibre GL (map), Vitest (tests)

**Design doc:** `docs/plans/2026-03-25-map-filter-panel-design.md`

---

## Task 1: Server — DTO for filtered map markers

**Files:**

- Create: `server/src/dtos/gallery-map.dto.ts`

**Step 1: Create the DTO**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, Max, Min } from 'class-validator';
import { Optional, ValidateBoolean, ValidateDate, ValidateUUID } from 'src/validation';

export enum MapMediaType {
  Image = 'IMAGE',
  Video = 'VIDEO',
}

export class FilteredMapMarkerDto {
  @ValidateUUID({ each: true, optional: true, description: 'Filter by person IDs' })
  personIds?: string[];

  @ValidateUUID({ each: true, optional: true, description: 'Filter by tag IDs' })
  tagIds?: string[];

  @ValidateUUID({ optional: true, description: 'Scope to a shared space' })
  spaceId?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera make' })
  @Optional()
  make?: string;

  @ApiProperty({ type: String, required: false, description: 'Camera model' })
  @Optional()
  model?: string;

  @ApiProperty({ type: Number, required: false, description: 'Minimum star rating', minimum: 1, maximum: 5 })
  @Optional()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiProperty({ enum: MapMediaType, required: false, description: 'Filter by media type' })
  @Optional()
  @IsEnum(MapMediaType)
  type?: MapMediaType;

  @ValidateDate({ optional: true, description: 'Filter assets taken after this date' })
  takenAfter?: Date;

  @ValidateDate({ optional: true, description: 'Filter assets taken before this date' })
  takenBefore?: Date;

  @ValidateBoolean({ optional: true, description: 'Filter by favorite status' })
  isFavorite?: boolean;
}
```

**Step 2: Verify it compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors from `gallery-map.dto.ts`

**Step 3: Commit**

```bash
git add server/src/dtos/gallery-map.dto.ts
git commit -m "feat(server): add DTO for filtered map markers endpoint"
```

---

## Task 2: Server — Repository method for filtered map markers

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts` (add method at end of class)

**Step 1: Add the repository method**

Add this method to the `SharedSpaceRepository` class (after the existing `getMapMarkers` method around line 414):

```typescript
import { searchAssetBuilder } from 'src/utils/database';
import { AssetVisibility } from 'src/enum';
import type { AssetSearchBuilderOptions } from 'src/repositories/search.repository';
```

```typescript
@GenerateSql({
  params: [{ userIds: [DummyValue.UUID], visibility: AssetVisibility.Timeline }],
})
getFilteredMapMarkers(options: AssetSearchBuilderOptions) {
  return searchAssetBuilder(this.db, options)
    .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .where('asset_exif.latitude', 'is not', null)
    .where('asset_exif.longitude', 'is not', null)
    .select([
      'asset.id',
      'asset_exif.latitude as lat',
      'asset_exif.longitude as lon',
      'asset_exif.city',
      'asset_exif.state',
      'asset_exif.country',
    ])
    .$narrowType<{ lat: NotNull; lon: NotNull }>()
    .execute();
}
```

Note: Do NOT pass `withExif: true` in the options — that would cause `searchAssetBuilder` to add its own `innerJoin('asset_exif', ...)` plus a `toJson(asset_exif).as('exifInfo')` select, which is wasteful. Instead, we add our own explicit `innerJoin` with only the columns we need. The `DeduplicateJoinsPlugin` handles cases where `searchAssetBuilder` also adds the join (e.g., when exif filter fields like `make` or `city` are set) — it deduplicates identical join signatures. Make sure the join uses the exact same three-argument form: `'asset_exif', 'asset.id', 'asset_exif.assetId'`.

**Step 2: Verify it compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean compile. If `NotNull` import is missing, add `import type { NotNull } from 'kysely';`

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat(server): add filtered map markers repository method"
```

---

## Task 3: Server — Service method for filtered map markers

**Files:**

- Modify: `server/src/services/shared-space.service.ts` (add method)

**Step 1: Add the service method**

Add to `SharedSpaceService` class:

```typescript
import type { FilteredMapMarkerDto, MapMediaType } from 'src/dtos/gallery-map.dto';
import { AssetType, AssetVisibility } from 'src/enum';
import type { MapMarkerResponseDto } from 'src/dtos/map.dto';
```

```typescript
async getFilteredMapMarkers(auth: AuthDto, dto: FilteredMapMarkerDto): Promise<MapMarkerResponseDto[]> {
  if (dto.spaceId) {
    await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
  }

  const markers = await this.sharedSpaceRepository.getFilteredMapMarkers({
    userIds: dto.spaceId ? undefined : [auth.user.id],
    spaceId: dto.spaceId,
    personIds: dto.spaceId ? undefined : dto.personIds,
    spacePersonIds: dto.spaceId ? dto.personIds : undefined,
    tagIds: dto.tagIds,
    make: dto.make,
    model: dto.model,
    rating: dto.rating,
    type: dto.type === 'IMAGE' ? AssetType.IMAGE : dto.type === 'VIDEO' ? AssetType.VIDEO : undefined,
    takenAfter: dto.takenAfter,
    takenBefore: dto.takenBefore,
    isFavorite: dto.isFavorite,
    visibility: AssetVisibility.Timeline,
  });

  return markers.map((marker) => ({
    id: marker.id,
    lat: marker.lat,
    lon: marker.lon,
    city: marker.city ?? null,
    state: marker.state ?? null,
    country: marker.country ?? null,
  }));
}
```

**Step 2: Verify it compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean compile

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.ts
git commit -m "feat(server): add filtered map markers service method"
```

---

## Task 4: Server — Controller endpoint

**Files:**

- Create: `server/src/controllers/gallery-map.controller.ts`
- Modify: `server/src/controllers/index.ts` (register controller)

**Step 1: Create the controller**

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from 'src/dtos/auth.dto';
import { FilteredMapMarkerDto } from 'src/dtos/gallery-map.dto';
import { MapMarkerResponseDto } from 'src/dtos/map.dto';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { SharedSpaceService } from 'src/services/shared-space.service';

@ApiTags('Gallery Map')
@Controller('gallery/map')
export class GalleryMapController {
  constructor(private service: SharedSpaceService) {}

  @Get('markers')
  @Authenticated()
  @Endpoint({
    summary: 'Get filtered map markers',
    description: 'Retrieve map markers with rich content filtering (people, camera, tags, etc.)',
    history: new HistoryBuilder().added('v1').beta('v1'),
  })
  getFilteredMapMarkers(@Auth() auth: AuthDto, @Query() dto: FilteredMapMarkerDto): Promise<MapMarkerResponseDto[]> {
    return this.service.getFilteredMapMarkers(auth, dto);
  }
}
```

**Step 2: Register the controller**

In `server/src/controllers/index.ts`, add the import and registration:

```typescript
import { GalleryMapController } from 'src/controllers/gallery-map.controller';
```

Add `GalleryMapController,` to the `controllers` array (alphabetically, after `FaceController`).

**Step 3: Verify it compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Clean compile

**Step 4: Commit**

```bash
git add server/src/controllers/gallery-map.controller.ts server/src/controllers/index.ts
git commit -m "feat(server): add gallery map controller with filtered markers endpoint"
```

---

## Task 5: Server — Unit tests

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts` (add tests)

**Step 1: Write tests for the service method**

Add a new `describe('getFilteredMapMarkers')` block:

```typescript
describe('getFilteredMapMarkers', () => {
  it('should return filtered map markers for the authenticated user', async () => {
    const mockMarkers = [
      { id: 'asset-1', lat: 48.8566, lon: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
    ];
    mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue(mockMarkers);

    const result = await sut.getFilteredMapMarkers(authStub.user1, { personIds: ['person-1'] });

    expect(result).toEqual([
      { id: 'asset-1', lat: 48.8566, lon: 2.3522, city: 'Paris', state: 'Île-de-France', country: 'France' },
    ]);
    expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
      expect.objectContaining({
        userIds: [authStub.user1.user.id],
        personIds: ['person-1'],
        visibility: expect.anything(),
      }),
    );
  });

  it('should scope to space when spaceId is provided', async () => {
    mocks.access.checkAccess.mockResolvedValue(new Set(['space-1']));
    mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([]);

    await sut.getFilteredMapMarkers(authStub.user1, { spaceId: 'space-1' });

    expect(mocks.sharedSpace.getFilteredMapMarkers).toHaveBeenCalledWith(
      expect.objectContaining({
        spaceId: 'space-1',
        userIds: undefined,
      }),
    );
  });

  it('should throw when user lacks space access', async () => {
    mocks.access.checkAccess.mockResolvedValue(new Set());

    await expect(sut.getFilteredMapMarkers(authStub.user1, { spaceId: 'space-1' })).rejects.toThrow();
  });

  it('should map null city/state/country to null', async () => {
    mocks.sharedSpace.getFilteredMapMarkers.mockResolvedValue([
      { id: 'asset-1', lat: 0, lon: 0, city: undefined, state: undefined, country: undefined },
    ]);

    const result = await sut.getFilteredMapMarkers(authStub.user1, {});

    expect(result[0].city).toBeNull();
    expect(result[0].state).toBeNull();
    expect(result[0].country).toBeNull();
  });
});
```

**Step 2: Run the tests**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: All new tests pass. If mocks need adjustment (e.g., `mocks.sharedSpace` doesn't auto-mock `getFilteredMapMarkers`), check how `newTestService()` generates mocks and add the method.

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test(server): add unit tests for filtered map markers"
```

---

## Task 6: Server — Regenerate OpenAPI specs and SDK

**Files:**

- Modified (generated): `open-api/immich-openapi-specs.json`, `open-api/typescript-sdk/src/fetch-client.ts`

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
cd server && pnpm sync:open-api
make open-api-typescript
```

**Step 2: Verify the new endpoint appears in the SDK**

Run: `grep -n 'getFilteredMapMarkers\|galleryMap' open-api/typescript-sdk/src/fetch-client.ts | head -10`
Expected: A function `getFilteredMapMarkers` is generated in the SDK.

**Step 3: Commit**

```bash
git add open-api/ server/src/queries/
git commit -m "chore: regenerate OpenAPI specs and SDK for filtered map markers"
```

---

## Task 7: Web — Add `isFavorite` to FilterState and `favorites` section type

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.ts`

**Step 1: Extend FilterSection type**

At line 1, add `'favorites'` to the union:

```typescript
export type FilterSection = 'timeline' | 'people' | 'location' | 'camera' | 'tags' | 'rating' | 'media' | 'favorites';
```

**Step 2: Add `isFavorite` to FilterState**

Add after the `mediaType` field (around line 46):

```typescript
isFavorite?: boolean;
```

**Step 3: Update `clearFilters` to reset `isFavorite`**

In the `clearFilters` function, add `isFavorite: undefined` to the returned object.

**Step 4: Update `getActiveFilterCount` to count `isFavorite`**

In the `getActiveFilterCount` function, add a check:

```typescript
if (state.isFavorite !== undefined) {
  count++;
}
```

**Step 5: Verify it compiles**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -5`
Expected: May show errors in filter-panel.svelte (needs favorites case) — that's fine, we handle it in Task 8.

**Step 6: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.ts
git commit -m "feat(web): add isFavorite and favorites section to filter panel types"
```

---

## Task 8: Web — Favorites filter component

**Files:**

- Create: `web/src/lib/components/filter-panel/favorites-filter.svelte`

**Step 1: Create the component**

Model after `media-type-filter.svelte` (simplest existing filter):

```svelte
<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiHeart, mdiHeartOutline } from '@mdi/js';

  interface Props {
    selected?: boolean;
    onToggle: (value: boolean | undefined) => void;
  }

  let { selected, onToggle }: Props = $props();
</script>

<div class="flex gap-1.5" data-testid="favorites-filter">
  <button
    type="button"
    class="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs {selected === undefined
      ? 'border-immich-primary bg-immich-primary/10 text-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary/20 dark:text-immich-dark-primary'
      : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}"
    onclick={() => onToggle(undefined)}
    data-testid="favorites-all"
  >
    All
  </button>
  <button
    type="button"
    class="flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs {selected === true
      ? 'border-immich-primary bg-immich-primary/10 text-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary/20 dark:text-immich-dark-primary'
      : 'border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400'}"
    onclick={() => onToggle(true)}
    data-testid="favorites-only"
  >
    <Icon icon={selected === true ? mdiHeart : mdiHeartOutline} size="14" />
    Favorites
  </button>
</div>
```

**Step 2: Commit**

```bash
git add web/src/lib/components/filter-panel/favorites-filter.svelte
git commit -m "feat(web): add favorites filter toggle component"
```

---

## Task 9: Web — Wire favorites into FilterPanel

**Files:**

- Modify: `web/src/lib/components/filter-panel/filter-panel.svelte`

**Step 1: Add favorites icon and title mappings**

In the `sectionIcons` record (around line 198), add:

```typescript
favorites: mdiHeart,
```

Import `mdiHeart` from `@mdi/js`.

In the `sectionTitles` record (around line 208), add:

```typescript
favorites: 'Favorites',
```

**Step 2: Add favorites case to `hasActiveFilter`**

In the `hasActiveFilter` switch (around line 320), add:

```typescript
case 'favorites': {
  return filters.isFavorite !== undefined;
}
```

**Step 3: Add favorites rendering in the sections loop**

In the `{#each config.sections}` block (around line 470), add before the closing `{/if}`:

```svelte
{:else if section === 'favorites'}
  <FavoritesFilter
    selected={filters.isFavorite}
    onToggle={(value) => {
      filters = { ...filters, isFavorite: value };
    }}
  />
```

Import `FavoritesFilter` from `'./favorites-filter.svelte'`.

**Step 4: Run existing filter panel tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/filter-panel.spec.ts`
Expected: All existing tests pass (favorites section not in their configs so no interference).

**Step 5: Commit**

```bash
git add web/src/lib/components/filter-panel/filter-panel.svelte
git commit -m "feat(web): wire favorites filter into filter panel"
```

---

## Task 10: Web — Map filter config builder

**Files:**

- Create: `web/src/lib/utils/map-filter-config.ts`

**Step 1: Create the config builder**

```typescript
import type { FilterPanelConfig } from '$lib/components/filter-panel/filter-panel';
import {
  getAllPeople,
  getAllTags,
  getFilteredMapMarkers,
  getSearchSuggestions,
  getSpacePeople,
  SearchSuggestionType,
  type MapMarkerResponseDto,
} from '@immich/sdk';
import type { FilterContext } from '$lib/components/filter-panel/filter-panel';

export function buildMapFilterConfig(spaceId?: string): FilterPanelConfig {
  const sections = ['timeline', 'people', 'camera', 'tags', 'rating', 'media', 'favorites'] as const;

  if (spaceId) {
    return {
      sections: [...sections],
      providers: {
        people: (context?: FilterContext) =>
          getSpacePeople({
            id: spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }).then((people) => people.map((p) => ({ id: p.id, name: p.name, thumbnailPath: p.thumbnailPath }))),
        cameras: (context?: FilterContext) =>
          getSearchSuggestions({
            $type: SearchSuggestionType.CameraMake,
            spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }).then((results) => results.map((r) => ({ value: r, type: 'make' as const }))),
        cameraModels: (make: string, context?: FilterContext) =>
          getSearchSuggestions({
            $type: SearchSuggestionType.CameraModel,
            make,
            spaceId,
            ...(context?.takenAfter && { takenAfter: context.takenAfter }),
            ...(context?.takenBefore && { takenBefore: context.takenBefore }),
          }),
        tags: () => getAllTags().then((tags) => tags.map((t) => ({ id: t.id, name: t.value }))),
      },
    };
  }

  return {
    sections: [...sections],
    providers: {
      people: (context?: FilterContext) =>
        getAllPeople({ withHidden: false }).then((response) =>
          response.people
            .filter((p) => p.name)
            .map((p) => ({ id: p.id, name: p.name, thumbnailPath: p.thumbnailPath })),
        ),
      cameras: (context?: FilterContext) =>
        getSearchSuggestions({
          $type: SearchSuggestionType.CameraMake,
          ...(context?.takenAfter && { takenAfter: context.takenAfter }),
          ...(context?.takenBefore && { takenBefore: context.takenBefore }),
        }).then((results) => results.map((r) => ({ value: r, type: 'make' as const }))),
      cameraModels: (make: string, context?: FilterContext) =>
        getSearchSuggestions({
          $type: SearchSuggestionType.CameraModel,
          make,
          ...(context?.takenAfter && { takenAfter: context.takenAfter }),
          ...(context?.takenBefore && { takenBefore: context.takenBefore }),
        }),
      tags: () => getAllTags().then((tags) => tags.map((t) => ({ id: t.id, name: t.value }))),
    },
  };
}
```

Note: The exact SDK function name for the new endpoint will be determined after OpenAPI generation in Task 6. Adjust the import accordingly. Remove the `getFilteredMapMarkers` and `MapMarkerResponseDto` imports from this file — the API call is made in the map page, not here.

**Step 2: Verify it compiles**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -10`
Expected: Clean or minor unrelated warnings.

**Step 3: Commit**

```bash
git add web/src/lib/utils/map-filter-config.ts
git commit -m "feat(web): add map filter config builder with space-aware providers"
```

---

## Task 11: Web — Dark mode tile toggle on map

**Files:**

- Modify: `web/src/lib/components/shared-components/map/map.svelte`

**Step 1: Add dark mode toggle button**

After the existing `{#if showSettings}` block (around line 366-374), add a new control that shows when settings are hidden:

```svelte
{#if !showSettings}
  <Control>
    <ControlGroup>
      <ControlButton
        onclick={() => {
          $mapSettings = { ...$mapSettings, allowDarkMode: !$mapSettings.allowDarkMode };
        }}
      >
        <Icon
          icon={mdiThemeLightDark}
          size="100%"
          class="text-black/80"
        />
      </ControlButton>
    </ControlGroup>
  </Control>
{/if}
```

Add import: `mdiThemeLightDark` from `@mdi/js` (already used elsewhere in the codebase for dark mode toggles).

**Step 2: Verify it compiles**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -10`

**Step 3: Commit**

```bash
git add web/src/lib/components/shared-components/map/map.svelte
git commit -m "feat(web): add dark mode tile toggle button to map controls"
```

---

## Task 12: Web — Integrate FilterPanel into map page

**Files:**

- Modify: `web/src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add imports and filter state**

Add to the script block:

```typescript
import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
import { createFilterState, buildFilterContext } from '$lib/components/filter-panel/filter-panel';
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
import { AssetVisibility, getFilteredMapMarkers, getTimeBuckets, type MapMarkerResponseDto } from '@immich/sdk';
import OnEvents from '$lib/components/OnEvents.svelte';
```

Add state variables:

```typescript
let filters = $state<FilterState>(createFilterState());
let mapMarkers = $state<MapMarkerResponseDto[]>([]);
let timeBuckets = $state<Array<{ timeBucket: string; count: number }>>([]);

const filterConfig = $derived(buildMapFilterConfig(spaceId));
```

**Step 2: Add data fetching effects**

Fetch time buckets on mount:

```typescript
$effect(() => {
  const currentSpaceId = spaceId;
  void getTimeBuckets({
    ...(currentSpaceId ? { spaceId: currentSpaceId } : { visibility: AssetVisibility.Timeline }),
  }).then((buckets) => {
    timeBuckets = buckets.map((b) => ({ timeBucket: b.timeBucket, count: b.count }));
  });
});
```

Fetch filtered markers when filters change (debounced):

```typescript
let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

$effect(() => {
  // Track all filter state fields to trigger re-fetch
  const { personIds, make, model, tagIds, rating, mediaType, isFavorite, selectedYear, selectedMonth } = filters;
  const currentSpaceId = spaceId;
  const context = buildFilterContext(filters);

  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    try {
      const result = await getFilteredMapMarkers({
        ...(currentSpaceId && { spaceId: currentSpaceId }),
        ...(personIds.length > 0 && { personIds }),
        ...(make && { make }),
        ...(model && { model }),
        ...(tagIds.length > 0 && { tagIds }),
        ...(rating !== undefined && { rating }),
        ...(mediaType !== 'all' && { type: mediaType === 'image' ? 'IMAGE' : 'VIDEO' }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(context?.takenAfter && { takenAfter: context.takenAfter }),
        ...(context?.takenBefore && { takenBefore: context.takenBefore }),
      });
      mapMarkers = result;
    } catch (error) {
      console.error('Failed to fetch filtered map markers:', error);
    }
  }, 200);

  return () => clearTimeout(fetchTimeout);
});
```

**Step 3: Add deletion re-fetch handler**

The `OnEvents` component uses named callback props derived from event names (e.g., event `AssetsDelete` becomes prop `onAssetsDelete`). See `web/src/lib/components/OnEvents.svelte` and `web/src/lib/managers/event-manager.svelte.ts` for the full event list.

```svelte
<OnEvents
  onAssetsDelete={() => {
    // Trigger re-fetch by creating a new filters reference
    filters = { ...filters };
  }}
/>
```

**Step 4: Update the template layout**

Replace the current main content div (line 78-108) with:

```svelte
<div class="isolate flex h-full w-full">
  <FilterPanel
    bind:filters
    config={filterConfig}
    {timeBuckets}
    storageKey="gallery-filter-visible-sections-map"
  />
  <div class="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
    <div
      class={[
        'min-h-0',
        isTimelinePanelVisible ? 'h-1/2 w-full pb-2 sm:h-full sm:w-2/3 sm:pe-2 sm:pb-0' : 'h-full w-full',
      ]}
    >
      {#await import('$lib/components/shared-components/map/map.svelte')}
        {#await delay(timeToLoadTheMap) then}
          <div class="flex items-center justify-center h-full w-full">
            <LoadingSpinner />
          </div>
        {/await}
      {:then { default: Map }}
        <Map hash onSelect={onViewAssets} {onClusterSelect} {spaceId} showSettings={false} {mapMarkers} />
      {/await}
    </div>

    {#if isTimelinePanelVisible && selectedClusterBBox}
      <div class="h-1/2 min-h-0 w-full pt-2 sm:h-full sm:w-1/3 sm:ps-2 sm:pt-0">
        <MapTimelinePanel
          bbox={selectedClusterBBox}
          {selectedClusterIds}
          assetCount={selectedClusterIds.size}
          onClose={closeTimelinePanel}
          {spaceId}
          {filters}
        />
      </div>
    {/if}
  </div>
</div>
```

Key changes:

- `mapMarkers` is passed (not undefined) — prevents map.svelte's internal `loadMapMarkers()`
- `showSettings={false}` — hides gear icon (dark mode toggle renders instead via Task 11)
- `filters` passed to MapTimelinePanel for filter forwarding

**Step 5: Verify it compiles**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -20`
Expected: May show warning about MapTimelinePanel not accepting `filters` prop — that's fixed in Task 13.

**Step 6: Commit**

```bash
git add web/src/routes/\(user\)/map/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): integrate FilterPanel into map page with filtered marker fetching"
```

---

## Task 13: Web — Forward filters to MapTimelinePanel

**Files:**

- Modify: `web/src/lib/components/shared-components/map/MapTimelinePanel.svelte`

**Step 1: Accept filter props**

Add to the `Props` interface:

```typescript
import type { FilterState } from '$lib/components/filter-panel/filter-panel';
import { buildFilterContext } from '$lib/components/filter-panel/filter-panel';
import { AssetTypeEnum } from '@immich/sdk';
```

```typescript
interface Props {
  bbox: SelectionBBox;
  selectedClusterIds: Set<string>;
  assetCount: number;
  onClose: () => void;
  spaceId?: string;
  filters?: FilterState;
}
```

Destructure it:

```typescript
let { bbox, selectedClusterIds, assetCount, onClose, spaceId, filters }: Props = $props();
```

**Step 2: Merge filter state into timelineOptions**

Update the `timelineOptions` derived:

```typescript
const timelineOptions = $derived.by(() => {
  const context = filters ? buildFilterContext(filters) : undefined;
  return {
    bbox: timelineBoundingBox,
    visibility: spaceId ? undefined : AssetVisibility.Timeline,
    isFavorite: filters?.isFavorite ?? (spaceId ? undefined : $mapSettings.onlyFavorites || undefined),
    withPartners: spaceId ? undefined : $mapSettings.withPartners || undefined,
    spaceId,
    timelineSpaceId: spaceId,
    assetFilter: selectedClusterIds,
    ...(filters?.personIds &&
      filters.personIds.length > 0 && {
        personIds: spaceId ? undefined : filters.personIds,
        spacePersonIds: spaceId ? filters.personIds : undefined,
      }),
    ...(filters?.make && { make: filters.make }),
    ...(filters?.model && { model: filters.model }),
    ...(filters?.tagIds && filters.tagIds.length > 0 && { tagIds: filters.tagIds }),
    ...(filters?.rating !== undefined && { rating: filters.rating }),
    ...(filters?.mediaType &&
      filters.mediaType !== 'all' && {
        $type: filters.mediaType === 'image' ? AssetTypeEnum.Image : AssetTypeEnum.Video,
      }),
    ...(context?.takenAfter && { takenAfter: context.takenAfter }),
    ...(context?.takenBefore && { takenBefore: context.takenBefore }),
  };
});
```

**Step 3: Verify it compiles**

Run: `cd web && npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tail -10`

**Step 4: Commit**

```bash
git add web/src/lib/components/shared-components/map/MapTimelinePanel.svelte
git commit -m "feat(web): forward filter state to map timeline panel"
```

---

## Task 14: Web — Unit tests for map filter config

**Files:**

- Create: `web/src/lib/utils/__tests__/map-filter-config.spec.ts`

**Step 1: Write tests**

```typescript
import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
import { describe, expect, it } from 'vitest';

describe('buildMapFilterConfig', () => {
  it('should return config without location section', () => {
    const config = buildMapFilterConfig();
    expect(config.sections).not.toContain('location');
  });

  it('should include expected sections', () => {
    const config = buildMapFilterConfig();
    expect(config.sections).toContain('timeline');
    expect(config.sections).toContain('people');
    expect(config.sections).toContain('camera');
    expect(config.sections).toContain('tags');
    expect(config.sections).toContain('rating');
    expect(config.sections).toContain('media');
    expect(config.sections).toContain('favorites');
  });

  it('should provide all required providers', () => {
    const config = buildMapFilterConfig();
    expect(config.providers.people).toBeDefined();
    expect(config.providers.cameras).toBeDefined();
    expect(config.providers.cameraModels).toBeDefined();
    expect(config.providers.tags).toBeDefined();
  });

  it('should provide space-scoped providers when spaceId given', () => {
    const config = buildMapFilterConfig('space-123');
    expect(config.providers.people).toBeDefined();
    expect(config.sections).not.toContain('location');
  });
});
```

**Step 2: Run tests**

Run: `cd web && pnpm test -- --run src/lib/utils/__tests__/map-filter-config.spec.ts`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add web/src/lib/utils/__tests__/map-filter-config.spec.ts
git commit -m "test(web): add unit tests for map filter config builder"
```

---

## Task 15: Web — Unit tests for favorites filter

**Files:**

- Create: `web/src/lib/components/filter-panel/__tests__/favorites-filter.spec.ts`

**Step 1: Write tests**

```typescript
import FavoritesFilter from '$lib/components/filter-panel/favorites-filter.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

describe('FavoritesFilter', () => {
  it('should render All and Favorites buttons', () => {
    render(FavoritesFilter, { props: { selected: undefined, onToggle: vi.fn() } });
    expect(screen.getByTestId('favorites-all')).toBeInTheDocument();
    expect(screen.getByTestId('favorites-only')).toBeInTheDocument();
  });

  it('should highlight All when selected is undefined', () => {
    render(FavoritesFilter, { props: { selected: undefined, onToggle: vi.fn() } });
    const allBtn = screen.getByTestId('favorites-all');
    expect(allBtn.className).toContain('border-immich-primary');
  });

  it('should highlight Favorites when selected is true', () => {
    render(FavoritesFilter, { props: { selected: true, onToggle: vi.fn() } });
    const favBtn = screen.getByTestId('favorites-only');
    expect(favBtn.className).toContain('border-immich-primary');
  });

  it('should call onToggle with true when Favorites clicked', async () => {
    const onToggle = vi.fn();
    render(FavoritesFilter, { props: { selected: undefined, onToggle } });
    await screen.getByTestId('favorites-only').click();
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('should call onToggle with undefined when All clicked', async () => {
    const onToggle = vi.fn();
    render(FavoritesFilter, { props: { selected: true, onToggle } });
    await screen.getByTestId('favorites-all').click();
    expect(onToggle).toHaveBeenCalledWith(undefined);
  });
});
```

**Step 2: Run tests**

Run: `cd web && pnpm test -- --run src/lib/components/filter-panel/__tests__/favorites-filter.spec.ts`
Expected: All tests pass.

**Step 3: Commit**

```bash
git add web/src/lib/components/filter-panel/__tests__/favorites-filter.spec.ts
git commit -m "test(web): add unit tests for favorites filter component"
```

---

## Task 16: Lint and format

**Step 1: Format**

```bash
make format-server
make format-web
```

**Step 2: Lint**

```bash
make lint-server
make lint-web
```

**Step 3: Type check**

```bash
make check-server
make check-web
```

**Step 4: Fix any issues found**

Address lint/format/type errors.

**Step 5: Run all tests**

```bash
cd server && pnpm test -- --run
cd web && pnpm test -- --run
```

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "chore: lint, format, and fix type errors"
```

---

## Task 17: Web — "No matching photos" overlay

**Files:**

- Modify: `web/src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add active filter detection**

Import `getActiveFilterCount` from the filter panel utilities:

```typescript
import { getActiveFilterCount } from '$lib/components/filter-panel/filter-panel';
```

Add a derived:

```typescript
const hasActiveFilters = $derived(getActiveFilterCount(filters) > 0);
const noResults = $derived(mapMarkers.length === 0 && hasActiveFilters);
```

**Step 2: Add overlay to the map container**

Inside the map container div (the one that wraps the `{#await import(...)}` block), add after the Map component:

```svelte
{#if noResults}
  <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
    <div class="pointer-events-auto rounded-lg bg-white/90 px-4 py-3 text-sm text-gray-600 shadow dark:bg-gray-800/90 dark:text-gray-300">
      No matching photos
    </div>
  </div>
{/if}
```

Make sure the map container div has `relative` in its class list for the absolute positioning to work.

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/map/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): add no-results overlay on map when filters eliminate all markers"
```

---

## Task 18: Web — Mobile-responsive FilterPanel

**Files:**

- Modify: `web/src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Use single FilterPanel with conditional rendering**

Use `{#if}` to avoid mounting two FilterPanel instances (which would cause duplicate provider API calls). Add state:

```typescript
let showMobileFilters = $state(false);
let isMobile = $state(false);
```

Add a resize observer to detect mobile viewport:

```typescript
function checkMobile() {
  isMobile = window.innerWidth < 640; // sm breakpoint
  if (!isMobile) showMobileFilters = false;
}

onMount(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
});
```

Import `onMount` from `svelte`.

**Step 2: Conditional rendering in template**

Replace the FilterPanel markup from Task 12 with:

```svelte
<!-- Desktop: inline sidebar -->
{#if !isMobile}
  <FilterPanel
    bind:filters
    config={filterConfig}
    {timeBuckets}
    storageKey="gallery-filter-visible-sections-map"
  />
{/if}

<!-- Mobile: slide-out overlay -->
{#if isMobile && showMobileFilters}
  <div class="fixed inset-0 z-30">
    <button
      type="button"
      class="absolute inset-0 bg-black/50"
      onclick={() => (showMobileFilters = false)}
    ></button>
    <div class="absolute inset-y-0 left-0 w-72 bg-light shadow-xl dark:bg-immich-dark-bg">
      <FilterPanel
        bind:filters
        config={filterConfig}
        {timeBuckets}
        storageKey="gallery-filter-visible-sections-map"
      />
    </div>
  </div>
{/if}
```

Only one FilterPanel is mounted at a time — no duplicate provider fetches.

**Step 3: Add mobile filter toggle button**

In the `UserPageLayout` header area (the `leading` snippet), add a filter toggle button visible only on mobile:

```svelte
{#if isMobile}
  <button
    type="button"
    onclick={() => (showMobileFilters = !showMobileFilters)}
  >
    <Icon icon={mdiFilterVariant} size="24" />
  </button>
{/if}
```

Import `mdiFilterVariant` from `@mdi/js`.

**Step 3: Commit**

```bash
git add web/src/routes/\(user\)/map/\[\[photos=photos\]\]/\[\[assetId=id\]\]/+page.svelte
git commit -m "feat(web): responsive FilterPanel with mobile overlay on map page"
```

---

## Task 19: E2E — Map filter panel tests

**Files:**

- Create: `e2e/src/specs/web/map-filter-panel.e2e-spec.ts`

Note: E2E web tests live at `e2e/src/specs/web/` (not `e2e/src/web/specs/`). Follow the patterns in existing tests like `auth.e2e-spec.ts`.

**Step 1: Write E2E tests**

```typescript
import { expect, test } from '@playwright/test';
import { utils } from 'src/utils';

test.describe('Map FilterPanel', () => {
  let admin: { accessToken: string };

  test.beforeAll(() => {
    utils.initSdk();
  });

  test.beforeEach(async () => {
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('should show filter panel on map page', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/map');
    await expect(page.getByTestId('discovery-panel')).toBeVisible();
  });

  test('should collapse and expand filter panel', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/map');

    // Panel starts expanded
    await expect(page.getByTestId('discovery-panel')).toBeVisible();

    // Collapse
    await page.getByTestId('collapse-panel-btn').click();
    await expect(page.getByTestId('collapsed-icon-strip')).toBeVisible();

    // Expand
    await page.getByTestId('expand-panel-btn').click();
    await expect(page.getByTestId('discovery-panel')).toBeVisible();
  });

  test('should show favorites filter section', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/map');
    await expect(page.getByTestId('favorites-filter')).toBeVisible();
  });

  test('should not show location filter section on map', async ({ context, page }) => {
    await utils.setAuthCookies(context, admin.accessToken);
    await page.goto('/map');
    await expect(page.getByTestId('filter-section-location')).not.toBeVisible();
  });
});
```

**Step 2: Run E2E tests**

Run: `cd e2e && npx playwright test src/specs/web/map-filter-panel.e2e-spec.ts`
Expected: Tests pass (or adjust based on actual test fixture setup).

**Step 3: Commit**

```bash
git add e2e/src/specs/web/map-filter-panel.e2e-spec.ts
git commit -m "test(e2e): add Playwright tests for map filter panel"
```
