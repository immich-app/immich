# Live Typed Filter Suggestions 01 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the shared parser, caret, manager-state, and UI shell needed for live typed-filter suggestions.

**Architecture:** Extend the pure typed-search parser with token spans and draft-mode parsing, then let `GlobalSearchManager` derive the active token from the input caret. Add a dedicated live filter-match section component and manager state, but keep provider fetches idle until the provider-specific plans wire people, tags, and location.

**Tech Stack:** Svelte 5, TypeScript, Vitest, Testing Library Svelte, bits-ui Command, existing `@immich/sdk` mocks, existing global search manager.

---

## File Structure

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`
  - Add token span metadata, draft-mode parsing, active-token derivation, and token rewrite helpers.
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
  - Add parser span, draft parse, active token, and canonical rewrite tests.
- Create: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`
  - Define live suggestion types and return `idle` before provider plans add lookups.
- Create: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`
  - Lock the initial `idle` behavior and type shape.
- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
  - Track input caret/composition and expose live suggestion state.
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  - Cover caret-active token state, empty draft parsing, selected-choice invalidation, and close cleanup.
- Create: `web/src/lib/components/global-search/live-typed-filter-section.svelte`
  - Render the dedicated section shell for live filter suggestions.
- Create: `web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts`
  - Cover loading/empty/error/ok rows and row activation.
- Modify: `web/src/lib/components/global-search/global-search.svelte`
  - Wire caret events to the manager and render the new section before the top result in modal and dropdown.
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`
  - Cover caret wiring and Enter behavior with a manually seeded live row.
- Modify: `i18n/en.json`
  - Add English labels for the live filter section.

## Task 0: Baseline

**Files:**

- Read: `docs/superpowers/specs/2026-05-06-live-typed-filter-suggestions-design.md`
- No production edits

- [ ] **Step 1: Build SDK**

Run:

```bash
pnpm --filter @immich/sdk build
```

Expected: exit 0.

- [ ] **Step 2: Run focused current typed-search tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts
```

Expected: existing tests pass before edits.

## Task 1: Parser Span Metadata And Draft Mode

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`

- [ ] **Step 1: Write failing parser tests**

Add these tests to `typed-search-parser.spec.ts`:

```ts
it('returns token spans for plain and quoted typed filters', () => {
  const result = parseTypedSearch('beach person:"Anna Maria" city:Paris');

  expect(result.tokens).toMatchObject([
    {
      raw: 'person:"Anna Maria"',
      key: 'person',
      value: 'Anna Maria',
      start: 6,
      end: 25,
      valueStart: 14,
      valueEnd: 24,
      quoted: true,
    },
    {
      raw: 'city:Paris',
      key: 'city',
      value: 'Paris',
      start: 26,
      end: 36,
      valueStart: 31,
      valueEnd: 36,
      quoted: false,
    },
  ]);
});

it('keeps empty known filters quiet in draft mode but blocking in commit mode', () => {
  const draft = parseTypedSearch('person: tag: country: city:', { mode: 'draft' });
  const commit = parseTypedSearch('person: tag: country: city:');

  expect(draft.issues).toEqual([]);
  expect(draft.tokens.map((token) => token.raw)).toEqual(['person:', 'tag:', 'country:', 'city:']);
  expect(commit.issues.map((issue) => issue.code)).toEqual([
    'empty-value',
    'empty-value',
    'empty-value',
    'empty-value',
  ]);
});

it('keeps unterminated quoted filters as draft issues', () => {
  const result = parseTypedSearch('person:"Anna Maria', { mode: 'draft' });

  expect(result.issues).toEqual([expect.objectContaining({ code: 'unterminated-quote', raw: 'person:"Anna Maria' })]);
});
```

- [ ] **Step 2: Run parser tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: FAIL because `tokens` and the parse options do not exist.

- [ ] **Step 3: Implement parser spans and draft mode**

Update `typed-search-parser.ts` with these exported types and signatures:

