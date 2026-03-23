# Filterable Timeline Design

## Context

The Immich community has been discussing filtering, sorting, and temporal navigation
across dozens of GitHub threads. A community write-up frames the core problem: users of
shared archives navigate through **discovery** (recognition-based browsing), not
**search** (recall-based querying). The current UI lacks the navigation primitives needed
for discovery at scale.

Today, applying filters kicks you out of the timeline into a degraded flat search results
page — no month grouping, no virtual scrolling, no scrubber. The goal is to make the
timeline itself filterable, so filters apply in-place without leaving the timeline
experience.

## Problem

1. **No filtering within views** — the timeline, person, album, and space views produce
   result sets with no way to narrow them down. The only path to filtering is the search
   modal, which navigates away to `/search`.
2. **No sorting** — the server hardcodes `ORDER BY fileCreatedAt DESC`. Users cannot
   change sort direction.
3. **No temporal navigation at scale** — the scrubber maps a 20-year archive to ~600px.
   Precise navigation requires sub-pixel accuracy.
4. **Filter and search are conflated** — the `SearchFilterModal` mixes structured
   filters (person, location, camera) with text/CLIP search. These are different
   operations: filtering is exhaustive (every match), search is ranked (best matches).

## Solution

A generic, reusable **FilterPanel** component that can be embedded in any view with a
timeline. V1 is implemented inside the **Spaces** view (fork-only code, zero upstream
conflict risk). The same component can later be added to albums, person views, tags, and
the main timeline.

The FilterPanel sits as a collapsible left sidebar alongside the existing timeline grid.
Filters apply to the timeline endpoint in-place — the `TimelineManager` rebuilds with
the new filter parameters. Virtual scrolling, scrubber, and month grouping all continue
to work.

### Separation of concerns

- **Filtering** (this feature) = exhaustive structured narrowing. "Show me ALL photos
  from Munich taken by Canon with 4+ stars." Uses the timeline endpoint with WHERE
  clauses. Results have month grouping and virtual scrolling.
- **Search** (existing feature) = ranked keyword/semantic retrieval. "Find photos that
  look like a beach sunset." Uses CLIP embeddings via `/search/smart`. Results are
  ranked by relevance. Stays in the global search bar → `/search` page.

These are different operations and belong in different UI locations.

### Layout (Spaces V1)

```
┌──────┬──────────┬───────────────────────────────────────────┐
│      │ Filters  │  ← Summer Trip 2023          [↑↓ Sort]   │
│      │          ├───────────────────────────────────────────┤
│      │ TIMELINE │  342 results [Sarah ×] [Munich ×] Clear   │
│      │ [2023]   ├───────────────────────────────────────────┤
│ Nav  │ [months] │  August 2023 · 312 photos                 │
│      │          │  ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐          │
│      │ PEOPLE   │  │   ││   ││   ││   ││   ││   │          │
│      │ ☑ Sarah  │  └───┘└───┘└───┘└───┘└───┘└───┘          │
│      │ ☐ Max    │                                           │
│      │          │  July 2023 · 535 photos                    │
│      │ LOCATION │  ┌───┐┌───┐┌───┐┌───┐┌───┐               │
│      │ ☑ Munich │  │   ││   ││   ││   ││   │               │
│      │ ☐ Berlin │  └───┘└───┘└───┘└───┘└───┘               │
│      │          │                                           │
│      │ CAMERA   │                                    scrub  │
│      │ RATING   │                                      ·    │
│      │ MEDIA    │                                      ·    │
└──────┴──────────┴───────────────────────────────────────────┘
  160px   240px                  remaining
 (as-is) (new, collapsible to 32px)
```

### Key properties

- **Nav sidebar is untouched** — the existing 160px nav renders exactly as today. Zero
  modifications to upstream layout files.
- **FilterPanel is a new generic component** — it receives configuration (which sections
  to show, data providers for filter options) and emits filter state. It does not know
  about spaces, albums, or any specific view.
- **Collapsible to 32px** — collapses to an icon strip showing filter category icons
  with blue badges on categories that have active filters.
- **Active filter chips** — displayed above the grid in a horizontal bar. Each chip is
  individually removable. "Clear all" button resets everything.
- **Scrubber stays on the right** — the existing timeline scrubber continues to work
  alongside the temporal picker.

## Visual Specification

