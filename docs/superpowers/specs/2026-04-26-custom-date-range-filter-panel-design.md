# Custom Date Range Filter Panel Design

## Goal

Add custom date range filtering to the shared web `FilterPanel` timeline section, above the existing year/month picker, so users can filter by arbitrary taken-date ranges anywhere the panel is used.

This is the first web-only slice of [issue #434](https://github.com/open-noodle/gallery/issues/434). It intentionally does not change mobile, people ordering, or search-bar filter composition.

## Scope

In scope:

- Web `FilterPanel` timeline section.
- Photos, albums, spaces, and map pages that already consume the shared panel or shared filter-state helpers.
- Bounded custom ranges, from-only open-ended ranges, and to-only open-ended ranges.
- Interdependent filter suggestions that narrow when the custom date range changes.
- Active filter chips and clear/remove behavior.

Out of scope:

- Mobile search/filter UI.
- Adding filter syntax or structured filters to the global search bar.
- Changing people ordering or favorite-first sorting.
- Persisting custom date ranges in URLs or local storage.

## Decisions

1. **Custom range is additive** - render it above the existing year/month picker, not instead of it.
2. **One temporal mode is active at a time** - custom range and year/month are mutually exclusive.
3. **Do not disable the inactive mode** - switching modes should be easy; the latest date-selection action wins.
4. **Open-ended ranges are valid** - a single `From` or `To` value is enough to filter.
5. **Invalid typed dates stay local** - invalid input does not update `FilterState` or refetch suggestions.
6. **Shared state drives every page** - route option builders should continue consuming `buildFilterContext()` instead of duplicating date logic.
7. **Contextual suggestions must update** - changing custom dates must narrow the available people, locations, cameras, and tags just like changing year/month does today.
8. **Date inputs are validated text inputs** - use `YYYY-MM-DD` text fields, not native `type="date"`, so malformed and impossible typed dates can stay visible locally while `FilterState` remains unchanged.

## Interaction Model

The timeline section has two stacked controls:

```text
[ From date ] [ To date ]

[ existing year/month timeline picker ]
```

When the user enters or changes either custom date:

- Clear `selectedYear` and `selectedMonth`.
- Keep the year/month picker enabled and visible.
- Update filter context from the custom range.
- Refetch contextual suggestions for the new date range.

When the user selects a year or month:

- Clear custom `dateAfter` and `dateBefore`.
- Keep both date inputs enabled and visible, but empty.
- Update filter context from the selected year/month.
- Refetch contextual suggestions for that year/month.

When the user clears the temporal chip or uses `Clear all`:

- Clear custom dates.
- Clear `selectedYear` and `selectedMonth`.

If the user types an invalid date:

- Keep the invalid value in the input field.
- Show a small inline error for that field.
- Do not update `FilterState`.
- Do not refetch suggestions until the field is valid or cleared.
- Treat impossible calendar dates such as `2024-02-31` as invalid, not as normalized JavaScript dates.
- If the user clears an invalid field while the other side is valid, emit the remaining open-ended range.

## Data Model

Extend `FilterState` with custom temporal fields:

```typescript
interface FilterState {
  dateAfter?: string;
  dateBefore?: string;
  selectedYear?: number;
  selectedMonth?: number;
}
```

The custom date values are ISO date strings in `YYYY-MM-DD` form at the UI boundary. `buildFilterContext()` converts them to API-ready `takenAfter` and `takenBefore` ISO datetimes.

`takenAfter` should be inclusive at the start of the selected UTC calendar date. `takenBefore` should be exclusive at the start of the UTC calendar day after the selected `To` date, matching the existing server-side `< takenBefore` convention and the current year/month helper behavior.

Examples:

| User input                         | Filter context                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------- |
| From `2024-01-01`, To `2024-12-31` | `takenAfter = 2024-01-01T00:00:00.000Z`, `takenBefore = 2025-01-01T00:00:00.000Z` |
| From `2024-01-01` only             | `takenAfter = 2024-01-01T00:00:00.000Z`                                           |
| To `2024-12-31` only               | `takenBefore = 2025-01-01T00:00:00.000Z`                                          |

If either custom date is present, `buildFilterContext()` ignores `selectedYear` and `selectedMonth`.

If one custom field is cleared while the other remains valid, keep the remaining open-ended range active. If both custom fields are cleared, clear the custom temporal mode.

## Component Design

Add a focused custom date range control inside the existing timeline section. It can live in `temporal-picker.svelte` or a new child component owned by it; the implementation should keep the public timeline-section API small.

Use text inputs with `inputmode="numeric"`, `placeholder="YYYY-MM-DD"`, and strict parsing. Native date inputs are not used because browsers may prevent or normalize invalid text before the component can preserve the typed value and show the required local validation error.

The control exposes:

- current `dateAfter`
- current `dateBefore`
- `onCustomRangeChange`

`TemporalPicker` remains responsible for year/month selection. The parent `FilterPanel` remains responsible for mutating `filters`.

Expected handlers:

- `handleCustomDateRangeChange(dateAfter?: string, dateBefore?: string)`
- `handleYearSelect(year?: number)`
- `handleMonthSelect(year: number, month?: number)`

`handleCustomDateRangeChange` sets custom dates and clears year/month. `handleYearSelect` and `handleMonthSelect` clear custom dates before applying the bucket selection.

## Active Chips

The active filters bar keeps one temporal chip.

Chip labels:

- Both dates: `Jan 1, 2024 - Dec 31, 2024`
- From only: `After Jan 1, 2024`
- To only: `Before Dec 31, 2024`
- Year: `2024`
- Month: `Jan 2024`

Removing the temporal chip clears both temporal modes. `Clear all` also clears both temporal modes while preserving the existing sort-order behavior.

## Interdependent Filtering

The existing `FilterPanel` already builds a `filterContext` from temporal state and uses it to fetch/refetch contextual suggestions.

Custom dates must use and extend that same path:

- `suggestionsProvider(filters)` receives the updated custom date state.
- `getFilterSuggestions()` calls include `takenAfter` and/or `takenBefore` derived from the custom range.
- Dependent providers such as `cities(country, context)` and `cameraModels(make, context)` receive the same custom range context.
- Visible people, locations, cameras, and tags narrow to values that exist inside the active date range.

The current unified suggestions path intentionally keeps rating and media options fixed. This feature does not change that behavior. Rating and media controls should stay stable while temporal context narrows people, locations, cameras, and tags.

The `FilterPanel` effects that currently track only `selectedYear` and `selectedMonth` must also track `dateAfter` and `dateBefore`; otherwise custom date changes will not update `filterContext`, dependent providers, or contextual suggestion refetches.

This avoids route-specific suggestion behavior and keeps photos, albums, spaces, and map consistent.

## Route Behavior

Route option builders that already consume `buildFilterContext()` should pick up custom dates through the shared helper. Any route that still builds temporal options locally must be changed to use the shared helper so custom dates and year/month semantics stay consistent.

Route-local temporal option construction should be extracted into helper functions when practical so the custom date behavior can be covered by unit tests. The spaces timeline options currently build date ranges inside the route component, so this slice should introduce a small spaces filter-options helper and make the route consume it.

Expected routes:

- `/photos` timeline options and smart-search filters.
- Album detail filter options for album timeline and add-assets picker.
- Spaces filter options, including the space-person mapping already present there. The current spaces route has route-local year/month date construction and should be refactored to use `buildFilterContext()`.
- Map marker and time-bucket options.

Search-result components that rerun work from reactive filter dependencies must also track `dateAfter` and `dateBefore`. In particular, smart-search result flows should re-search when either custom date field changes, not only when `selectedYear` or `selectedMonth` changes.

No URL persistence is added in this design.

## Error Handling

- Invalid date text is a UI validation error only.
- Invalid date text does not update route options or suggestion requests.
- Suggestion fetch failures keep the existing non-fatal behavior: preserve current selections and keep the panel mounted.
- If `From` is after `To`, show an inline range error and do not update `FilterState` until the range is valid or one side is cleared.

## Testing

Add or update focused web tests:

- `filter-state.spec.ts`
  - default state includes no custom dates
  - custom dates count as one temporal filter
  - custom dates take priority over year/month in `buildFilterContext()`
  - from-only and to-only open-ended ranges build the expected context
  - clearing filters clears both custom dates and year/month

- `temporal-picker.spec.ts`
  - custom range inputs render above the year/month picker
  - entering `From` clears selected year/month
  - entering `To` clears selected year/month
  - selecting a year clears custom dates
  - selecting a month clears custom dates
  - malformed dates, impossible dates, and inverted ranges do not call the change handler
  - clearing an invalid field emits the remaining valid open-ended range

- `active-filters-bar.spec.ts`
  - bounded custom range chip label
  - from-only chip label
  - to-only chip label
  - removing temporal chip clears through the existing `timeline` removal path

- `contextual-refetch.spec.ts`
  - changing custom date range refetches unified suggestions
  - refetch payload includes `takenAfter` and/or `takenBefore`
  - visible suggestion lists update to the narrowed response
  - rating and media controls remain stable when temporal context changes
  - dependent city and camera-model providers receive the custom date context

- route option helper tests
  - photos options include custom `takenAfter` / `takenBefore`
  - album options include custom dates for album and picker modes
  - real suggestion config builders send custom `takenAfter` / `takenBefore` to `getFilterSuggestions()`
  - map options include custom dates for markers and time buckets
  - spaces timeline options include custom dates while preserving existing space-person mapping
  - spaces timeline removal clears both custom dates and year/month
  - smart-search result components rerun when `dateAfter` or `dateBefore` changes

## Rollout Notes

This should be a web-only change with no server or OpenAPI changes. The server already accepts `takenAfter` and `takenBefore` on the relevant search and suggestion endpoints.

The safest implementation path is to update shared filter-state utilities first, then the timeline section UI, then contextual suggestion tests, and finally route helper coverage.
