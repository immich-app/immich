# Live Typed Filter Suggestions 02 People Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live `person:` suggestions that resolve the active token without navigating to a person page.

**Architecture:** Use the foundation plan's parser spans, live state, and filter-match section. Add `person` support to the live suggestion utility, then wire the manager to debounce/abort live requests and canonicalize selected people into the raw typed search input.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, existing `@immich/sdk` people APIs.

---

## Prerequisite

Complete and verify `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-01-foundation.md` first. This plan assumes these exports exist:

```ts
parseTypedSearch(raw, { mode: 'draft' });
getActiveTypedSearchToken(parsed, caret);
rewriteTypedSearchToken(raw, token, { key, value });
resolveLiveTypedSearchSuggestions(context);
type LiveTypedSearchChoice;
type LiveTypedSearchStatus;
```

## File Structure

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`
  - Add `person:` live suggestion lookup and choice mapping.
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
  - Add mocked SDK tests for global, empty, scoped, empty result, and error behavior.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Add debounce/abort/stale request orchestration for active `person:` tokens.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Cover debounced person lookup, stale response guards, close aborts, and canonical selection.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Cover UI interaction that selects a person filter row and does not call person navigation.

## Task 0: Baseline

**Files:**

- No production edits

- [ ] **Step 1: Run foundation tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: PASS.

## Task 1: People Live Suggestion Utility

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`

- [ ] **Step 1: Write failing people utility tests**

Extend the test file with SDK mocks:

```ts
import { getAllPeople, getFilterSuggestions, searchPerson } from '@immich/sdk';
import { vi } from 'vitest';

vi.mock('@immich/sdk', async () => ({
  ...(await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk')),
  getAllPeople: vi.fn(),
  getFilterSuggestions: vi.fn(),
  searchPerson: vi.fn(),
}));
```

Add tests:

```ts
it('searches people by active person token value', async () => {
  vi.mocked(searchPerson).mockResolvedValue([
    { id: 'person-1', name: 'Anna Maria' },
    { id: 'person-2', name: 'Annika' },
  ] as never);
  const parsed = parseTypedSearch('beach person:ann', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(searchPerson).toHaveBeenCalledWith(
    { name: 'ann', withHidden: false, withSharedSpaces: true },
    expect.anything(),
  );
  expect(result).toEqual({
    status: 'ok',
    key: 'person',
    total: 2,
    items: [
      expect.objectContaining({ key: 'person', label: 'Anna Maria', value: 'Anna Maria', entityId: 'person-1' }),
      expect.objectContaining({ key: 'person', label: 'Annika', value: 'Annika', entityId: 'person-2' }),
    ],
  });
});

it('loads initial people suggestions for empty person token', async () => {
  vi.mocked(getAllPeople).mockResolvedValue({
    people: [{ id: 'person-1', name: 'Zoe' }],
    total: 1,
    hidden: 0,
    hasNextPage: false,
  } as never);
  const parsed = parseTypedSearch('person:', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(getAllPeople).toHaveBeenCalledWith({ size: 10, withSharedSpaces: true }, expect.anything());
  expect(result).toMatchObject({ status: 'ok', key: 'person', total: 1 });
});

it('uses space-scoped people suggestions when spaceId is present', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [{ id: 'space-person-1', name: 'Anna Space' }],
    countries: [],
    cameraMakes: [],
    tags: [],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0], spaceId: 'space-1' });

  expect(getFilterSuggestions).toHaveBeenCalledWith({ spaceId: 'space-1' }, expect.anything());
  expect(result).toMatchObject({ status: 'ok', key: 'person' });
  if (result.status === 'ok') {
    expect(result.items[0]).toMatchObject({ entityId: 'space-person-1', label: 'Anna Space' });
  }
});

it('returns empty when no people match', async () => {
  vi.mocked(searchPerson).mockResolvedValue([]);
  const parsed = parseTypedSearch('person:zzzz', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'empty',
    key: 'person',
  });
});

it('returns a quiet live error when person suggestions fail', async () => {
  vi.mocked(searchPerson).mockRejectedValue(new Error('network down'));
  const parsed = parseTypedSearch('person:ann', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'error',
    key: 'person',
    message: 'network down',
  });
});
```