**Primary mockup:** `docs/plans/mockups/discovery-independent-panel.html` (the "Left"
option). Open this file in a browser to see expanded and collapsed states side by side.

**Temporal picker detail:** `docs/plans/mockups/discovery-navigation-phase3.html` for
volume bars, breadcrumb, and filtered count behavior.

### Panel dimensions and styling

- **Expanded width:** 240px, with `border-right: 1px solid var(--border)`
- **Collapsed width:** 32px icon strip
- **Background:** `--bg-panel: #131316` (slightly darker than nav's `#141416` for
  visual distinction)
- **Scrollable:** `overflow-y: auto; scrollbar-width: thin`

### Panel header

- Sticky at top (`position: sticky; top: 0; z-index: 5`)
- Title "Filters" (13px, weight 600)
- Collapse chevron button (24×24px, `mdiChevronLeft`)
- Padding: 10px 12px, bottom border

### Section structure (each filter section)

- **Section header:** title (10px, uppercase, 700 weight, 0.7px letter-spacing,
  muted color) + chevron icon (14px). Click to collapse/expand. Hover shows
  `--primary-soft` background.
- **Section body:** padding 0 12px 10px
- **Divider:** `border-bottom: 1px solid var(--border)` between sections

### Temporal picker section

- **Year chips:** 4-column flex wrap grid, 3px gap
  - Each chip: 1px border, 4px border-radius, 10px font, weight 600
  - Shows year label + count (8px, opacity 0.6)
  - Volume bar: 2px height, border-radius 1px, fills proportionally (max year = 100%)
  - Selected state: primary background, white text, white bar on 25%-opacity track
  - Empty/zero state: 30% opacity
- **Month grid:** 4-column CSS grid, appears below years when a year is selected
  - Separated by `border-top: 1px solid var(--border)` with 6px margin/padding
  - Breadcrumb above: "All / 2020" (11px, "All" is a link in primary color)
  - Each month: 3px padding, 4px border-radius, 9px font, weight 600
  - Selected state: primary background, white text

### Filter items (people, location, camera, tags)

- **Item row:** flex, 6px gap, 4px vertical padding, 11px font

**Multi-select items (people, tags):**

- **Checkbox:** 13×13px, 1.5px border, 3px border-radius
  - Active: primary background + border, white checkmark SVG (9px)
  - Multiple items can be active simultaneously
- **Person avatar:** 18×18px circle, gradient background, 8px white initial

**Single-select items (location, camera):**

- **Radio indicator:** 13×13px circle, 1.5px border
  - Active: primary background + border, white dot center (5px)
  - Only one item active at a time — selecting another deselects the previous
- **Location hierarchy:** country items at root level, city items indented 20px
  when parent country is expanded. Selecting a city auto-fills the country.
  The `locations` provider returns countries; when a country is selected, a second
  call fetches cities for that country (`getSpaceSuggestions(spaceId, 'city',
{ country })`)

**Shared:**

- **Label:** flex-1, text-overflow ellipsis
- **People section:** local search input (26px height, 11px font, 5px border-radius,
  search icon 12px)
- **"Show N more" link:** 10px, primary color, weight 500
- **Empty section:** when provider returns zero items, show muted text
  "No [people/locations/cameras/tags] in this space" (11px, muted color). Section
  header remains visible but body shows the empty message.

### Rating section

- 5 star icons (14×14px), 2px gap
- Unfilled: `var(--border)` color
- Filled: `#f59e0b` amber

### Media type section

- 3 toggle buttons in a flex row, 4px gap
- Each: 1px border, 4px border-radius, 10px font, centered text
- Active: primary border, primary-soft background, primary text color

### Active filters bar

- Sits above the photo grid, below any toolbar
- Background: `var(--bg-surface)`, bottom border
- Padding: 6px 14px, flex wrap
- **Result count:** muted color, 10px
- **Chips:** pill shape (radius-full), 1px border, 10px font
  - Close button: 14×14px, faint color, hover shows border background
- **"Clear all":** primary color, weight 600, 10px, right-aligned (`margin-left: auto`)
- **Chip overflow:** bar uses `flex-wrap`, chips wrap to next line. No max-height —
  the bar grows as needed, pushing the grid down.

### Empty state (zero results)

When active filters match zero photos, the grid area shows a centered message:
"No photos match your filters" (14px, muted color) with a "Clear all filters" link
(primary color) below it. The filter panel remains fully interactive.

