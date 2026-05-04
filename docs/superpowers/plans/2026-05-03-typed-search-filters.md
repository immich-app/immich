# Typed Search Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typed filter syntax to the global search bar so users can commit searches such as `beach person:anna from:2025 type:photo` into context-aware `/photos` or `/spaces/:id` results.

**Architecture:** Keep the feature split into pure parser, URL serialization, resolver, and UI integration units. Parsing and token display happen while typing with no network calls; resolving people, tags, and cameras happens only on Enter. Destination pages hydrate the same `FilterState` used by the existing filter panel.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, existing `@immich/sdk`, existing `FilterState`, existing global search manager and command palette.

---

## File Structure

- Create: `web/src/lib/utils/typed-search/typed-search-parser.ts`
  - Owns raw string tokenization, scalar validation, query extraction, display token metadata, duplicate detection, date expansion, and syntax issues.
- Create: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
  - Unit tests for parser behavior. No SDK or Svelte dependencies.
- Create: `web/src/lib/utils/typed-search/typed-search-resolver.ts`
  - Owns Enter-only resolution of `person:`, `tag:`, and `camera:` tokens into a `FilterState` patch and display-name maps.
- Create: `web/src/lib/utils/typed-search/typed-search-resolver.spec.ts`
  - Unit tests with mocked `@immich/sdk` calls for resolution success, ambiguity, missing matches, and SDK errors.
- Create: `web/src/lib/utils/typed-search/typed-search-name-cache.ts`
  - Stores resolver-provided person/tag display names in `sessionStorage` by destination URL so active chips can show labels immediately after palette navigation.
- Create: `web/src/lib/utils/typed-search/typed-search-name-cache.spec.ts`
  - Unit tests for storing, reading, one-shot consumption, and malformed storage data.
- Create: `web/src/lib/components/global-search/typed-search-token-rail.svelte`
  - Renders the quiet inline token rail behind/around the command input while preserving normal text input behavior.
- Create: `web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts`
  - Component tests for token states and accessible labels.
- Modify: `web/src/lib/utils/searchable-page-search.ts`
  - Extends existing helpers with typed filter serialization and hydration.
- Create: `web/src/lib/utils/__tests__/searchable-page-search.spec.ts`
  - Adds URL round-trip tests for existing searchable-page behavior and typed filters.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Adds typed-search parse state, commit issues, ambiguity state, and `activateSearch()` commit path.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Adds manager tests for Enter commit, all-or-nothing blocking, resolver errors, live-provider plain-query payloads, context-aware destinations, and recents.
- Modify: `web/src/lib/components/global-search/global-search.svelte`
  - Renders token rail, issue rows, ambiguity rows, and routes Enter through typed-search commit.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Adds integration tests for no resolver calls while typing, token rendering, failed commit behavior, ambiguity selection, and successful navigation.
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
  - Hydrates typed filter URL params into local `FilterState`; clears typed filter params with search/filter clear actions.
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
  - Adds photos page URL hydration and clear-filter URL sync tests.
- Create: `web/src/test-data/mocks/active-filters-bar-actions.stub.svelte`
  - Exposes active-filter clear/remove callbacks for destination page route tests.
- Modify: `web/src/test-data/mocks/smart-search-results.stub.svelte`
  - Exposes filter fields as data attributes for route hydration assertions.
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  - Hydrates typed filter URL params into local `FilterState`; clears typed filter params with search/filter clear actions.
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`
  - Adds space page URL hydration and active-filter URL sync tests.

## Common Types And APIs

Use these exported shapes so tasks stay consistent:

```ts
export type TypedSearchFilterKey =
  | 'person'
  | 'tag'
  | 'from'
  | 'to'
  | 'city'
  | 'country'
  | 'camera'
  | 'type'
  | 'favorite'
  | 'rating';

export type TypedSearchResolutionKey = 'person' | 'tag' | 'camera';
export type TypedSearchIssueCode =
  | 'unknown-key'
  | 'empty-value'
  | 'invalid-date'
  | 'invalid-range'
  | 'invalid-rating'
  | 'invalid-type'
  | 'invalid-favorite'
  | 'duplicate-filter'
  | 'unterminated-quote'
  | 'escaped-quote'
  | 'no-match'
  | 'ambiguous'
  | 'resolver-error';

export type TypedSearchIssue = {
  code: TypedSearchIssueCode;
  message: string;
  raw: string;
  key?: string;
  value?: string;
};

export type TypedSearchScalarToken = {
  kind: 'scalar';
  key: Exclude<TypedSearchFilterKey, TypedSearchResolutionKey>;
  raw: string;
  value: string;
  normalizedValue: string | number | boolean;
};

export type TypedSearchResolutionToken = {
  kind: 'resolution';
  key: TypedSearchResolutionKey;
  raw: string;
  value: string;
};

export type TypedSearchDisplayToken = {
  raw: string;
  key: string;
  value: string;
  status: 'recognized' | 'pending-entity' | 'resolved-entity' | 'error';
  issue?: TypedSearchIssue;
};

export type TypedSearchParseResult = {
  raw: string;
  queryText: string;
  scalarTokens: TypedSearchScalarToken[];
  resolutionTokens: TypedSearchResolutionToken[];
  displayTokens: TypedSearchDisplayToken[];
  issues: TypedSearchIssue[];
};
```

---

### Task 0: Baseline Verification

**Files:**

- Read: `open-api/typescript-sdk/package.json`
- Read: `web/vite.config.ts`
- No production edits

- [ ] **Step 1: Build the workspace SDK package**

Run:

```bash
pnpm --filter @immich/sdk build
```

Expected: exit 0 and `open-api/typescript-sdk/build/index.js` exists.

- [ ] **Step 2: Run existing focused smoke tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/space-search.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts
```

Expected: existing tests pass. If unrelated existing tests fail, record the failure and continue only after confirming the failure exists before feature edits.

- [ ] **Step 3: Commit baseline note if a repo-local workaround was required**

If no files changed, do not commit. If a repo-local generated artifact had to be created and tracked, stop and ask before committing generated output.

---

### Task 1: Parser TDD

**Files:**

- Create: `web/src/lib/utils/typed-search/typed-search-parser.ts`
- Create: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`

- [ ] **Step 1: Write failing parser tests**

Create `web/src/lib/utils/typed-search/typed-search-parser.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { parseTypedSearch } from './typed-search-parser';

