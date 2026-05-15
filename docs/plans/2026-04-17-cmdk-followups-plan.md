# cmdk Palette Follow-ups Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix blank face thumbnails in the command palette and surface the
`@ # / >` scope prefixes in the search input placeholder.

**Architecture:** Replace dead `faceAssetId` plumbing with the existing
`getPeopleThumbnailUrl()` helper (hits `/api/people/:id/thumbnail`).
Update the `cmdk_placeholder` i18n string. Pure web-only changes — no
server, SDK, or DB touches.

**Tech Stack:** SvelteKit, Svelte 5 runes, Vitest + @testing-library/svelte
with happy-dom, generated `@immich/sdk`. All work in
`web/src/lib/components/global-search/`,
`web/src/lib/managers/global-search-manager.svelte.ts`,
`web/src/lib/stores/cmdk-recent.ts`, and `i18n/en.json`.

**Working directory for all tasks:** `web/` (`cd web` once, stay there).
Use `pnpm test -- --run <file>` to scope test runs.

**Design reference:** `docs/plans/2026-04-17-cmdk-followups-design.md`

---

## Task 1: Update person-row test (RED + GREEN)

**Files:**

- Modify: `web/src/lib/components/global-search/__tests__/person-row.spec.ts`

**Step 1: Replace the test file**

Open the file. Rewrite the test cases so they (a) drop `faceAssetId` from
fixtures, (b) assert the rendered thumbnail URL points to
`/api/people/.*/thumbnail`, and (c) replace the "placeholder when
faceAssetId is missing" case with an `onerror` swap test.

Replace the entire `describe('person-row', () => { ... })` block with:

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import PersonRow from '../rows/person-row.svelte';

describe('person-row', () => {
  it('renders the person name and asset count', () => {
    render(PersonRow, {
      props: {
        item: { id: 'p1', name: 'Alice', numberOfAssets: 42 } as never,
      },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/42 photos/)).toBeInTheDocument();
  });

  it('falls back to "Unnamed person" label when name is empty', () => {
    render(PersonRow, {
      props: { item: { id: 'p1', name: '' } as never },
    });
    expect(screen.getByText(/cmdk_unnamed_person|Unnamed/)).toBeInTheDocument();
  });

  it('renders the people thumbnail endpoint url', () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toMatch(/\/api\/people\/p1\/thumbnail/);
  });

  it('swaps to placeholder div when the thumbnail image fails to load', async () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    await fireEvent.error(img!);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull();
  });

  it('does NOT set role="option"', () => {
    const { container } = render(PersonRow, {
      props: { item: { id: 'p1', name: 'X' } as never },
    });
    expect(container.querySelector('[role="option"]')).toBeNull();
  });
});
```

**Step 2: Run the new tests — they should FAIL**

```bash
cd web
pnpm test -- --run src/lib/components/global-search/__tests__/person-row.spec.ts
```

Expected: the "renders the people thumbnail endpoint url" and "swaps to
placeholder div" cases FAIL because the component still uses
`getAssetMediaUrl({ id: faceAssetId })` and the URL never matches
`/api/people/.*/thumbnail`.

**Step 3: Implement person-row.svelte**

Open `web/src/lib/components/global-search/rows/person-row.svelte`.
Replace the entire file with:

```svelte
<script lang="ts">
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    item: PersonResponseDto & { numberOfAssets?: number };
  }
  let { item }: Props = $props();

  const thumbUrl = $derived(getPeopleThumbnailUrl(item));
  let failed = $state(false);
  // Reset the failure flag whenever the row swaps to a different person — the
  // component instance is re-used by bits-ui as the user scrolls the list.
  $effect(() => {
    void item.id;
    failed = false;
  });
</script>

<div
  class="flex h-[52px] items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-[80ms] ease-out group-data-[selected]:bg-primary/10"