```ts
export type TypedSearchParseMode = 'commit' | 'draft';

export type TypedSearchTokenSpan = {
  raw: string;
  key?: TypedSearchFilterKey;
  rawKey?: string;
  value: string;
  start: number;
  end: number;
  valueStart: number;
  valueEnd: number;
  quoted: boolean;
  issue?: TypedSearchIssue;
};

export type TypedSearchParseOptions = {
  mode?: TypedSearchParseMode;
};

export type TypedSearchParseResult = {
  raw: string;
  queryText: string;
  scalarTokens: TypedSearchScalarToken[];
  resolutionTokens: TypedSearchResolutionToken[];
  displayTokens: TypedSearchDisplayToken[];
  issues: TypedSearchIssue[];
  tokens: TypedSearchTokenSpan[];
};

export function parseTypedSearch(raw: string, options: TypedSearchParseOptions = {}): TypedSearchParseResult {
  const mode = options.mode ?? 'commit';
  const pieces = splitSearch(raw);
  // existing parse loop, now pushing TypedSearchTokenSpan entries.
}
```

Replace `splitSearch()` so it records source offsets:

```ts
type ParsedPiece = {
  raw: string;
  start: number;
  end: number;
  key?: string;
  value: string;
  valueStart: number;
  valueEnd: number;
  quoted: boolean;
  issue?: 'unterminated-quote' | 'escaped-quote';
};
```

When `mode === 'draft'` and `piece.value.trim() === ''`, add a display token and `tokens` entry but do not push an `empty-value` issue. In commit mode, preserve current `empty-value` behavior.

- [ ] **Step 4: Run parser tests and verify pass**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit parser spans**

```bash
git add web/src/lib/utils/typed-search/typed-search-parser.ts web/src/lib/utils/typed-search/typed-search-parser.spec.ts
git commit -m "feat(web): add typed search token spans"
```

## Task 2: Active Token And Rewrite Helpers

**Files:**

- Modify: `web/src/lib/utils/typed-search/typed-search-parser.spec.ts`
- Modify: `web/src/lib/utils/typed-search/typed-search-parser.ts`

- [ ] **Step 1: Write failing helper tests**

Add:

```ts
import { getActiveTypedSearchToken, rewriteTypedSearchToken } from './typed-search-parser';

it('finds the cursor active typed filter token', () => {
  const result = parseTypedSearch('beach person:ann tag:family', { mode: 'draft' });

  expect(getActiveTypedSearchToken(result, 12)).toMatchObject({ raw: 'person:ann', key: 'person' });
  expect(getActiveTypedSearchToken(result, 22)).toMatchObject({ raw: 'tag:family', key: 'tag' });
  expect(getActiveTypedSearchToken(result, 3)).toBeUndefined();
});

it('rewrites only the active token and quotes whitespace values', () => {
  const parsed = parseTypedSearch('beach person:ann tag:family', { mode: 'draft' });
  const token = getActiveTypedSearchToken(parsed, 12);

  expect(token).toBeDefined();
  expect(rewriteTypedSearchToken(parsed.raw, token!, { key: 'person', value: 'Anna Maria' })).toEqual({
    text: 'beach person:"Anna Maria" tag:family',
    caret: 'beach person:"Anna Maria"'.length,
  });
});

it('normalizes unsupported aliases when rewriting', () => {
  const parsed = parseTypedSearch('beach people:ann', { mode: 'draft' });
  const token = getActiveTypedSearchToken(parsed, 12);

  expect(rewriteTypedSearchToken(parsed.raw, token!, { key: 'person', value: 'Anna' }).text).toBe('beach people:Anna');
});
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: FAIL because helper exports do not exist.

- [ ] **Step 3: Implement helpers**

Add:

```ts
export type TypedSearchRewriteValue = {
  key: TypedSearchFilterKey;
  value: string;
};

export function getActiveTypedSearchToken(
  parsed: TypedSearchParseResult,
  caret: number | null | undefined,
): TypedSearchTokenSpan | undefined {
  if (caret === null || caret === undefined) {
    return undefined;
  }
  return parsed.tokens.find((token) => caret >= token.start && caret <= token.end);
}

