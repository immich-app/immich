# Live Typed Filter Suggestions 05 Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the edge-case gaps for live typed-filter suggestions and add regression coverage across parser, manager, UI, docs, and one browser smoke path.

**Architecture:** Keep the feature anchored in pure parser metadata, manager-owned request orchestration, and the dedicated filter-match section. Harden token identity, invalidation, keyboard behavior, timeout handling, quiet draft validation, and documentation after people, tags, country, and city work is present.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, Playwright, existing global search manager and typed-search utilities.

---

## Prerequisite

Complete and verify these plans first:

- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-01-foundation.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-02-people.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-03-tags.md`
- `docs/superpowers/plans/2026-05-06-live-typed-filter-suggestions-04-location.md`

This plan assumes live suggestions already work for `person:`, `tag:`, `country:`, and non-empty `city:`.

## File Structure

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`
  - Add stable span-based token identity to resolution/scalar tokens and keep draft scalar validation quiet in issue rows but visible on token chips.
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
  - Add identity, quoted cursor, invalid scalar draft, and repeated-token tests.
- Modify: `web/src/lib/utils/typed-search/typed-search-resolver.ts`
  - Use span identity before raw-token fallback when consuming selected live entity choices.
- Modify: `web/src/lib/utils/typed-search/typed-search-resolver.spec.ts`
  - Cover repeated tokens with identical raw text and one selected live choice.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Harden invalidation, IME composition, unsupported/unterminated tokens, timeout states, and close abort cleanup.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Add manager regression tests for cursor movement, selected-choice invalidation, IME, stale responses, timeout, and close aborts.
- Modify: `web/src/lib/components/global-search/live-typed-filter-section.svelte`
  - Add stable test hooks and secondary labels for city/country display.
- Modify: `web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts`
  - Cover secondary labels, timeout rows, and keyboard-selectable row labels.
- Modify: `web/src/lib/components/global-search/global-search.svelte`
  - Preserve section ordering and Enter behavior for filter rows versus top search.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Cover section ordering, filter-row Enter, top-search Enter, no navigation-section reuse, and modal/dropdown parity.
- Modify: `web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts`
  - Cover red draft scalar tokens and resolved live tokens.
- Modify: `docs/docs/features/search-palette.md`
  - Document live typed-filter suggestions and supported keys.
- Modify: `e2e/src/specs/web/global-search.e2e-spec.ts`
  - Add one browser smoke test for selecting a live person filter and submitting the typed search.

## Task 0: Baseline

**Files:**

- No production edits

- [ ] **Step 1: Run full focused live typed-filter suite**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-resolver.spec.ts src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts
```

Expected: PASS after the location plan.

## Task 1: Span Identity For Selected Choices

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-resolver.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-resolver.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`

- [ ] **Step 1: Write failing parser and resolver identity tests**

Parser tests:

```ts
it('assigns stable span identities to repeated resolution tokens', () => {
  const result = parseTypedSearch('person:ann person:ann', { mode: 'draft' });

  expect(result.resolutionTokens.map((token) => token.identity)).toEqual([
    'person:0:10:person:ann',
    'person:11:21:person:ann',
  ]);
});

it('assigns span identities to scalar tokens too', () => {
  const result = parseTypedSearch('country:Germany city:Berlin', { mode: 'draft' });

  expect(result.scalarTokens.map((token) => token.identity)).toEqual([
    'country:0:15:country:Germany',
    'city:16:27:city:Berlin',
  ]);
});
```

Resolver test:

```ts
it('uses span identity before raw token fallback for repeated selected live choices', async () => {
  vi.mocked(searchPerson).mockResolvedValue([{ id: 'person-2', name: 'Ann Search' } as never]);
  const parsed = parseTypedSearch('person:ann person:ann', { mode: 'draft' });
  const selectedChoices = new Map([
    [
      parsed.resolutionTokens[0].identity,
      { tokenRaw: 'person:ann', key: 'person' as const, id: 'person-1', label: 'Ann Live', value: 'ann' },
    ],
  ]);

  const result = await resolveTypedSearchFilters(parsed, { selectedChoices });

  expect(searchPerson).toHaveBeenCalledTimes(1);
  expect(result).toMatchObject({ ok: true });
  if (result.ok) {
    expect(result.filters.personIds).toEqual(['person-1', 'person-2']);
  }
});
```

