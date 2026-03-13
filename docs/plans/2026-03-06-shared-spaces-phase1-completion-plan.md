# Shared Spaces Phase 1 Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining Phase 1 shared spaces gaps — map view, search within spaces, and advanced bulk actions — in a single PR.

**Architecture:** Client-side map markers (album-map pattern), server-side spaceId filtering for search (extending `searchAssetBuilder`), and wiring existing bulk action components into the space detail page.

**Tech Stack:** NestJS/Kysely (server), SvelteKit/Svelte 5 (web), Vitest (tests), OpenAPI codegen

---

### Task 1: Add `spaceId` to search DTOs

**Files:**

- Modify: `server/src/dtos/search.dto.ts:11` (BaseSearchDto class)

**Step 1: Add spaceId field to BaseSearchDto**

In `server/src/dtos/search.dto.ts`, add to the `BaseSearchDto` class (after line 13, the `libraryId` field):

```typescript
@ValidateUUID({ optional: true, description: 'Shared space ID to filter by' })
spaceId?: string;
```

This automatically propagates to `MetadataSearchDto`, `SmartSearchDto`, `RandomSearchDto`, `StatisticsSearchDto`, and `LargeAssetSearchDto` since they all extend `BaseSearchDto`.

**Step 2: Verify build**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add server/src/dtos/search.dto.ts
git commit -m "feat: add spaceId to search DTOs"
```

---

### Task 2: Add `spaceId` to search query builder

**Files:**

- Modify: `server/src/utils/database.ts:311` (searchAssetBuilder function)
- Modify: `server/src/repositories/search.repository.ts:99-101` (SearchAlbumOptions interface)
- Modify: `server/src/repositories/search.repository.ts:128-136` (SmartSearchOptions type)

**Step 1: Add spaceId to search option types**

In `server/src/repositories/search.repository.ts`, add a new interface after `SearchAlbumOptions` (line 101):

```typescript
export interface SearchSpaceOptions {
  spaceId?: string;
}
```

Then add `SearchSpaceOptions` to `BaseAssetSearchOptions` (line 112):

```typescript
type BaseAssetSearchOptions = SearchDateOptions &
  SearchIdOptions &
  SearchExifOptions &
  SearchOrderOptions &
  SearchPathOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchAlbumOptions &
  SearchOcrOptions &
  SearchSpaceOptions;
```

And add `SearchSpaceOptions` to the `SmartSearchOptions` type (line 128):

```typescript
export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchOcrOptions &
  SearchSpaceOptions;
```

**Step 2: Add spaceId clause to searchAssetBuilder**

In `server/src/utils/database.ts`, import `asUuid` if not already imported, then add a new `.$if` clause to `searchAssetBuilder` (after the `inAlbums` clause at line 319):

```typescript
.$if(!!options.spaceId, (qb) =>
  qb.where((eb) =>
    eb.exists(
      eb.selectFrom('shared_space_asset')
        .whereRef('shared_space_asset.assetId', '=', 'asset.id')
        .where('shared_space_asset.spaceId', '=', asUuid(options.spaceId!))
    )
  )
)
```

Note: Import `AssetSearchBuilderOptions` may need `spaceId` — check that the options type flows through. The `AssetSearchBuilderOptions` is derived from `AssetSearchOptions` which includes `BaseAssetSearchOptions`, so it should already have `spaceId` via `SearchSpaceOptions`.

**Step 3: Verify build**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add server/src/utils/database.ts server/src/repositories/search.repository.ts
git commit -m "feat: add spaceId filter to search query builder"
```

---

### Task 3: Add space permission check in search service

**Files:**

- Modify: `server/src/services/search.service.ts:49` (searchMetadata method)
- Modify: `server/src/services/search.service.ts:105` (searchSmart method)

**Step 1: Add permission check to searchMetadata**

In `server/src/services/search.service.ts`, add after the `requireElevatedPermission` check (line 52):

```typescript
if (dto.spaceId) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
}
```

**Step 2: Add permission check to searchSmart**

Add the same check in `searchSmart()`, after the `requireElevatedPermission` check (line 108):