export function rewriteTypedSearchToken(
  raw: string,
  token: TypedSearchTokenSpan,
  next: TypedSearchRewriteValue,
): { text: string; caret: number } {
  const key = token.rawKey && normalizeFilterKey(token.rawKey) === next.key ? token.rawKey : next.key;
  const value = quoteTypedSearchValue(next.value);
  const replacement = `${key}:${value}`;
  const text = `${raw.slice(0, token.start)}${replacement}${raw.slice(token.end)}`;
  return { text, caret: token.start + replacement.length };
}

function quoteTypedSearchValue(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}
```

Do not escape embedded quotes in this task; existing typed-search syntax rejects escaped quotes.

- [ ] **Step 4: Run parser tests and verify pass**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit helpers**

```bash
git add web/src/lib/utils/typed-search/typed-search-parser.ts web/src/lib/utils/typed-search/typed-search-parser.spec.ts
git commit -m "feat(web): add typed search active token helpers"
```

## Task 3: Live Suggestion State Types

**Files:**

- Create: `web/src/lib/utils/typed-search/typed-search-live-suggestions.ts`
- Create: `web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts`

- [ ] **Step 1: Write failing live suggestion state test**

Create `typed-search-live-suggestions.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseTypedSearch } from './typed-search-parser';
import { resolveLiveTypedSearchSuggestions } from './typed-search-live-suggestions';

describe('resolveLiveTypedSearchSuggestions foundation', () => {
  it('returns idle for unsupported typed tokens', async () => {
    const parsed = parseTypedSearch('camera:nik', { mode: 'draft' });

    await expect(resolveLiveTypedSearchSuggestions({ parsed, activeToken: parsed.tokens[0] })).resolves.toEqual({
      status: 'idle',
    });
  });
});
```

- [ ] **Step 2: Run new test and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Create live suggestion types and idle resolver**

Create `typed-search-live-suggestions.ts`:

```ts
import type { TypedSearchParseResult, TypedSearchTokenSpan } from './typed-search-parser';

export type LiveTypedSearchKey = 'person' | 'tag' | 'country' | 'city';

export type LiveTypedSearchToken = TypedSearchTokenSpan & { key: LiveTypedSearchKey };

export type LiveTypedSearchChoice = {
  id: string;
  key: LiveTypedSearchKey;
  label: string;
  value: string;
  tokenStart: number;
  tokenEnd: number;
  entityId?: string;
  secondaryLabel?: string;
};

export type LiveTypedSearchStatus =
  | { status: 'idle' }
  | { status: 'loading'; key: LiveTypedSearchKey }
  | { status: 'ok'; key: LiveTypedSearchKey; items: LiveTypedSearchChoice[]; total: number }
  | { status: 'empty'; key: LiveTypedSearchKey }
  | { status: 'timeout'; key: LiveTypedSearchKey }
  | { status: 'error'; key: LiveTypedSearchKey; message: string };

export type LiveTypedSearchContext = {
  parsed: TypedSearchParseResult;
  activeToken?: TypedSearchTokenSpan;
  spaceId?: string;
  signal?: AbortSignal;
};

export function isLiveTypedSearchToken(token: TypedSearchTokenSpan | undefined): token is LiveTypedSearchToken {
  return token?.key === 'person' || token?.key === 'tag' || token?.key === 'country' || token?.key === 'city';
}

export async function resolveLiveTypedSearchSuggestions(
  _context: LiveTypedSearchContext,
): Promise<LiveTypedSearchStatus> {
  return { status: 'idle' };
}
```

- [ ] **Step 4: Run live suggestion state test**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit live suggestion state types**

```bash
git add web/src/lib/utils/typed-search/typed-search-live-suggestions.ts web/src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
git commit -m "feat(web): add typed search live suggestion state"
```

## Task 4: Manager Caret And Live State Shell

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

- [ ] **Step 1: Write failing manager tests**

Add to `GlobalSearchManager typed search commit` describe block:

```ts
it('tracks the active typed filter token from the input caret', () => {
  const manager = new GlobalSearchManager();

  manager.setQuery('beach person:ann tag:family');
  manager.setInputCaret('beach person:ann'.length);

  expect(manager.activeTypedSearchToken).toMatchObject({ key: 'person', raw: 'person:ann' });

  manager.setInputCaret('beach person:ann tag:f'.length);
  expect(manager.activeTypedSearchToken).toMatchObject({ key: 'tag', raw: 'tag:family' });
});