describe('parseTypedSearch', () => {
  it('extracts plain query text and recognized filters', () => {
    const result = parseTypedSearch('beach person:anna from:2025 to:2026 camera:nikon type:photo');

    expect(result.queryText).toBe('beach');
    expect(result.resolutionTokens).toEqual([
      { kind: 'resolution', key: 'person', raw: 'person:anna', value: 'anna' },
      { kind: 'resolution', key: 'camera', raw: 'camera:nikon', value: 'nikon' },
    ]);
    expect(result.scalarTokens).toMatchObject([
      { kind: 'scalar', key: 'from', raw: 'from:2025', value: '2025', normalizedValue: '2025-01-01' },
      { kind: 'scalar', key: 'to', raw: 'to:2026', value: '2026', normalizedValue: '2026-12-31' },
      { kind: 'scalar', key: 'type', raw: 'type:photo', value: 'photo', normalizedValue: 'image' },
    ]);
    expect(result.issues).toEqual([]);
  });

  it('supports quoted values with spaces', () => {
    const result = parseTypedSearch('beach person:"Anna Maria" city:"New York"');

    expect(result.queryText).toBe('beach');
    expect(result.resolutionTokens).toEqual([
      { kind: 'resolution', key: 'person', raw: 'person:"Anna Maria"', value: 'Anna Maria' },
    ]);
    expect(result.scalarTokens).toMatchObject([
      { kind: 'scalar', key: 'city', raw: 'city:"New York"', value: 'New York', normalizedValue: 'New York' },
    ]);
  });

  it('rejects unknown alphabetic key value tokens', () => {
    const result = parseTypedSearch('beach persn:anna');

    expect(result.queryText).toBe('beach');
    expect(result.issues).toEqual([
      {
        code: 'unknown-key',
        key: 'persn',
        raw: 'persn:anna',
        value: 'anna',
        message: 'Unknown filter "persn"',
      },
    ]);
  });

  it('keeps non-filter colon text in the query', () => {
    const result = parseTypedSearch('IMG_1234.jpg ratio:3:2 http://example.test');

    expect(result.queryText).toBe('IMG_1234.jpg http://example.test');
    expect(result.issues).toEqual([
      {
        code: 'unknown-key',
        key: 'ratio',
        raw: 'ratio:3:2',
        value: '3:2',
        message: 'Unknown filter "ratio"',
      },
    ]);
  });

  it('rejects invalid scalar values', () => {
    const result = parseTypedSearch('from:soon to:2026-99-01 rating:9 type:gif favorite:maybe');

    expect(result.issues.map((issue) => issue.code)).toEqual([
      'invalid-date',
      'invalid-date',
      'invalid-rating',
      'invalid-type',
      'invalid-favorite',
    ]);
  });

  it('rejects empty values and unterminated quotes on commit parse', () => {
    const result = parseTypedSearch('person: city:"New York');

    expect(result.issues.map((issue) => issue.code)).toEqual(['empty-value', 'unterminated-quote']);
  });

  it('rejects escaped quote sequences in quoted values', () => {
    const result = parseTypedSearch('person:"Anna \\"The Ace\\""');

    expect(result.issues).toEqual([
      {
        code: 'escaped-quote',
        key: 'person',
        raw: 'person:"Anna \\"The Ace\\""',
        value: 'Anna \\"The Ace\\"',
        message: 'Escaped quotes are not supported in filters',
      },
    ]);
  });

  it('rejects duplicate scalar filters but allows repeated people and tags', () => {
    const result = parseTypedSearch('person:anna person:bob tag:travel tag:family city:Berlin city:Paris');

    expect(result.resolutionTokens.map((token) => token.raw)).toEqual([
      'person:anna',
      'person:bob',
      'tag:travel',
      'tag:family',
    ]);
    expect(result.issues).toEqual([
      {
        code: 'duplicate-filter',
        key: 'city',
        raw: 'city:Paris',
        value: 'Paris',
        message: 'Filter "city" can only be used once',
      },
    ]);
  });

  it('rejects a date range where from is after to', () => {
    const result = parseTypedSearch('from:2026 to:2025');

    expect(result.issues).toEqual([
      {
        code: 'invalid-range',
        key: 'from',
        raw: 'from:2026',
        value: '2026',
        message: 'Start date must be before end date',
      },
    ]);
  });

  it('normalizes keys and boolean or media values case-insensitively', () => {
    const result = parseTypedSearch('TYPE:Photo FAVORITE:Yes rating:4');

    expect(result.scalarTokens).toMatchObject([
      { key: 'type', normalizedValue: 'image' },
      { key: 'favorite', normalizedValue: true },
      { key: 'rating', normalizedValue: 4 },
    ]);
    expect(result.issues).toEqual([]);
  });
});
```

- [ ] **Step 2: Run parser tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: FAIL because `./typed-search-parser` does not exist.

- [ ] **Step 3: Implement parser types and behavior**

Create `web/src/lib/utils/typed-search/typed-search-parser.ts` with the common types from this plan and:

```ts
const FILTER_KEYS = new Set<TypedSearchFilterKey>([
  'person',
  'tag',
  'from',
  'to',
  'city',
  'country',
  'camera',
  'type',
  'favorite',
  'rating',
]);

const RESOLUTION_KEYS = new Set<TypedSearchResolutionKey>(['person', 'tag', 'camera']);
const REPEATABLE_KEYS = new Set<TypedSearchFilterKey>(['person', 'tag']);

export function parseTypedSearch(raw: string): TypedSearchParseResult {
  const pieces = splitSearch(raw);
  const queryParts: string[] = [];
  const scalarTokens: TypedSearchScalarToken[] = [];
  const resolutionTokens: TypedSearchResolutionToken[] = [];
  const displayTokens: TypedSearchDisplayToken[] = [];
  const issues: TypedSearchIssue[] = [];
  const seenScalarKeys = new Set<string>();

  for (const piece of pieces) {
    if (!piece.key) {
      queryParts.push(piece.raw);
      continue;
    }

    const key = piece.key.toLowerCase() as TypedSearchFilterKey;
    if (!FILTER_KEYS.has(key)) {
      const issue = makeIssue('unknown-key', piece.raw, `Unknown filter "${piece.key}"`, piece.key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key: piece.key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (piece.issue) {
      const issue = makeIssue(piece.issue, piece.raw, issueMessage(piece.issue, key), key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!piece.value.trim()) {
      const issue = makeIssue('empty-value', piece.raw, `Filter "${key}" needs a value`, key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (!REPEATABLE_KEYS.has(key) && seenScalarKeys.has(key)) {
      const issue = makeIssue('duplicate-filter', piece.raw, `Filter "${key}" can only be used once`, key, piece.value);
      issues.push(issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue });
      continue;
    }

    if (RESOLUTION_KEYS.has(key as TypedSearchResolutionKey)) {
      resolutionTokens.push({
        kind: 'resolution',
        key: key as TypedSearchResolutionKey,
        raw: piece.raw,
        value: piece.value,
      });
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'pending-entity' });
      continue;
    }

    seenScalarKeys.add(key);
    const scalar = normalizeScalarToken(key, piece.raw, piece.value);
    if ('issue' in scalar) {
      issues.push(scalar.issue);
      displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'error', issue: scalar.issue });
      continue;
    }
    scalarTokens.push(scalar.token);
    displayTokens.push({ raw: piece.raw, key, value: piece.value, status: 'recognized' });
  }

  const rangeIssue = validateDateRange(scalarTokens);
  if (rangeIssue) {
    issues.push(rangeIssue);
    const token = displayTokens.find((item) => item.key === 'from');
    if (token) {
      token.status = 'error';
      token.issue = rangeIssue;
    }
  }

  return {
    raw,
    queryText: queryParts.join(' ').trim().replace(/\s+/g, ' '),
    scalarTokens,
    resolutionTokens,
    displayTokens,
    issues,
  };
}
```

Implement helper functions in the same file:

- `splitSearch(raw)` scans whitespace-delimited pieces while preserving quoted values.
- `splitSearch(raw)` must leave URL-like strings containing `://` as plain query text instead of treating `http:` as an unknown filter.
- `normalizeScalarToken(key, raw, value)` validates `from`, `to`, `city`, `country`, `type`, `favorite`, and `rating`.
- `expandDate(value, boundary)` accepts `YYYY`, `YYYY-MM`, and `YYYY-MM-DD`.
- `validateDateRange(tokens)` compares normalized `from` and `to`.
- `makeIssue(code, raw, message, key, value)` creates `TypedSearchIssue`.

- [ ] **Step 4: Run parser tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit parser slice**

Run:

```bash
git add web/src/lib/utils/typed-search/typed-search-parser.ts web/src/lib/utils/typed-search/typed-search-parser.spec.ts
git commit -m "feat(web): add typed search parser"
```

---

### Task 2: URL Serialization And Hydration TDD

**Files:**

- Modify: `web/src/lib/utils/searchable-page-search.ts`
- Create: `web/src/lib/utils/__tests__/searchable-page-search.spec.ts`
- Create: `web/src/lib/utils/typed-search/typed-search-name-cache.ts`
- Create: `web/src/lib/utils/typed-search/typed-search-name-cache.spec.ts`

- [ ] **Step 1: Write failing URL tests**

Create `web/src/lib/utils/__tests__/searchable-page-search.spec.ts`:

```ts
import { createFilterState } from '$lib/components/filter-panel/filter-panel';
import {
  buildSearchablePageUrl,
  clearSearchablePageFilterParams,
  getSearchablePageState,
  getSearchablePageFilterState,
} from '$lib/utils/searchable-page-search';

describe('searchable page URL state', () => {
  it('detects photos as a searchable page', () => {
    const state = getSearchablePageState(new URL('https://gallery.test/photos?q=beach'));

    expect(state).toMatchObject({
      basePath: '/photos',
      isSearchable: true,
      query: 'beach',
      sortOrder: 'relevance',
    });
  });

  it('detects spaces and space photos as searchable pages', () => {
    expect(getSearchablePageState(new URL('https://gallery.test/spaces/space-1')).basePath).toBe('/spaces/space-1');
    expect(getSearchablePageState(new URL('https://gallery.test/spaces/space-1/photos')).basePath).toBe(
      '/spaces/space-1/photos',
    );
  });

  it('builds the existing query-only URL without filters', () => {
    const url = new URL('https://gallery.test/photos?view=timeline');

    expect(buildSearchablePageUrl(url, 'beach')).toBe('/photos?view=timeline&q=beach');
  });

  it('preserves existing typed filter params when no replacement filter state is supplied', () => {
    const url = new URL('https://gallery.test/photos?q=beach&people=person-1&city=Berlin&view=timeline');

    expect(buildSearchablePageUrl(url, 'sunset', 'asc')).toBe(
      '/photos?q=sunset&people=person-1&city=Berlin&view=timeline&sort=asc',
    );
  });
});

describe('typed filter URL state', () => {
  it('serializes typed filters into photos URLs while preserving query and sort', () => {
    const url = new URL('https://gallery.test/photos?view=timeline');
    const filters = {
      ...createFilterState(),
      personIds: ['person-1', 'person-2'],
      tagIds: ['tag-1'],
      city: 'Berlin',
      country: 'Germany',
      make: 'Nikon',
      model: 'Z8',
      mediaType: 'image' as const,
      isFavorite: true,
      rating: 4,
      dateAfter: '2025-01-01',
      dateBefore: '2026-12-31',
      sortOrder: 'asc' as const,
    };

    const result = buildSearchablePageUrl(url, 'beach', 'asc', filters);

    expect(result).toBe(
      '/photos?view=timeline&q=beach&sort=asc&people=person-1%2Cperson-2&tags=tag-1&city=Berlin&country=Germany&make=Nikon&model=Z8&type=image&favorite=true&rating=4&from=2025-01-01&to=2026-12-31',
    );
  });

  it('serializes typed filters into space URLs', () => {
    const url = new URL('https://gallery.test/spaces/space-1/photos?panel=closed');
    const filters = {
      ...createFilterState(),
      city: 'Berlin',
      mediaType: 'video' as const,
      sortOrder: 'relevance' as const,
    };

    const result = buildSearchablePageUrl(url, 'beach', 'relevance', filters);

    expect(result).toBe('/spaces/space-1/photos?panel=closed&q=beach&city=Berlin&type=video');
  });

  it('hydrates typed filter params into FilterState', () => {
    const url = new URL(
      'https://gallery.test/photos?q=beach&people=person-1%2Cperson-2&tags=tag-1&type=video&favorite=false&rating=5&from=2025-01-01&to=2026-12-31',
    );

    expect(getSearchablePageFilterState(url)).toEqual({
      personIds: ['person-1', 'person-2'],
      tagIds: ['tag-1'],
      mediaType: 'video',
      isFavorite: false,
      rating: 5,
      dateAfter: '2025-01-01',
      dateBefore: '2026-12-31',
    });
  });

  it('drops invalid typed filter URL params without crashing', () => {
    const url = new URL('https://gallery.test/photos?type=gif&favorite=maybe&rating=9&from=soon&to=2026-99-01');

    expect(getSearchablePageFilterState(url)).toEqual({});
  });

  it('clears only typed filter params', () => {
    const params = new URLSearchParams('q=beach&sort=desc&people=p1&city=Berlin&view=timeline');

    clearSearchablePageFilterParams(params);

    expect(params.toString()).toBe('q=beach&sort=desc&view=timeline');
  });
});
```

Create `web/src/lib/utils/typed-search/typed-search-name-cache.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { consumeTypedSearchNames, storeTypedSearchNames } from './typed-search-name-cache';

describe('typed search name cache', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores and consumes names by destination URL', () => {
    storeTypedSearchNames('/photos?q=beach&people=person-1', {
      personNames: new Map([['person-1', 'Anna']]),
      tagNames: new Map([['tag-1', 'Travel']]),
    });

    const result = consumeTypedSearchNames('/photos?q=beach&people=person-1');

    expect(result.personNames).toEqual(new Map([['person-1', 'Anna']]));
    expect(result.tagNames).toEqual(new Map([['tag-1', 'Travel']]));
    expect(consumeTypedSearchNames('/photos?q=beach&people=person-1')).toEqual({
      personNames: new Map(),
      tagNames: new Map(),
    });
  });

  it('ignores malformed storage data', () => {
    sessionStorage.setItem('typed-search:names:/photos', '{not-json');

    expect(consumeTypedSearchNames('/photos')).toEqual({
      personNames: new Map(),
      tagNames: new Map(),
    });
  });
});
```

- [ ] **Step 2: Run URL tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/searchable-page-search.spec.ts src/lib/utils/typed-search/typed-search-name-cache.spec.ts
```

Expected: FAIL because `clearSearchablePageFilterParams`, `getSearchablePageFilterState`, and typed-search name cache helpers are missing and `buildSearchablePageUrl` does not accept filters.

- [ ] **Step 3: Implement URL helpers**

Modify `web/src/lib/utils/searchable-page-search.ts`:

```ts
import type { FilterState } from '$lib/components/filter-panel/filter-panel';

export const SEARCHABLE_PAGE_FILTER_PARAMS = [
  'people',
  'tags',
  'city',
  'country',
  'make',
  'model',
  'type',
  'favorite',
  'rating',
  'from',
  'to',
] as const;

export type SearchablePageFilterState = Partial<
  Pick<
    FilterState,
    | 'personIds'
    | 'tagIds'
    | 'city'
    | 'country'
    | 'make'
    | 'model'
    | 'mediaType'
    | 'isFavorite'
    | 'rating'
    | 'dateAfter'
    | 'dateBefore'
  >
>;
```

Add helpers:

```ts
export function clearSearchablePageFilterParams(params: URLSearchParams) {
  for (const key of SEARCHABLE_PAGE_FILTER_PARAMS) {
    params.delete(key);
  }
}

export function getSearchablePageFilterState(url: URL): SearchablePageFilterState {
  const result: SearchablePageFilterState = {};
  const people = splitListParam(url.searchParams.get('people'));
  const tags = splitListParam(url.searchParams.get('tags'));
  const rating = parseRating(url.searchParams.get('rating'));
  const type = parseMediaType(url.searchParams.get('type'));
  const favorite = parseFavorite(url.searchParams.get('favorite'));
  const from = parseDateParam(url.searchParams.get('from'));
  const to = parseDateParam(url.searchParams.get('to'));

  if (people.length > 0) result.personIds = people;
  if (tags.length > 0) result.tagIds = tags;
  if (url.searchParams.get('city')) result.city = url.searchParams.get('city') ?? undefined;
  if (url.searchParams.get('country')) result.country = url.searchParams.get('country') ?? undefined;
  if (url.searchParams.get('make')) result.make = url.searchParams.get('make') ?? undefined;
  if (url.searchParams.get('model')) result.model = url.searchParams.get('model') ?? undefined;
  if (type) result.mediaType = type;
  if (favorite !== undefined) result.isFavorite = favorite;
  if (rating !== undefined) result.rating = rating;
  if (from) result.dateAfter = from;
  if (to) result.dateBefore = to;
  return result;
}
```

Update `buildSearchablePageUrl` signature:

```ts
export function buildSearchablePageUrl(
  url: URL,
  query: string,
  sortOrder: SearchablePageSortOrder = 'relevance',
  filters?: FilterState,
): string | null;
```

Inside it, after query/sort handling:

```ts
if (filters !== undefined) {
  clearSearchablePageFilterParams(params);
  appendSearchablePageFilterParams(params, filters);
}
```

Add `appendSearchablePageFilterParams`, `splitListParam`, `parseRating`, `parseMediaType`, `parseFavorite`, and `parseDateParam` in the same file.

Create `web/src/lib/utils/typed-search/typed-search-name-cache.ts`:

```ts
type StoredTypedSearchNames = {
  personNames: Array<[string, string]>;
  tagNames: Array<[string, string]>;
};

const prefix = 'typed-search:names:';

function emptyNames() {
  return {
    personNames: new Map<string, string>(),
    tagNames: new Map<string, string>(),
  };
}

export function storeTypedSearchNames(
  destination: string,
  names: { personNames: Map<string, string>; tagNames: Map<string, string> },
) {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  const payload: StoredTypedSearchNames = {
    personNames: [...names.personNames.entries()],
    tagNames: [...names.tagNames.entries()],
  };
  sessionStorage.setItem(`${prefix}${destination}`, JSON.stringify(payload));
}

