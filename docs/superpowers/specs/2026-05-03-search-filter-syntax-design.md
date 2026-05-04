# Typed Search Filters Design

Status: approved for implementation planning
Date: 2026-05-03
Worktree: `/home/pierre/dev/gallery/.worktrees/brainstorm-search-filter-syntax`
Branch: `brainstorm/search-filter-syntax`

## Problem

Gallery has a capable search and filter stack, but adding filters currently requires leaving the keyboard flow and using the filter panel. Power users should be able to include filters directly in the search bar, for example:

```text
beach person:anna from:2025 to:2026 camera:nikon
```

The typed syntax should be a shortcut over the existing filter model, not a replacement for the filter panel.

## Goals

- Let users type existing search filters in the global search bar.
- Preserve plain search text as the smart-search query.
- Apply typed filters only when the user commits with Enter.
- Keep live global-search results cheap by not resolving or applying typed filters while typing.
- Use the current searchable context when possible: `/photos` stays on photos, `/spaces/:id` stays in that space, and other pages fall back to `/photos`.
- Serialize committed filters into the URL so refresh, share links, browser history, active filter chips, and the filter panel stay aligned.
- Block submission when any typed filter is invalid, ambiguous, or unresolved.

## Non-Goals

- Do not build a full token editor in the first version.
- Do not support boolean logic, grouping, negation, or arbitrary search expressions in the first version.
- Do not silently drop failed filters and submit the remaining query.
- Do not replace the existing filter panel or active filter chip UI.

## User Experience

The search input becomes a quiet command-token rail. Recognized completed `key:value` filters render as compact inline tokens inside the search field wrapper, while non-filter words remain normal editable query text.

Tokens should use restrained visuals that match the existing command palette:

- `recognized`: syntactically valid scalar filters such as `from:2025`, `rating:4`, or `type:video`.
- `pending entity`: syntactically valid entity filters such as `person:anna` or `tag:vacation` before Enter resolution.
- `resolved entity`: an entity token that has been disambiguated in the current palette session.
- `error`: a token that failed validation or resolution after Enter.

The token display should not become a separate visual system. Prefer compact key/value styling such as `person Anna` and `from 2025`, with subtle border/background treatment and existing primary/error colors. Do not add a separate "will apply filters" preview row when inline tokens are visible.

Keyboard behavior stays simple:

- Backspace edits the raw input normally.
- Arrow keys continue to navigate the command palette.
- Enter commits the search when all tokens are valid.
- Enter resolves the active ambiguity when a resolution row is selected.
- Failed tokens keep the palette open and show issue rows below the input.

## Syntax

The first version supports existing filter concepts only:

- `person:<name>`: resolves to one person ID; repeated tokens accumulate multiple people.
- `tag:<name>`: resolves to one tag ID; repeated tokens accumulate multiple tags.
- `from:<date>`: maps to `dateAfter`.
- `to:<date>`: maps to `dateBefore`.
- `city:<value>`: maps to `city`.
- `country:<value>`: maps to `country`.
- `camera:<value>`: resolves through camera make/model suggestions.
- `type:<photo|image|video>`: maps to `mediaType`; `photo` is an alias for `image`.
- `favorite:<true|false|yes|no>`: maps to `isFavorite`.
- `rating:<1-5>`: maps to `rating`.

Plain words outside recognized filter tokens become the search query. For example:

```text
beach person:anna from:2025
```

commits query `beach` plus person/date filters.

Quoted values are part of v1 so names and places with spaces work:

```text
person:"Anna Maria" city:"New York"
```

Quoted values must support spaces. Escaped quotes inside values are not part of v1. Unterminated quotes should remain editable while typing and become invalid tokens on Enter.

Unknown alphabetic `key:value` tokens should become invalid tokens and block submission with a useful issue row. This keeps typos such as `persn:anna` visible instead of silently treating them as query text.

Empty values are invalid for every typed filter. While the user is still typing, incomplete tokens such as `person:` may render as pending input; on Enter they block submission.

Duplicate and conflicting filters should be deterministic:

