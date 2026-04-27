# Favorites Filter Parity Design

## Context

GitHub issue #443 reports two gaps in the new Favorites filter:

- In Map, selecting Favorites does not create an active filter chip, so the active state is invisible in the results view.
- Favorites is available in Map but missing from Timeline and Spaces.

During review, we expanded the scope to include Albums because album assets already support favorite state and the album search/timeline APIs already accept `isFavorite`. The dedicated Favorites page stays unchanged because it is intrinsically scoped to favorites-only.

## Goals

- Show a `Favorites` active filter chip whenever `filters.isFavorite === true`.
- Make the Favorites filter available in Photos, Spaces, Album detail view, and Album asset picker.
- Preserve existing Map behavior while fixing the shared active-chip omission.
- Ensure Favorites narrows final results, dependent suggestions, and any route-level time-bucket requests that use the shared filter state.
- Preserve user section visibility preferences while making newly introduced sections visible and expanded by default.

## Non-Goals

- Do not change backend favorite semantics for personal assets, shared spaces, or albums.
- Do not add a redundant Favorites filter to the dedicated `/favorites` page.
- Do not broaden localization cleanup beyond the newly added Favorites labels.
- Do not add a Map route-level regression; shared component and utility coverage is sufficient for the reported Map chip gap.
- Do not change Album asset picker suggestions to exclude assets already in the album; that is an existing picker-suggestion mismatch outside this issue.

## Behavior

Favorites remains a two-state control everywhere it appears:

- `All` maps to `filters.isFavorite === undefined`.
- `Favorites` maps to `filters.isFavorite === true`.

The active filter bar renders one chip labeled exactly `Favorites`, matching the existing filter control copy. Closing that chip resets `isFavorite` to `undefined`, returning the control to `All`. The chip appears after media type chips and before timeline chips.

Favorites appears after `Media Type` in the filter section order for Map, Photos, Spaces, Album detail view, and Album asset picker.

On owner-timeline requests that normally include partner assets or shared-space assets, selecting Favorites narrows the request back to the user's own favorited timeline assets. The backend rejects `isFavorite` when combined with `withPartners` or `withSharedSpaces`, and this design preserves that server contract instead of redefining cross-owner favorite semantics. Concrete shared-space scopes using `spaceId` remain supported.

Photos search mode follows the same owner-only rule. When Favorites is selected, Photos smart-search and Photos dependent suggestions should not include `withSharedSpaces`. Map keeps its existing behavior: it may send `withSharedSpaces` with `isFavorite`, and the existing backend map service narrows that combination to owner-only favorites.

Spaces exposes Favorites only in normal view mode. Select-assets and select-cover flows do not show the filter panel today, so they remain unchanged.

## Architecture

The implementation should reuse the existing filter state model. `FilterState.isFavorite` already exists and is already counted by `getActiveFilterCount()` and included in `buildFilterContext()` when requested.

The changes are expected in these areas:

- `ActiveFiltersBar` should add a chip when `filters.isFavorite === true`.
- `handlePhotosRemoveFilter()` and `handleSpaceRemoveFilter()` should clear `isFavorite` for `favorites` and `isFavorite` removal types.
- Photos and Spaces filter panel configs should include the `favorites` section.
- Album filter configs should include the `favorites` section and pass `isFavorite` to filter suggestions.
- Photos, Spaces, and Album option builders should pass `isFavorite` through to their timeline or picker requests.
- Owner-timeline option builders should omit `withPartners` and `withSharedSpaces` when `isFavorite` is selected.
- Photos search and dependent suggestion builders should omit `withSharedSpaces` when `isFavorite` is selected.
- `FilterPanel` localStorage hydration should add newly introduced sections into saved visible and expanded section sets without unhiding sections the user already hid.

Map already includes the `favorites` section and passes `isFavorite` through map marker, time-bucket, and timeline option builders. Its missing behavior comes from the shared active-chip renderer.

## Data Flow

When a user selects Favorites:

1. `FavoritesFilter` sets `filters.isFavorite` to `true`.
2. `FilterPanel` emits the bound filter state to the owning route.
3. The route's option builder includes `isFavorite: true` in the timeline, picker, marker, time-bucket, or search request used by that surface.
4. If the owner timeline request would otherwise include partner or shared-space assets, the option builder removes those inclusions while Favorites is selected.
5. The route's suggestions provider includes `isFavorite: true`, so dependent filter options narrow to the favorites subset.
6. `ActiveFiltersBar` renders a `Favorites` chip.
7. Closing the chip routes through the page's remove-filter handler and clears `isFavorite`.

For search result mode, `SmartSearchResults` already tracks and passes `filters.isFavorite`; the route-level scope passed into it should match the no-query timeline scope.

## Persistence

Existing users may have saved visible or expanded section arrays in localStorage. If `favorites` is simply added to a route config, those old saved arrays would omit the new section and make the fix look absent.

`FilterPanel` should handle this by tracking the section keys known when preferences are saved. On hydration, it should add config sections that are not in the saved known-section set, while preserving hidden or collapsed state for known sections. Legacy array-only entries should be treated as pre-Favorites entries, so `favorites` is added by default without unhiding any other existing section. Users can still hide or collapse Favorites afterward.

## Testing

Add or update focused tests for:

- `ActiveFiltersBar` renders and removes a Favorites chip.
- Photos, Spaces, Album, and Map filter configs include `favorites` in the expected order.
- Photos, Spaces, and Album option builders include `isFavorite: true` when selected.
- Photos and Album picker option builders omit partner/shared-space inclusion when `isFavorite` is selected.
- Photos search and dependent suggestions omit shared-space inclusion when `isFavorite` is selected.
- Photos and Spaces remove-filter handlers clear favorites.
- Album suggestions include `isFavorite` for detail and picker configs.
- `FilterPanel` visible and expanded section hydration adds newly introduced sections without unhiding known sections that were already hidden or collapsed.
- Album route regression covers Favorites in both album detail mode and asset picker mode.
- Lightweight Photos and Spaces route regressions verify Favorites wiring without full UI interaction scaffolding.

Run the focused web suite covering filter-panel components, filter option utilities, and affected route specs. If time allows, run the broader web type checks after the targeted suite passes.