export function consumeTypedSearchNames(destination: string) {
  if (typeof sessionStorage === 'undefined') {
    return emptyNames();
  }
  const key = `${prefix}${destination}`;
  const raw = sessionStorage.getItem(key);
  sessionStorage.removeItem(key);
  if (!raw) {
    return emptyNames();
  }
  try {
    const parsed = JSON.parse(raw) as StoredTypedSearchNames;
    return {
      personNames: new Map(parsed.personNames ?? []),
      tagNames: new Map(parsed.tagNames ?? []),
    };
  } catch {
    return emptyNames();
  }
}
```

- [ ] **Step 4: Run URL tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/__tests__/searchable-page-search.spec.ts src/lib/utils/typed-search/typed-search-name-cache.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit URL slice**

Run:

```bash
git add web/src/lib/utils/searchable-page-search.ts web/src/lib/utils/__tests__/searchable-page-search.spec.ts web/src/lib/utils/typed-search/typed-search-name-cache.ts web/src/lib/utils/typed-search/typed-search-name-cache.spec.ts
git commit -m "feat(web): serialize typed search filters in URLs"
```

---

### Task 3: Destination Page Hydration TDD

**Files:**

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
- Create: `web/src/test-data/mocks/active-filters-bar-actions.stub.svelte`
- Modify: `web/src/test-data/mocks/smart-search-results.stub.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`

- [ ] **Step 1: Extend the smart-search results test stub**

Modify the `<div>` in `web/src/test-data/mocks/smart-search-results.stub.svelte` so route tests can assert hydrated filters:

```svelte
<div
  {...rest}
  data-testid="smart-search-results"
  data-loading={String(isLoading)}
  data-search-query={searchQuery}
  data-sort-order={filters?.sortOrder ?? ''}
  data-is-favorite={String(filters?.isFavorite)}
  data-filter-favorite={String(filters?.isFavorite)}
  data-filter-person-ids={filters?.personIds.join(',') ?? ''}
  data-filter-tag-ids={filters?.tagIds.join(',') ?? ''}
  data-filter-media-type={filters?.mediaType ?? ''}
  data-filter-rating={filters?.rating ?? ''}
  data-filter-date-after={filters?.dateAfter ?? ''}
  data-filter-date-before={filters?.dateBefore ?? ''}
  data-filter-city={filters?.city ?? ''}
  data-filter-country={filters?.country ?? ''}
  data-filter-make={filters?.make ?? ''}
  data-filter-model={filters?.model ?? ''}
  data-with-shared-spaces={String(withSharedSpaces)}
  data-space-id={spaceId ?? ''}
  data-country={filters?.country ?? ''}
  data-language={language}
  data-total={total ?? ''}
></div>
```

Create `web/src/test-data/mocks/active-filters-bar-actions.stub.svelte` so route tests can exercise clear/remove callbacks:

```svelte
<script lang="ts">
  type Props = {
    searchQuery?: string;
    onClearSearch?: () => void;
    onClearAll?: () => void;
    onRemoveFilter?: (type: string, id?: string) => void;
  };

  let { searchQuery = '', onClearSearch, onClearAll, onRemoveFilter }: Props = $props();
</script>

<div data-testid="active-filters-bar-stub">
  <button type="button" data-testid="active-filters-clear-search" onclick={() => onClearSearch?.()}>Clear search</button>
  <button
    type="button"
    data-testid="active-filters-clear-all"
    onclick={() => {
      onClearAll?.();
      if (searchQuery) {
        onClearSearch?.();
      }
    }}
  >
    Clear all
  </button>
  <button type="button" data-testid="active-filters-remove-person" onclick={() => onRemoveFilter?.('person', 'person-1')}>
    Remove person
  </button>
</div>
```

- [ ] **Step 2: Write failing photos hydration test**

Append to `Photos page search URL state` in `photos-page.spec.ts`:

Add the mocked navigation import if it is not already present:

```ts
import { goto } from '$app/navigation';
```

Update the active filters bar mock in this spec to use the actionable stub:

```ts
vi.mock('$lib/components/filter-panel/active-filters-bar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/active-filters-bar-actions.stub.svelte');
  return { default: MockComponent };
});
```

```ts
it('hydrates typed filter URL params into the photos FilterState', () => {
  mockPage.url = new URL(
    'https://gallery.test/photos?q=beach&people=person-1&tags=tag-1&type=image&favorite=true&rating=4&from=2025-01-01&to=2025-12-31',
  );

  renderPage();

  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'beach');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-person-ids', 'person-1');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-tag-ids', 'tag-1');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-media-type', 'image');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-favorite', 'true');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-rating', '4');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-date-after', '2025-01-01');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-date-before', '2025-12-31');
});

it('clears only q when clearing the search chip', async () => {
  mockPage.url = new URL('https://gallery.test/photos?view=timeline&q=beach&people=person-1&city=Berlin');

  renderPage();
  await fireEvent.click(await screen.findByTestId('active-filters-clear-search'));

  expect(goto).toHaveBeenCalledWith('/photos?view=timeline&people=person-1&city=Berlin', {
    replaceState: true,
    keepFocus: true,
    noScroll: true,
  });
});

it('clears typed filter URL params and q when clearing all active filters', async () => {
  mockPage.url = new URL('https://gallery.test/photos?view=timeline&q=beach&people=person-1&city=Berlin');

  renderPage();
  await fireEvent.click(await screen.findByTestId('active-filters-clear-all'));

  expect(goto).toHaveBeenLastCalledWith('/photos?view=timeline', {
    replaceState: true,
    keepFocus: true,
    noScroll: true,
  });
});
```

- [ ] **Step 3: Write failing spaces hydration test**

Append to `spaces-page.spec.ts`:

Update the active filters bar mock in this spec to use the actionable stub:

```ts
vi.mock('$lib/components/filter-panel/active-filters-bar.svelte', async () => {
  const { default: MockComponent } = await import('@test-data/mocks/active-filters-bar-actions.stub.svelte');
  return { default: MockComponent };
});
```

```ts
it('hydrates typed filter URL params into the space FilterState', async () => {
  mockPage.url = new URL(
    'https://gallery.test/spaces/space-1/photos?q=beach&people=space-person-1&city=Berlin&type=video',
  );

  renderPage({ space: makeSpace(), members: [makeMember()] });

  expect(await screen.findByTestId('smart-search-results')).toHaveAttribute('data-search-query', 'beach');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-person-ids', 'space-person-1');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-city', 'Berlin');
  expect(screen.getByTestId('smart-search-results')).toHaveAttribute('data-filter-media-type', 'video');
});

it('removes only the selected typed filter from the space URL', async () => {
  mockPage.url = new URL('https://gallery.test/spaces/space-1/photos?q=beach&people=person-1&city=Berlin');

  renderPage({ space: makeSpace(), members: [makeMember()] });
  await fireEvent.click(await screen.findByTestId('active-filters-remove-person'));

  expect(gotoMock).toHaveBeenCalledWith('/spaces/space-1/photos?q=beach&city=Berlin', {
    replaceState: true,
    keepFocus: true,
    noScroll: true,
  });
});
```

- [ ] **Step 4: Run page tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: FAIL because route components ignore typed filter URL params and active filter callbacks do not sync typed filter params back to the URL, not because the test stubs lack assertion attributes.

- [ ] **Step 5: Implement photos hydration**

Modify imports in `photos +page.svelte`:

```ts
import {
  buildSearchablePageUrl,
  getSearchablePageFilterState,
  getSearchablePageState,
} from '$lib/utils/searchable-page-search';
import { consumeTypedSearchNames } from '$lib/utils/typed-search/typed-search-name-cache';
```

Initialize filters:

```ts
const initialSearchState = getSearchablePageState(page.url);
const initialFilterState = getSearchablePageFilterState(page.url);
let filters = $state<FilterState>({
  ...createFilterState(),
  ...initialFilterState,
  sortOrder: initialSearchState.sortOrder,
});
let lastHandledSearchState = $state(`${initialSearchState.query}:${initialSearchState.sortOrder}:${page.url.search}`);
```

Immediately after `personNames` and `tagNames` are initialized, consume cached names for the current route:

```ts
const initialTypedSearchNames = consumeTypedSearchNames(page.url.pathname + page.url.search);
for (const [id, name] of initialTypedSearchNames.personNames) {
  personNames.set(id, name);
}
for (const [id, name] of initialTypedSearchNames.tagNames) {
  tagNames.set(id, name);
}
```

Update the URL sync effect token and assignment:

```ts
const nextFilterState = getSearchablePageFilterState(page.url);
const nextToken = `${nextSearchState.query}:${nextSearchState.sortOrder}:${page.url.search}`;
filters = {
  ...createFilterState(),
  ...nextFilterState,
  sortOrder: nextSearchState.sortOrder,
};
```

Keep the existing smart facet reset when query changes, and also reset facets when filter URL params change.

Update `clearSearch()` so clearing the search chip preserves the current filter state instead of preserving stale filter params from `page.url`:

```ts
function clearSearch() {
  isLoading = false;
  const nextUrl = buildSearchablePageUrl(page.url, '', filters.sortOrder, filters);
  if (!nextUrl) {
    return;
  }
  void goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
}
```

Add a local URL sync helper and use it from active filter callbacks:

```ts
function syncFilterUrl(nextFilters: FilterState) {
  const nextUrl = buildSearchablePageUrl(page.url, committedQuery, nextFilters.sortOrder, nextFilters);
  if (!nextUrl) {
    return;
  }
  void goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
}
```

Update `onRemoveFilter` and `onClearAll`:

```svelte
onRemoveFilter={(type, id) => {
  const nextFilters = handlePhotosRemoveFilter(filters, type, id);
  filters = nextFilters;
  syncFilterUrl(nextFilters);
}}
onClearAll={() => {
  const nextFilters = clearFilters(filters);
  filters = nextFilters;
  if (!committedQuery.trim()) {
    syncFilterUrl(nextFilters);
  }
}}
```

- [ ] **Step 6: Implement spaces hydration**

Make the same import, initial state, active-filter URL sync, and URL-state sync changes in the spaces page. Use the spaces page's existing `committedSearchQuery` name where the photos page uses `committedQuery`.

Update `clearSearch()`, `handleRemoveFilter()`, and `onClearAll` with the same URL-sync rules:

```ts
function handleRemoveFilter(type: string, id?: string) {
  const nextFilters = handleSpaceRemoveFilter(filters, type, id);
  filters = nextFilters;
  syncFilterUrl(nextFilters);
}
```

When `onClearAll` runs and `committedSearchQuery.trim()` is non-empty, let the active filters bar's follow-up `onClearSearch` write the combined no-query/no-filter URL. If there is no query, call `syncFilterUrl(nextFilters)` immediately.

In the space-change effect, use:

```ts
const nextFilterState = getSearchablePageFilterState(page.url);
filters = {
  ...createFilterState(),
  ...nextFilterState,
  sortOrder: nextSearchState.sortOrder,
};
lastHandledSearchState = `${nextSearchState.query}:${nextSearchState.sortOrder}:${page.url.search}`;
```

Also consume cached typed-search names in the spaces page using the same `consumeTypedSearchNames(page.url.pathname + page.url.search)` pattern after `personNames` and `tagNames` are initialized.

- [ ] **Step 7: Run page tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: PASS.

- [ ] **Step 8: Commit route hydration slice**

Run:

```bash
git add 'web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' web/src/test-data/mocks/active-filters-bar-actions.stub.svelte web/src/test-data/mocks/smart-search-results.stub.svelte 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
git commit -m "feat(web): hydrate typed search filters from URLs"
```

---

### Task 4: Resolver TDD

**Files:**

- Create: `web/src/lib/utils/typed-search/typed-search-resolver.ts`
- Create: `web/src/lib/utils/typed-search/typed-search-resolver.spec.ts`

- [ ] **Step 1: Write failing resolver tests**

Create `typed-search-resolver.spec.ts`:

```ts
import { AssetTypeEnum, getFilterSuggestions, searchPerson } from '@immich/sdk';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseTypedSearch } from './typed-search-parser';
import { resolveTypedSearchFilters } from './typed-search-resolver';