Manager test:

```ts
it('does not leak a selected live choice between repeated equal raw tokens', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('person:ann person:ann');
  manager.setInputCaret('person:ann'.length);

  manager.selectLiveTypedSearchChoice({
    id: 'person:0:10:p1',
    key: 'person',
    label: 'Ann Live',
    value: 'Ann Live',
    tokenStart: 0,
    tokenEnd: 10,
    entityId: 'person-1',
  });

  expect(manager.query).toBe('person:"Ann Live" person:ann');
  expect(manager.selectedTypedSearchChoices.has('person:0:17:person:"Ann Live"')).toBe(true);
  expect(manager.selectedTypedSearchChoices.has('person:0:10:person:ann')).toBe(false);
});
```

- [ ] **Step 2: Run identity tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-resolver.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts -t "span identities|span identity|repeated equal raw tokens"
```

Expected: FAIL because resolution/scalar tokens do not expose `identity`, and the resolver still checks raw token text first.

- [ ] **Step 3: Add token identity to parser and resolver**

In `typed-search-parser.ts`, add:

```ts
export type TypedSearchTokenIdentity = `${TypedSearchFilterKey}:${number}:${number}:${string}`;

export function getTypedSearchTokenIdentity(token: {
  key: TypedSearchFilterKey;
  start: number;
  end: number;
  raw: string;
}): TypedSearchTokenIdentity {
  return `${token.key}:${token.start}:${token.end}:${token.raw}`;
}
```

Extend token types:

```ts
export type TypedSearchResolutionToken = {
  kind: 'resolution';
  key: TypedSearchResolutionKey;
  raw: string;
  value: string;
  start: number;
  end: number;
  identity: TypedSearchTokenIdentity;
};

export type TypedSearchScalarToken = {
  kind: 'scalar';
  key: Exclude<TypedSearchFilterKey, TypedSearchResolutionKey>;
  raw: string;
  value: string;
  normalizedValue: unknown;
  start: number;
  end: number;
  identity: TypedSearchTokenIdentity;
};
```

When pushing scalar and resolution tokens, copy `piece.start`, `piece.end`, and `getTypedSearchTokenIdentity({ key, start: piece.start, end: piece.end, raw: piece.raw })`.

In `typed-search-resolver.ts`, change selected-choice lookup:

```ts
function getSelectedChoice(
  selectedChoices: Map<string, TypedSearchChoice> | undefined,
  token: TypedSearchResolutionToken,
): TypedSearchChoice | undefined {
  return selectedChoices?.get(token.identity) ?? selectedChoices?.get(token.raw);
}
```

Use:

```ts
const unresolvedTokens = parsed.resolutionTokens.filter((token) => !getSelectedChoice(context.selectedChoices, token));
```

and:

```ts
const selectedChoice = getSelectedChoice(context.selectedChoices, token);
```

In `global-search-manager.svelte.ts`, use the helper when storing live choices after the token has been rewritten and reparsed:

```ts
const parsedAfterRewrite = this.parseTypedSearchDraft(text);
const rewrittenToken = getActiveTypedSearchToken(parsedAfterRewrite, caret);
if (isLiveTypedSearchToken(rewrittenToken)) {
  const spanKey = getTypedSearchTokenIdentity(rewrittenToken);
  const selectedChoice = this.selectedChoiceFromLiveChoice(choice, rewrittenToken);
  if (selectedChoice) {
    this.selectedTypedSearchChoices.set(spanKey, selectedChoice);
  }
}
```

Do not store raw-token fallback entries for live choices. Keep raw-token keys only for manually chosen ambiguity rows created by the existing Enter resolver.

- [ ] **Step 4: Run identity tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-resolver.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts -t "span identities|span identity|repeated equal raw tokens"
```