```typescript
if (dto.spaceId) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [dto.spaceId] });
}
```

**Step 3: Verify build**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add server/src/services/search.service.ts
git commit -m "feat: add SharedSpaceRead permission check for space-scoped search"
```

---

### Task 4: Write search service tests for spaceId

**Files:**

- Modify: `server/src/services/search.service.spec.ts`

**Step 1: Write tests for searchMetadata with spaceId**

Add a new describe block inside the `searchMetadata` describe:

```typescript
it('should check shared space access when spaceId is provided', async () => {
  const spaceId = newUuid();
  mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

  await sut.searchMetadata(authStub.user1, { spaceId });

  expect(mocks.access.checkAccess).toHaveBeenCalledWith({
    auth: authStub.user1,
    permission: expect.stringContaining('sharedSpace'),
    ids: expect.any(Set),
  });
});

it('should pass spaceId through to search repository', async () => {
  const spaceId = newUuid();
  mocks.search.searchMetadata.mockResolvedValue({ hasNextPage: false, items: [] });

  await sut.searchMetadata(authStub.user1, { spaceId });

  expect(mocks.search.searchMetadata).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ spaceId }));
});
```

**Step 2: Write tests for searchSmart with spaceId**

Add a new test inside the `searchSmart` describe:

```typescript
it('should check shared space access when spaceId is provided', async () => {
  const spaceId = newUuid();
  mocks.search.searchSmart.mockResolvedValue({ hasNextPage: false, items: [] });

  await sut.searchSmart(authStub.user1, { query: 'test', spaceId });

  expect(mocks.access.checkAccess).toHaveBeenCalledWith({
    auth: authStub.user1,
    permission: expect.stringContaining('sharedSpace'),
    ids: expect.any(Set),
  });
});
```

**Step 3: Run tests to verify they pass**

Run: `cd server && pnpm test -- --run src/services/search.service.spec.ts`
Expected: All tests pass (new tests included)

Note: The exact mock assertion format may need adjustment based on how `requireAccess` calls `checkAccess` internally. Check `checkAccess` mock signature if tests fail and adjust the `expect.objectContaining` patterns accordingly.

**Step 4: Commit**

```bash
git add server/src/services/search.service.spec.ts
git commit -m "test: add search service tests for space-scoped search"
```

---

### Task 5: Add space map markers endpoint to shared-space repository

**Files:**

- Modify: `server/src/repositories/shared-space.repository.ts`

**Step 1: Add getMapMarkers method**

Add a new method to `SharedSpaceRepository` that returns asset IDs with lat/lon for a given space:

```typescript
@GenerateSql({ params: [DummyValue.UUID] })
getMapMarkers(spaceId: string) {
  return this.db
    .selectFrom('shared_space_asset')
    .innerJoin('asset', 'asset.id', 'shared_space_asset.assetId')
    .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
    .where('shared_space_asset.spaceId', '=', spaceId)
    .where('asset.deletedAt', 'is', null)
    .where('asset_exif.latitude', 'is not', null)
    .where('asset_exif.longitude', 'is not', null)
    .select([
      'asset.id',
      'asset_exif.latitude',
      'asset_exif.longitude',
      'asset_exif.city',
      'asset_exif.state',
      'asset_exif.country',
    ])
    .execute();
}
```

**Step 2: Verify build**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 3: Commit**

```bash
git add server/src/repositories/shared-space.repository.ts
git commit -m "feat: add getMapMarkers to shared-space repository"
```

---

### Task 6: Add space map markers endpoint to controller and service

**Files:**

- Modify: `server/src/controllers/shared-space.controller.ts`
- Modify: `server/src/services/shared-space.service.ts`

**Step 1: Add getMapMarkers to service**

In `server/src/services/shared-space.service.ts`, add a method:

```typescript
async getMapMarkers(auth: AuthDto, id: string) {
  await this.requireAccess({ auth, permission: Permission.SharedSpaceRead, ids: [id] });

  const markers = await this.sharedSpaceRepository.getMapMarkers(id);
  return markers.map((marker) => ({
    id: marker.id,
    lat: marker.latitude!,
    lon: marker.longitude!,
    city: marker.city ?? null,
    state: marker.state ?? null,
    country: marker.country ?? null,
  }));
}
```

**Step 2: Add endpoint to controller**

In `server/src/controllers/shared-space.controller.ts`, add:

```typescript
@Get(':id/map-markers')
@Authenticated()
getMapMarkers(@Auth() auth: AuthDto, @Param() { id }: UUIDParamDto): Promise<MapMarkerResponseDto[]> {
  return this.service.getMapMarkers(auth, id);
}
```

Import `MapMarkerResponseDto` from `src/dtos/map.dto` (check exact path/name — it may be in the SDK types or a response DTO file).

**Step 3: Verify build**

Run: `cd server && npx tsc --noEmit`
Expected: No type errors

**Step 4: Commit**

```bash
git add server/src/controllers/shared-space.controller.ts server/src/services/shared-space.service.ts
git commit -m "feat: add GET /shared-spaces/:id/map-markers endpoint"
```

---

### Task 7: Write tests for space map markers

**Files:**

- Modify: `server/src/services/shared-space.service.spec.ts`

**Step 1: Write test for getMapMarkers**

```typescript
describe('getMapMarkers', () => {
  it('should require shared space read access', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();

    mocks.access.checkAccess.mockResolvedValue(new Set());

    await expect(sut.getMapMarkers(auth, spaceId)).rejects.toThrow();
  });

  it('should return map markers for space assets', async () => {
    const auth = factory.auth();
    const spaceId = newUuid();
    const assetId = newUuid();

    mocks.access.checkAccess.mockResolvedValue(new Set([spaceId]));
    mocks.sharedSpace.getMapMarkers.mockResolvedValue([
      {
        id: assetId,
        latitude: 42.0,
        longitude: -71.0,
        city: 'Boston',
        state: 'MA',
        country: 'US',
      },
    ]);

    const result = await sut.getMapMarkers(auth, spaceId);

    expect(result).toEqual([
      {
        id: assetId,
        lat: 42.0,
        lon: -71.0,
        city: 'Boston',
        state: 'MA',
        country: 'US',
      },
    ]);
  });
});
```

**Step 2: Run tests**

Run: `cd server && pnpm test -- --run src/services/shared-space.service.spec.ts`
Expected: All tests pass

**Step 3: Commit**

```bash
git add server/src/services/shared-space.service.spec.ts
git commit -m "test: add shared-space map markers tests"
```

---

### Task 8: Regenerate OpenAPI clients

**Step 1: Build server and regenerate**

```bash
cd server && pnpm build
pnpm sync:open-api
cd .. && make open-api-typescript
```

**Step 2: Verify the new SDK exports**

Check that the generated SDK includes `getSpaceMapMarkers` (or similar name) and that `SmartSearchDto`/`MetadataSearchDto` now have `spaceId`.

**Step 3: Commit**

```bash
git add open-api/ server/immich-openapi-specs.json
git commit -m "chore: regenerate OpenAPI clients for space search and map markers"
```

---

### Task 9: Create SpaceMap component

**Files:**

- Create: `web/src/lib/components/spaces/space-map.svelte`

**Step 1: Create the component**

Model after `web/src/lib/components/album-page/album-map.svelte`. The component fetches map markers from the new endpoint and opens `MapModal`:

```svelte
<script lang="ts">
  import MapModal from '$lib/modals/MapModal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { getSpaceMapMarkers, type MapMarkerResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    spaceId: string;
  }

  let { spaceId }: Props = $props();
  let abortController: AbortController;
  let { setAssetId } = assetViewingStore;

  let mapMarkers: MapMarkerResponseDto[] = $state([]);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewingStore.showAssetViewer(false);
  });

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    return getSpaceMapMarkers({ id: spaceId });
  }

  async function openMap() {
    const assetIds = await modalManager.show(MapModal, { mapMarkers });

    if (assetIds) {
      await setAssetId(assetIds[0]);
    }
  }
