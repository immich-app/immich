# Live Typed Filter Suggestions 04 Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live `country:` and `city:` suggestions while preserving the existing scalar filter commit semantics.

**Architecture:** Extend the live suggestion utility with scalar-backed choices for countries and cities. `country:` uses filter suggestions and allows empty initial browsing; `city:` uses search suggestions, waits for at least one character, and scopes by an existing country token when present.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, existing `@immich/sdk` `getFilterSuggestions`, `getSearchSuggestions`, and `SearchSuggestionType.City`.

---

## Prerequisite

Complete and verify these plans first:

- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-01-foundation.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-02-people.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-03-tags.md`

This plan assumes the live scheduler already supports multiple live keys and that scalar choices can call `selectLiveTypedSearchChoice(choice)`.

## File Structure

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`
  - Add `country:` and `city:` lookup, result mapping, city-empty idle behavior, and country-scoped city requests.
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
  - Add country and city utility tests using mocked SDK calls.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Allow live scheduling for `country:` and non-empty `city:` tokens and rewrite scalar selections without storing resolver entity choices.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Cover country scheduling, city scheduling, empty `city:` staying idle, country-scoped city context, and scalar rewrite behavior.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Cover selecting country and city rows from the dedicated filter-match section.

## Task 0: Baseline

**Files:**

- No production edits

- [ ] **Step 1: Run current live suggestion tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: PASS after the tags plan.

## Task 1: Country Live Suggestion Utility

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`

- [ ] **Step 1: Write failing country utility tests**

Add:

```ts
it('loads initial country suggestions for an empty country token', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: ['Germany', 'France', 'United States'],
    cameraMakes: [],
    tags: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('country:', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(getFilterSuggestions).toHaveBeenCalledWith({ withSharedSpaces: true }, expect.anything());
  expect(result).toEqual({
    status: 'ok',
    key: 'country',
    total: 3,
    items: [
      expect.objectContaining({ key: 'country', label: 'Germany', value: 'Germany' }),
      expect.objectContaining({ key: 'country', label: 'France', value: 'France' }),
      expect.objectContaining({ key: 'country', label: 'United States', value: 'United States' }),
    ],
  });
});

it('narrows country suggestions by the active country token value', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: ['Germany', 'Georgia', 'France'],
    cameraMakes: [],
    tags: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('country:ge', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(result).toMatchObject({ status: 'ok', key: 'country', total: 2 });
  if (result.status === 'ok') {
    expect(result.items.map((item) => item.value)).toEqual(['Germany', 'Georgia']);
  }
});

it('returns empty when no countries match', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: ['Germany'],
    cameraMakes: [],
    tags: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('country:zzzz', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'empty',
    key: 'country',
  });
});

it('returns a quiet live error when country suggestions fail', async () => {
  vi.mocked(getFilterSuggestions).mockRejectedValue(new Error('network down'));
  const parsed = parseTypedSearch('country:ge', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'error',
    key: 'country',
    message: 'network down',
  });
});
```

- [ ] **Step 2: Run country utility tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts -t "country"
```

Expected: FAIL because `country:` still returns `idle`.

- [ ] **Step 3: Implement country live suggestions**

In `typed-search-live-suggestions.ts`, add:

```ts
function stringChoice(
  token: TypedSearchTokenSpan,
  key: 'country' | 'city',
  value: string,
  secondaryLabel?: string,
): LiveTypedSearchChoice {
  return {
    id: makeChoiceId(token, value, key),
    key,
    label: value,
    value,
    tokenStart: token.start,
    tokenEnd: token.end,
    secondaryLabel,
  };
}

async function resolveCountryLiveSuggestions(
  context: LiveTypedSearchContext,
  token: TypedSearchTokenSpan,
): Promise<LiveTypedSearchStatus> {
  try {
    const value = token.value.trim().toLowerCase();
    const response = await getFilterSuggestions(liveSuggestionScope(context), { signal: context.signal });
    const matches = response.countries
      .filter((country): country is string => typeof country === 'string')
      .filter((country) => !value || country.toLowerCase().includes(value))
      .slice(0, LIVE_RESULT_LIMIT)
      .map((country) => stringChoice(token, 'country', country));
    return matches.length === 0
      ? { status: 'empty', key: 'country' }
      : { status: 'ok', key: 'country', items: matches, total: matches.length };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return {
      status: 'error',
      key: 'country',
      message: error instanceof Error ? error.message : 'Unable to load countries',
    };
  }
}
```