Expected: PASS.

- [ ] **Step 5: Commit span identity hardening**

```bash
git add web/src/lib/utils/typed-search/typed-search-parser.ts web/src/lib/utils/typed-search/typed-search-parser.spec.ts web/src/lib/utils/typed-search/typed-search-resolver.ts web/src/lib/utils/typed-search/typed-search-resolver.spec.ts web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "feat(web): key typed search choices by token span"
```

## Task 2: Draft Validation And Token Invalidation

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts`

- [ ] **Step 1: Write failing draft validation and invalidation tests**

Parser test:

```ts
it('keeps invalid scalar tokens red in draft mode without suppressing their token issue', () => {
  const result = parseTypedSearch('rating:9 favorite:maybe', { mode: 'draft' });

  expect(result.issues.map((issue) => issue.code)).toEqual(['invalid-rating', 'invalid-favorite']);
  expect(result.displayTokens).toEqual([
    expect.objectContaining({ raw: 'rating:9', status: 'error' }),
    expect.objectContaining({ raw: 'favorite:maybe', status: 'error' }),
  ]);
});
```

Manager tests:

```ts
it('does not show detailed issue rows for invalid scalar tokens until Enter', () => {
  const manager = new GlobalSearchManager();

  manager.setQuery('rating:9');

  expect(manager.typedSearchDisplayTokens[0]).toMatchObject({ raw: 'rating:9', status: 'error' });
  expect(manager.typedSearchIssues).toEqual([]);
});

it('clears a selected live choice when the token raw text changes', () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  manager.selectLiveTypedSearchChoice({
    id: 'person:0:10:p1',
    key: 'person',
    label: 'Ann Live',
    value: 'Ann Live',
    tokenStart: 0,
    tokenEnd: 10,
    entityId: 'person-1',
  });

  manager.setQuery('person:anna');

  expect([...manager.selectedTypedSearchChoices.keys()]).toEqual([]);
});
```

Token rail test:

```ts
it('renders draft scalar errors with the error status color', () => {
  render(TypedSearchTokenRail, {
    props: {
      tokens: [
        {
          raw: 'rating:9',
          key: 'rating',
          value: '9',
          status: 'error',
          issue: { code: 'invalid-rating', raw: 'rating:9', key: 'rating', value: '9', message: 'Rating must be 0-5' },
        },
      ],
    },
  });

  expect(screen.getByTestId('typed-search-token-rating')).toHaveAttribute('data-status', 'error');
});
```

- [ ] **Step 2: Run draft validation tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts -t "invalid scalar|detailed issue rows|raw text changes|draft scalar errors"
```

Expected: FAIL if draft parsing drops scalar issues, manager shows issue rows too early, or selected choices survive token edits.

- [ ] **Step 3: Harden draft validation and invalidation**

In `parseTypedSearch()`, suppress only `empty-value` in draft mode:

```ts
const suppressDraftEmptyValue = mode === 'draft' && issue.code === 'empty-value';
if (!suppressDraftEmptyValue) {
  issues.push(issue);
}
```

In `GlobalSearchManager.parseTypedSearchDraft()`, keep row issues quiet while retaining display token status:

```ts
this.typedSearchDisplayTokens = parsed.displayTokens;
this.typedSearchPlainQuery = parsed.queryText;
this.typedSearchIssues = [];
this.typedSearchChoices = [];
this.reconcileSelectedTypedSearchChoices(parsed);
```

Add:

```ts
private reconcileSelectedTypedSearchChoices(parsed: TypedSearchParseResult) {
  const validSpanKeys = new Set(parsed.resolutionTokens.map((token) => token.identity));
  const validRawKeys = new Set(parsed.resolutionTokens.map((token) => token.raw));
  for (const key of this.selectedTypedSearchChoices.keys()) {
    if (!validSpanKeys.has(key) && !validRawKeys.has(key)) {
      this.selectedTypedSearchChoices.delete(key);
    }
  }
}
```