>
  {#if !failed}
    <img
      src={thumbUrl}
      alt=""
      class="h-10 w-10 rounded-full object-cover"
      loading="lazy"
      onerror={() => (failed = true)}
    />
  {:else}
    <div class="h-10 w-10 rounded-full bg-subtle/40" aria-hidden="true"></div>
  {/if}
  <div class="min-w-0 flex-1">
    <div class="truncate text-sm font-medium">{item.name || $t('cmdk_unnamed_person')}</div>
    {#if item.numberOfAssets !== undefined}
      <div class="text-xs text-gray-500 dark:text-gray-400">{item.numberOfAssets} photos</div>
    {/if}
  </div>
</div>
```

**Step 4: Run tests — they should PASS**

```bash
pnpm test -- --run src/lib/components/global-search/__tests__/person-row.spec.ts
```

Expected: all 5 tests PASS.

**Step 5: Do NOT commit yet** — Tasks 3-4 introduce coupled type changes;
commit happens after Task 4 once the tree is consistent again.

---

## Task 2: Update person-preview test + component (RED + GREEN)

**Files:**

- Modify: `web/src/lib/components/global-search/__tests__/person-preview.spec.ts`
- Modify: `web/src/lib/components/global-search/previews/person-preview.svelte`

**Step 1: Update the test file**

Replace the entire `describe('person-preview', () => { ... })` block with:

```ts
import { searchAssets } from '@immich/sdk';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PersonPreview from '../previews/person-preview.svelte';

vi.mock('@immich/sdk', async () => {
  const actual = await vi.importActual<typeof import('@immich/sdk')>('@immich/sdk');
  return { ...actual, searchAssets: vi.fn() };
});

describe('person-preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(searchAssets).mockResolvedValue({ assets: { items: [], nextPage: null } } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the person name and count', () => {
    render(PersonPreview, {
      props: {
        person: { id: 'p1', name: 'Alice', numberOfAssets: 42 } as never,
      },
    });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/42 photos/)).toBeInTheDocument();
  });

  it('defers searchAssets by 300ms after mount', async () => {
    render(PersonPreview, { props: { person: { id: 'p1', name: 'Alice' } as never } });
    await vi.advanceTimersByTimeAsync(200);
    expect(searchAssets).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(150);
    expect(searchAssets).toHaveBeenCalledOnce();
  });

  it('renders the people thumbnail endpoint url', () => {
    const { container } = render(PersonPreview, {
      props: { person: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('[data-cmdk-preview-person] img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toMatch(/\/api\/people\/p1\/thumbnail/);
  });

  it('swaps to placeholder when the thumbnail image fails to load', async () => {
    const { container } = render(PersonPreview, {
      props: { person: { id: 'p1', name: 'Alice' } as never },
    });
    const img = container.querySelector('[data-cmdk-preview-person] > img');
    expect(img).not.toBeNull();
    await fireEvent.error(img!);
    // After error: the avatar img is gone, only the placeholder div remains as
    // the first child of the preview wrapper.
    expect(container.querySelector('[data-cmdk-preview-person] > img')).toBeNull();
    expect(container.querySelector('[data-cmdk-preview-person] > div[aria-hidden="true"]')).not.toBeNull();
  });
});
```

Note: the second img-existence selector uses `> img` (direct child) so it
only matches the avatar, not the 4-asset strip below the name.

**Step 2: Run tests — they should FAIL**

```bash
pnpm test -- --run src/lib/components/global-search/__tests__/person-preview.spec.ts
```

Expected: the "renders the people thumbnail endpoint url" and "swaps to
placeholder" cases FAIL.

**Step 3: Implement person-preview.svelte**

Open `web/src/lib/components/global-search/previews/person-preview.svelte`.
Replace the entire file with:

```svelte
<script lang="ts">
  import { getAssetMediaUrl, getPeopleThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, searchAssets, type AssetResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    person: PersonResponseDto & { numberOfAssets?: number };
  }
  let { person }: Props = $props();

  let photos = $state<AssetResponseDto[]>([]);
  let loaded = $state(false);
  let generation = 0;

  const thumbUrl = $derived(getPeopleThumbnailUrl(person));
  let failed = $state(false);
  // Reset failure when the person changes (preview is re-used as the user
  // arrows through the People section).
  $effect(() => {
    void person.id;
    failed = false;
  });

  $effect(() => {
    const gen = ++generation;
    const id = person.id;
    photos = [];
    loaded = false;
    const dwell = setTimeout(() => {
      // Wrap the async work in an IIFE so setTimeout's callback is synchronous.
      // ESLint's `no-misused-promises` flags async setTimeout callbacks because
      // setTimeout doesn't await the returned promise.
      void (async () => {
        const ctrl = new AbortController();
        try {
          const response = await searchAssets(
            { metadataSearchDto: { personIds: [id], size: 4 } },
            { signal: ctrl.signal },
          );
          if (gen !== generation) {
            return;
          }
          photos = response.assets.items;
        } catch {
          // ignore — preview is best-effort
        } finally {
          if (gen === generation) {
            loaded = true;
          }
        }
      })();
    }, 300);
    return () => clearTimeout(dwell);
  });
</script>

<div data-cmdk-preview-person class="flex flex-col items-center gap-3 p-5">
  {#if !failed}
    <img
      src={thumbUrl}
      alt={person.name ?? ''}
      class="h-[120px] w-[120px] rounded-full object-cover"
      onerror={() => (failed = true)}
    />
  {:else}
    <div class="h-[120px] w-[120px] rounded-full bg-subtle/40" aria-hidden="true"></div>
  {/if}
  <div class="text-center">
    <div class="text-lg font-semibold">{person.name || $t('cmdk_unnamed_person')}</div>
    {#if person.numberOfAssets !== undefined}
      <div class="text-xs font-normal text-gray-500 dark:text-gray-400">{person.numberOfAssets} photos</div>
    {/if}
  </div>
  {#if loaded && photos.length > 0}
    <div class="mt-2 flex gap-2">
      {#each photos as photo (photo.id)}
        <img
          src={getAssetMediaUrl({ id: photo.id, size: AssetMediaSize.Thumbnail })}
          alt=""
          class="h-12 w-12 rounded-md object-cover"
        />
      {/each}
    </div>
  {/if}
</div>
```

**Step 4: Run tests — they should PASS**

```bash
pnpm test -- --run src/lib/components/global-search/__tests__/person-preview.spec.ts
```

Expected: all 4 tests PASS.

**Step 5: Do NOT commit yet** — same reason as Task 1.

---

## Task 3: Drop `thumbnailAssetId` from `RecentEntry.person`

**Files:**

- Modify: `web/src/lib/stores/cmdk-recent.ts`

**Step 1: Edit the type declaration**

In `web/src/lib/stores/cmdk-recent.ts`, find the union member at line 16:

```ts
| { kind: 'person'; id: string; personId: string; label: string; thumbnailAssetId?: string; lastUsed: number }
```

Replace with:

```ts
| { kind: 'person'; id: string; personId: string; label: string; lastUsed: number }
```

**Step 2: Run cmdk-recent tests — should still PASS**

```bash
pnpm test -- --run src/lib/stores/cmdk-recent.spec.ts
```

Expected: all tests PASS. Existing tests don't reference `thumbnailAssetId`
on person entries, so this is a pure type narrowing.

**Step 3: Do NOT commit yet** — manager + recent-row still set the now-removed
field and won't typecheck. Fixed in next task.

---

## Task 4: Drop `faceAssetId` plumbing in manager + recent-row

**Files:**

- Modify: `web/src/lib/managers/global-search-manager.svelte.ts`
- Modify: `web/src/lib/components/global-search/rows/recent-row.svelte`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`

**Step 1: Update manager — `activate('person')`**

In `web/src/lib/managers/global-search-manager.svelte.ts` around line 990,
find:

```ts
case 'person': {
  const p = item as { id: string; name?: string; faceAssetId?: string };
  addEntry({
    kind: 'person',
    id: `person:${p.id}`,
    personId: p.id,
    label: p.name ?? '',
    thumbnailAssetId: p.faceAssetId,
    lastUsed: now,
  });
  void goto(Route.viewPerson({ id: p.id }));
  break;
}
```

Replace with:

```ts
case 'person': {
  const p = item as { id: string; name?: string };
  addEntry({
    kind: 'person',
    id: `person:${p.id}`,
    personId: p.id,
    label: p.name ?? '',
    lastUsed: now,
  });
  void goto(Route.viewPerson({ id: p.id }));
  break;
}
```

**Step 2: Update manager — `activeItemFromRecent` person branch**

In the same file around line 852, find:

```ts
case 'person': {
  return {
    kind: 'person',
    data: {
      id: entry.personId,
      name: entry.label,
      faceAssetId: entry.thumbnailAssetId,
    } as unknown,
  };
}
```

Replace with:

```ts
case 'person': {
  return {
    kind: 'person',
    data: {
      id: entry.personId,
      name: entry.label,
    } as unknown,
  };
}
```

**Step 3: Update recent-row.svelte**

In `web/src/lib/components/global-search/rows/recent-row.svelte` line 28,
find:

```svelte
<PersonRow item={{ id: entry.personId, name: entry.label, faceAssetId: entry.thumbnailAssetId } as never} />
```

Replace with:

```svelte
<PersonRow item={{ id: entry.personId, name: entry.label } as never} />
```

**Step 4: Update manager spec — line 818**

In `web/src/lib/managers/global-search-manager.svelte.spec.ts` line 818-822,
find:

```ts
m.activate('person', { id: 'p1', name: 'Alice', faceAssetId: 'face1' });
expect(goto).toHaveBeenCalledWith('/people/p1');
const entries = getEntries();
expect(entries[0]).toMatchObject({ kind: 'person', personId: 'p1', label: 'Alice', thumbnailAssetId: 'face1' });
```

Replace with:

```ts
m.activate('person', { id: 'p1', name: 'Alice' });
expect(goto).toHaveBeenCalledWith('/people/p1');
const entries = getEntries();
expect(entries[0]).toMatchObject({ kind: 'person', personId: 'p1', label: 'Alice' });
```

**Step 5: Update manager spec — `synthesizes a person ActiveItem` case (~line 2549)**

Find the test that adds a person recent and asserts `faceAssetId`. The
fixture passes `thumbnailAssetId: 'face-1'` to `addEntry` and asserts
`data.faceAssetId === 'face-1'`. Update both:

- In the `addEntry({ kind: 'person', ...` call, **remove** the
  `thumbnailAssetId: 'face-1',` line.
- Replace the assertion block:

  ```ts
  if (active?.kind === 'person') {
    const data = active.data as { id: string; name: string; faceAssetId: string };
    expect(data.id).toBe('p1');
    expect(data.name).toBe('Alice');
    expect(data.faceAssetId).toBe('face-1');
  }
  ```

  with:

  ```ts
  if (active?.kind === 'person') {
    const data = active.data as { id: string; name: string };
    expect(data.id).toBe('p1');
    expect(data.name).toBe('Alice');
  }
  ```

**Step 6: Run the full web unit test suite**

```bash
pnpm test -- --run
```

Expected: all tests PASS. If any spec fails because it referenced
`faceAssetId` or `thumbnailAssetId` on person entries that this plan
missed, fix the spec the same way (remove the field from fixtures, drop
the assertion).

**Step 7: Run svelte-check + tsc**

```bash
cd ..
make check-web
```

Expected: zero errors. The dropped `thumbnailAssetId` field on the
`person` recent variant is exhaustive — if anything still references it,
TypeScript will fail and point at the file.

If `make check-web` fails, address each error and re-run before continuing.

---

## Task 5: Commit fix

**Step 1: Stage and commit**

```bash
cd ..
git add \
  web/src/lib/components/global-search/rows/person-row.svelte \
  web/src/lib/components/global-search/rows/recent-row.svelte \
  web/src/lib/components/global-search/previews/person-preview.svelte \
  web/src/lib/components/global-search/__tests__/person-row.spec.ts \
  web/src/lib/components/global-search/__tests__/person-preview.spec.ts \
  web/src/lib/managers/global-search-manager.svelte.ts \
  web/src/lib/managers/global-search-manager.svelte.spec.ts \
  web/src/lib/stores/cmdk-recent.ts
git status --short
```

Confirm only the files above are staged (no unrelated diffs).

```bash
git commit -m "$(cat <<'EOF'
fix(web): cmdk palette person thumbnails

PersonResponseDto has no faceAssetId field — the existing intersection
type silently let the property be undefined and the thumbnail ternary
always fell through to the placeholder div. Switch person row + preview
to getPeopleThumbnailUrl(person), which hits the dedicated face-crop
endpoint used elsewhere in the app, and add an onerror fallback for the
404 case (deleted person, thumbnail not yet generated).

Drops the dead faceAssetId / thumbnailAssetId plumbing from the recent
store, the manager's activate/activeItemFromRecent paths, and the
recent-row component. Backward-compatible with stale localStorage
entries: the JSON read path does no narrowing, and the new code
silently ignores the extra property.
EOF
)"
```

---

## Task 6: Update placeholder hint + commit

**Files:**

- Modify: `i18n/en.json`

**Step 1: Edit the placeholder string**

In `i18n/en.json` line 839, find:

```json
"cmdk_placeholder": "Search Gallery",
```

Replace with:

```json
"cmdk_placeholder": "Search Gallery — try @ for people, # tags, / albums, > pages",
```

**Step 2: Run i18n format/sort**

The repo enforces sorted keys via a dedicated script (per memory
`feedback_i18n_key_sorting`):

```bash
pnpm --filter=immich-i18n format:fix
```

Expected: clean exit, no diff (the key already exists in place).

**Step 3: Run web unit tests + svelte-check**

```bash
cd web
pnpm test -- --run
cd ..
make check-web
```

Expected: all tests PASS, zero check errors.

**Step 4: Commit**

```bash
git add i18n/en.json
git status --short
```

Confirm only `i18n/en.json` is staged.

```bash
git commit -m "$(cat <<'EOF'
feat(web): cmdk placeholder advertises @ # / > scope prefixes

The footer chip and the keyboard-shortcut modal already document the
prefixes, but the search input — the most prominent affordance on a
fresh palette open — said only "Search Gallery". Inline the prefix →
entity mapping so users discover @ for people, # for tags, / for
albums/spaces, and > for pages without having to look elsewhere.

Long string (62 chars); on narrow viewports it clips left-to-right so
the head ("try @ for people, # tags") stays visible.
EOF
)"
```

---

## Task 7: Push + open PR

**Step 1: Push branch**

```bash
git push -u origin fix/cmdk-people-thumbnails
```

**Step 2: Create PR**

```bash
gh pr create --title "fix(web): cmdk palette people thumbnails + scope hint" --body "$(cat <<'EOF'
## Summary

Two post-merge polish fixes for the cmdk palette (PR #365):

- **Fix blank face thumbnails.** `PersonResponseDto` has no `faceAssetId`
  field — the intersection type silently allowed undefined and the
  thumbnail ternary always fell through to the placeholder div. Switch
  to `getPeopleThumbnailUrl(person)` (the dedicated `/api/people/:id/thumbnail`
  endpoint used elsewhere in the app). `<img onerror>` falls back to the
  placeholder for 404s.
- **Discoverability for `@ # / >` scope prefixes.** Inline the prefix →
  entity mapping into `cmdk_placeholder` so the search input itself
  documents what the prefixes do.

Design doc: `docs/plans/2026-04-17-cmdk-followups-design.md`

## Test plan

- [ ] CI green
- [ ] Open palette (Ctrl+K), type `@`: rows render face thumbnails (cropped
      circles), not blank placeholders. Highlighted row's preview pane shows
      the same face in the big circle on the right.
- [ ] Type `@alice` (or any name): same — thumbnails resolve.
- [ ] Open palette fresh: placeholder reads
      `Search Gallery — try @ for people, # tags, / albums, > pages`.
- [ ] Trigger an `onerror` (e.g. delete a person and re-open recents that
      still reference it): row falls back to the grey placeholder
      circle without breaking layout.
- [ ] On `personal instance` (real photo library): browse a few
      arrowed-through people in the People section to confirm the row
      thumbnail and the preview pane both update correctly per person.
EOF
)"
```

Expected: PR URL printed. Save the URL — that's what gets reported back
to the user.

---

## Notes for the implementer

- **Order matters.** Tasks 1-4 leave the tree in an uncompiled state
  intentionally. Don't try to commit between them.
- **No server / SDK / OpenAPI / migration changes.** If you find yourself
  reaching for `make sql` or `make open-api`, you're off-plan.
- **Don't run tests in parallel** (per memory `feedback_no_parallel_tests`).
  One `pnpm test -- --run <file>` at a time, then the full suite at the end.
- **`make check-web` is the gate**, not lint. Lint runs in CI; tsc/svelte-check
  is what catches the type fallout from the recent-store change.
- **Memory references that informed this plan:**
  `feedback_format_docs.md` (prettier on docs/plans),
  `feedback_i18n_key_sorting.md` (use `pnpm --filter=immich-i18n format:fix`),
  `feedback_always_use_prs.md`,
  `feedback_lint_sequential.md` (lint last),
  `feedback_no_parallel_tests.md`.