### Collapsed state

- **Icon strip:** 32px wide, flex column, centered, 8px vertical padding, 12px gap
- **First icon:** expand chevron (`mdiChevronRight`)
- **Category icons:** 24×24px, 6px border-radius, faint color
  - Hover: primary-soft background, muted color
- **Active badge:** 8×8px circle, primary background, 1.5px panel-colored border,
  positioned absolute top-right (-2px, -2px)
- **Icons with badges:** calendar (timeline), person (people), map-pin (location),
  camera, star (rating) — only show badge when that category has active filters

## Component Architecture

### FilterPanel — generic, view-agnostic

```typescript
interface FilterPanelConfig {
  // Which sections to show (not all views need all filters)
  sections: FilterSection[];

  // Data providers — the panel calls these to populate filter options.
  // Each view provides its own scoped data source.
  providers: {
    people?: () => Promise<PersonOption[]>;
    locations?: () => Promise<LocationOption[]>;
    cameras?: () => Promise<CameraOption[]>;
    tags?: () => Promise<TagOption[]>;
  };

  // Time buckets — passed in from whatever TimelineManager owns the grid.
  // Type: { timeBucket: string; count: number }[] (from GET /timeline/buckets)
  timeBuckets?: Array<{ timeBucket: string; count: number }>;
}

// Filter state sent to the server (maps to TimeBucketDto parameters)
interface FilterState {
  personIds: string[]; // multi-select, OR logic (photos with ANY selected person)
  city?: string; // single-select (server is single-value)
  country?: string; // single-select
  make?: string; // single-select
  model?: string; // single-select
  tagIds: string[]; // multi-select, OR logic (photos with ANY selected tag)
  rating?: number; // minimum rating (>= N), not exact match
  mediaType: 'all' | 'image' | 'video'; // maps to server AssetType: 'image'→IMAGE, 'video'→VIDEO, 'all'→omit param
  sortOrder: 'asc' | 'desc'; // maps to server 'order' param using AssetOrder enum
}

// Client-only view state (not sent to server)
interface FilterViewState {
  selectedYear?: number; // temporal picker position (scroll-to)
  selectedMonth?: number; // temporal picker position (scroll-to)
  collapsed: boolean; // panel collapsed state
}
```

### Usage in Spaces (V1)

```svelte
<FilterPanel
  config={{
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
    providers: {
      people: () => getSpacePeople(spaceId),  // returns SharedSpacePerson[]
      locations: () => getSpaceSuggestions(spaceId, 'country'),
      cameras: () => getSpaceSuggestions(spaceId, 'camera-make'),
      tags: () => getAllTags(),  // global tags, not space-scoped in V1
    },
  }}
  timeBuckets={timelineManager.months}
  onFilterChange={(filters) => rebuildTimeline(filters)}
/>
```

**Note on people in Spaces:** Spaces use `SharedSpacePerson` (space-level face clusters),
not the global `Person` entity. The `FilterState.personIds` maps to `spacePersonIds` on
`TimeBucketDto` when inside a Spaces context. The FilterPanel does not need to know
this distinction — the parent view maps `personIds` to the correct server parameter
(`spacePersonIds` for spaces, `personIds` for global timeline).

### Future usage in Albums

```svelte
<FilterPanel
  config={{
    sections: ['timeline', 'people', 'location', 'camera', 'rating'],
    providers: {
      people: () => getAlbumPeople(albumId),
      locations: () => getAlbumSuggestions(albumId, 'country'),
    },
  }}
  timeBuckets={timelineManager.months}
  onFilterChange={(filters) => rebuildTimeline(filters)}
/>
```

### Future usage in main timeline (/photos or /discover)

```svelte
<FilterPanel
  config={{
    sections: ['timeline', 'people', 'location', 'camera', 'tags', 'rating', 'media'],
    providers: {
      people: () => getAllPeople(),
      locations: () => getSuggestions('country'),
      cameras: () => getSuggestions('camera-make'),
      tags: () => getAllTags(),
    },
  }}
  timeBuckets={timelineManager.months}
  onFilterChange={(filters) => rebuildTimeline(filters)}
/>
```

## Server Changes

### Extend `TimeBucketDto` with missing filter parameters

The timeline endpoint already supports personId, albumId, spaceId, tagId, isFavorite,
visibility. It is missing the EXIF-based filters that the search endpoint supports.