it('clears live suggestion state on close', () => {
  const manager = new GlobalSearchManager();

  manager.liveTypedSearchStatus = { status: 'loading', key: 'person' };
  manager.setQuery('person:ann');
  manager.setInputCaret(8);
  manager.close();

  expect(manager.liveTypedSearchStatus).toEqual({ status: 'idle' });
  expect(manager.activeTypedSearchToken).toBeUndefined();
});
```

- [ ] **Step 2: Run manager tests and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "typed search"
```

Expected: FAIL because caret APIs and `liveTypedSearchStatus` do not exist.

- [ ] **Step 3: Add manager state and methods**

In `global-search-manager.svelte.ts`, import:

```ts
import {
  getActiveTypedSearchToken,
  parseTypedSearch,
  type TypedSearchDisplayToken,
  type TypedSearchIssue,
} from '$lib/utils/typed-search/typed-search-parser';
import {
  isLiveTypedSearchToken,
  type LiveTypedSearchStatus,
  type LiveTypedSearchToken,
} from '$lib/utils/typed-search/typed-search-live-suggestions';
```

Add state:

```ts
activeTypedSearchToken = $state<LiveTypedSearchToken | undefined>();
liveTypedSearchStatus = $state<LiveTypedSearchStatus>({ status: 'idle' });
typedSearchCaret = $state<number | null>(null);
typedSearchComposing = $state(false);
```

Add methods:

```ts
setInputCaret(caret: number | null) {
  this.typedSearchCaret = caret;
  this.updateActiveTypedSearchToken();
}

setInputComposing(isComposing: boolean) {
  this.typedSearchComposing = isComposing;
  if (!isComposing) {
    this.updateActiveTypedSearchToken();
  }
}

private updateActiveTypedSearchToken() {
  if (this.typedSearchComposing) {
    this.activeTypedSearchToken = undefined;
    this.liveTypedSearchStatus = { status: 'idle' };
    return;
  }
  const parsed = parseTypedSearch(this.query, { mode: 'draft' });
  const token = getActiveTypedSearchToken(parsed, this.typedSearchCaret);
  this.activeTypedSearchToken = isLiveTypedSearchToken(token) ? token : undefined;
  if (!this.activeTypedSearchToken) {
    this.liveTypedSearchStatus = { status: 'idle' };
  }
}
```

Update `parseTypedSearchDraft()` to call `parseTypedSearch(text, { mode: 'draft' })` and `this.updateActiveTypedSearchToken()` after display state updates.

Update `clearTypedSearchDraft()` and `close()` to reset `activeTypedSearchToken`, `typedSearchCaret`, and `liveTypedSearchStatus`.

- [ ] **Step 4: Run manager tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/managers/global-search-manager.svelte.spec.ts -t "typed search"
```

Expected: PASS.

- [ ] **Step 5: Commit manager shell**

```bash
git add web/src/lib/managers/global-search-manager.svelte.ts web/src/lib/managers/global-search-manager.svelte.spec.ts
git commit -m "feat(web): track typed search caret state"
```

## Task 5: Live Filter Section Shell

**Files:**

- Create: `web/src/lib/components/global-search/live-typed-filter-section.svelte`
- Create: `web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts`
- Modify: `i18n/en.json`

- [ ] **Step 1: Write failing component tests**

Create `live-typed-filter-section.spec.ts`:

```ts
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import LiveTypedFilterSection from '../live-typed-filter-section.svelte';