vi.mock('@immich/sdk', async () => ({
  ...(await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk')),
  searchPerson: vi.fn(),
  getFilterSuggestions: vi.fn(),
}));

describe('resolveTypedSearchFilters', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      cameraModels: [],
      tags: [],
      ratings: [],
      mediaTypes: [AssetTypeEnum.Image, AssetTypeEnum.Video],
      hasUnnamedPeople: false,
    });
  });

  it('resolves a single person, tag, and camera make', async () => {
    vi.mocked(searchPerson).mockResolvedValue([{ id: 'person-1', name: 'Anna' } as never]);
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: ['Nikon'],
      cameraModels: [],
      tags: [{ id: 'tag-1', value: 'Travel' }],
      ratings: [4],
      mediaTypes: [AssetTypeEnum.Image],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('beach person:anna tag:travel camera:nikon'), {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.queryText).toBe('beach');
      expect(result.filters.personIds).toEqual(['person-1']);
      expect(result.filters.tagIds).toEqual(['tag-1']);
      expect(result.filters.make).toBe('Nikon');
      expect(result.personNames.get('person-1')).toBe('Anna');
      expect(result.tagNames.get('tag-1')).toBe('Travel');
    }
  });

  it('blocks when person resolution has no match', async () => {
    vi.mocked(searchPerson).mockResolvedValue([]);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'person', value: 'anna' });
    }
  });

  it('blocks when person resolution is ambiguous', async () => {
    vi.mocked(searchPerson).mockResolvedValue([
      { id: 'person-1', name: 'Anna' },
      { id: 'person-2', name: 'Anna Maria' },
    ] as never);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'person', value: 'anna' });
      expect(result.choices).toHaveLength(2);
    }
  });

  it('uses a selected ambiguity choice without calling SDK resolution again for that token', async () => {
    const selectedChoices = new Map([
      [
        'person:anna',
        { tokenRaw: 'person:anna', key: 'person' as const, id: 'person-2', label: 'Anna Maria', value: 'anna' },
      ],
    ]);

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), { selectedChoices });

    expect(searchPerson).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['person-2']);
      expect(result.personNames.get('person-2')).toBe('Anna Maria');
    }
  });

  it('accumulates repeated people and tags in input order', async () => {
    vi.mocked(searchPerson)
      .mockResolvedValueOnce([{ id: 'person-1', name: 'Anna' } as never])
      .mockResolvedValueOnce([{ id: 'person-2', name: 'Bob' } as never]);
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      cameraModels: [],
      tags: [
        { id: 'tag-1', value: 'Travel' },
        { id: 'tag-2', value: 'Family' },
      ],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(
      parseTypedSearch('person:anna person:bob tag:travel tag:family'),
      {},
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['person-1', 'person-2']);
      expect(result.filters.tagIds).toEqual(['tag-1', 'tag-2']);
    }
  });

  it('blocks when tag has no match', async () => {
    const result = await resolveTypedSearchFilters(parseTypedSearch('tag:vacation'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'tag', value: 'vacation' });
    }
  });

  it('blocks when tag resolution is ambiguous', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: [],
      cameraModels: [],
      tags: [
        { id: 'tag-1', value: 'Travel' },
        { id: 'tag-2', value: 'Travel 2025' },
      ],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('tag:trav'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'tag', value: 'trav' });
      expect(result.choices).toHaveLength(2);
    }
  });

  it('passes spaceId to suggestion-backed resolution', async () => {
    vi.mocked(searchPerson).mockResolvedValue([{ id: 'space-person-1', name: 'Anna' } as never]);

    await resolveTypedSearchFilters(parseTypedSearch('person:anna camera:nikon'), { spaceId: 'space-1' });

    expect(getFilterSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ spaceId: 'space-1' }),
      expect.anything(),
    );
  });

  it('uses space-scoped people from filter suggestions when resolving people inside a space', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [{ id: 'space-person-1', name: 'Anna' }],
      countries: [],
      cameraMakes: [],
      cameraModels: [],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), { spaceId: 'space-1' });

    expect(searchPerson).not.toHaveBeenCalled();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.filters.personIds).toEqual(['space-person-1']);
      expect(result.personNames.get('space-person-1')).toBe('Anna');
    }
  });

  it('blocks when camera matches both make and model', async () => {
    vi.mocked(getFilterSuggestions).mockResolvedValue({
      people: [],
      countries: [],
      cameraMakes: ['Nikon'],
      cameraModels: ['Nikon'],
      tags: [],
      ratings: [],
      mediaTypes: [],
      hasUnnamedPeople: false,
    });

    const result = await resolveTypedSearchFilters(parseTypedSearch('camera:nikon'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'ambiguous', key: 'camera', value: 'nikon' });
    }
  });

  it('blocks when camera has no match', async () => {
    const result = await resolveTypedSearchFilters(parseTypedSearch('camera:nikon'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'no-match', key: 'camera', value: 'nikon' });
    }
  });

  it('returns a resolver-error issue for SDK failures', async () => {
    vi.mocked(searchPerson).mockRejectedValue(new Error('network down'));

    const result = await resolveTypedSearchFilters(parseTypedSearch('person:anna'), {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]).toMatchObject({ code: 'resolver-error', message: 'network down' });
    }
  });
});
```

- [ ] **Step 2: Run resolver tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-resolver.spec.ts
```

Expected: FAIL because `typed-search-resolver` does not exist.

- [ ] **Step 3: Implement resolver**

Create `typed-search-resolver.ts` with:

```ts
import { createFilterState, type FilterState } from '$lib/components/filter-panel/filter-panel';
import { getFilterSuggestions, searchPerson } from '@immich/sdk';
import type { TypedSearchIssue, TypedSearchParseResult } from './typed-search-parser';

export type TypedSearchChoice = {
  tokenRaw: string;
  key: 'person' | 'tag' | 'camera';
  id?: string;
  label: string;
  value: string;
  field?: 'make' | 'model';
};

export type TypedSearchResolveContext = {
  spaceId?: string;
  signal?: AbortSignal;
  selectedChoices?: Map<string, TypedSearchChoice>;
};

export type TypedSearchResolveResult =
  | {
      ok: true;
      queryText: string;
      filters: FilterState;
      personNames: Map<string, string>;
      tagNames: Map<string, string>;
    }
  | {
      ok: false;
      queryText: string;
      issues: TypedSearchIssue[];
      choices: TypedSearchChoice[];
    };

export async function resolveTypedSearchFilters(
  parsed: TypedSearchParseResult,
  context: TypedSearchResolveContext,
): Promise<TypedSearchResolveResult> {
  const filters = createFilterState();
  const issues: TypedSearchIssue[] = [...parsed.issues];
  const choices: TypedSearchChoice[] = [];
  const personNames = new Map<string, string>();
  const tagNames = new Map<string, string>();

  for (const token of parsed.scalarTokens) {
    applyScalar(filters, token.key, token.normalizedValue);
  }

  const needsSuggestions = parsed.resolutionTokens.some(
    (token) => token.key === 'tag' || token.key === 'camera' || (token.key === 'person' && context.spaceId),
  );
  const suggestions = needsSuggestions
    ? await getFilterSuggestions({ spaceId: context.spaceId }, { signal: context.signal })
    : undefined;

  for (const token of parsed.resolutionTokens) {
    const selectedChoice = context.selectedChoices?.get(token.raw);
    if (selectedChoice) {
      applySelectedChoice(selectedChoice, filters, personNames, tagNames);
      continue;
    }

    if (token.key === 'person') {
      if (context.spaceId && suggestions) {
        resolvePersonTokenFromSuggestions(token, suggestions.people, filters, personNames, issues, choices);
        continue;
      }
      const people = await searchPerson({ name: token.value, withHidden: false }, { signal: context.signal });
      const exact = people.filter((person) => person.name.toLowerCase() === token.value.toLowerCase());
      const matches = exact.length > 0 ? exact : people;
      if (matches.length === 1) {
        filters.personIds.push(matches[0].id);
        personNames.set(matches[0].id, matches[0].name || matches[0].id);
      } else if (matches.length === 0) {
        issues.push({
          code: 'no-match',
          key: 'person',
          raw: token.raw,
          value: token.value,
          message: `No person found for "${token.value}"`,
        });
      } else {
        issues.push({
          code: 'ambiguous',
          key: 'person',
          raw: token.raw,
          value: token.value,
          message: `Choose a person for "${token.value}"`,
        });
        choices.push(
          ...matches.map((person) => ({
            tokenRaw: token.raw,
            key: 'person' as const,
            id: person.id,
            label: person.name || person.id,
            value: token.value,
          })),
        );
      }
    }

    if (token.key === 'tag' && suggestions) {
      resolveTagToken(token, suggestions.tags, filters, tagNames, issues, choices);
    }

    if (token.key === 'camera' && suggestions) {
      resolveCameraToken(token, suggestions.cameraMakes, suggestions.cameraModels ?? [], filters, issues, choices);
    }
  }

  return issues.length > 0
    ? { ok: false, queryText: parsed.queryText, issues, choices }
    : { ok: true, queryText: parsed.queryText, filters, personNames, tagNames };
}
```

Wrap the SDK calls in `try/catch`. Re-throw abort errors so palette close still cancels work; for other SDK errors, return `{ ok: false, queryText: parsed.queryText, issues: [{ code: 'resolver-error', raw: parsed.raw, message }], choices: [] }`.

Add local helpers `applyScalar`, `applySelectedChoice`, `resolvePersonTokenFromSuggestions`, `resolveTagToken`, and `resolveCameraToken`. Keep all matching case-insensitive; prefer exact entity/tag matches when one exists, return `ambiguous` when multiple non-exact suggestions match, and return `no-match` when nothing matches.

- [ ] **Step 4: Run resolver tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-resolver.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit resolver slice**

Run:

```bash
git add web/src/lib/utils/typed-search/typed-search-resolver.ts web/src/lib/utils/typed-search/typed-search-resolver.spec.ts
git commit -m "feat(web): resolve typed search filters"
```

---

### Task 5: GlobalSearchManager Commit TDD

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing manager tests**

Add mocks near the existing mocks in `global-search-manager.svelte.spec.ts`:

```ts
const { typedSearchMock } = vi.hoisted(() => ({
  typedSearchMock: {
    resolveTypedSearchFilters: vi.fn(),
  },
}));

vi.mock('$lib/utils/typed-search/typed-search-resolver', () => ({
  resolveTypedSearchFilters: typedSearchMock.resolveTypedSearchFilters,
}));

vi.mock('$lib/utils/typed-search/typed-search-name-cache', () => ({
  storeTypedSearchNames: vi.fn(),
}));
```

Add this import near the existing test imports:

```ts
import { storeTypedSearchNames } from '$lib/utils/typed-search/typed-search-name-cache';
```

Use the real `parseTypedSearch()` implementation in this manager spec. Do not mock the parser here: the existing manager file has many `setQuery()` tests that call `vi.resetAllMocks()`, and a parser mock would create broad unrelated failures unless every existing `beforeEach` restored its implementation.

Add tests:

```ts
describe('GlobalSearchManager typed search commit', () => {
  beforeEach(() => {
    typedSearchMock.resolveTypedSearchFilters.mockReset();
    vi.mocked(storeTypedSearchNames).mockClear();
    vi.mocked(goto).mockClear();
    mockPage.url = new URL('https://gallery.test/photos');
  });

  it('navigates with typed filters when resolution succeeds', async () => {
    const manager = new GlobalSearchManager();
    typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
      ok: true,
      queryText: 'beach',
      filters: {
        personIds: ['person-1'],
        tagIds: [],
        mediaType: 'all',
        sortOrder: 'desc',
        dateAfter: '2025-01-01',
      },
      personNames: new Map([['person-1', 'Anna']]),
      tagNames: new Map(),
    });

    await manager.activateSearch('beach person:anna from:2025');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach&people=person-1&from=2025-01-01');
    expect(manager.typedSearchIssues).toEqual([]);
  });

  it('dispatches live providers with the plain query while preserving raw top-search commit text', async () => {
    const manager = new GlobalSearchManager();
    const providers = (manager as unknown as { providers: Record<keyof Sections, Provider> }).providers;
    const photosRun = vi.fn().mockResolvedValue({ status: 'empty' as const });
    providers.photos.run = photosRun;

    manager.setQuery('beach camera:nikon');

    await vi.waitFor(() => expect(photosRun).toHaveBeenCalledWith('beach', expect.anything(), expect.anything()));
    expect(manager.topSearchMatch).toEqual({ id: 'top-search', query: 'beach', rawQuery: 'beach camera:nikon' });
  });

  it('blocks parser issues before calling the resolver', async () => {
    const manager = new GlobalSearchManager();

    await manager.activateSearch('beach persn:anna');

    expect(typedSearchMock.resolveTypedSearchFilters).not.toHaveBeenCalled();
    expect(goto).not.toHaveBeenCalled();
    expect(manager.typedSearchIssues[0]).toMatchObject({ code: 'unknown-key', raw: 'persn:anna' });
  });

  it('stores resolver names for the destination URL before navigating', async () => {
    const manager = new GlobalSearchManager();
    typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
      ok: true,
      queryText: 'beach',
      filters: { personIds: ['person-1'], tagIds: ['tag-1'], mediaType: 'all', sortOrder: 'desc' },
      personNames: new Map([['person-1', 'Anna']]),
      tagNames: new Map([['tag-1', 'Travel']]),
    });

    await manager.activateSearch('beach person:anna tag:travel');

    expect(storeTypedSearchNames).toHaveBeenCalledWith('/photos?q=beach&people=person-1&tags=tag-1', {
      personNames: new Map([['person-1', 'Anna']]),
      tagNames: new Map([['tag-1', 'Travel']]),
    });
  });

  it('supports filter-only searches without q', async () => {
    const manager = new GlobalSearchManager();
    typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
      ok: true,
      queryText: '',
      filters: { personIds: ['person-1'], tagIds: [], mediaType: 'all', sortOrder: 'desc' },
      personNames: new Map([['person-1', 'Anna']]),
      tagNames: new Map(),
    });

    await manager.activateSearch('person:anna');

    expect(goto).toHaveBeenCalledWith('/photos?people=person-1');
  });

  it('blocks navigation and exposes issues when resolution fails', async () => {
    const manager = new GlobalSearchManager();
    const issue = {
      code: 'no-match',
      key: 'person',
      raw: 'person:anna',
      value: 'anna',
      message: 'No person found for "anna"',
    };
    typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
      ok: false,
      queryText: 'beach',
      issues: [issue],
      choices: [],
    });

    await manager.activateSearch('beach person:anna');

    expect(goto).not.toHaveBeenCalled();
    expect(manager.typedSearchIssues).toEqual([issue]);
  });

  it('stores an ambiguity choice and clears matching issue state', () => {
    const manager = new GlobalSearchManager();
    const issue = {
      code: 'ambiguous',
      key: 'person',
      raw: 'person:anna',
      value: 'anna',
      message: 'Choose a person for "anna"',
    };
    const choice = {
      tokenRaw: 'person:anna',
      key: 'person' as const,
      id: 'person-2',
      label: 'Anna Maria',
      value: 'anna',
    };
    manager.typedSearchIssues = [issue];
    manager.typedSearchChoices = [choice];
    manager.typedSearchDisplayTokens = [{ raw: 'person:anna', key: 'person', value: 'anna', status: 'error', issue }];

    manager.selectTypedSearchChoice(choice);

    expect(manager.selectedTypedSearchChoices.get('person:anna')).toEqual(choice);
    expect(manager.typedSearchIssues).toEqual([]);
    expect(manager.typedSearchChoices).toEqual([]);
    expect(manager.typedSearchDisplayTokens).toEqual([
      { raw: 'person:anna', key: 'person', value: 'Anna Maria', status: 'resolved-entity' },
    ]);
  });

  it('falls back to photos when current page is not searchable', async () => {
    mockPage.url = new URL('https://gallery.test/albums');
    const manager = new GlobalSearchManager();
    typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
      ok: true,
      queryText: 'beach',
      filters: { personIds: [], tagIds: [], mediaType: 'all', sortOrder: 'desc' },
      personNames: new Map(),
      tagNames: new Map(),
    });

    await manager.activateSearch('beach');

    expect(goto).toHaveBeenCalledWith('/photos?q=beach');
  });
});
```