**Upgrade existing single-value fields to arrays:**

The existing `personId` (single string) and `tagId` (single string) in `TimeBucketDto`
are upgraded to `personIds` (string array) and `tagIds` (string array) to support
multi-select. Similarly, `spacePersonId` is upgraded to `spacePersonIds` (string array)
for Spaces multi-person filtering.

**Backward compatibility:** The old single-value field names (`personId`, `tagId`,
`spacePersonId`) must be kept as deprecated aliases in the DTO alongside the new array
fields. The DTO should accept both forms and normalize to the array internally (e.g.,
if `personId` is provided, treat it as `personIds: [personId]`). This avoids breaking
the mobile Dart client and existing API consumers. The OpenAPI spec will expose both
the old and new fields until the old ones are removed in a future version.

**OR semantics for multi-select:** When multiple people or tags are selected, the filter
uses OR logic — photos matching ANY selected person or ANY selected tag are included.
This requires NEW helper functions (the existing ones must not be modified):

- `hasPeople()` in `database.ts` currently uses AND logic (`HAVING COUNT = length`).
  **Do not modify it** — search depends on AND logic. Instead, create a new
  `hasAnyPerson()` helper that uses OR logic: return assets where the person face
  matches ANY of the provided IDs (no HAVING count check).
- `hasSpacePerson()` in `database.ts` currently accepts a single string. Create a new
  `hasAnySpacePerson()` helper that accepts an array and uses OR logic, mirroring the
  `hasAnyPerson()` pattern for space-scoped face clusters.
- `withTagId()` in `database.ts` currently accepts a single string and traverses
  `tag_closure` for hierarchical tag matching. Create a new `withAnyTagId()` helper
  that accepts an array and matches assets with ANY of the selected tags. **Preserve
  tag hierarchy:** the helper should still traverse `tag_closure` so that selecting
  a parent tag includes photos tagged with child tags.

**Rating filter uses `>=` semantics:** The existing search builder uses exact match
(`rating = N`). The timeline filter uses minimum rating (`rating >= N`). The CTE
WHERE clause should use `>=`, not `=`.

**Service-layer access checks:** `TimelineService.timeBucketChecks()` currently checks
access for the single `dto.tagId`. This must be updated to iterate over `dto.tagIds[]`
and check `Permission.TagRead` for each element. Note: `personId` and `spacePersonId`
do NOT have access checks in `timeBucketChecks` today (access is implicitly scoped by
user/space/album checks), so only `tagId → tagIds` needs an access check update.

**Add new optional fields to `TimeBucketDto` and `TimeBucketAssetDto`:**

```typescript
// Upgraded to arrays (multi-select, OR semantics)
personIds?: string[]; // was personId: string
spacePersonIds?: string[]; // was spacePersonId: string (for Spaces)
tagIds?: string[]; // was tagId: string

// EXIF filters — new, single-value (require joining asset_exif in CTE)
city?: string;
country?: string;
make?: string; // camera make
model?: string; // camera model
rating?: number; // minimum rating (>= N)

// Asset table filters — new (no extra join needed)
type?: AssetType; // IMAGE or VIDEO
```

Wire these as WHERE clauses in the `getTimeBuckets` and `getTimeBucket` CTE queries in
`asset.repository.ts`. Note the different join strategies:

- **`getTimeBuckets`** does NOT currently join `asset_exif` except conditionally for
  `bbox` (geospatial). Add a **single conditional** join that covers both the existing
  `bbox` case and the new EXIF filters: `.$if(!!bbox || !!city || !!country || !!make
|| !!model || !!rating, (qb) => qb.innerJoin('asset_exif', ...))`. This replaces
  the existing `bbox`-only conditional join to avoid duplicate joins when both `bbox`
  and an EXIF filter are provided.
- **`getTimeBucket`** already has an unconditional `innerJoin('asset_exif', ...)`.
  Only WHERE clauses are needed — no additional join.

### Add space-scoped suggestions

The existing `GET /search/suggestions` endpoint returns global results. Add an optional
`spaceId` parameter to `SearchSuggestionRequestDto`. When provided, the `getExifField()`
helper in `search.repository.ts` adds an EXISTS subquery to scope results to assets in
that space:

```typescript
// Reuses the existing pattern from searchAssetBuilder
.$if(!!spaceId, (qb) =>
  qb.where((eb) =>
    eb.exists(
      eb.selectFrom('shared_space_asset')
        .whereRef('shared_space_asset.assetId', '=', 'asset.id')
        .where('shared_space_asset.spaceId', '=', asUuid(spaceId))
    ),
  ),
)
```

This makes `GET /search/suggestions?type=country&spaceId=abc` return only countries
that have photos in that space. The endpoint remains backward-compatible — omitting
`spaceId` returns global results as before.

People suggestions are already space-scoped via the existing
`GET /shared-spaces/:id/people` endpoint.

### Sort direction

The timeline endpoint already accepts an `order` parameter (asc/desc) via `TimeBucketDto`.
No new enum or parameter needed — just expose it in the FilterPanel UI. The sort field
remains `fileCreatedAt` (capture date). Additional sort fields (upload date, filename)
are deferred to a future iteration.

### No new endpoints

The existing timeline endpoints gain new optional filter parameters. The existing
suggestions endpoint gains an optional `spaceId` scope parameter. The API contract is
backward-compatible — omitting the new parameters produces the same behavior as before.

## Web Changes

### New generic components

All new components live in `web/src/lib/components/filter-panel/`:

- `filter-panel.svelte` — outer wrapper, collapsible, header with collapse button
- `filter-section.svelte` — generic collapsible section (title + chevron + body slot)
- `temporal-picker.svelte` — year→month grid with counts and volume bars
- `people-filter.svelte` — searchable multi-select list with avatars and checkboxes
- `location-filter.svelte` — hierarchical country→city with radio buttons (single-select)
- `camera-filter.svelte` — flat list of make/model with radio buttons (single-select).
  The `cameras` provider returns camera makes; when a make is selected, a second call
  fetches models for that make (`getSpaceSuggestions(spaceId, 'camera-model', { make })`).
  Selecting a model sets both `make` and `model` in FilterState.
- `tags-filter.svelte` — flat multi-select checkbox list (shows all user tags, not space-scoped)
- `rating-filter.svelte` — interactive star selector
- `media-type-filter.svelte` — All/Photos/Videos toggle
- `sort-toggle.svelte` — ascending/descending toggle button
- `active-filters-bar.svelte` — removable chips + result count + clear all

### Integration into Spaces page

The space page (`web/src/routes/(user)/spaces/[spaceId]/...`) adds the `FilterPanel`
as a left sidebar alongside the existing timeline. The page provides space-scoped data
providers and passes filter state changes to the `TimelineManager`.

### Collapsed state

When collapsed (32px), the panel shows vertical icon buttons for each filter category.
Icons with active filters show a small blue dot badge. Clicking an icon expands the
panel and scrolls to that section.

## Testing Strategy

### Server (TDD)

- **Unit tests** for `TimelineService` — verify new filter params are passed through
- **Unit tests** for `AssetRepository` — verify CTE WHERE clauses for each new filter
  (city, country, make, model, rating, type)
- **Unit tests** for `SearchService` — verify `spaceId` is passed to suggestions
- **Unit tests** for `SearchRepository` — verify scoped suggestion queries include
  EXISTS subquery when `spaceId` provided, and omit it when not
- **Medium tests** (real DB) — insert assets with known EXIF data, verify:
  - Timeline buckets return correct counts when filtered by city
  - Timeline buckets return correct counts when filtered by camera make
  - Timeline buckets return correct counts when filtered by rating
  - Timeline buckets return zero counts for non-matching filters
  - Scoped suggestions return only values from the specified space
  - Global suggestions still work when spaceId is omitted

### Web (TDD + E2E)

**Unit tests:**