Keep raw-token keys only for ambiguity choices selected after Enter:

```ts
selectTypedSearchChoice(choice: TypedSearchChoice) {
  this.selectedTypedSearchChoices.set(choice.tokenRaw, choice);
  // existing issue and display-token updates stay unchanged
}
```

- [ ] **Step 4: Run draft validation tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts -t "invalid scalar|detailed issue rows|raw text changes|draft scalar errors"
```

Expected: PASS.

- [ ] **Step 5: Commit validation and invalidation hardening**

```bash
git add web/src/lib/utils/typed-search/typed-search-parser.ts web/src/lib/utils/typed-search/typed-search-parser.spec.ts web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts
git commit -m "fix(web): harden live typed filter draft validation"
```

## Task 3: Cursor, IME, Timeout, And Abort Edge Cases

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`

- [ ] **Step 1: Write failing manager edge-case tests**

Add:

```ts
it('clears the live section when the caret moves outside supported typed tokens', async () => {
  vi.useFakeTimers();
  const manager = new GlobalSearchManager();

  manager.setQuery('beach person:ann');
  manager.setInputCaret('beach person:ann'.length);
  expect(manager.activeTypedSearchToken).toMatchObject({ key: 'person' });

  manager.setInputCaret(2);
  await vi.advanceTimersByTimeAsync(200);

  expect(manager.activeTypedSearchToken).toBeUndefined();
  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  vi.useRealTimers();
});

it('does not request live suggestions while an IME composition is active', async () => {
  vi.useFakeTimers();
  const manager = new GlobalSearchManager();

  manager.setInputComposing(true);
  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  await vi.advanceTimersByTimeAsync(200);
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).not.toHaveBeenCalled();

  manager.setInputComposing(false);
  await vi.advanceTimersByTimeAsync(150);
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).toHaveBeenCalledOnce();
  vi.useRealTimers();
});

it('does not request live suggestions for unterminated quoted tokens', async () => {
  vi.useFakeTimers();
  const manager = new GlobalSearchManager();

  manager.setQuery('person:"Ann');
  manager.setInputCaret('person:"Ann'.length);
  await vi.advanceTimersByTimeAsync(200);

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  expect(liveTypedSearchMock.resolveLiveTypedSearchSuggestions).not.toHaveBeenCalled();
  vi.useRealTimers();
});

it('sets timeout status when live suggestion lookup times out', async () => {
  vi.useFakeTimers();
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockRejectedValue(
    new DOMException('The operation timed out', 'TimeoutError'),
  );
  const manager = new GlobalSearchManager();

  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  await vi.advanceTimersByTimeAsync(150);
  await Promise.resolve();

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'timeout', key: 'person' });
  vi.useRealTimers();
});

it('aborts live requests and ignores late writes after close', async () => {
  vi.useFakeTimers();
  let resolveLookup!: (value: unknown) => void;
  liveTypedSearchMock.resolveLiveTypedSearchSuggestions.mockImplementation(
    () => new Promise((resolve) => (resolveLookup = resolve)),
  );
  const manager = new GlobalSearchManager();

  manager.open();
  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  await vi.advanceTimersByTimeAsync(150);
  manager.close();
  resolveLookup({ status: 'ok', key: 'person', total: 1, items: [] });
  await Promise.resolve();

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run manager edge-case tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "caret moves|IME composition|unterminated quoted|times out|late writes"
```

Expected: FAIL until the manager filters these states consistently.

- [ ] **Step 3: Harden manager request orchestration**

In `updateActiveTypedSearchToken()`, reject syntactically broken tokens:

```ts
if (token?.issue?.code === 'unterminated-quote') {
  this.activeTypedSearchToken = undefined;
  this.clearLiveTypedSearchRequest();
  this.liveTypedSearchStatus = { status: 'idle' };
  return;
}
```

Add a cleanup helper:

```ts
private clearLiveTypedSearchRequest() {
  if (this.liveTypedSearchTimer) {
    clearTimeout(this.liveTypedSearchTimer);
    this.liveTypedSearchTimer = null;
  }
  this.liveTypedSearchController?.abort();
  this.liveTypedSearchController = null;
  this.liveTypedSearchRequestId++;
}
```

Use `clearLiveTypedSearchRequest()` when the active token is missing, composition starts, draft state clears, and the palette closes.

Store the composite request signal in a local `signal` variable before calling the resolver, then map timeout from `signal.reason` in the live request catch block:

```ts
const isTimeout = signal.aborted && signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError';
if (isTimeout || (error instanceof DOMException && error.name === 'TimeoutError')) {
  if (requestId === this.liveTypedSearchRequestId) {
    this.liveTypedSearchStatus = { status: 'timeout', key };
  }
  return;
}
```

- [ ] **Step 4: Run manager edge-case tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "caret moves|IME composition|unterminated quoted|times out|late writes"
```

Expected: PASS.

- [ ] **Step 5: Commit manager edge-case hardening**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "fix(web): harden live typed filter request lifecycle"
```

## Task 4: UI Ordering And Keyboard Behavior

**Files:**

- Modify: `web/src/lib/components/global-search/live-typed-filter-section.svelte`
- Modify: `web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts`
- Modify: `web/src/lib/components/global-search/global-search.svelte`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing UI ordering and keyboard tests**

Live section test:

```ts
it('renders city secondary labels and timeout rows', () => {
  const { rerender } = render(LiveTypedFilterSection, {
    props: {
      status: {
        status: 'ok',
        key: 'city',
        total: 1,
        items: [
          {
            id: 'city:0:8:Berlin',
            key: 'city',
            label: 'Berlin',
            value: 'Berlin',
            tokenStart: 0,
            tokenEnd: 8,
            secondaryLabel: 'Germany',
          },
        ],
      },
      onSelect: vi.fn(),
    },
  });

  expect(screen.getByText('Germany')).toBeInTheDocument();

  rerender({ status: { status: 'timeout', key: 'city' }, onSelect: vi.fn() });
  expect(screen.getByText(/city matches timed out/i)).toBeInTheDocument();
});
```

Global search tests:

```ts
it('renders live filter matches before the top result and outside normal people or tag sections', () => {
  const manager = new GlobalSearchManager();
  manager.open();
  manager.setQuery('person:ann');
  manager.liveTypedSearchStatus = {
    status: 'ok',
    key: 'person',
    total: 1,
    items: [
      {
        id: 'person:0:10:p1',
        key: 'person',
        label: 'Ann Live',
        value: 'Ann Live',
        tokenStart: 0,
        tokenEnd: 10,
        entityId: 'p1',
      },
    ],
  };
  render(GlobalSearch, { props: { manager } });

  const liveSection = screen.getByTestId('live-typed-filter-section');
  const topResult = screen.getByTestId('cmdk-top-result');

  expect(liveSection.compareDocumentPosition(topResult) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole('group', { name: /person filter matches/i })).toBeInTheDocument();
  const peopleGroup = screen.queryByRole('group', { name: /^people$/i });
  if (peopleGroup) {
    expect(peopleGroup).not.toHaveTextContent('Ann Live');
  }
});

it('uses Enter on a highlighted live filter row to rewrite the token instead of submitting search', async () => {
  const user = userEvent.setup();
  const manager = new GlobalSearchManager();
  const activateSearchSpy = vi.spyOn(manager, 'activateSearch');
  manager.open();
  manager.setQuery('person:ann');
  manager.setInputCaret('person:ann'.length);
  manager.liveTypedSearchStatus = {
    status: 'ok',
    key: 'person',
    total: 1,
    items: [
      {
        id: 'person:0:10:p1',
        key: 'person',
        label: 'Ann Live',
        value: 'Ann Live',
        tokenStart: 0,
        tokenEnd: 10,
        entityId: 'p1',
      },
    ],
  };
  render(GlobalSearch, { props: { manager } });

  await user.keyboard('{ArrowDown}{Enter}');

  expect(manager.query).toBe('person:"Ann Live"');
  expect(activateSearchSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run UI tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "secondary labels|filter matches before|highlighted live filter"
```