</script>

<IconButton
  variant="ghost"
  shape="round"
  color="secondary"
  icon={mdiMapOutline}
  onclick={openMap}
  aria-label={$t('map')}
/>
```

Note: The exact SDK function name (`getSpaceMapMarkers`) will depend on what the OpenAPI codegen produces. Adjust the import name after Task 8.

**Step 2: Verify build**

Run: `cd web && npx svelte-check --tsconfig tsconfig.json`
Expected: No type errors

**Step 3: Commit**

```bash
git add web/src/lib/components/spaces/space-map.svelte
git commit -m "feat(web): add SpaceMap component"
```

---

### Task 10: Wire SpaceMap into space detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add import and render SpaceMap**

Add import at the top of the script:

```typescript
import SpaceMap from '$lib/components/spaces/space-map.svelte';
```

Add the `<SpaceMap>` component in the header buttons area (line ~151, inside the `{#if viewMode === 'view' && !assetInteraction.selectionActive}` block), next to the existing icon buttons:

```svelte
<SpaceMap spaceId={space.id} />
```

Place it after the add-photos button and before the members button.

**Step 2: Verify build**

Run: `make check-web`
Expected: No type errors

**Step 3: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): add map button to space detail page header"
```

---

### Task 11: Add search bar to space detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add search state and handler**

In the `<script>` section, add state and search handler:

```typescript
import { searchSmart, type AssetResponseDto } from '@immich/sdk';