- [ ] **Step 2: Run manager tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts
```

Expected: FAIL because `activateSearch` is synchronous, manager has no typed issue state, and live provider batches still use the raw query.

- [ ] **Step 3: Implement manager commit state**

Modify `global-search-manager.svelte.ts`:

```ts
import {
  parseTypedSearch,
  type TypedSearchDisplayToken,
  type TypedSearchIssue,
} from '$lib/utils/typed-search/typed-search-parser';
import { resolveTypedSearchFilters, type TypedSearchChoice } from '$lib/utils/typed-search/typed-search-resolver';
import { storeTypedSearchNames } from '$lib/utils/typed-search/typed-search-name-cache';
```

Add state:

```ts
typedSearchDisplayTokens = $state<TypedSearchDisplayToken[]>([]);
typedSearchIssues = $state<TypedSearchIssue[]>([]);
typedSearchChoices = $state<TypedSearchChoice[]>([]);
// eslint-disable-next-line svelte/prefer-svelte-reactivity
selectedTypedSearchChoices = new Map<string, TypedSearchChoice>();
typedSearchPlainQuery = $state('');
```

Add a parse helper:

```ts
parseTypedSearchDraft(text = this.query) {
  const parsed = parseTypedSearch(text);
  this.typedSearchDisplayTokens = parsed.displayTokens;
  this.typedSearchPlainQuery = parsed.queryText;
  this.typedSearchIssues = [];
  this.typedSearchChoices = [];
  for (const key of [...this.selectedTypedSearchChoices.keys()]) {
    if (!parsed.resolutionTokens.some((token) => token.raw === key)) {
      this.selectedTypedSearchChoices.delete(key);
    }
  }
  return parsed;
}
```

Add a choice helper:

```ts
selectTypedSearchChoice(choice: TypedSearchChoice) {
  this.selectedTypedSearchChoices.set(choice.tokenRaw, choice);
  this.typedSearchIssues = this.typedSearchIssues.filter((issue) => issue.raw !== choice.tokenRaw);
  this.typedSearchChoices = this.typedSearchChoices.filter((item) => item.tokenRaw !== choice.tokenRaw);
  this.typedSearchDisplayTokens = this.typedSearchDisplayTokens.map((token) =>
    token.raw === choice.tokenRaw
      ? { raw: token.raw, key: token.key, value: choice.label, status: 'resolved-entity' as const }
      : token,
  );
}
```

Update live provider payload and top-search display so live results use plain query text, while Enter still commits the raw input:

```ts
private getSearchProviderPayload(): string {
  if (this.scope !== 'all') {
    return this.payload;
  }
  return this.typedSearchPlainQuery;
}
```

Use `getSearchProviderPayload()` in `runBatch()` for entity providers when `scope === 'all'`. Keep prefix scopes (`@`, `#`, `/`, `>`) using `this.payload`. Update the top-search type and derived value:

In `setQuery()`, call `parseTypedSearchDraft()` after `this.query` is updated and before the debounced batch is scheduled. For non-`all` prefix scopes, clear typed-search display/issues/choices so prefix modes do not show stale typed tokens.

In `runBatch()`, derive `providerPayload = scope === 'all' ? this.getSearchProviderPayload() : payload` and use `providerPayload` for min-length checks and `provider.run(providerPayload, mode, signal)`. Keep the original `payload` for bare-prefix detection so `@`, `#`, `/`, and `>` behavior remains unchanged.

```ts
type TopSearchMatch = { id: 'top-search'; query: string; rawQuery: string };
```

For all-scope typed search, return `{ id: 'top-search', query: this.typedSearchPlainQuery || query, rawQuery: query }` so a filter-only search can still be committed.

Change `activateSearch` to async:

```ts
async activateSearch(text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const parsed = this.parseTypedSearchDraft(trimmed);
  if (parsed.issues.length > 0) {
    this.typedSearchIssues = parsed.issues;
    this.typedSearchChoices = [];
    this.typedSearchDisplayTokens = parsed.displayTokens;
    return;
  }

  const spaceId = page.url.pathname.startsWith('/spaces/') ? page.url.pathname.split('/').filter(Boolean)[1] : undefined;
  const resolved = await resolveTypedSearchFilters(parsed, {
    spaceId,
    signal: this.closeSignal,
    selectedChoices: this.selectedTypedSearchChoices,
  });

  if (!resolved.ok) {
    this.typedSearchIssues = resolved.issues;
    this.typedSearchChoices = resolved.choices;
    this.typedSearchDisplayTokens = parsed.displayTokens.map((token) => {
      const issue = resolved.issues.find((item) => item.raw === token.raw);
      return issue ? { ...token, status: 'error' as const, issue } : token;
    });
    return;
  }

  this.typedSearchIssues = [];
  this.typedSearchChoices = [];
  addEntry({
    kind: 'query',
    id: `query:${trimmed.toLowerCase()}`,
    text: trimmed,
    lastUsed: Date.now(),
  });
  const destination = this.buildSearchDestination(resolved.queryText, resolved.filters);
  storeTypedSearchNames(destination, { personNames: resolved.personNames, tagNames: resolved.tagNames });
  void goto(destination);
}
```

Update `buildSearchDestination(text: string, filters?: FilterState)` and pass filters into `buildSearchablePageUrl`. For non-searchable fallback, construct `/photos` params using a temporary URL and `buildSearchablePageUrl(new URL('/photos', page.url), text, this.searchSortOrder, filters)`. Return a string from every branch; if `buildSearchablePageUrl` unexpectedly returns `null` for the fallback URL, return `/photos`.

- [ ] **Step 4: Update call sites that assume synchronous activateSearch**

In `global-search-manager.svelte.ts`, wrap internal calls:

```ts
void this.activateSearch(entry.text);
```

In `global-search.svelte`, existing calls already use `manager.activateSearch(...)`; convert click and key handlers to `void manager.activateSearch(...)`.

When the active item is `manager.topSearchMatch`, pass `manager.topSearchMatch.rawQuery` to `activateSearch()` and keep `manager.topSearchMatch.query` for display text.

- [ ] **Step 5: Run manager tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit manager slice**

Run:

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/global-search.svelte
git commit -m "feat(web): commit typed search filters from global search"
```

---

### Task 6: Token Rail UI TDD

**Files:**

- Create: `web/src/lib/components/global-search/typed-search-token-rail.svelte`
- Create: `web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts`
- Modify: `web/src/lib/components/global-search/global-search.svelte`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing token rail component tests**

Create `typed-search-token-rail.spec.ts`:

```ts
import TypedSearchTokenRail from '$lib/components/global-search/typed-search-token-rail.svelte';
import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