Expected: FAIL until the section exposes stable hooks, timeout copy, secondary labels, and correct ordering.

- [ ] **Step 3: Add UI hooks, timeout copy, and keyboard-safe ordering**

In `i18n/en.json`, add:

```json
"cmdk_filter_match_timeout": "{entity} matches timed out",
```

In `live-typed-filter-section.svelte`, add `data-testid="live-typed-filter-section"` to `Command.Group`, render `choice.secondaryLabel`, and add the timeout branch:

```svelte
{:else if status.status === 'timeout'}
  <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
    {$t('cmdk_filter_match_timeout', { values: { entity } })}
  </div>
```

For each live row, set the value to an action-specific label so keyboard selection stays distinct from navigation rows:

```svelte
<Command.Item value={`filter:${choice.id}:${choice.label}`} onSelect={() => onSelect(choice)} class="group">
```

In `global-search.svelte`, keep `LiveTypedFilterSection` as the first list section after typed issue rows and before `data-cmdk-top-result-*` groups in both presentation modes. Add `data-testid="cmdk-top-result"` to the rendered top-result group for the active top-result variant so ordering tests can use a stable hook without depending on whether search, command, or navigation is promoted.

- [ ] **Step 4: Run UI tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "secondary labels|filter matches before|highlighted live filter"
```

Expected: PASS.

- [ ] **Step 5: Commit UI polish**

```bash
git add web/src/lib/components/global-search/live-typed-filter-section.svelte web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts web/src/lib/components/global-search/global-search.svelte web/src/lib/components/global-search/__tests__/global-search.spec.ts i18n/en.json
git commit -m "fix(web): polish live typed filter section behavior"
```

## Task 5: Final Commit Behavior And Docs

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
- Modify: `docs/docs/features/search-palette.md`

- [ ] **Step 1: Write failing final behavior tests**

Manager tests:

```ts
it('keeps duplicate scalar live tokens commit-blocking on Enter', async () => {
  const manager = new GlobalSearchManager();
  manager.setQuery('country:Germany country:France');

  await manager.activateSearch(manager.query);

  expect(manager.typedSearchIssues).toEqual([expect.objectContaining({ code: 'duplicate-filter', key: 'country' })]);
});

it('submits selected live scalar values through the existing all-or-nothing resolver', async () => {
  typedSearchMock.resolveTypedSearchFilters.mockResolvedValue({
    ok: true,
    queryText: 'beach',
    filters: { ...createFilterState(), city: 'Paris' },
    personNames: new Map(),
    tagNames: new Map(),
  });
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
  });

  await manager.activateSearch(manager.query);

  expect(typedSearchMock.resolveTypedSearchFilters).toHaveBeenCalledWith(
    expect.objectContaining({ raw: 'beach city:Paris' }),
    expect.anything(),
  );
});
```

Component test:

```ts
it('pressing Enter on the top search row still submits the whole typed search', async () => {
  const user = userEvent.setup();
  const manager = new GlobalSearchManager();
  const activateSearchSpy = vi.spyOn(manager, 'activateSearch').mockResolvedValue();
  manager.open();
  manager.setQuery('beach city:Paris');
  render(GlobalSearch, { props: { manager } });

  await user.keyboard('{Enter}');

  expect(activateSearchSpy).toHaveBeenCalledWith('beach city:Paris');
});
```

- [ ] **Step 2: Run final behavior tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "duplicate scalar|selected live scalar|top search row"
```

Expected: FAIL if Enter bypasses parser issues, scalar live values skip final resolver validation, or top search Enter regresses.

- [ ] **Step 3: Fix final behavior and update docs**