- `FilterPanel` renders configured sections only
- `FilterPanel` hides sections not in config
- Collapsing/expanding the panel preserves filter state
- `TemporalPicker` aggregates monthly buckets into year counts correctly
- `TemporalPicker` calculates relative volume bars (max year = 100%)
- `TemporalPicker` handles single-month data correctly
- `TemporalPicker` handles empty bucket data without crashing
- `TemporalPicker` month drill-down shows correct counts for selected year
- Each filter section emits correct filter state on selection
- `PeopleFilter` is multi-select (selecting B keeps A selected)
- `PeopleFilter` deselecting removes from selection array
- `PeopleFilter` local search filters the list client-side
- `PeopleFilter` "Show N more" truncates long lists
- `LocationFilter` hierarchical expand (country click → cities load and appear indented)
- `LocationFilter` selecting a city auto-fills the country field
- `LocationFilter` is single-select (selecting a different city replaces the previous)
- `LocationFilter` shows empty message when no locations exist
- `CameraFilter` renders make/model combinations with radio buttons
- `CameraFilter` is single-select (selecting a different camera replaces the previous)
- `CameraFilter` hierarchical expand (make click triggers model load, models appear)
- `CameraFilter` selecting a model auto-fills the make field
- `CameraFilter` shows empty message when no cameras exist
- `TagsFilter` renders tag names with checkboxes (multi-select)
- `TagsFilter` shows all user tags (not space-scoped in V1)
- `TagsFilter` shows empty message when user has no tags
- `RatingFilter` highlights stars up to selected value
- `RatingFilter` clicking same star again clears the filter
- `MediaTypeFilter` toggles between All/Photos/Videos (only one active)
- `SortToggle` toggles between ascending and descending
- `ActiveFiltersBar` renders chips for each active filter with correct labels
- `ActiveFiltersBar` renders no chips when no filters active
- `ActiveFiltersBar` removes individual filter on chip close click
- `ActiveFiltersBar` clears all filters on Clear All click
- `ActiveFiltersBar` shows result count
- Collapsed state shows badge dots on icons with active filters
- Collapsed state shows no badge on icons without active filters
- Collapsed icon click expands panel and scrolls to that section
- `clearAll` does NOT reset sort order (sort is a view preference, not a filter)

**E2E (Playwright) — comprehensive coverage:**

_Page load and basic rendering:_

- Navigate to space page — verify filter panel renders with all sections
- Verify temporal picker shows year/month data from space's photos
- Verify filter panel is expanded by default

_Temporal picker:_

- Click a year — verify month grid appears with per-month counts
- Click a month — verify timeline scrolls to that month's position
- Click "All years" breadcrumb — verify returns to year-level view
- Apply a filter — verify year counts update to reflect filtered set
- Select a year, then apply a person filter — verify month counts update dynamically
- Verify years with zero photos after filtering appear greyed out
- Verify months with zero photos after filtering appear greyed out
- Clear all filters — verify temporal picker counts return to unfiltered totals

_People filter:_

- Verify only people present in the space are shown (not global people list)
- Select a person — verify timeline updates to show only their photos
- Select a second person — verify both remain selected (multi-select)
- Verify timeline shows photos containing either selected person
- Deselect one person — verify only the other person's filter remains
- Deselect last person — verify timeline returns to full space set
- Type in people search box — verify list filters to matching names
- Clear search box — verify full people list returns
- Space with many people — verify "Show N more" button appears and works

_Location filter:_

- Verify only locations present in the space are shown
- Select a country — verify city sub-items appear indented below
- Select a city — verify timeline filters to photos from that city
- Select a different city — verify previous city is deselected (single-select)
- Verify chip shows "City, Country" format
- Deselect city — verify timeline returns to country-level filter
- Select a country without selecting a city — verify timeline filters to all photos
  from that country
- Deselect country — verify all location filters removed
- Remove location chip — verify location filter cleared

_Camera filter:_

- Verify only cameras used in the space's photos are listed
- Select a camera make — verify models appear for that make
- Select a model — verify timeline filters and chip shows "Make Model" text
- Select a different make — verify previous is deselected (single-select)
- Deselect — verify filter removed
- Remove camera chip — verify filter cleared

_Tags filter:_

- Select a tag — verify timeline filters to tagged photos
- Select a second tag — verify both remain selected (multi-select)
- Verify two tag chips appear (one per selected tag)
- Deselect one tag — verify other tag filter remains and one chip removed
- Deselect last tag — verify filter removed
- Remove tag chip — verify that tag is deselected in the panel
- Select a parent tag — verify photos tagged with child tags are also included
  (tag hierarchy via tag_closure)

_Rating filter:_

- Click 3rd star — verify only 3+ star rated photos shown
- Click 5th star — verify only 5-star photos shown
- Click 3rd star again (same as current) — verify rating filter clears
- Verify unrated photos are excluded when any rating filter is active
- Verify chip shows "★ 3+" format
- Remove rating chip — verify filter cleared

_Media type filter:_

