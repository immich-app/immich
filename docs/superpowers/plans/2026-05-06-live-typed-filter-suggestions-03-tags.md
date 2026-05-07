# Live Typed Filter Suggestions 03 Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live `tag:` suggestions that apply tag filters from the dedicated filter-match section.

**Architecture:** Reuse the foundation parser spans, live filter section, and the people plan's debounced manager request path. Add tag lookup to the live suggestion utility, then let live tag rows rewrite only the active token and store the selected tag for the final Enter resolver.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, bits-ui Command, existing `@immich/sdk` filter suggestions.

---

## Prerequisite

Complete and verify these plans first:

- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-01-foundation.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-02-people.md`

This plan assumes `GlobalSearchManager` already schedules debounced live requests for `person:` tokens and exposes `selectLiveTypedSearchChoice(choice)`.

## File Structure

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`
  - Add `tag:` lookup, filtering, and `LiveTypedSearchChoice` mapping.
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
  - Add mocked `getFilterSuggestions` tests for empty, narrowed, scoped, no-match, and error behavior.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Allow the live scheduler to run for active `tag:` tokens and store selected tag choices.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Cover debounced tag requests, empty tag requests, unsupported `camera:` staying idle, and tag choice storage.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Cover selecting a tag filter row without navigating to the tag page.

## Task 0: Baseline

**Files:**

- No production edits

- [ ] **Step 1: Run current live suggestion tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: PASS after the people plan.

## Task 1: Tag Live Suggestion Utility

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`

- [ ] **Step 1: Write failing tag utility tests**

Extend `typed-search-live-suggestions.spec.ts` with these tests:

```ts
it('loads initial tag suggestions for an empty tag token', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: [],
    cameraMakes: [],
    tags: [
      { id: 'tag-1', value: 'Travel' },
      { id: 'tag-2', value: 'Family' },
    ],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('tag:', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(getFilterSuggestions).toHaveBeenCalledWith({ withSharedSpaces: true }, expect.anything());
  expect(result).toEqual({
    status: 'ok',
    key: 'tag',
    total: 2,
    items: [
      expect.objectContaining({ key: 'tag', label: 'Travel', value: 'Travel', entityId: 'tag-1' }),
      expect.objectContaining({ key: 'tag', label: 'Family', value: 'Family', entityId: 'tag-2' }),
    ],
  });
});

it('narrows tag suggestions by the active tag token value', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: [],
    cameraMakes: [],
    tags: [
      { id: 'tag-1', value: 'Travel' },
      { id: 'tag-2', value: 'Work' },
      { id: 'tag-3', value: 'Family/Travel' },
    ],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('beach tag:trav', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] });

  expect(result).toMatchObject({ status: 'ok', key: 'tag', total: 2 });
  if (result.status === 'ok') {
    expect(result.items.map((item) => item.label)).toEqual(['Travel', 'Family/Travel']);
  }
});

it('uses space-scoped tag suggestions when spaceId is present', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: [],
    cameraMakes: [],
    tags: [{ id: 'space-tag-1', value: 'Shared Travel' }],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('tag:travel', { mode: 'draft' });

  const result = await resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0], spaceId: 'space-1' });

  expect(getFilterSuggestions).toHaveBeenCalledWith({ spaceId: 'space-1' }, expect.anything());
  expect(result).toMatchObject({ status: 'ok', key: 'tag' });
});

it('returns empty when no tags match the active token', async () => {
  vi.mocked(getFilterSuggestions).mockResolvedValue({
    people: [],
    countries: [],
    cameraMakes: [],
    tags: [{ id: 'tag-1', value: 'Travel' }],
    ratings: [],
    mediaTypes: [],
    hasUnnamedPeople: false,
  } as never);
  const parsed = parseTypedSearch('tag:zzzz', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'empty',
    key: 'tag',
  });
});

it('returns a quiet live error when tag suggestions fail', async () => {
  vi.mocked(getFilterSuggestions).mockRejectedValue(new Error('network down'));
  const parsed = parseTypedSearch('tag:travel', { mode: 'draft' });

  await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
    status: 'error',
    key: 'tag',
    message: 'network down',
  });
});
```

- [ ] **Step 2: Run tag utility tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts -t "tag"
```

Expected: FAIL because the resolver still returns `idle` for `tag:`.

- [ ] **Step 3: Implement tag live suggestions**