Update resolver dispatch:

```ts
if (token.key === 'country') {
  return resolveCountryLiveSuggestions(context, token);
}
```

- [ ] **Step 4: Run country utility tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts -t "country"
```

Expected: PASS.

- [ ] **Step 5: Commit country utility support**

```bash
git add web/src/lib/utils/typed-search/typed-search-live-suggestions.ts web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
git commit -m "feat(web): resolve live country filter suggestions"
```

## Task 2: City Live Suggestion Utility

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`

- [ ] **Step 1: Write failing city utility tests**

Add:

```ts
it('does not fetch city suggestions for an empty city token', async () => {
  const parsed = parseTypedSearch('city:', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'idle',
  });
  expect(getSearchSuggestions).not.toHaveBeenCalled();
});

it('loads city suggestions for a non-empty city token without adding a country', async () => {
  vi.mocked(getSearchSuggestions).mockResolvedValue(['Paris', 'Parikia'] as never);
  const parsed = parseTypedSearch('city:par', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(getSearchSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({ $type: SearchSuggestionType.City, withSharedSpaces: true }),
    expect.anything(),
  );
  expect(result).toEqual({
    status: 'ok',
    key: 'city',
    total: 2,
    items: [
      expect.objectContaining({ key: 'city', label: 'Paris', value: 'Paris' }),
      expect.objectContaining({ key: 'city', label: 'Parikia', value: 'Parikia' }),
    ],
  });
});

it('scopes city suggestions to an existing country token with canonical country casing', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: ['Germany'],
    cameraMakes: [],
    tags: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  vi.mocked(getSearchSuggestions).mockResolvedValue(['Berlin'] as never);
  const parsed = parseTypedSearch('country:germany city:ber', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[1] });

  expect(getSearchSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({ $type: SearchSuggestionType.City, country: 'Germany', withSharedSpaces: true }),
    expect.anything(),
  );
  expect(result).toMatchObject({ status: 'ok', key: 'city' });
});

it('returns empty when no cities match', async () => {
  vi.mocked(getSearchSuggestions).mockResolvedValue([] as never);
  const parsed = parseTypedSearch('city:zzzz', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'empty',
    key: 'city',
  });
});

it('returns a quiet live error when city suggestions fail', async () => {
  vi.mocked(getSearchSuggestions).mockRejectedValue(new Error('network down'));
  const parsed = parseTypedSearch('city:par', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'error',
    key: 'city',
    message: 'network down',
  });
});
```