- Click Photos — verify only images shown, videos hidden
- Click Videos — verify only videos shown, images hidden
- Click All — verify both images and videos shown
- Verify the toggle is All by default
- Verify chip shows "Photos only" or "Videos only" (no chip for All)
- Remove media type chip — verify toggle returns to All

_Sort direction:_

- Toggle to ascending — verify oldest photos appear first
- Toggle back to descending — verify newest photos appear first
- Toggle sort with active filters — verify filters are preserved after sort change
- Apply filters with ascending sort, click Clear All — verify sort order remains
  ascending (sort is a view preference, not cleared with filters)

_Active filter chips:_

- Apply person filter — verify chip appears showing person's name
- Apply second person — verify second chip appears (one chip per person)
- Apply location filter — verify chip appears showing "City, Country"
- Apply rating filter — verify chip appears showing "★ 3+"
- Apply media type filter — verify chip appears showing "Photos only"
- Verify result count in the bar updates with each filter added
- Remove person chip by clicking × — verify person filter cleared, others remain
- Click "Clear All" — verify all filters removed, full timeline returns
- Verify chip bar is hidden or shows only count when no filters active

_Combined filters:_

- Apply person + location + rating simultaneously — verify results are the
  intersection (AND logic, not OR)
- Verify result count decreases with each additional filter
- Remove one filter — verify others remain active and count updates
- Verify temporal picker counts reflect the combined filter state

_Collapsed panel:_

- Click collapse button — verify panel shrinks to 32px icon strip
- Verify badge dot appears on people icon when person filter is active
- Verify badge dot appears on location icon when city filter is active
- Verify no badge on camera icon when no camera filter is active
- Click people icon in collapsed strip — verify panel expands scrolled
  to people section
- Expand panel — verify all previously set filters are still active
- Collapse with no filters active — verify no badge dots shown

_Edge cases:_

- Apply filters that match zero photos — verify empty state message with
  "Clear all filters" link
- Space with exactly one photo — verify temporal picker shows one year and one month
- Space with no photos — verify filter panel renders but shows empty messages in sections
- Space with no EXIF data — verify location and camera sections show empty messages
- Rapidly toggle multiple filters — verify no race conditions in timeline reload
  (each filter change should cancel any in-flight request)
- Apply all filter types simultaneously — verify they all work together
- Collapse and expand panel rapidly — verify state is preserved
- Navigate away from space and back — verify filters are reset (not persisted)
- Filter section with single option — verify it is still shown and functional

## Design Mockups

Interactive HTML mockups are in `docs/plans/mockups/`:

- `discovery-independent-panel.html` — the chosen layout (left panel, expanded +
  collapsed states with badge indicators)
- `discovery-navigation-phase3.html` — detailed temporal picker with volume bars,
  breadcrumb, and filtered counts

Additional reference mockups (earlier explorations):

- `discovery-page.html` — full-page layout exploration
- `discovery-layout-options.html` — comparison of four layout approaches
- `discovery-navigation-phase1.html` — filter + sort toolbar concepts
- `discovery-navigation-phase2.html` — clickable metadata concepts (deferred)

## Out of Scope

- **Clickable metadata navigation** — making detail panel metadata (person, location,
  camera) link to filtered views. Deferred.
- **Faceted filter counts** — showing result counts per filter option before selection.
  Requires heavier server queries.
- **Sort field selection** — sorting by upload date, filename, file size. Requires
  addressing the tension between non-capture-date sort fields and capture-date month
  grouping. Deferred to a future iteration.
- **Mobile layout** — web-only for now.
- **Smart/CLIP search integration** — CLIP search uses vector similarity and produces
  ranked results incompatible with month-grouped timelines. Stays in global search bar.
- **Multi-select location/camera** — server accepts single city/make/model values.
  Multi-select for these fields requires upstream search builder changes. Deferred.
- **Filter state persistence** — filters reset on navigation. URL-based or local
  storage persistence deferred.
- **Space-scoped tags** — V1 shows all user tags globally. Scoping tags to a space
  requires a new endpoint or extending the tags API. Deferred.
- **Keyboard navigation / accessibility** — arrow key navigation within filter
  sections, focus management, ARIA roles for checkboxes and radio buttons. Deferred.
- **Responsive breakpoint** — behavior when viewport is too narrow for 160px nav +
  240px panel + usable grid. Deferred.
- **Provider error handling** — error states when filter data providers fail to fetch.
  Deferred (V1 shows empty section on failure).