describe('LiveTypedFilterSection', () => {
  it('renders live choices as filter application rows', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(LiveTypedFilterSection, {
      props: {
        status: {
          status: 'ok',
          key: 'person',
          total: 1,
          items: [
            {
              id: 'person:0:10:p1',
              key: 'person',
              label: 'Anna Maria',
              value: 'Anna Maria',
              tokenStart: 6,
              tokenEnd: 16,
            },
          ],
        },
        onSelect,
      },
    });

    expect(screen.getByText(/person filter matches/i)).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /Anna Maria/i }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ label: 'Anna Maria' }));
  });

  it('renders loading empty and error states', () => {
    const { rerender } = render(LiveTypedFilterSection, {
      props: { status: { status: 'loading', key: 'tag' }, onSelect: vi.fn() },
    });
    expect(screen.getByText(/loading tag matches/i)).toBeInTheDocument();

    rerender({ status: { status: 'empty', key: 'tag' }, onSelect: vi.fn() });
    expect(screen.getByText(/no matching tags/i)).toBeInTheDocument();

    rerender({ status: { status: 'error', key: 'tag', message: 'network down' }, onSelect: vi.fn() });
    expect(screen.getByText(/couldn't load tag matches/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run component test and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement component and English strings**

Add keys to `i18n/en.json` near the other `cmdk_` keys:

```json
"cmdk_filter_match_city": "City filter matches",
"cmdk_filter_match_country": "Country filter matches",
"cmdk_filter_match_person": "Person filter matches",
"cmdk_filter_match_tag": "Tag filter matches",
"cmdk_filter_match_loading": "Loading {entity} matches",
"cmdk_filter_match_none": "No matching {entity}",
"cmdk_filter_match_error": "Couldn't load {entity} matches",
"cmdk_filter_use_as_filter": "Use as filter",
```

Create `live-typed-filter-section.svelte`:

```svelte
<script lang="ts">
  import type { LiveTypedSearchChoice, LiveTypedSearchStatus } from '$lib/utils/typed-search/typed-search-live-suggestions';
  import { Command } from 'bits-ui';
  import { t } from 'svelte-i18n';

  interface Props {
    status: LiveTypedSearchStatus;
    onSelect: (choice: LiveTypedSearchChoice) => void;
  }
  let { status, onSelect }: Props = $props();

  const labelKey = $derived(status.status === 'idle' ? '' : `cmdk_filter_match_${status.key}`);
  const entity = $derived(status.status === 'idle' ? '' : status.key);
</script>

{#if status.status !== 'idle'}
  <Command.Group class="mb-4" data-live-typed-filter-section>
    <Command.GroupHeading class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {$t(labelKey)}
    </Command.GroupHeading>
    <Command.GroupItems>
      {#if status.status === 'ok'}
        {#each status.items as choice (choice.id)}
          <Command.Item value={choice.id} onSelect={() => onSelect(choice)} class="group">
            <div class="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span class="min-w-0 truncate">{choice.label}</span>
              <span class="shrink-0 text-xs font-medium text-primary">{$t('cmdk_filter_use_as_filter')}</span>
            </div>
          </Command.Item>
        {/each}
      {:else if status.status === 'loading'}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_loading', { values: { entity } })}
        </div>
      {:else if status.status === 'empty'}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_none', { values: { entity } })}
        </div>
      {:else}
        <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {$t('cmdk_filter_match_error', { values: { entity } })}
        </div>
      {/if}
    </Command.GroupItems>
  </Command.Group>
{/if}
```

- [ ] **Step 4: Run component and i18n formatting checks**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts
pnpm --dir i18n exec prettier --write en.json
```

Expected: component test passes and `i18n/en.json` stays sorted.

- [ ] **Step 5: Commit component shell**

```bash
git add web/src/lib/components/global-search/live-typed-filter-section.svelte web/src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts i18n/en.json
git commit -m "feat(web): add typed filter match section"
```

## Task 6: Global Search Wiring Shell

**Files:**

- Modify: `web/src/lib/components/global-search/global-search.svelte`
- Modify: `web/src/lib/components/global-search/__tests__/global-search.spec.ts`

- [ ] **Step 1: Write failing global-search test**

Add:

```ts
it('renders live typed filter section before normal results and selects rows before submit', async () => {
  const m = new GlobalSearchManager();
  const selectSpy = vi.spyOn(m, 'selectLiveTypedSearchChoice').mockImplementation(() => {});
  m.open();
  m.liveTypedSearchStatus = {
    status: 'ok',
    key: 'person',
    total: 1,
    items: [
      { id: 'person:6:16:p1', key: 'person', label: 'Anna Maria', value: 'Anna Maria', tokenStart: 6, tokenEnd: 16 },
    ],
  };
  render(GlobalSearch, { props: { manager: m } });

  expect(screen.getByText(/person filter matches/i)).toBeInTheDocument();
  await user.click(screen.getByRole('option', { name: /Anna Maria/i }));

  expect(selectSpy).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run global-search test and verify failure**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/global-search.spec.ts -t "live typed filter section"
```

Expected: FAIL because the component is not wired and `selectLiveTypedSearchChoice` does not exist.

- [ ] **Step 3: Add select method and component wiring**

In `global-search-manager.svelte.ts`, add:

```ts
import {
  rewriteTypedSearchToken,
  type TypedSearchDisplayToken,
  type TypedSearchIssue,
} from '$lib/utils/typed-search/typed-search-parser';
import type { LiveTypedSearchChoice } from '$lib/utils/typed-search/typed-search-live-suggestions';

selectLiveTypedSearchChoice(choice: LiveTypedSearchChoice) {
  if (!this.activeTypedSearchToken) {
    return;
  }
  const { text, caret } = rewriteTypedSearchToken(this.query, this.activeTypedSearchToken, {
    key: choice.key,
    value: choice.value,
  });
  this.query = text;
  this.setInputCaret(caret);
  this.liveTypedSearchStatus = { status: 'idle' };
}
```

In `global-search.svelte`, import and render the section before `Top result` in both dropdown and modal lists:

```svelte
import LiveTypedFilterSection from './live-typed-filter-section.svelte';
```

```svelte
<LiveTypedFilterSection
  status={manager.liveTypedSearchStatus}
  onSelect={(choice) => manager.selectLiveTypedSearchChoice(choice)}
/>
```

Add input caret hooks to both `Command.Input` elements:

```svelte
onselect={(event) => manager.setInputCaret((event.currentTarget as HTMLInputElement).selectionStart)}
onkeyup={(event) => manager.setInputCaret((event.currentTarget as HTMLInputElement).selectionStart)}
oncompositionstart={() => manager.setInputComposing(true)}
oncompositionend={(event) => {
  manager.setInputComposing(false);
  manager.setInputCaret((event.currentTarget as HTMLInputElement).selectionStart);
}}
```

Also call `manager.setInputCaret(...)` inside existing `oninput`.

- [ ] **Step 4: Run focused tests**

Run:

```bash
pnpm --dir web exec vitest --run src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit wiring shell**

```bash
git add web/src/lib/components/global-search/global-search.svelte web/src/lib/components/global-search/__tests__/global-search.spec.ts web/src/lib/managers/global-search-manager.svelte.ts
git commit -m "feat(web): wire typed filter match shell"
```

## Task 7: Foundation Verification

**Files:**

- No production edits

- [ ] **Step 1: Run formatting and focused tests**

Run:

```bash
pnpm --dir web exec prettier --check src/lib/utils/typed-search src/lib/managers/global-search-manager.svelte.ts src/lib/components/global-search
pnpm --dir web exec vitest --run src/lib/utils/typed-search/typed-search-parser.spec.ts src/lib/utils/typed-search/typed-search-live-suggestions.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/components/global-search/__tests__/global-search.spec.ts src/lib/components/global-search/__tests__/live-typed-filter-section.spec.ts
pnpm --dir i18n exec prettier --check en.json
```

Expected: all pass.

- [ ] **Step 2: Commit verification note only if files changed**

If formatting changed files:

```bash
git add web/src/lib i18n/en.json
git commit -m "chore(web): format typed filter match foundation"
```

If no files changed, do not commit.