Keep `activateSearch()` unchanged in principle: parse commit mode, block parser issues, then call `resolveTypedSearchFilters()`. If a test fails because selected scalar values bypass the parser, remove the bypass; scalar live rows must only rewrite `manager.query`.

Add this section to `docs/docs/features/search-palette.md` after `## Top result band`:

````markdown
## Typed Filter Suggestions

On searchable pages, typed filters can be mixed with free-text search:

```text
beach person:anna tag:travel country:Germany city:Berlin
```

While the cursor is inside `person:`, `tag:`, `country:`, or non-empty `city:`, the palette shows a compact filter-match section before the normal results. Selecting a row rewrites only that token to the canonical value, such as `person:"Anna Maria"`, and keeps the final search under the normal Enter validation path.

Live filter rows apply filters; they do not navigate to person or tag pages. `camera:` still resolves only when the search is submitted.
````

- [ ] **Step 4: Run final behavior and docs formatting checks**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts -t "duplicate scalar|selected live scalar|top search row"
pnpm --dir web exec prettier --check ../docs/docs/features/search-palette.md
```

Expected: PASS.

- [ ] **Step 5: Commit final behavior and docs**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts web/src/lib/components/global-search/global-search.svelte web/src/lib/components/global-search/__tests__/global-search.spec.ts docs/docs/features/search-palette.md
git commit -m "docs: document live typed filter suggestions"
```

## Task 6: Browser Smoke Test And Release Verification

**Files:**

- Modify: `e2e/src/specs/web/global-search.e2e-spec.ts`
- No production edits after the test passes

- [ ] **Step 1: Write failing browser smoke test**

Add this test inside `test.describe('global search palette', () => { ... })`:

```ts
test('typed person filter suggestions can be selected and submitted', async ({ page }) => {
  const person = await createSearchablePerson(admin.accessToken, 'Live Filter Person');

  await page.goto('/photos');
  await page.getByTestId('cmdk-input-trigger').waitFor({ state: 'visible' });
  await page.keyboard.press('Control+k');
  const dialog = page.getByRole('dialog');
  const input = dialog.getByRole('combobox');
  await input.fill('person:Live');

  const filterGroup = dialog.getByRole('group', { name: /person filter matches/i });
  await expect(filterGroup).toBeVisible();
  await filterGroup.getByText('Live Filter Person').click();

  await expect(input).toHaveValue('person:"Live Filter Person"');
  await input.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/photos.*people=${person.id}`));
});
```

- [ ] **Step 2: Run browser smoke test and verify failure**

Run:

```bash
pnpm --dir e2e exec playwright test --project=web e2e/src/specs/web/global-search.e2e-spec.ts -g "typed person filter suggestions"
```

Expected: FAIL before the final wiring is fully correct, or PASS if unit/component work already covered the path.

- [ ] **Step 3: Fix only the behavior exposed by the smoke test**

If the smoke test fails, use its first failing assertion to choose the smallest fix:

```ts
// Expected final URL shape after a selected live person filter.
expect(new URL(page.url()).searchParams.get('people')).toContain(person.id);
```

Do not add new feature behavior in this step. Limit edits to the bug needed for the smoke path.

- [ ] **Step 4: Run full verification**

Run:

```bash
pnpm --filter @immich/sdk build
pnpm --dir web exec prettier --check src/lib/utils/typed-search src/lib/managers/global-search-manager.svelte.ts src/lib/components/global-search ../docs/docs/features/search-palette.md
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-resolver.spec.ts src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts src/lib/components/global-search/__tests__/typed-search-token-rail.spec.ts
pnpm --dir e2e exec playwright test --project=web e2e/src/specs/web/global-search.e2e-spec.ts -g "typed person filter suggestions"
```

Expected: all pass.

- [ ] **Step 5: Commit smoke test and final fixes**

```bash
git add e2e/src/specs/web/global-search.e2e-spec.ts web/src/lib docs/docs/features/search-palette.md i18n/en.json
git commit -m "test(e2e): cover live typed filter suggestions"
```