let searchQuery = $state('');
let searchResults = $state<AssetResponseDto[]>([]);
let isSearching = $state(false);
let showSearchResults = $state(false);

const handleSearch = async () => {
  const query = searchQuery.trim();
  if (!query) {
    showSearchResults = false;
    searchResults = [];
    return;
  }

  isSearching = true;
  try {
    const { assets } = await searchSmart({
      smartSearchDto: { query, spaceId: space.id },
    });
    searchResults = assets.items;
    showSearchResults = true;
  } catch {
    searchResults = [];
  } finally {
    isSearching = false;
  }
};

const clearSearch = () => {
  searchQuery = '';
  searchResults = [];
  showSearchResults = false;
};
```

**Step 2: Add search bar UI**

In the template, add a search bar inside the space header section (after the stats line at ~line 201, before the description). Use a simple text input with a search icon:

```svelte
<div class="flex items-center gap-2 mt-2">
  <form
    class="flex-1"
    onsubmit={(e) => { e.preventDefault(); handleSearch(); }}
  >
    <input
      type="text"
      bind:value={searchQuery}
      placeholder={$t('search')}
      class="w-full rounded-lg border bg-transparent px-3 py-2 text-sm dark:border-gray-600"
    />
  </form>
  {#if showSearchResults}
    <IconButton
      variant="ghost"
      shape="round"
      color="secondary"
      icon={mdiClose}
      onclick={clearSearch}
      aria-label={$t('clear')}
    />
  {/if}
</div>
```

Import `mdiClose` from `@mdi/js`.

**Step 3: Add search results display**

When `showSearchResults` is true, render search results as a simple grid instead of the timeline. Add conditional rendering around the `<Timeline>` component:

```svelte
{#if showSearchResults}
  <section class="p-4">
    {#if isSearching}
      <LoadingSpinner />
    {:else if searchResults.length === 0}
      <p class="text-center text-gray-500 dark:text-gray-400 mt-8">{$t('search_no_result')}</p>
    {:else}
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {searchResults.length} {$t('results')}
      </p>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-1">
        {#each searchResults as asset (asset.id)}
          <img
            src={`/api/assets/${asset.id}/thumbnail`}
            alt={asset.originalFileName}
            class="aspect-square object-cover rounded cursor-pointer"
            onclick={() => assetViewingStore.setAssetId(asset.id)}
          />
        {/each}
      </div>
    {/if}
  </section>
{:else}
  <!-- existing Timeline component -->
{/if}
```

Import `LoadingSpinner` from `@immich/ui` if available, or use a simple loading indicator.

Note: The exact i18n keys (`search_no_result`, `results`) may not exist — check `web/src/lib/i18n/en.json` for available keys and use existing ones. The search page uses `search_no_result` or similar.

**Step 4: Verify build**

Run: `make check-web`
Expected: No type errors

**Step 5: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): add search bar to space detail page"
```

---

### Task 12: Add advanced bulk actions to space detail page

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`

**Step 1: Add imports for action components**

Add imports at the top of the script:

```typescript
import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
import { mdiDotsVertical } from '@mdi/js';
import { preferences } from '$lib/stores/user.store';
```

**Step 2: Add overflow menu with actions**

In the `AssetSelectControlBar` section (line ~237), after the existing actions (Favorite), add a `ButtonContextMenu` with the advanced actions. Follow the album page pattern (lines 468-500 of the album page):

```svelte
{#if assetInteraction.selectionActive && viewMode === 'view'}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets {timelineManager} {assetInteraction} />
    {#if isEditor}
      <RemoveFromSpaceAction spaceId={space.id} onRemove={handleRemoveAssets} />
    {/if}
    <DownloadAction />
    {#if assetInteraction.isAllUserOwned}
      <FavoriteAction
        removeFavorite={assetInteraction.isAllFavorite}
        onFavorite={(ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))}
      />
    {/if}
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')} offset={{ x: 175, y: 25 }}>
      {#if assetInteraction.isAllUserOwned}
        <ChangeDate menuItem />
        <ChangeDescription menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction
          menuItem
          unarchive={assetInteraction.isAllArchived}
          onArchive={(ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))}
        />
      {/if}
      {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
        <TagAction menuItem />
      {/if}
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}
```

Note: Check the exact import paths and component prop signatures. The `$preferences` store comes from `$lib/stores/user.store` — verify the import. `ButtonContextMenu` may need a different import path; check by grepping for its usage in the album page.

**Step 3: Verify build**

Run: `make check-web`
Expected: No type errors

**Step 4: Commit**

```bash
git add web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte
git commit -m "feat(web): add advanced bulk actions to space detail page"
```

---

### Task 13: Regenerate SQL docs

**Step 1: Run SQL generation**

```bash
make sql
```

**Step 2: Commit if changes**

```bash
git add -A server/src/queries/
git commit -m "chore: sync SQL query docs"
```

---

### Task 14: Run all checks

**Step 1: Run linting and formatting**

```bash
make lint-server && make lint-web
make format-server && make format-web
make check-server && make check-web
```

Fix any issues found.

**Step 2: Run server tests**

```bash
cd server && pnpm test -- --run
```

Expected: All tests pass (3159+ tests)

**Step 3: Run web tests**

```bash
cd web && pnpm test -- --run
```

Expected: All tests pass

**Step 4: Commit any formatting/lint fixes**

```bash
git add -A
git commit -m "fix: formatting and lint fixes"
```

---

### Task 15: Create PR

**Step 1: Create branch and push**

```bash
git checkout -b feat/shared-spaces-phase1-completion
git push -u origin feat/shared-spaces-phase1-completion
```

**Step 2: Create PR**

```bash
gh pr create --title "feat: shared spaces phase 1 completion" --body "$(cat <<'EOF'
## Summary

- Adds map view to shared spaces — map icon button in space header opens MapModal with markers for geotagged space assets
- Adds search within spaces — search bar on space detail page uses CLIP-based smart search scoped to the space via new `spaceId` filter on search DTOs and query builder
- Adds advanced bulk actions — archive, change date/location/description, and tag actions available via overflow menu when selecting space assets (gated behind ownership check)

## Test plan

- [ ] Server unit tests for space-scoped search (permission check, spaceId passthrough)
- [ ] Server unit tests for space map markers endpoint
- [ ] Server type check (`make check-server`) passes
- [ ] Web type check (`make check-web`) passes
- [ ] All server unit tests pass
- [ ] All web unit tests pass
- [ ] CI checks pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)" --label "changelog:feat"
```

**Step 3: Wait for CI**

```bash
gh pr checks <PR_NUMBER> --watch
```