- `person:` and `tag:` may appear multiple times and should accumulate resolved IDs.
- Repeating scalar filters such as `from:`, `to:`, `city:`, `country:`, `camera:`, `type:`, `favorite:`, and `rating:` should block submission instead of silently choosing one value.
- `from:` later than `to:` should block submission.
- `camera:` may set either `make` or `model`; if separate `make` or `model` URL params already exist, typed camera filters should replace only the field they resolve to during commit.

## Date Semantics

Date tokens should accept:

- `YYYY`
- `YYYY-MM`
- `YYYY-MM-DD`

`from:` should map to the start of the supplied period:

- `from:2025` -> `2025-01-01`
- `from:2025-06` -> `2025-06-01`
- `from:2025-06-14` -> `2025-06-14`

`to:` should map to the end of the supplied period as an inclusive date stored in `FilterState.dateBefore`:

- `to:2026` -> `2026-12-31`
- `to:2026-03` -> `2026-03-31`
- `to:2026-03-10` -> `2026-03-10`

This matches the existing `buildFilterContext()` behavior, which turns `dateBefore` into an exclusive UTC end internally.

## Commit And Resolution

Typed filters are all-or-nothing on Enter.

Commit flow:

1. Parse the raw input into query text, scalar tokens, entity tokens, and invalid tokens.
2. Validate scalar filters locally.
3. Resolve suggestion-backed tokens (`person:`, `tag:`, and `camera:`) in the current context.
4. If any token fails, keep the palette open and mark the token.
5. If every token succeeds, build a destination URL with `q`, `sort`, and serialized filters.
6. Navigate to the context-aware destination.
7. Destination pages hydrate their local `FilterState` from the URL and run existing result/facet logic.

Resolution behavior:

- A single strong entity match can be applied automatically.
- Multiple plausible matches block submission and show selectable rows.
- No match blocks submission and marks the token as unresolved.
- Selecting an ambiguity row resolves that token. If no other issues remain, the user may press Enter again to submit.

## Architecture

### `typed-search-parser`

A pure utility that accepts raw input and returns:

- `queryText`
- recognized scalar tokens
- pending entity tokens
- invalid tokens
- display tokens for the inline rail

This module should have no network or Svelte dependencies.

### `typed-search-resolver`

Runs only on Enter. It resolves entity and suggestion-backed tokens and produces either:

- a `FilterState` patch that can be serialized into the destination URL, or
- blocking issues for unresolved, ambiguous, or invalid tokens.

For `/spaces/:id`, person resolution should prefer space-scoped people/facets where available. For `/photos`, it should resolve globally. Tags and cameras should follow the same contextual pattern where the API supports it.

### `searchable-page-search`

Extend the existing URL helpers so typed filters can be serialized alongside `q` and `sort`.

The current helper already preserves the searchable base path for photos and spaces. The new behavior should add filter params while keeping this context-aware routing.

### Destination Pages

`/photos` and `/spaces/:id` should hydrate URL filter params into local `FilterState` on initial load and relevant client-side URL changes.

The existing search flow should then remain responsible for:

- smart-search result fetching
- metadata/timeline filter options
- smart facet loading
- active filter chip rendering
- filter panel state

When URL hydration includes person or tag IDs, destination pages must populate `personNames` and `tagNames` maps from resolver output when navigating from the palette, or from filter suggestions/facets after refresh. Active filter chips may temporarily fall back to IDs only while names are loading.

## URL Serialization

Use explicit, readable query params for filters rather than encoding the full filter state as JSON. Use these names unless implementation discovers a concrete collision with existing routes:

- `people=<id>,<id>`
- `tags=<id>,<id>`
- `city=<value>`
- `country=<value>`
- `make=<value>`
- `model=<value>`
- `type=image|video`
- `favorite=true|false`
- `rating=1..5`
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`

The URL layer should preserve existing unrelated params where the current helper already does so, and clearing filters should remove only filter params plus any query params explicitly cleared by the user action.

## Camera Matching

`camera:<value>` is a convenience alias over the existing camera filter. It should resolve to the most appropriate existing camera field:

- If the value clearly matches a make, set `make`.
- If it clearly matches a model, set `model`.
- If it is ambiguous between make and model, block commit and show choices.

The first implementation should match against current camera suggestions. It should not invent camera values that the current filter UI could not apply.

## Error Handling

Typed-filter commit errors are separate from provider/search errors.

Invalid scalar examples:

- `from:soon`
- `to:2026-99-01`
- `rating:seven`
- `rating:9`
- `type:gif`
- `favorite:maybe`

Entity examples:

- `person:anna` with no matches -> unresolved token, no navigation.
- `person:anna` with multiple matches -> ambiguity rows, no navigation.
- `tag:vacation` with no matches -> unresolved token, no navigation.

The issue rows should be concise and actionable. The user should be able to edit the original text and retry without losing input.

## TDD Requirements

Implementation should use red-green-refactor for every behavior change. No production code should be added for a parser, resolver, URL helper, or component behavior until a focused test for that behavior has been written and observed failing for the expected reason.

Recommended order:

1. Add parser tests first, run them, and confirm they fail because `typed-search-parser` does not exist or lacks the behavior.
2. Implement the smallest parser slice that makes those tests pass.
3. Add URL serialization/hydration tests and confirm they fail before changing `searchable-page-search` or route state.
4. Implement the smallest URL/state slice that makes those tests pass.
5. Add resolver tests with mocked SDK calls and confirm the desired failure before adding resolver behavior.
6. Implement the smallest resolver slice that makes those tests pass.
7. Add component/manager tests for token rendering, Enter commit, blocking issues, ambiguity selection, and navigation.
8. Implement UI and manager integration only after those tests fail correctly.

Focused verification commands should use direct vitest invocation so arguments do not expand into the full web suite:

```bash
pnpm --filter @immich/sdk build
pnpm --dir web exec vitest --run <focused-spec-file>
```

The broader web suite should be run only after the SDK workspace package has been built and focused tests are green.

## Testing

Parser tests:

- plain query extraction
- recognized filters
- quoted values
- unterminated quotes
- escaped quote sequences rejected as invalid input
- malformed tokens
- unknown keys
- duplicate filters
- empty values
- repeated `person:` and `tag:` accumulation
- repeated scalar filter rejection
- date validation
- date range ordering where `from:` is after `to:`
- `YYYY`, `YYYY-MM`, and `YYYY-MM-DD` expansion
- rating validation
- type/favorite validation
- `type:photo` aliasing to `image`
- case normalization for keys and boolean/media values
- preserving colon-containing plain text that is not an alphabetic `key:value` filter

Resolver tests:

- no entity match
- single strong entity match
- ambiguous entity matches
- repeated people/tags
- space-scoped resolution
- camera make match
- camera model match
- ambiguous camera make/model match
- no camera match
- resolver output includes display names for hydrated person/tag chips
- abort/error handling

URL/state tests:

- serialize filters into `/photos`
- serialize filters into `/spaces/:id`
- hydrate URL params into `FilterState`
- preserve query and sort
- preserve unrelated URL params that the current helper preserves
- remove only typed filter params when clearing filters
- invalid URL params fall back safely without crashing
- `type=photo` is not emitted; `type=image` is emitted
- multiple people/tags round-trip through URL encoding
- clear typed filters correctly
- keep active filter chips in sync with hydrated state

Component tests:

- inline token rendering
- no resolver calls while typing
- Enter blocked on invalid tokens
- issue rows for unresolved tokens
- ambiguity rows and selection
- no navigation on invalid, unresolved, ambiguous, or resolver-error commits
- successful `/photos` navigation
- successful `/spaces/:id` and `/spaces/:id/photos` navigation
- fallback `/photos` navigation from non-searchable pages
- raw input remains editable after a failed commit
- resolved entity token state resets when the raw token text changes
- successful context-aware navigation

## Implementation Notes

- Keep parser and URL helpers independent from Svelte components.
- Avoid introducing a second filter state model. Typed search should produce the same `FilterState` shape the existing filter panel uses.
- Do not fetch entity suggestions on every keystroke in v1.
- Use the current global-search manager activation path as the commit integration point.
- The initial worktree baseline test attempt failed because the web test invocation expanded into the broader suite and many files failed to resolve `@immich/sdk`. Implementation planning should include a focused verification command that first ensures workspace SDK packages are available.