- [ ] **Step 2: Run city utility tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts -t "city"
```

Expected: FAIL because `city:` still returns `idle`.

- [ ] **Step 3: Implement city live suggestions**

In `typed-search-live-suggestions.ts`, import:

```ts
import { getFilterSuggestions, getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
```

Add:

```ts
function canonicalExactMatch(candidates: string[], value: string): string {
  return candidates.find((candidate) => candidate.toLowerCase() === value.toLowerCase()) ?? value;
}

async function getCanonicalCountryForCity(context: LiveTypedSearchContext): Promise<string | undefined> {
  const countryToken = context.parsed.scalarTokens.find((token) => token.key === 'country');
  if (!countryToken) {
    return undefined;
  }
  const value = String(countryToken.normalizedValue);
  const response = await getFilterSuggestions(liveSuggestionScope(context), { signal: context.signal });
  return canonicalExactMatch(
    response.countries.filter((country): country is string => typeof country === 'string'),
    value,
  );
}

async function resolveCityLiveSuggestions(
  context: LiveTypedSearchContext,
  token: TypedSearchTokenSpan,
): Promise<LiveTypedSearchStatus> {
  const value = token.value.trim();
  if (!value) {
    return { status: 'idle' };
  }
  try {
    const country = await getCanonicalCountryForCity(context);
    const cities = await getSearchSuggestions(
      {
        $type: SearchSuggestionType.City,
        ...(country ? { country } : {}),
        ...liveSuggestionScope(context),
      },
      { signal: context.signal },
    );
    const matches = cities
      .filter((city): city is string => typeof city === 'string')
      .filter((city) => city.toLowerCase().includes(value.toLowerCase()))
      .slice(0, LIVE_RESULT_LIMIT)
      .map((city) => stringChoice(token, 'city', city, country));
    return matches.length === 0
      ? { status: 'empty', key: 'city' }
      : { status: 'ok', key: 'city', items: matches, total: matches.length };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return { status: 'error', key: 'city', message: error instanceof Error ? error.message : 'Unable to load cities' };
  }
}
```

Update resolver dispatch:

```ts
if (token.key === 'city') {
  return resolveCityLiveSuggestions(context, token);
}
```

- [ ] **Step 4: Run city utility tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts -t "city|country"
```

Expected: PASS.

- [ ] **Step 5: Commit city utility support**

```bash
git add web/src/lib/utils/typed-search/typed-search-live-suggestions.ts web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
git commit -m "feat(web): resolve live city filter suggestions"
```

## Task 3: Manager Location Scheduling

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing location scheduling tests**

Add:

```ts
it('debounces live country filter suggestions for an active country token', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockResolvedValue({
    status: 'ok',
    key: 'country',
    total: 1,
    items: [
      { id: 'country:0:10:Germany', key: 'country', label: 'Germany', value: 'Germany', tokenStart: 0, tokenEnd: 10 },
    ],
  });
  const manager = new GlobalSearchManager();

  manager.setQuery('country:ge');
  manager.setInputCaret('country:ge'.length);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'loading', key: 'country' });
  await vi.advanceTimersByTimeAsync(150);
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledOnce();
  vi.useRealTimers();
});

it('does not schedule live suggestions for an empty city token', async () => {
  vi.useFakeTimers();
  const manager = new GlobalSearchManager();

  manager.setQuery('city:');
  manager.setInputCaret('city:'.length);
  await vi.advanceTimersByTimeAsync(200);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).not.toHaveBeenCalled();
  vi.useRealTimers();
});

it('schedules live city suggestions when the city token has text', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockResolvedValue({
    status: 'ok',
    key: 'city',
    total: 1,
    items: [{ id: 'city:16:24:Berlin', key: 'city', label: 'Berlin', value: 'Berlin', tokenStart: 16, tokenEnd: 24 }],
  });
  const manager = new GlobalSearchManager();

  manager.setQuery('country:germany city:ber');
  manager.setInputCaret('country:germany city:ber'.length);
  await vi.advanceTimersByTimeAsync(150);

  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({ activeToken: expect.objectContaining({ key: 'city', value: 'ber' }) }),
  );
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run location scheduling tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live country|empty city|live city"
```

Expected: FAIL because `country:` and `city:` are not in the manager's live key set.

- [ ] **Step 3: Enable location keys in the live scheduler**

Update `scheduleLiveTypedSearchSuggestions()`:

```ts
const key = this.activeTypedSearchToken.key;
const supportsLiveSuggestions = key === 'person' || key === 'tag' || key === 'country' || key === 'city';
if (!supportsLiveSuggestions || (key === 'city' && this.activeTypedSearchToken.value.trim() === '')) {
  this.liveTypedSearchStatus = { status: 'idle' };
  return;
}
```

Keep all other debounce, abort, and stale-response logic unchanged.

- [ ] **Step 4: Run location scheduling tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live country|empty city|live city"
```

Expected: PASS.

- [ ] **Step 5: Commit location scheduling**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "feat(web): schedule live location filter suggestions"
```

## Task 4: Scalar Row Selection

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing scalar selection tests**

Manager tests:

```ts
it('selecting a live country choice rewrites only the active country token', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('beach country:ge city:ber');
  manager.setInputCaret('beach country:ge'.length);

  manager.selectLiveTypedSearchChoice({
    id: 'country:6:16:Germany',
    key: 'country',
    label: 'Germany',
    value: 'Germany',
    tokenStart: 6,
    tokenEnd: 16,
  });

  expect(manager.query).toBe('beach country:Germany city:ber');
  expect(manager.selectedTypedSearchChoices.size).toBe(0);
});

it('selecting a live city choice does not add a country token', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('beach city:par');
  manager.setInputCaret('beach city:par'.length);

  manager.selectLiveTypedSearchChoice({
    id: 'city:6:14:Paris',
    key: 'city',
    label: 'Paris',
    value: 'Paris',
    tokenStart: 6,
    tokenEnd: 14,
    secondaryLabel: 'France',
  });

  expect(manager.query).toBe('beach city:Paris');
  expect(manager.query).not.toContain('country:');
});
```

Component test:

```ts
it('selects live city rows from the filter-match section', async () => {
  const manager = new GlobalSearchManager();
  manager.open();
  manager.setQuery('city:par');
  manager.setInputCaret('city:par'.length);
  manager.liveTypedSearchStatus = {
    status: 'ok',
    key: 'city',
    total: 1,
    items: [{ id: 'city:0:8:Paris', key: 'city', label: 'Paris', value: 'Paris', tokenStart: 0, tokenEnd: 8 }],
  };

  render(GlobalSearch, { props: { manager } });
  await user.click(screen.getByRole('option', { name: /Paris/i }));

  expect(manager.query).toBe('city:Paris');
});
```

- [ ] **Step 2: Run scalar selection tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live country|live city"
```

Expected: FAIL until location choices use the shared rewrite path and skip resolver choice storage.

- [ ] **Step 3: Handle scalar choices in selection**

Update `selectLiveTypedSearchChoice()` so it rewrites every `LiveTypedSearchChoice`, but only stores resolver choices for `person` and `tag`:

```ts
selectLiveTypedSearchChoice(choice: LiveTypedSearchChoice) {
  if (!this.activeTypedSearchToken) {
    return;
  }
  const activeToken = this.activeTypedSearchToken;
  const { text, caret } = rewriteTypedSearchToken(this.query, activeToken, {
    key: choice.key,
    value: choice.value,
  });
  this.query = text;
  this.skipNextLiveTypedSearchForCaret = caret;
  const parsedAfterRewrite = this.parseTypedSearchDraft(text);
  const rewrittenToken = getActiveTypedSearchToken(parsedAfterRewrite, caret);
  const selectedChoice = isLiveTypedSearchToken(rewrittenToken)
    ? this.selectedChoiceFromLiveChoice(choice, rewrittenToken)
    : undefined;
  if (selectedChoice) {
    const spanKey = `${rewrittenToken.key}:${rewrittenToken.start}:${rewrittenToken.end}:${rewrittenToken.raw}`;
    this.selectedTypedSearchChoices.set(rewrittenToken.raw, selectedChoice);
    this.selectedTypedSearchChoices.set(spanKey, selectedChoice);
  }
  this.setInputCaret(caret);
  this.liveTypedSearchStatus = { status: 'idle' };
}
```

Reuse the `skipNextLiveTypedSearchForCaret` guard added in the people plan so selecting a canonical scalar value does not immediately refetch suggestions for the rewritten token.

- [ ] **Step 4: Run scalar selection tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live country|live city|live tag|live person"
```

Expected: PASS.

- [ ] **Step 5: Commit scalar selection**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/__tests__/global-search.spec.ts
git commit -m "feat(web): apply live location filter choices"
```

## Task 5: Location Plan Verification

**Files:**

- No production edits

- [ ] **Step 1: Run focused location checks**

Run:

```bash
pnpm --dir web exec prettier --check src/lib/utils/typed-search src/lib/managers/global-search-manager.svelte.ts src/lib/components/global-search
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Commit formatting only if files changed**

Run:

```bash
git status --short
```

If formatting changed files:

```bash
git add web/src/lib
git commit -m "chore(web): format live location filter suggestions"
```

If no files changed, do not commit.