describe('TypedSearchTokenRail', () => {
  it('renders recognized and pending tokens quietly', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [
          { raw: 'from:2025', key: 'from', value: '2025', status: 'recognized' },
          { raw: 'person:anna', key: 'person', value: 'anna', status: 'pending-entity' },
        ],
      },
    });

    expect(screen.getByText('from')).toBeVisible();
    expect(screen.getByText('2025')).toBeVisible();
    expect(screen.getByText('person')).toBeVisible();
    expect(screen.getByText('anna')).toBeVisible();
    expect(screen.getByTestId('typed-search-token-person')).toHaveAttribute('data-status', 'pending-entity');
  });

  it('renders error tokens with issue text', () => {
    render(TypedSearchTokenRail, {
      props: {
        tokens: [
          {
            raw: 'person:anna',
            key: 'person',
            value: 'anna',
            status: 'error',
            issue: {
              code: 'no-match',
              raw: 'person:anna',
              key: 'person',
              value: 'anna',
              message: 'No person found for "anna"',
            },
          },
        ],
      },
    });

    expect(screen.getByTestId('typed-search-token-person')).toHaveAttribute('data-status', 'error');
    expect(screen.getByLabelText('No person found for "anna"')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run token rail tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement token rail component**

Create `typed-search-token-rail.svelte`:

```svelte
<script lang="ts">
  import type { TypedSearchDisplayToken } from '$lib/utils/typed-search/typed-search-parser';

  interface Props {
    tokens: TypedSearchDisplayToken[];
  }

  let { tokens }: Props = $props();
</script>

{#if tokens.length > 0}
  <div class="flex min-w-0 flex-wrap items-center gap-1.5 px-3 pb-2" data-testid="typed-search-token-rail">
    {#each tokens as token (`${token.raw}:${token.status}`)}
      <span
        data-testid={`typed-search-token-${token.key}`}
        data-status={token.status}
        aria-label={token.issue?.message}
        class="inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-[11px] leading-none
          {token.status === 'error'
            ? 'border-red-400/70 bg-red-50 text-red-700 dark:border-red-500/50 dark:bg-red-950/30 dark:text-red-200'
            : token.status === 'pending-entity'
              ? 'border-dashed border-gray-300 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-800/60 dark:text-gray-300'
              : 'border-gray-200 bg-subtle/60 text-gray-700 dark:border-gray-700 dark:text-gray-200'}"
      >
        <span class="font-semibold">{token.key}</span>
        <span class="truncate">{token.value}</span>
      </span>
    {/each}
  </div>
{/if}
```

- [ ] **Step 4: Run token rail tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Write failing palette integration tests**

In `global-search.spec.ts`, include `getFilterSuggestions` in the existing `@immich/sdk` import and mock:

```ts
import {
  AssetVisibility,
  getFilterSuggestions,
  getMlHealth,
  searchAssets,
  searchPerson,
  searchPlaces,
  searchSmart,
} from '@immich/sdk';
```

```ts
getFilterSuggestions: vi.fn().mockResolvedValue({
  people: [],
  countries: [],
  cameraMakes: [],
  cameraModels: [],
  tags: [],
  ratings: [],
  mediaTypes: [],
  hasUnnamedPeople: false,
}),
```

Add to `global-search.spec.ts`:

```ts
it('renders typed search tokens while typing without resolving suggestion-backed filters', async () => {
  const m = new GlobalSearchManager();
  const parseSpy = vi.spyOn(m, 'parseTypedSearchDraft');
  m.open();
  render(GlobalSearch, { props: { manager: m } });

  await user.type(screen.getByRole('combobox'), 'beach camera:nikon from:2025');

  expect(parseSpy).toHaveBeenCalled();
  expect(screen.getByTestId('typed-search-token-rail')).toBeInTheDocument();
  expect(screen.getByTestId('typed-search-token-camera')).toHaveAttribute('data-status', 'pending-entity');
  expect(getFilterSuggestions).not.toHaveBeenCalled();
});

it('keeps the palette open and shows typed search issues after failed Enter commit', async () => {
  const m = new GlobalSearchManager();
  m.open();
  vi.spyOn(m, 'activateSearch').mockImplementation(async () => {
    m.typedSearchIssues = [
      { code: 'no-match', key: 'person', raw: 'person:anna', value: 'anna', message: 'No person found for "anna"' },
    ];
  });
  render(GlobalSearch, { props: { manager: m } });

  await user.type(screen.getByRole('combobox'), 'person:anna');
  await user.keyboard('{Enter}');

  expect(screen.getByText('No person found for "anna"')).toBeVisible();
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

it('renders ambiguity choices and sends selection to the manager', async () => {
  const m = new GlobalSearchManager();
  const selectSpy = vi.spyOn(m, 'selectTypedSearchChoice');
  m.typedSearchIssues = [
    { code: 'ambiguous', key: 'person', raw: 'person:anna', value: 'anna', message: 'Choose a person for "anna"' },
  ];
  m.typedSearchChoices = [
    { tokenRaw: 'person:anna', key: 'person', id: 'person-1', label: 'Anna', value: 'anna' },
    { tokenRaw: 'person:anna', key: 'person', id: 'person-2', label: 'Anna Maria', value: 'anna' },
  ];
  m.open();
  render(GlobalSearch, { props: { manager: m } });

  await user.click(screen.getByRole('button', { name: 'Anna Maria' }));

  expect(selectSpy).toHaveBeenCalledWith({
    tokenRaw: 'person:anna',
    key: 'person',
    id: 'person-2',
    label: 'Anna Maria',
    value: 'anna',
  });
});
```

- [ ] **Step 6: Run palette tests and verify red**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: FAIL because the palette does not render token rail, issue rows, or ambiguity choice rows.

- [ ] **Step 7: Integrate token rail and issue rows**

Modify `global-search.svelte` imports:

```ts
import TypedSearchTokenRail from './typed-search-token-rail.svelte';
```

After the existing `Command.Input` row, render:

```svelte
<TypedSearchTokenRail tokens={manager.typedSearchDisplayTokens} />
```

In the input sync effect or `oninput`, call:

```ts
manager.parseTypedSearchDraft(inputValue);
```

Above normal command groups, render issues:

```svelte
{#if manager.typedSearchIssues.length > 0}
  <Command.Group class="mb-4" data-typed-search-issues>
    <Command.GroupHeading class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Search filters
    </Command.GroupHeading>
    <div class="space-y-1 px-3">
      {#each manager.typedSearchIssues as issue (`${issue.raw}:${issue.code}`)}
        <div class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
          {issue.message}
        </div>
      {/each}
    </div>
  </Command.Group>
{/if}
```

Below issue rows, render ambiguity choices:

```svelte
{#if manager.typedSearchChoices.length > 0}
  <Command.Group class="mb-4" data-typed-search-choices>
    <Command.GroupHeading class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      Choose filter value
    </Command.GroupHeading>
    <div class="space-y-1 px-3">
      {#each manager.typedSearchChoices as choice (`${choice.tokenRaw}:${choice.key}:${choice.id ?? choice.field ?? choice.label}`)}
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-primary/10"
          onclick={() => manager.selectTypedSearchChoice(choice)}
        >
          <span>{choice.label}</span>
        </button>
      {/each}
    </div>
  </Command.Group>
{/if}
```

- [ ] **Step 8: Run UI tests and verify green**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: PASS.

- [ ] **Step 9: Commit UI slice**

Run:

```bash
git add web/src/lib/components/global-search/typed-search-token-rail.svelte web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts web/src/lib/components/global-search/global-search.svelte web/src/lib/components/global-search/__tests__/global-search.spec.ts
git commit -m "feat(web): show typed search filter tokens"
```

---

### Task 7: Final Integration Verification

**Files:**

- No planned code edits unless verification exposes a defect

- [ ] **Step 1: Run focused typed search tests**

Run:

```bash
pnpm --filter @immich/sdk build
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-resolver.spec.ts src/lib/utils/typed-search/typed-search-name-cache.spec.ts src/lib/utils/__tests__/searchable-page-search.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts'
```

Expected: PASS.

- [ ] **Step 2: Run type and Svelte checks**

Run:

```bash
pnpm --dir web run check:svelte
pnpm --dir web run check:typescript
```

Expected: PASS.

- [ ] **Step 3: Run lint for touched files or full web lint**

Run:

```bash
pnpm --dir web run lint
```

Expected: PASS.

- [ ] **Step 4: Manual smoke in dev server**

Run:

```bash
pnpm --dir web dev --host 0.0.0.0 --port 3000
```

Open the app, then smoke these flows:

- From `/photos`, open global search and enter `beach from:2025 type:photo`; Enter navigates to `/photos?q=beach&from=2025-01-01&type=image`.
- From `/photos`, enter `person:thisdoesnotexist`; Enter keeps the palette open and shows one issue row.
- From `/spaces/space-1/photos`, enter `beach city:Berlin`; Enter stays under that space route and applies `city=Berlin`.
- Type `beach person:anna` without Enter; people resolution is not called until Enter.

- [ ] **Step 5: Handle verification defects with TDD**

If Step 1, 2, 3, or 4 exposes a defect, return to the task that owns the broken behavior, add a focused failing test in that task's test file, implement the fix, rerun that task's focused command, rerun Task 7 Step 1, and commit using that task's file list and commit-message pattern. If no defects are found, do not create a verification-only commit.
