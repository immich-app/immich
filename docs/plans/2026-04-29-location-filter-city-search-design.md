# Location Filter City Search Design

## Problem

The filter panel location section currently caps and searches the country list, but selecting a country renders every city returned for that country. Countries with many cities, such as Germany, can make the filter panel extremely long and hard to scan. The current search input also does not help once the user needs a city inside an expanded country.

## Goals

- Keep the current country-to-city hierarchy.
- Prevent expanded countries from rendering an unbounded city list.
- Make the existing location search input search city names as well as country names.
- Let users find and select a city without scrolling through all cities in a large country.
- Preserve existing selection behavior: selecting a country filters by country, selecting a city filters by city and its country.
- Keep route-level provider APIs unchanged unless implementation proves that impossible.

## Non-Goals

- Replacing the hierarchy with a flat location list.
- Adding a second city-specific input.
- Changing the smart facet API or backend search behavior.
- Virtualizing the filter panel list.

## User Experience

The location filter continues to show countries first, with the existing `Search locations...` input. When no query is entered, the country list is capped as it is today. Opening a country fetches its cities, but only the first city batch is rendered. A `Show N more` action appears under that country when more cities are available.

When the user types into the search input, the query matches both countries and cities. A country should remain visible when either the country name matches or one of its fetched city names matches. Matching cities should appear under their country so a query like `ber` can surface `Berlin` under `Germany`.

Selected locations remain visible even when they fall outside the current cap or search result. Orphaned country behavior remains intact for selected countries that are no longer returned by contextual suggestions.

## Component Design

Changes are centered in `web/src/lib/components/filter-panel/location-filter.svelte`.

The component should introduce a city display cap, separate from the existing country cap. A starting cap of 10 cities matches the existing country behavior and keeps the panel bounded. The city `Show N more` state should be tracked per country so expanding one country does not expand every country.

The component currently stores one expanded country and one city result list. That can remain the default browsing model. For city search, the implementation should cache fetched city lists by country. When the search query is non-empty, it should fetch uncached city lists across the current country suggestions so city search is complete, not limited to the first visible country batch. The first implementation should avoid changing `FilterPanelConfig.providers.cities`; it can call the existing `onCityFetch(country, context)` callback as needed.

The displayed country list should be derived from:

- country name matches,
- countries with city matches,
- the selected country,
- any orphaned selected country.

The displayed city list for a country should be derived from:

- the fetched city cache for that country,
- the active search query,
- the selected city,
- that country's per-country city cap.

## Data Flow

`FilterPanel` continues to pass `countries`, `selectedCountry`, `selectedCity`, `context`, `onCityFetch`, and `onSelectionChange` to `LocationFilter`.

`LocationFilter` handles all view-local search, city caching, caps, and show-more state. Selecting a country calls `onSelectionChange(country, undefined)`. Selecting a city calls `onSelectionChange(country, city)`.

Contextual refetch behavior should remain compatible with temporal and other contextual filters. When `countries` or `context` changes, stale city cache entries should not cause incorrect city results. The implementation should clear or invalidate city cache entries when the country list changes or when context changes.

Async city fetches should be guarded so older responses cannot overwrite newer results after the search query, expanded country, or context changes. A later fetch for the same country/context should win over earlier in-flight requests.

## Error Handling

If a city fetch fails, the component should stop loading for that country and keep the panel usable. Existing behavior does not surface an inline error, so the scoped change can continue logging or silently keeping previous city results. Failed city searches should not clear the selected country or city.

## TDD Workflow

Implementation must follow red-green-refactor:

1. Add or update one focused `LocationFilter` test for the next behavior.
2. Run the targeted test command and confirm the new test fails for the expected reason.
3. Make the smallest component change that passes that test.
4. Rerun the targeted test and confirm it passes.
5. Refactor only after the behavior is green, then rerun the same tests.

Do not write production code for this feature before a failing test exists. The first failing test should cover the core bug: expanding a country with more than the city cap does not render every city.

## Testing

Add focused tests to the existing `LocationFilter` tests in `web/src/lib/components/filter-panel/__tests__/filter-sections.spec.ts`.

Cover:

- expanded city lists are capped and show `Show N more`;
- clicking the city-level show-more reveals hidden cities for only that country;
- the location search matches city names and displays matching cities under the country;
- city search finds a matching city in a country beyond the initial 10-country visible cap;
- selecting a city from a city search still calls `onSelectionChange(country, city)`;
- selected city remains visible even if it is outside the initial city cap;
- selected country-only behavior still works: clicking an already-selected country with no city clears the location;
- selected city behavior still works: clicking an already-selected city clears the city but keeps the country;
- countries with zero cities do not show a city-level `Show more`;
- no-results state waits for relevant city fetches during city search so a matching city is not hidden behind a premature `No matching locations` message;
- city fetch failures leave the panel usable and do not clear the active selection;
- city cache is refreshed or invalidated when countries/context changes;
- stale in-flight city fetches do not overwrite newer search/context results.

Run `pnpm --filter @immich/sdk build` in fresh worktrees before web tests if `@immich/sdk` has not been built yet. Use `pnpm --filter immich-web exec vitest run src/lib/components/filter-panel/__tests__/filter-sections.spec.ts` for the targeted test file. After implementation, run that targeted file and the broader web check that is practical for the change.

## Implementation Notes

The preferred implementation keeps this as a component-local enhancement. Avoid backend changes and avoid changing route provider signatures unless the current API cannot support city search without excessive requests.

Because city search across all countries can cause multiple provider calls, the implementation should limit repeated work with caching, context invalidation, and debounce/cancellation around the active query. The current country suggestion set is the search boundary.

- continue fetching cities immediately for the expanded or selected country;
- during search, fetch city lists for current countries that have not been cached for the active context;
- show country-name matches immediately while city matches populate as fetches resolve.

This keeps network/API work bounded by the current country facet list and preserves complete city search within the active filter context.
