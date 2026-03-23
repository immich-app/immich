# Unify People Strip with Filter Panel

## Problem

Two independent person-filtering mechanisms exist in the space page:

1. `selectedPersonId` (people strip) → sets `spacePersonId` (singular) on the API query
2. `filters.personIds` (filter panel) → sets `spacePersonIds` (plural) on the API query

They don't communicate. Clicking a person in the strip doesn't update the filter panel, and
vice versa.

## Solution

Remove `selectedPersonId` entirely. Make the people strip read from and write to
`filters.personIds`. Make FilterPanel a controlled component via `$bindable()` so the page
owns filter state and both the strip and panel stay in sync.

## Changes

### FilterPanel (`filter-panel.svelte`)

Replace internal `let filters = $state(createFilterState())` with a `$bindable()` prop:

```typescript
let { filters = $bindable(createFilterState()), config, ... } = $props();
```

Remove the `onFilterChange` callback — both sides read/write the same reactive object.

### Space page (`+page.svelte`)

- Remove `selectedPersonId` state variable
- Remove `onFilterChange` callback from `<FilterPanel>`, use `bind:filters` instead
- Change `handlePersonClick` to toggle in `filters.personIds`:
  ```typescript
  const handlePersonClick = (personId: string) => {
    const current = filters.personIds;
    filters = {
      ...filters,
      personIds: current.includes(personId) ? current.filter((id) => id !== personId) : [...current, personId],
    };
  };
  ```
- Remove `spacePersonId` (singular) from `options` derived — person filtering now only goes
  through `spacePersonIds` (plural) via `filters.personIds`
- Pass `selectedPersonIds={filters.personIds}` to `<SpacePeopleStrip>` instead of
  `selectedPersonId`

### SpacePeopleStrip (`space-people-strip.svelte`)

- Change prop from `selectedPersonId?: string | null` to `selectedPersonIds?: string[]`
- Default: `selectedPersonIds = []`
- Update ring check from `selectedPersonId === person.id` to
  `selectedPersonIds.includes(person.id)`
- Update text highlight similarly

### SpacePeopleStrip tests (`space-people-strip.spec.ts`)

- Update existing selection tests to use `selectedPersonIds: ['person-1']`
- Add test for multi-select visual state (two people highlighted)

## Behavior

- Clicking a person in the strip adds them to `filters.personIds` → filter panel shows them
  selected, ActiveFiltersBar shows chip
- Clicking the same person again removes them (toggle)
- Selecting people in the filter panel highlights them in the strip
- Removing a person chip from ActiveFiltersBar deselects in both places
- Clearing all filters deselects all people in both places
- First person selection auto-collapses the hero (filter count 0→>0)

## Files Changed

1. `web/src/lib/components/filter-panel/filter-panel.svelte` — `$bindable()` filters prop,
   remove `onFilterChange`
2. `web/src/lib/components/spaces/space-people-strip.svelte` — multi-select prop
3. `web/src/lib/components/spaces/space-people-strip.spec.ts` — update selection tests
4. `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte` —
   remove `selectedPersonId`, `bind:filters`, update handlers

## Out of Scope

- No changes to PeopleFilter component (already supports multi-select)
- No changes to ActiveFiltersBar (already handles `personIds` removal)
- No API changes
- Deprecating `spacePersonId` singular field on the API