In `typed-search-live-suggestions.ts`, add:

```ts
type TagSuggestion = { id: string; name?: string | null; value?: string | null };

function liveSuggestionScope(context: LiveTypedSearchContext) {
  return context.spaceId ? { spaceId: context.spaceId } : { withSharedSpaces: true };
}

function tagLabel(tag: TagSuggestion) {
  return tag.value || tag.name || tag.id;
}

function tagChoice(token: TypedSearchTokenSpan, tag: TagSuggestion): LiveTypedSearchChoice {
  const label = tagLabel(tag);
  return {
    id: makeChoiceId(token, tag.id, 'tag'),
    key: 'tag',
    label,
    value: label,
    tokenStart: token.start,
    tokenEnd: token.end,
    entityId: tag.id,
  };
}

async function resolveTagLiveSuggestions(
  context: LiveTypedSearchContext,
  token: TypedSearchTokenSpan,
): Promise<LiveTypedSearchStatus> {
  try {
    const value = token.value.trim().toLowerCase();
    const response = await getFilterSuggestions(liveSuggestionScope(context), { signal: context.signal });
    const matches = response.tags
      .filter((tag) => !value || tagLabel(tag).toLowerCase().includes(value))
      .slice(0, LIVE_RESULT_LIMIT)
      .map((tag) => tagChoice(token, tag));
    return matches.length === 0
      ? { status: 'empty', key: 'tag' }
      : { status: 'ok', key: 'tag', items: matches, total: matches.length };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    return { status: 'error', key: 'tag', message: error instanceof Error ? error.message : 'Unable to load tags' };
  }
}
```

Update the exported resolver dispatch:

```ts
if (token.key === 'tag') {
  return resolveTagLiveSuggestions(context, token);
}
```

- [ ] **Step 4: Run live suggestion utility tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit tag utility support**

```bash
git add web/src/lib/utils/typed-search/typed-search-live-suggestions.ts web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
git commit -m "feat(web): resolve live tag filter suggestions"
```

## Task 2: Manager Tag Scheduling

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing manager scheduling tests**

Add:

```ts
it('debounces live tag filter suggestions for an active tag token', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockResolvedValue({
    status: 'ok',
    key: 'tag',
    total: 1,
    items: [
      { id: 'tag:6:16:t1', key: 'tag', label: 'Travel', value: 'Travel', tokenStart: 6, tokenEnd: 16, entityId: 't1' },
    ],
  });
  const manager = new GlobalSearchManager();

  manager.setQuery('beach tag:tra');
  manager.setInputCaret('beach tag:tra'.length);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'loading', key: 'tag' });
  await vi.advanceTimersByTimeAsync(150);

  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({ activeToken: expect.objectContaining({ key: 'tag', value: 'tra' }) }),
  );
  expect(manager.liveTypedSearchStatus).toMatchObject({ status: 'ok', key: 'tag' });
  vi.useRealTimers();
});

it('debounces initial live tag suggestions for an empty tag token', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockResolvedValue({
    status: 'empty',
    key: 'tag',
  });
  const manager = new GlobalSearchManager();

  manager.setQuery('tag:');
  manager.setInputCaret('tag:'.length);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'loading', key: 'tag' });
  await vi.advanceTimersByTimeAsync(150);

  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledWith(
    expect.objectContaining({ activeToken: expect.objectContaining({ key: 'tag', value: '' }) }),
  );
  vi.useRealTimers();
});

it('keeps unsupported camera tokens out of live suggestions', async () => {
  vi.useFakeTimers();
  const manager = new GlobalSearchManager();

  manager.setQuery('camera:nik');
  manager.setInputCaret('camera:nik'.length);
  await vi.advanceTimersByTimeAsync(200);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).not.toHaveBeenCalled();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run manager scheduling tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live tag|camera tokens"
```

Expected: FAIL because `tag:` is not in the scheduler's live key set.

- [ ] **Step 3: Allow tag tokens in the live scheduler**

Replace the people-only guard in `scheduleLiveTypedSearchSuggestions()` with:

```ts
const key = this.activeTypedSearchToken.key;
const supportsLiveSuggestions = key === 'person' || key === 'tag';
if (!supportsLiveSuggestions) {
  this.liveTypedSearchStatus = { status: 'idle' };
  return;
}
```

Keep the `camera:` guard test passing by leaving `camera` out of this set.

