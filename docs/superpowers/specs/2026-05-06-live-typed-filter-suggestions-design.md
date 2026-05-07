# Live Typed Filter Suggestions Design

Status: reviewed for TDD and edge-case coverage
Date: 2026-05-06
Worktree: `/home/pierre/dev/gallery/.worktrees/search-bar-next-feature`
Branch: `brainstorm/search-bar-next-feature`

## Context

Gallery's typed search filters let users submit searches such as:

```text
beach person:anna from:2025 type:photo
```

The current implementation intentionally resolves entity filters only on Enter. That kept v1 cheap and simple, but it means users do not know whether `person:anna`, `tag:travel`, or `city:par` will resolve until submission fails or succeeds.

This feature adds live, cursor-aware suggestions for the typed filters that benefit most from preview:

- `person:`
- `tag:`
- `country:`
- `city:`

The design keeps the existing all-or-nothing Enter submit behavior. Live suggestions make the typed filter state visible and easier to correct; they do not replace final validation.

## Goals

- Preview matching filter values while the user edits a supported typed-filter token.
- Make suggestion rows unambiguously apply filters rather than navigate to entities.
- Canonicalize the raw typed token when a suggestion is selected.
- Keep normal palette providers driven by the plain query text.
- Preserve Enter as the authoritative all-or-nothing commit path.
- Support one written design with separate implementation plans for shared infrastructure, people, tags, location, and polish.

## Non-Goals

- Do not build a full token editor or token-attached popover.
- Do not live-suggest `camera:` in this feature. Existing Enter-time camera resolution remains unchanged.
- Do not make live suggestions submit filters automatically.
- Do not show verbose scalar validation issue rows while the user is still editing.
- Do not reuse the existing People or Tags navigation sections for filter application rows.

## User Experience

When the cursor is inside a supported typed-filter token, the palette treats that token as the active filter being edited.

Examples:

- Cursor inside `person:ann` shows a `Person filter matches` section.
- Cursor inside `tag:` shows initial tag suggestions.
- Cursor inside `country:ger` shows matching countries.
- Cursor inside `city:par` shows matching cities.

The filter-match section appears above the top result and normal provider sections. It is visually compact and action-specific. Rows use copy such as `Use as filter` so selection is not confused with navigating to a person or tag page.

Selecting a suggestion rewrites only the active token to a canonical value:

```text
beach person:ann
```

becomes:

```text
beach person:"Anna Maria"
```

The caret stays after the rewritten token. The token rail marks that token as resolved. If the user edits the token again, the resolved state is cleared and live suggestions resume.

Initial suggestions:

- `person:` shows initial people suggestions, following the spirit of the existing bare-`@` suggestions.
- `tag:` shows initial tag suggestions, following the spirit of existing tag suggestion behavior.
- `country:` shows initial country suggestions.
- `city:` waits for at least one character.

Empty active `person:`, `tag:`, and `country:` tokens are draft-suggestable, not draft errors. Pressing Enter without selecting or completing a value still blocks as an `empty-value` issue. Empty `city:` is neutral while the cursor is in it, shows no live rows until one character is typed, and blocks as `empty-value` on Enter.

Scalar validation stays quiet while typing. Invalid scalar tokens such as `rating:9`, `from:soon`, or `favorite:maybe` may turn red immediately, but detailed issue rows appear only after Enter blocks submission.

## Location Behavior

Location suggestions cover both `country:` and `city:`.

`country:` resolves against country suggestions. Empty `country:` shows initial suggestions.

`city:` resolves against city suggestions. When the input also contains a country token, city suggestions are scoped to that country:

```text
beach country:Germany city:ber
```

shows German city matches such as `Berlin`.

Without a country token, `city:par` suggests matching cities globally. If the implementation uses the existing `getSearchSuggestions({ $type: City })` path and it returns only city names, rows show the city name only. If an implementation path returns city/country pairs, rows may include country as secondary text.

Selecting a city canonicalizes only the city token. It does not automatically add a `country:` token in this feature. Enter keeps the current scalar location semantics: it canonicalizes exact city/country casing through suggestions where possible, but does not invent missing country values.

## Architecture

### Cursor-Aware Parser Metadata

Extend the typed-search parser result with token span metadata:

- raw token text
- normalized key
- parsed value
- start offset
- end offset
- syntactic issue, if any
- quoted/unquoted value metadata sufficient to rewrite only the value safely

The parser should remain pure and dependency-free. It should not read DOM selection state or fetch suggestions.

The global search input should provide the manager with the current caret offset. The manager combines the parse result and caret offset to find the active token. A supported live token is active when the caret is inside or immediately after a `person`, `tag`, `country`, or `city` token.

Caret edge rules:

- If the browser reports no caret position, live suggestions stay `idle`.
- If the user has a text range selected, use the selection start as the active caret for suggestions, and replace the selected token only after explicit row selection.
- If the caret is inside a quoted value, suggestions use the value text without quotes.
- If the caret is outside any token, live suggestions stay `idle`.
- During IME composition, do not fire live requests until composition ends.

### Live Suggestion Utility

Add a typed-search live suggestion utility that accepts:

- parse result
- active token metadata
- current selected-choice state
- scope information such as `spaceId`
- abort signal

It returns preview choices, not a final `FilterState`.

The utility should reuse the same data sources and matching semantics as final resolution where possible:

- `person:` uses people search or scoped people suggestions.
- `tag:` uses tag suggestions/cache.
- `country:` uses filter-suggestion countries.
- `city:` uses city search suggestions, scoped by an existing `country:` token when present.

Live choices should distinguish entity-backed and scalar-backed selections:

- `person` choices carry a person id and display label.
- `tag` choices carry a tag id and display label.
- `country` choices carry the canonical country string.
- `city` choices carry the canonical city string and optionally a country label for display only.

The existing Enter resolver remains authoritative. Live suggestions can pass selected choices to the Enter resolver so it can avoid duplicate lookups where practical, but Enter must still validate the full input all-or-nothing before navigation.

### Manager State

The global search manager owns:

- caret offset
- active live token
- debounce timer
- request id
- abort controller
- live suggestion status
- live suggestion rows
- selected choices keyed by token identity

Token identity should include at least key, raw text, start offset, and end offset. This prevents a resolved choice for one repeated token, such as the first `person:ann`, from leaking to another token with the same raw text.

Status values:

- `idle`: no supported active token.
- `loading`: debounce fired and a request is in flight.
- `ok`: rows are available.
- `empty`: no matches.
- `error`: lookup failed.
- `timeout`: lookup exceeded the provider timeout.

Stale responses must be ignored using request id and abort signal. Closing the palette aborts live suggestion requests.

Selected-choice invalidation rules:

- Editing a token's raw text clears that token's selected choice.
- Moving the token to a different span clears the selected choice.
- Removing a token clears its selected choice.
- Reordering repeated tokens must not swap their resolved choices.

### UI

Add a dedicated filter-match section above `Top result` and normal providers. Do not place live suggestions in the existing People, Tags, or Navigation sections.

The same component should support all live keys with key-specific labels:

- `Person filter matches`
- `Tag filter matches`
- `Country filter matches`
- `City filter matches`

Rows should be keyboard-navigable with the existing cmdk list semantics. Choosing a row canonicalizes the active token and updates selected-choice state. The UI should stay compact, with a small row cap, so validation does not push normal search results too far down.

When a filter-match row is highlighted, Enter selects that row and rewrites the token. Enter submits the whole search only when the active item is the top search row or there is no filter-match row selected. This avoids accidentally navigating while the user is resolving a token.

The normal provider payload remains the plain query text from the parser. For example, `beach city:par` still searches photos for `beach`.

## Data Flow

While typing:

1. Input value changes.
2. Manager parses the raw input.
3. Manager updates token rail display state.
4. Input selection change updates the caret offset.
5. Manager derives the active live token.
6. If the active token supports live suggestions, manager starts a debounced request.
7. UI renders the filter-match section when live status is `loading`, `ok`, `empty`, `error`, or `timeout`.

When selecting a live suggestion:

1. Manager rewrites only the active token to its canonical value.
2. Manager updates the raw query.
3. Manager keeps the caret after the rewritten token.
4. Manager stores the selected choice for final resolution.
5. Manager clears live rows or moves to the next active token if the caret lands in one.

Canonical rewrite rules:

- Quote values that contain whitespace.
- Preserve the original filter key spelling only if it is a supported alias; otherwise write the normalized key.
- Do not rewrite unrelated query text or other tokens.
- Do not rewrite scalar tokens such as `from:` or `rating:` from the live suggestion path.

When pressing Enter:

1. Manager parses the current raw input.
2. Parser issues block immediately.
3. Enter resolver resolves all supported and existing typed filters.
4. If any filter is invalid, unresolved, ambiguous, or fails resolution, the palette stays open and issue rows render.
5. If everything resolves, the destination URL is built with `q`, `sort`, and serialized filters.
6. Destination pages hydrate the same filter state used by the filter panel.

## Error Handling

Live suggestion errors do not block typing. They should render as quiet inline rows in the filter-match section, for example `Unable to load matching people`. They should not create commit-blocking issue rows until Enter.

No-match live results show a compact empty row. On Enter, unresolved filters still use the existing blocking issue behavior.

Scalar filters may turn red while typing, but detailed issue copy appears only after Enter. This avoids noisy mid-edit feedback while still showing that a token needs attention.

## Implementation Plan Split

Write one design and separate implementation plans:

1. **Shared cursor-aware foundation**
   Add parser spans, caret tracking, live suggestion manager state, debounce/abort/stale handling, and the dedicated section shell.
2. **People live suggestions**
   Implement `person:` suggestions, selection canonicalization, selected-choice reuse, and tests.
3. **Tags live suggestions**
   Implement `tag:` suggestions, including empty initial suggestions and tests.
4. **Location live suggestions**
   Implement `country:` and `city:` suggestions, including country-scoped city lookup and tests.
5. **Polish and regression coverage**
   Cover keyboard navigation, mobile/dropdown parity, timeout/error states, stale response guards, final Enter behavior, and docs updates.

Each implementation plan must be TDD-first. Every task should start by writing the smallest focused failing test for the behavior, running it and recording the expected failure, then adding only enough production code to pass. Do not batch production code ahead of tests for parser spans, live suggestion utility behavior, manager state, or UI interaction.

## Testing

Use TDD at the same boundaries as the typed-filter feature:

- Parser unit tests for token spans, caret-active token derivation, quoted values, and issue preservation.
- Live suggestion utility tests with mocked SDK calls for people, tags, countries, scoped cities, empty states, ambiguous matches, errors, and aborts.
- Manager tests for debounce, stale response guards, caret changes, canonical token rewrite, selected-choice clearing when a token changes, and final Enter integration.
- Component tests for the filter-match section, row labels, loading/empty/error states, and keyboard activation.
- Route-level tests confirming final submitted filters still serialize and hydrate into photos/spaces page filter state.
- One focused Playwright smoke test for the full user-facing path after unit/component coverage is green: open the palette, type a live-supported token, select a suggestion, submit, and assert the destination page receives the serialized filter.

Specific edge cases that must have coverage:

- Empty active `person:`, `tag:`, and `country:` show initial suggestions without draft issue rows.
- Empty active `city:` does not fetch until one character and blocks only on Enter.
- Repeated tokens with the same raw text keep separate selected choices by span.
- Editing a canonicalized token clears its resolved state.
- Cursor movement between two supported tokens switches the live section without changing the input.
- Caret outside a supported token clears the live section.
- Quoted values with spaces canonicalize without double-quoting.
- Unterminated quotes do not fire live requests and still block on Enter.
- IME composition does not fire live requests mid-composition.
- Request A resolving after request B does not overwrite B's rows.
- Closing the palette aborts live requests and prevents late state writes.
- `city:` with an existing `country:` token passes the canonical country to the city lookup.
- Global `city:` without `country:` does not auto-add a country on selection.
- Duplicate scalar live tokens such as `country:Germany country:France` remain commit-blocking.
- Filter-match rows do not appear in the normal People/Tags navigation sections.
- Selecting a live person/tag row applies a filter value and does not navigate to a person/tag page.

Baseline verification for this brainstorming worktree:

```bash
pnpm install --frozen-lockfile
pnpm --filter @immich/sdk build
pnpm --dir web exec vitest --run src/lib/utils/__tests__/space-search.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts
```

The focused baseline tests passed before this spec was written.