- [ ] **Step 2: Run utility tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: FAIL because the resolver still returns `idle`.

- [ ] **Step 3: Implement people live suggestions**

In `typed-search-live-suggestions.ts`, import SDK calls:

```ts
import { getAllPeople, getFilterSuggestions, searchPerson } from '@immich/sdk';
```

Add helpers:

```ts
const LIVE_RESULT_LIMIT = 5;

function isLiveKey(key: string | undefined): key is LiveTypedSearchKey {
  return key === 'person' || key === 'tag' || key === 'country' || key === 'city';
}

function makeChoiceId(token: TypedSearchTokenSpan, entityId: string, key: LiveTypedSearchKey) {
  return `${key}:${token.start}:${token.end}:${entityId}`;
}

function personChoice(
  token: TypedSearchTokenSpan,
  person: { id: string; name?: string | null },
): LiveTypedSearchChoice {
  const label = person.name || person.id;
  return {
    id: makeChoiceId(token, person.id, 'person'),
    key: 'person',
    label,
    value: label,
    tokenStart: token.start,
    tokenEnd: token.end,
    entityId: person.id,
  };
}
```

Update resolver:

```ts
export async function resolveLiveTypedSearchSuggestions(
  context: LiveTypedSearchContext,
): Promise<LiveTypedSearchStatus> {
  const token = context.activeToken;
  if (!token || !isLiveKey(token.key)) {
    return { status: 'idle' };
  }

  if (token.key === 'person') {
    return resolvePersonLiveSuggestions(context, token);
  }

  return { status: 'idle' };
}

async function resolvePersonLiveSuggestions(
  context: LiveTypedSearchContext,
  token: TypedSearchTokenSpan,
): Promise<LiveTypedSearchStatus> {
  try {
    const value = token.value.trim();
    const people = context.spaceId
      ? (await getFilterSuggestions({ spaceId: context.spaceId }, { signal: context.signal })).people
      : value
        ? await searchPerson({ name: value, withHidden: false, withSharedSpaces: true }, { signal: context.signal })
        : (await getAllPeople({ size: 10, withSharedSpaces: true }, { signal: context.signal })).people;
    const matches = people
      .filter((person) => !value || (person.name || person.id).toLowerCase().includes(value.toLowerCase()))
      .slice(0, LIVE_RESULT_LIMIT)
      .map((person) => personChoice(token, person));
    return matches.length === 0
      ? { status: 'empty', key: 'person' }
      : { status: 'ok', key: 'person', items: matches, total: matches.length };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return {
      status: 'error',
      key: 'person',
      message: error instanceof Error ? error.message : 'Unable to load people',
    };
  }
}
```

- [ ] **Step 4: Run utility tests and verify pass**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit utility people support**

```bash
git add web/src/lib/utils/typed-search/typed-search-live-suggestions.ts web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
git commit -m "feat(web): resolve live person filter suggestions"
```

## Task 2: Manager Debounce And Stale Guards For People

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing manager tests**

Mock the live utility in `global-search-manager.svelte.spec.ts`:

```ts
const { liveTypedSearchMock } = vi.hoisted(() => ({
  liveTypedSearchMock: {
    resolveLiveTypedSearchSuggestions: vi.fn(),
  },
}));

vi.mock('$lib/utils/typed-search/typed-search-live-suggestions', async () => ({
  ...(await vi.importActual<typeof import('$lib/utils/typed-search/typed-search-live-suggestions')>(
    '$lib/utils/typed-search/typed-search-live-suggestions',
  )),
  resolveLiveTypedSearchSuggestions: liveTypedSearchMock.resolveLiveTypedSearchSuggestions,
}));
```

Add:

```ts
it('debounces live person filter suggestions for the active token', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockResolvedValue({
    status: 'ok',
    key: 'person',
    total: 1,
    items: [
      {
        id: 'person:6:16:p1',
        key: 'person',
        label: 'Anna',
        value: 'Anna',
        tokenStart: 6,
        tokenEnd: 16,
        entityId: 'p1',
      },
    ],
  });
  const manager = new GlobalSearchManager();

  manager.setQuery('beach person:ann');
  manager.setInputCaret('beach person:ann'.length);
  expect(manager.liveTypedSearchStatus).toEqual({ status: 'loading', key: 'person' });

  await vi.advanceTimersByTimeAsync(150);

  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledOnce();
  expect(manager.liveTypedSearchStatus).toMatchObject({ status: 'ok', key: 'person' });
  vi.useRealTimers();
});

it('ignores stale live person suggestion responses', async () => {
  vi.useFakeTimers();
  let resolveFirst!: (value: unknown) => void;
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions
    .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce({ status: 'empty', key: 'person' });
  const manager = new GlobalSearchManager();

  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  await vi.advanceTimersByTimeAsync(150);
  manager.setQuery('person:zz');
  manager.setInputCaret('person:zz'.length);
  await vi.advanceTimersByTimeAsync(150);

  resolveFirst({
    status: 'ok',
    key: 'person',
    total: 1,
    items: [{ id: 'stale', key: 'person', label: 'Anna', value: 'Anna', tokenStart: 0, tokenEnd: 10 }],
  });
  await Promise.resolve();

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'empty', key: 'person' });
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run manager tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live person"
```

Expected: FAIL because manager never calls the live utility.

- [ ] **Step 3: Implement debounce/stale orchestration**

In manager imports:

```ts
import {
  resolveLiveTypedSearchSuggestions,
  type LiveTypedSearchChoice,
} from '$lib/utils/typed-search/typed-search-live-suggestions';
```

Add state:

```ts
private liveTypedSearchTimer: ReturnType<typeof setTimeout> | null = null;
private liveTypedSearchController: AbortController | null = null;
private liveTypedSearchRequestId = 0;
skipNextLiveTypedSearchForCaret = $state<number | null>(null);
```

Add:

```ts
private scheduleLiveTypedSearchSuggestions() {
  if (!this.activeTypedSearchToken || this.typedSearchComposing) {
    this.liveTypedSearchStatus = { status: 'idle' };
    return;
  }
  if (this.skipNextLiveTypedSearchForCaret === this.typedSearchCaret) {
    this.skipNextLiveTypedSearchForCaret = null;
    this.liveTypedSearchStatus = { status: 'idle' };
    return;
  }
  const key = this.activeTypedSearchToken.key;
  if (key !== 'person') {
    this.liveTypedSearchStatus = { status: 'idle' };
    return;
  }
  if (this.liveTypedSearchTimer) {
    clearTimeout(this.liveTypedSearchTimer);
  }
  this.liveTypedSearchController?.abort();
  const requestId = ++this.liveTypedSearchRequestId;
  const token = this.activeTypedSearchToken;
  this.liveTypedSearchStatus = { status: 'loading', key };
  this.liveTypedSearchTimer = setTimeout(() => {
    const controller = new AbortController();
    this.liveTypedSearchController = controller;
    const spaceId = page.url.pathname.startsWith('/spaces/') ? page.url.pathname.split('/').filter(Boolean)[1] : undefined;
    void resolveLiveTypedSearchSuggestions({
      parsed: parseTypedSearch(this.query, { mode: 'draft' }),
      activeToken: token,
      spaceId,
      signal: AbortSignal.any([this.closeSignal, controller.signal, AbortSignal.timeout(PROVIDER_TIMEOUT_MS)]),
    })
      .then((status) => {
        if (requestId === this.liveTypedSearchRequestId && !controller.signal.aborted) {
          this.liveTypedSearchStatus = status;
          this.reconcileCursor();
        }
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        if (requestId === this.liveTypedSearchRequestId) {
          this.liveTypedSearchStatus = { status: 'error', key, message: error instanceof Error ? error.message : 'unknown error' };
        }
      });
  }, 150);
}
```

Call `this.scheduleLiveTypedSearchSuggestions()` at the end of `updateActiveTypedSearchToken()`. Abort and clear timer in `clearTypedSearchDraft()` and `close()`.

- [ ] **Step 4: Run manager tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live person"
```

Expected: PASS.

- [ ] **Step 5: Commit manager people orchestration**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "feat(web): debounce live person filter suggestions"
```

## Task 3: Person Row Selection Integration

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing selection tests**

Manager test:

```ts
it('selecting a live person choice rewrites the active token and stores resolver choice by span', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('beach person:ann person:ann');
  manager.setInputCaret('beach person:ann'.length);

  manager.selectLiveTypedSearchChoice({
    id: 'person:6:16:p1',
    key: 'person',
    label: 'Anna Maria',
    value: 'Anna Maria',
    tokenStart: 6,
    tokenEnd: 16,
    entityId: 'p1',
  });

  expect(manager.query).toBe('beach person:"Anna Maria" person:ann');
  expect(manager.selectedTypedSearchChoices.get('person:"Anna Maria"')).toEqual(
    expect.objectContaining({
      tokenRaw: 'person:"Anna Maria"',
      key: 'person',
      id: 'p1',
      label: 'Anna Maria',
      value: 'Anna Maria',
    }),
  );
  expect(manager.selectedTypedSearchChoices.get('person:6:25:person:"Anna Maria"')).toEqual(
    expect.objectContaining({ key: 'person', id: 'p1' }),
  );
  expect(manager.selectedTypedSearchChoices.has('person:ann')).toBe(false);
});
```

Component test:

```ts
it('selecting a live person row applies the filter and does not navigate to person', async () => {
  const manager = new GlobalSearchManager();
  const activateSpy = vi.spyOn(manager, 'activate');
  manager.open();
  manager.setQuery('beach person:ann');
  manager.setInputCaret('beach person:ann'.length);
  manager.liveTypedSearchStatus = {
    status: 'ok',
    key: 'person',
    total: 1,
    items: [
      {
        id: 'person:6:16:p1',
        key: 'person',
        label: 'Anna Maria',
        value: 'Anna Maria',
        tokenStart: 6,
        tokenEnd: 16,
        entityId: 'p1',
      },
    ],
  };
  render(GlobalSearch, { props: { manager } });

  await user.click(screen.getByRole('option', { name: /Anna Maria/i }));

  expect(manager.query).toBe('beach person:"Anna Maria"');
  expect(activateSpy).not.toHaveBeenCalledWith('person', expect.anything());
});
```

- [ ] **Step 2: Run selection tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live person"
```

Expected: FAIL until selection stores resolver choices.

- [ ] **Step 3: Store selected resolver choice**

Update `selectLiveTypedSearchChoice()` so it stores the selected entity against the rewritten token, not the pre-rewrite draft token:

```ts
const activeToken = this.activeTypedSearchToken;
const { text, caret } = rewriteTypedSearchToken(this.query, activeToken, {
  key: choice.key,
  value: choice.value,
});
this.query = text;
this.skipNextLiveTypedSearchForCaret = caret;
const parsedAfterRewrite = this.parseTypedSearchDraft(text);
const rewrittenToken = getActiveTypedSearchToken(parsedAfterRewrite, caret);
if (choice.key === 'person' && choice.entityId && rewrittenToken?.key === 'person') {
  const selectedChoice: TypedSearchChoice = {
    tokenRaw: rewrittenToken.raw,
    key: 'person',
    id: choice.entityId,
    label: choice.label,
    value: rewrittenToken.value,
  };
  const tokenKey = `${rewrittenToken.key}:${rewrittenToken.start}:${rewrittenToken.end}:${rewrittenToken.raw}`;
  this.selectedTypedSearchChoices.set(rewrittenToken.raw, selectedChoice);
  this.selectedTypedSearchChoices.set(tokenKey, selectedChoice);
}
```

Task 1 of `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-05-polish.md` updates `resolveTypedSearchFilters` selected-choice lookup to prefer span identity. The raw rewritten-token key remains temporarily for current resolver compatibility until that polish task lands.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live person|typed search"
```

Expected: PASS.

- [ ] **Step 5: Commit person selection**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/__tests__/global-search.spec.ts
git commit -m "feat(web): apply live person filter choices"
```

## Task 4: People Plan Verification

**Files:**

- No production edits

- [ ] **Step 1: Run focused people checks**

Run:

```bash
pnpm --dir web exec prettier --check src/lib/utils/typed-search src/lib/managers/global-search-manager.svelte.ts src/lib/components/global-search
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Commit formatting only if needed**

```bash
git status --short
```

If formatting changed files:

```bash
git add web/src/lib
git commit -m "chore(web): format live person filter suggestions"
```

If the worktree is clean, do not commit.