- [ ] **Step 4: Run manager scheduling tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "live tag|camera tokens"
```

Expected: PASS.

- [ ] **Step 5: Commit manager tag scheduling**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "feat(web): schedule live tag filter suggestions"
```

## Task 3: Tag Row Selection Integration

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing tag selection tests**

Manager test:

```ts
it('selecting a live tag choice rewrites the active token and stores a resolver choice', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('beach tag:tra');
  manager.setInputCaret('beach tag:tra'.length);

  manager.selectLiveTypedSearchChoice({
    id: 'tag:6:13:t1',
    key: 'tag',
    label: 'Family Travel',
    value: 'Family Travel',
    tokenStart: 6,
    tokenEnd: 13,
    entityId: 't1',
  });

  expect(manager.query).toBe('beach tag:"Family Travel"');
  expect(manager.selectedTypedSearchChoices.get('tag:"Family Travel"')).toEqual(
    expect.objectContaining({
      tokenRaw: 'tag:"Family Travel"',
      key: 'tag',
      id: 't1',
      label: 'Family Travel',
      value: 'Family Travel',
    }),
  );
  expect(manager.selectedTypedSearchChoices.get('tag:6:25:tag:"Family Travel"')).toEqual(
    expect.objectContaining({ key: 'tag', id: 't1' }),
  );
  expect(manager.selectedTypedSearchChoices.has('tag:tra')).toBe(false);
});
```

Component test:

```ts
it('selecting a live tag row applies the filter without activating tag navigation', async () => {
  const manager = new GlobalSearchManager();
  const activateSpy = vi.spyOn(manager, 'activate');
  manager.open();
  manager.setQuery('beach tag:tra');
  manager.setInputCaret('beach tag:tra'.length);
  manager.liveTypedSearchStatus = {
    status: 'ok',
    key: 'tag',
    total: 1,
    items: [
      { id: 'tag:6:13:t1', key: 'tag', label: 'Travel', value: 'Travel', tokenStart: 6, tokenEnd: 13, entityId: 't1' },
    ],
  };

  render(GlobalSearch, { props: { manager } });
  await user.click(screen.getByRole('option', { name: /Travel/i }));

  expect(manager.query).toBe('beach tag:Travel');
  expect(activateSpy).not.toHaveBeenCalledWith('tag', expect.anything());
});
```

- [ ] **Step 2: Run tag selection tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live tag"
```

Expected: FAIL until tag choices are stored for the final resolver.

- [ ] **Step 3: Store selected tag choices**

In `selectLiveTypedSearchChoice()`, add a shared conversion:

```ts
private selectedChoiceFromLiveChoice(
  choice: LiveTypedSearchChoice,
  rewrittenToken: LiveTypedSearchToken,
): TypedSearchChoice | undefined {
  if (!choice.entityId) {
    return undefined;
  }
  if (choice.key !== 'person' && choice.key !== 'tag') {
    return undefined;
  }
  return {
    tokenRaw: rewrittenToken.raw,
    key: choice.key,
    id: choice.entityId,
    label: choice.label,
    value: rewrittenToken.value,
  };
}
```

Use it after rewriting the token and reparsing the rewritten text:

```ts
const parsedAfterRewrite = this.parseTypedSearchDraft(text);
const rewrittenToken = getActiveTypedSearchToken(parsedAfterRewrite, caret);
const selectedChoice = isLiveTypedSearchToken(rewrittenToken)
  ? this.selectedChoiceFromLiveChoice(choice, rewrittenToken)
  : undefined;
if (selectedChoice && rewrittenToken) {
  const spanKey = `${rewrittenToken.key}:${rewrittenToken.start}:${rewrittenToken.end}:${rewrittenToken.raw}`;
  this.selectedTypedSearchChoices.set(rewrittenToken.raw, selectedChoice);
  this.selectedTypedSearchChoices.set(spanKey, selectedChoice);
}
```

- [ ] **Step 4: Run tag selection tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "live tag|live person"
```

Expected: PASS.

- [ ] **Step 5: Commit tag selection**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/__tests__/global-search.spec.ts
git commit -m "feat(web): apply live tag filter choices"
```

## Task 4: Tags Plan Verification

**Files:**

- No production edits

- [ ] **Step 1: Run focused tag checks**

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
git commit -m "chore(web): format live tag filter suggestions"
```

If no files changed, do not commit.
