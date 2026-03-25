# FilterPanel on /photos Timeline — Design

## Goal

Add the existing FilterPanel sidebar to the /photos page so users can filter their main timeline by people, location, camera, tags, rating, media type, and time period.

## Approach

Direct integration — wire FilterPanel into /photos using the same `$derived.by()` pattern as the spaces page. No new abstractions, no backend changes.

## Design Decisions

1. **Collapsed by default** — /photos is browse-first, filters are opt-in. Panel starts as icon strip.
2. **All 7 filter sections** — timeline, people, location, camera, tags, rating, media type.
3. **Include partner & space assets** — `withPartners: true, withSharedSpaces: true` preserved in filtered results.
4. **Memory Lane hides when filtered** — carousel hidden when any filter is active.
5. **SortToggle in toolbar** — sort order control added to /photos.
6. **ActiveFiltersBar** — horizontal chip strip above timeline when filters are active.

## Known Gaps (accepted)

- **Search suggestion scope** — `getSearchSuggestions` without `spaceId` only returns values from user + partner assets, not shared space assets. A photo from a space member taken in "Tokyo" appears in the unfiltered timeline but "Tokyo" won't appear in the location dropdown. Fixing this requires backend changes (adding `withSharedSpaces` to the suggestions endpoint) — separate work.
- **People pagination** — `getAllPeople()` returns up to 500 per page. We fetch page 1 with size=500 and don't paginate further. People filter already has search+show-more to handle large lists.

## Component Changes

### `/photos` page (`web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`)

- Add `let filters = $state(createFilterState())`
- Change static `options` to `$derived.by()` mapping FilterState → TimelineManagerOptions
- Use `personIds` (not `spacePersonIds`) for global context
- Add FilterPanelConfig with global providers (no `spaceId`):
  - People: `getAllPeople({ withHidden: false })`
  - Locations: `getSearchSuggestions({ $type: 'country' })`
  - Cameras: `getSearchSuggestions({ $type: 'camera-make' })`
  - Tags: `getAllTags()`
- Add FilterPanel with `initialCollapsed={true}`
- Add ActiveFiltersBar, SortToggle, handleRemoveFilter, personNames/tagNames SvelteMap

### `filter-panel.svelte`

- Add `initialCollapsed?: boolean` prop (default `false`)
- Add `storageKey?: string` prop (default `'gallery-filter-visible-sections'`)

### Filter sub-components (people, location, camera, tags)

- Add `emptyText?: string` prop with generic defaults ("No X found" instead of "No X in this space")

## Data Flow

```
FilterState (reactive)
    ↓ $derived.by()
TimelineManagerOptions
    ↓ prop
Timeline → TimelineManager.updateOptions()
    ↓
getTimeBuckets(options) → re-fetch buckets
getTimeBucket(options) → re-fetch assets per bucket
    ↓
Re-render timeline with filtered results
```

## Branch Strategy

Start from the `contextual-filters` worktree branch to inherit city/model fetch fixes.

## Testing Strategy (TDD)

### Unit tests (write first)

- Filter state → options derivation: all filter combinations map correctly
- `initialCollapsed` prop: FilterPanel starts collapsed when set
- `storageKey` prop: different keys produce independent localStorage entries
- Empty state text prop: custom text renders, default fallback works

### E2E tests (4 core scenarios)

- Panel renders collapsed by default on /photos, expands on click
- Single filter (media type = video) returns only videos
- ActiveFiltersBar appears with active filters, clear-all restores full timeline
- Memory Lane hides when filters are active, reappears when cleared

### Existing tests must pass

- All 7 FilterPanel unit test files (1,559 lines)
- 86 spaces filter E2E tests

## YAGNI — Not Doing

- Generic search-within-section for location/camera/tags (people already has it)
- Mobile/responsive changes (same as spaces)
- Backend changes for search suggestion scope
- FilterableTimeline wrapper abstraction (only 2 consumers, they differ significantly)
