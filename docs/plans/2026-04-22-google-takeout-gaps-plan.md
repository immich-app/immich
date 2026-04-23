# Google Photos Takeout Import Gap Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Fix four Google Takeout import gaps (localized Photos root, `(N)` duplicate-index sidecars, `-edited` variants, missing media extension) plus the immich-go "forgotten duplicates" case, in one PR against `feat/google-takeout-gaps`.

**Architecture:** Port immich-go's 4-matcher cascade (`matchers.go`) into `web/src/lib/utils/google-takeout-parser.ts`, changing `matchSidecarToMedia` to return `string[]` so one sidecar can bind to both an original and its `-edited` variant. Replace the hard-coded `indexOf('Google Photos')` heuristic in scanner/parser with JSON-shape detection via a new `derivePhotoRoots` helper. A separate `finalizeItemAlbumNames` helper writes the authoritative `item.albumName` the uploader consumes.

**Tech Stack:** TypeScript, Svelte 5, Vitest + happy-dom, `@zip.js/zip.js`. All changes are in `web/` — no server, mobile, or SDK changes.

**Design:** See `docs/plans/2026-04-22-google-takeout-gaps-design.md` (committed as `eb79374a9`).

**Worktree:** `/home/pierre/dev/gallery/.worktrees/google-takeout-gaps`. All commands below run from either the worktree root or `<worktree>/web/`, stated per task.

**Conventions:**

- Run each test command from `<worktree>/web/` unless noted.
- Run `pnpm test -- --run <file>` to run a single spec in non-watch mode.
- Commit after each task. Never skip tests or lint. No `Co-Authored-By` trailer.
- When a task lists BOTH a failing-test step and an implementation step, run the test in between to confirm it fails as expected.

---

## Task 1 — Prep: move `MEDIA_EXTENSIONS` into `parser.ts`

The matcher cascade's `matchEditedName` needs to check whether a stem ends in a known media extension. Centralize the constant so parser + scanner share one source of truth.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-scanner.ts` (lines 36-66 — move the Set out)

**Step 1: Move the constant.**

Add to the top of `google-takeout-parser.ts` (near the interface declarations):

```ts
export const MEDIA_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.heic',
  '.heif',
  '.tiff',
  '.tif',
  '.bmp',
  '.avif',
  '.raw',
  '.arw',
  '.cr2',
  '.cr3',
  '.dng',
  '.nef',
  '.orf',
  '.raf',
  '.rw2',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.m4v',
  '.3gp',
  '.mts',
  '.m2ts',
]);
```

**Step 2: Import + re-export from `google-takeout-scanner.ts`.**

Delete the local `MEDIA_EXTENSIONS` constant in scanner.ts (lines 36-66). Replace with:

```ts
import { MEDIA_EXTENSIONS } from '$lib/utils/google-takeout-parser';
```

Add `MEDIA_EXTENSIONS` to the existing re-export block at the bottom of scanner.ts so nothing else in the codebase breaks:

```ts
export {
  MEDIA_EXTENSIONS,
  type TakeoutAlbum,
  type TakeoutMediaItem,
  type TakeoutMetadata,
} from '$lib/utils/google-takeout-parser';
```

**Step 3: Run the existing specs to confirm no regression.**

From `<worktree>/web/`:

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: all 47 existing tests pass.

**Step 4: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-scanner.ts
git commit -m "refactor(takeout-import): centralize MEDIA_EXTENSIONS in parser"
```

---

## Task 2 — Add `extractFileIndex` pure helper

Google appends `(N)` to duplicate filenames. The matcher cascade needs to peel that off both sides before comparing stems.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write the failing tests.**

Append to `google-takeout-parser.spec.ts` (inside a new `describe('extractFileIndex', …)` block). Import the function at the top alongside existing imports:

```ts
import { extractFileIndex } from '$lib/utils/google-takeout-parser';
```

Test block:

```ts
describe('extractFileIndex', () => {
  it('returns empty index when no (N) present', () => {
    expect(extractFileIndex('IMG_1234.jpg')).toEqual({ name: 'IMG_1234.jpg', index: '' });
  });

  it('extracts (N) before an extension', () => {
    expect(extractFileIndex('IMG_1234(1).jpg')).toEqual({ name: 'IMG_1234.jpg', index: '1' });
  });

  it('extracts (N) at end of name (no extension)', () => {
    expect(extractFileIndex('IMG_1234(1)')).toEqual({ name: 'IMG_1234', index: '1' });
  });

  it('extracts multi-digit (N)', () => {
    expect(extractFileIndex('file(42).json')).toEqual({ name: 'file.json', index: '42' });
  });

  it('returns empty index for a bare trailing ()', () => {
    expect(extractFileIndex('file().jpg')).toEqual({ name: 'file().jpg', index: '' });
  });

  it('returns empty index when (N) is in the middle, not at end of basename', () => {
    expect(extractFileIndex('file(1)-edited.jpg')).toEqual({ name: 'file(1)-edited.jpg', index: '' });
  });
});
```

**Step 2: Run — expected FAIL (function not exported).**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

Add near the top of `google-takeout-parser.ts` (after the `MEDIA_EXTENSIONS` constant):

```ts
/**
 * Extract the trailing `(N)` duplicate-index from a filename, if present.
 * Recognises both `file(1).ext` and `file(1)` (no extension) shapes; rejects
 * `file(1)-something.ext` where `(N)` is not immediately before the extension.
 *
 * Returns `{ name, index }` where `name` is the filename with `(N)` removed
 * and `index` is the number as a string (or `''` when no index is present).
 */
export function extractFileIndex(filename: string): { name: string; index: string } {
  const match = filename.match(/^(.*)\((\d+)\)(\.[^.]*)?$/);
  if (!match) {
    return { name: filename, index: '' };
  }
  const [, prefix, index, ext = ''] = match;
  return { name: prefix + ext, index };
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add extractFileIndex helper"
```

---

## Task 3 — Extract `stripSupplementalSuffix` as an exported helper

`stripSupplementalSuffix` already exists in `parser.ts:128-139` as a private helper inside `matchSidecarToMedia`. Export it so the matcher cascade can share it.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write the failing tests.**

Add tests for the exported helper. Import at top of spec:

```ts
import { stripSupplementalSuffix } from '$lib/utils/google-takeout-parser';
```

Test block:

```ts
describe('stripSupplementalSuffix', () => {
  it('leaves paths without a supplemental segment untouched', () => {
    expect(stripSupplementalSuffix('IMG_1234.jpg')).toBe('IMG_1234.jpg');
  });

  it('strips full .supplemental-metadata suffix', () => {
    expect(stripSupplementalSuffix('IMG_1234.jpg.supplemental-metadata')).toBe('IMG_1234.jpg');
  });

  it('strips truncated prefix of supplemental-metadata', () => {
    expect(stripSupplementalSuffix('IMG_1234.jpg.supple')).toBe('IMG_1234.jpg');
    expect(stripSupplementalSuffix('IMG_1234.jpg.s')).toBe('IMG_1234.jpg');
  });

  it('does not strip a segment that is not a prefix of supplemental-metadata', () => {
    expect(stripSupplementalSuffix('IMG_1234.jpg.zzz')).toBe('IMG_1234.jpg.zzz');
  });

  it('does not strip anything before the last /', () => {
    expect(stripSupplementalSuffix('supple/IMG_1234.jpg')).toBe('supple/IMG_1234.jpg');
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Extract and export.**

Change `function stripSupplementalSuffix(...)` (currently private at line 128) to `export function stripSupplementalSuffix(...)`. No logic change.

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "refactor(takeout-import): export stripSupplementalSuffix"
```

---

## Task 4 — Implement `matchFastTrack`

Simplest of the four matchers: strip `.json`, compare for exact equality.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

Import:

```ts
import { matchFastTrack } from '$lib/utils/google-takeout-parser';
```

Test block:

```ts
describe('matchFastTrack', () => {
  it('matches when jsonName is fileName + .json', () => {
    expect(matchFastTrack('IMG_1234.jpg.json', 'IMG_1234.jpg')).toBe(true);
  });

  it('does not match when stems differ', () => {
    expect(matchFastTrack('IMG_1234.jpg.json', 'IMG_5678.jpg')).toBe(false);
  });

  it('does not match when jsonName lacks .json extension', () => {
    expect(matchFastTrack('IMG_1234.jpg', 'IMG_1234.jpg')).toBe(false);
  });

  it('does not match for supplemental-metadata style sidecar', () => {
    expect(matchFastTrack('IMG_1234.jpg.supplemental-metadata.json', 'IMG_1234.jpg')).toBe(false);
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

Above the existing `matchSidecarToMedia` in `parser.ts`, open the attribution block + matcher cascade. Add the attribution comment (SHA pinned to `cc928edbce49216584647e5f756a2af6478bb7ea`) and `matchFastTrack`:

```ts
/**
 * Sidecar-to-media matching cascade. Ported from simulot/immich-go
 * (AGPL-3.0) —
 * https://github.com/simulot/immich-go/blob/cc928edbce49216584647e5f756a2af6478bb7ea/adapters/googlePhotos/matchers.go
 * See docs/plans/2026-04-22-google-takeout-gaps.md for gap context.
 */

/** Exact-match matcher: strip `.json`, compare for equality. */
export function matchFastTrack(jsonName: string, fileName: string): boolean {
  if (!jsonName.endsWith('.json')) {
    return false;
  }
  return jsonName.slice(0, -5) === fileName;
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add matchFastTrack matcher"
```

---

## Task 5 — Implement `matchNormal`

Strips `(N)` from both sides (indexes must match), strips supplemental-metadata, compares stems. Tolerates Google's basename truncation by accepting `fileStem.startsWith(jsonStem)` as a fallback.

**Key ordering:** strip supplemental FIRST, then extract index, then strip supplemental AGAIN on the resulting stem. The double-strip is required because `stripSupplementalSuffix` walks back from the last `.` — when the trailing segment is `(N)` (as in `IMG.jpg.supplemental-metadata(1).json`), the first strip misses the supplemental, and we need a second pass after `extractFileIndex` removes `(1)`.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

Import:

```ts
import { matchNormal } from '$lib/utils/google-takeout-parser';
```

Test block:

```ts
describe('matchNormal', () => {
  it('matches basic supplemental-metadata sidecar', () => {
    expect(matchNormal('IMG_1234.jpg.supplemental-metadata.json', 'IMG_1234.jpg')).toBe(true);
  });

  it('matches when (N) is in the basename on both sides', () => {
    expect(matchNormal('IMG(1).jpg.supplemental-metadata.json', 'IMG(1).jpg')).toBe(true);
  });

  it('matches when (N) is after supplemental-metadata on the sidecar side only', () => {
    expect(matchNormal('IMG.jpg.supplemental-metadata(1).json', 'IMG(1).jpg')).toBe(true);
  });

  it('matches legacy position (N).json sidecar', () => {
    expect(matchNormal('IMG.jpg(1).json', 'IMG(1).jpg')).toBe(true);
  });

  it('does not match when indexes differ', () => {
    expect(matchNormal('IMG.jpg.supplemental-metadata(1).json', 'IMG(2).jpg')).toBe(false);
  });

  it('does not match when one side has index and other does not', () => {
    expect(matchNormal('IMG.jpg.json', 'IMG(1).jpg')).toBe(false);
  });

  it('tolerates Google basename truncation (sidecar stem is prefix of media basename)', () => {
    // When Google's ~51-char filename budget is exceeded, the sidecar stem
    // drops the trailing media extension and becomes a strict prefix of the
    // media basename. This is the shape the existing PR #405 truncation test
    // covers.
    const longMedia = 'A'.repeat(40) + 'suffix.jpg';
    const truncatedStem = 'A'.repeat(40) + 'suffi';
    expect(matchNormal(`${truncatedStem}.supplemental-metadata.json`, longMedia)).toBe(true);
  });

  it('handles surrogate-pair emoji in the truncation prefix', () => {
    // 🌟 = 2 UTF-16 units, 1 code point. Prefix-matching must survive that.
    const mediaBase = '🌟'.repeat(10) + '.jpg';
    const truncStem = '🌟'.repeat(10);
    expect(matchNormal(`${truncStem}.supplemental-metadata.json`, mediaBase)).toBe(true);
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

Add below `matchFastTrack`:

```ts
/**
 * Normal matcher: handles Google's three `(N)` sidecar shapes:
 *   - `name.jpg(1).json`                          — legacy
 *   - `name.jpg(1).supplemental-metadata.json`    — (N) before supplemental
 *   - `name.jpg.supplemental-metadata(1).json`    — (N) after supplemental
 *
 * Ordering is load-bearing: strip supplemental first (so shape 2 loses its
 * `.supplemental-metadata` segment), extract `(N)`, then strip supplemental
 * again on the resulting stem (so shape 3's supplemental — which was hidden
 * behind the trailing `(N)` on the first pass — also comes off).
 */
export function matchNormal(jsonName: string, fileName: string): boolean {
  if (!jsonName.endsWith('.json')) {
    return false;
  }

  const afterJson = stripSupplementalSuffix(jsonName.slice(0, -5));

  const jsonExtract = extractFileIndex(afterJson);
  const fileExtract = extractFileIndex(fileName);
  if (jsonExtract.index !== fileExtract.index) {
    return false;
  }

  const jsonStem = stripSupplementalSuffix(jsonExtract.name);
  const fileStem = fileExtract.name;

  if (jsonStem === fileStem) {
    return true;
  }

  // Tolerate Google's basename truncation: when the sidecar filename is
  // too long for Google's budget, the stem (after stripping
  // `.supplemental-metadata` + `.json`) becomes a strict prefix of the
  // media basename. Require length strictly greater to avoid false positives.
  return fileStem.length > jsonStem.length && fileStem.startsWith(jsonStem);
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add matchNormal matcher with (N) + truncation"
```

---

## Task 6 — Implement `matchForgottenDuplicates`

`fileName.startsWith(jsonStem)` with code-point length diff < 10. Catches `original_<uuid>_.json` → `original_<uuid>_P(1).jpg` and is the only matcher that handles Gap #4 (missing media extension on sidecar).

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

```ts
import { matchForgottenDuplicates } from '$lib/utils/google-takeout-parser';

describe('matchForgottenDuplicates', () => {
  it('matches UUID-style forgotten duplicate', () => {
    expect(matchForgottenDuplicates('original_abc123_.json', 'original_abc123_P(1).jpg')).toBe(true);
  });

  it('matches Gap #4 missing-ext shape', () => {
    // Peanut Butter Balls.supplemental-metadata.json -> Peanut Butter Balls.jpg
    expect(matchForgottenDuplicates('Peanut Butter Balls.supplemental-metadata.json', 'Peanut Butter Balls.jpg')).toBe(
      true,
    );
  });

  it('matches at boundary diff of 9 code points', () => {
    // 'short' (5) -> 'short123.jpg' (12) = diff 7. Use explicit 9:
    expect(matchForgottenDuplicates('abc.json', 'abc123456.jpg')).toBe(true);
  });

  it('rejects at boundary diff of 10 code points', () => {
    expect(matchForgottenDuplicates('abc.json', 'abc1234567.jpg')).toBe(false);
  });

  it('rejects when diff is much larger than 10', () => {
    expect(matchForgottenDuplicates('short.json', 'short_with_too_many_extra_chars.jpg')).toBe(false);
  });

  it('rejects when fileName does not start with jsonStem', () => {
    expect(matchForgottenDuplicates('abc.json', 'xyz.jpg')).toBe(false);
  });

  it('counts code points, not UTF-16 units, in the diff', () => {
    // 🌟 = 1 code point, 2 UTF-16 units. 5 emoji + ".jpg" extension = 9 code points diff from empty stem. < 10, match.
    expect(matchForgottenDuplicates('.json', '🌟🌟🌟🌟🌟.jpg')).toBe(true);
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

```ts
/**
 * Forgotten-duplicates matcher: handles Google's `original_<uuid>_.json`
 * sidecars whose media files gained a `_P` or `_P(N)` suffix, and sidecars
 * that omit the media extension entirely (Gap #4). Requires `fileName`
 * starts with the stripped jsonStem and the code-point length diff is < 10.
 */
export function matchForgottenDuplicates(jsonName: string, fileName: string): boolean {
  if (!jsonName.endsWith('.json')) {
    return false;
  }
  const jsonStem = stripSupplementalSuffix(jsonName.slice(0, -5));
  if (!fileName.startsWith(jsonStem)) {
    return false;
  }
  const diff = [...fileName].length - [...jsonStem].length;
  return diff < 10;
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add matchForgottenDuplicates matcher"
```

---

## Task 7 — Implement `matchEditedName`

Requires `fileName` has no `(N)` index. Strips supplemental-metadata, drops trailing media extension from jsonStem, then `fileName.startsWith(jsonStem)` AND contains a confirmed edited suffix immediately before the file extension.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

```ts
import { matchEditedName } from '$lib/utils/google-takeout-parser';

describe('matchEditedName', () => {
  it('matches English -edited variant', () => {
    expect(matchEditedName('IMAG0061.JPG.supplemental-metadata.json', 'IMAG0061-edited.JPG')).toBe(true);
  });

  it('matches French -modifié variant', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG-modifié.JPG')).toBe(true);
  });

  it('matches German -bearbeitet variant', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG-bearbeitet.JPG')).toBe(true);
  });

  it('matches Italian -modificato variant', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG-modificato.JPG')).toBe(true);
  });

  it('does not match when fileName has (N) index', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG-edited(1).JPG')).toBe(false);
  });

  it('does not match an unconfirmed locale suffix (e.g. Spanish -editado)', () => {
    // Intentionally out-of-scope per design; graceful no-match.
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG-editado.JPG')).toBe(false);
  });

  it('does not match when fileName lacks an edited suffix', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'IMG.JPG')).toBe(false);
  });

  it('does not match when fileName has edited suffix but wrong stem', () => {
    expect(matchEditedName('IMG.JPG.supplemental-metadata.json', 'OTHER-edited.JPG')).toBe(false);
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

```ts
/**
 * Confirmed edited-copy suffixes Google Takeout appends to edited variants.
 * Only the 4 entries confirmed in immich-go's docs ship here — unconfirmed
 * variants are deliberately omitted to avoid false-match chains. See
 * docs/plans/2026-04-22-google-takeout-gaps.md for the full candidate list
 * and the rationale for the conservative cut.
 */
const EDITED_SUFFIXES = ['-edited', '-modifié', '-bearbeitet', '-modificato'] as const;

/**
 * Edited-name matcher: handles `IMAG0061-edited.JPG` etc. sharing the sidecar
 * of `IMAG0061.JPG`. Requires no `(N)` on fileName, strips supplemental-metadata
 * on the sidecar side, drops trailing media extension on the stem, then checks
 * startsWith + an edited suffix immediately before the file extension.
 */
export function matchEditedName(jsonName: string, fileName: string): boolean {
  if (!jsonName.endsWith('.json')) {
    return false;
  }
  if (extractFileIndex(fileName).index !== '') {
    return false;
  }

  let jsonStem = stripSupplementalSuffix(jsonName.slice(0, -5));

  // Drop trailing media extension from jsonStem, if any.
  const lastDot = jsonStem.lastIndexOf('.');
  if (lastDot !== -1 && MEDIA_EXTENSIONS.has(jsonStem.slice(lastDot).toLowerCase())) {
    jsonStem = jsonStem.slice(0, lastDot);
  }

  if (!fileName.startsWith(jsonStem)) {
    return false;
  }

  // `tail` is the remainder after the stem — must be `<edited-suffix><media-ext>`.
  const tail = fileName.slice(jsonStem.length);
  const tailDot = tail.lastIndexOf('.');
  if (tailDot === -1) {
    return false;
  }
  const suffix = tail.slice(0, tailDot);
  const ext = tail.slice(tailDot).toLowerCase();

  return MEDIA_EXTENSIONS.has(ext) && EDITED_SUFFIXES.some((s) => s === suffix);
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add matchEditedName matcher"
```

---

## Task 8 — Rewrite `matchSidecarToMedia` to return `string[]` + cascade

Signature change: `string | undefined` → `string[]`. Internal behavior: filter `mediaFilePaths` to same dir as sidecar, run the 4 matchers per candidate in order, return all hits.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts` (replaces lines 141-191)
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts` (update existing specs)
- Modify: `web/src/lib/utils/google-takeout-scanner.ts:231,310` (both call sites)

**Step 1: Update existing specs first — change assertions to the new shape.**

In `google-takeout-parser.spec.ts`, find the existing `describe('matchSidecarToMedia', …)` block. Update every assertion:

- `expect(result).toBe(path)` → `expect(result).toEqual([path])`.
- `expect(result).toBeUndefined()` → `expect(result).toEqual([])`.

**Step 2: Add a new Gap #3 multi-match test case.**

Inside the existing `describe('matchSidecarToMedia', …)` block, after the other cases:

```ts
it('binds a single sidecar to both original and -edited variant (Gap #3)', () => {
  const result = matchSidecarToMedia('Takeout/Google Photos/Album/IMAG.JPG.supplemental-metadata.json', validSidecar, [
    'Takeout/Google Photos/Album/IMAG.JPG',
    'Takeout/Google Photos/Album/IMAG-edited.JPG',
  ]);
  expect(result).toEqual(['Takeout/Google Photos/Album/IMAG.JPG', 'Takeout/Google Photos/Album/IMAG-edited.JPG']);
});
```

(`validSidecar` is already defined at the top of the existing `describe` block.)

**Step 3: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 4: Replace `matchSidecarToMedia` implementation.**

Delete the current function (lines 141-191, including the old JSDoc). Replace with:

```ts
/**
 * Match a JSON sidecar to one or more media files in the same directory.
 *
 * Returns an array of matching media paths. A single sidecar may bind to
 * multiple media files (e.g. an `IMG.jpg` original + `IMG-edited.jpg`
 * sharing one sidecar). Returns `[]` when the sidecar is not a valid
 * Takeout photo sidecar or has no matching candidates.
 */
export function matchSidecarToMedia(sidecarPath: string, sidecarContent: string, mediaFilePaths: string[]): string[] {
  if (!parseGoogleTakeoutSidecar(sidecarContent)) {
    return [];
  }
  if (!sidecarPath.endsWith('.json')) {
    return [];
  }

  // Same-dir filter: Takeout's invariant is that sidecars sit alongside media
  // in each album folder, so basename-collision across albums is impossible.
  const sidecarDir = sidecarPath.slice(0, Math.max(0, sidecarPath.lastIndexOf('/')));
  const sidecarBasename = sidecarPath.slice(Math.max(0, sidecarPath.lastIndexOf('/') + 1));

  const matches: string[] = [];
  for (const mediaPath of mediaFilePaths) {
    const mediaDir = mediaPath.slice(0, Math.max(0, mediaPath.lastIndexOf('/')));
    if (mediaDir !== sidecarDir) {
      continue;
    }
    const mediaBasename = mediaPath.slice(Math.max(0, mediaPath.lastIndexOf('/') + 1));

    if (
      matchFastTrack(sidecarBasename, mediaBasename) ||
      matchNormal(sidecarBasename, mediaBasename) ||
      matchForgottenDuplicates(sidecarBasename, mediaBasename) ||
      matchEditedName(sidecarBasename, mediaBasename)
    ) {
      matches.push(mediaPath);
    }
  }

  return matches;
}
```

**Step 5: Update both scanner call sites.**

In `google-takeout-scanner.ts`, find the sidecar-matching loops.

Around line 231 (inside `scanZipFile`):

```ts
// before
for (const [sidecarPath, text] of sidecarTexts) {
  const matchedPath = matchSidecarToMedia(sidecarPath, text, mediaPaths);
  if (matchedPath) {
    const metadata = parseGoogleTakeoutSidecar(text);
    if (metadata) {
      metadataMap.set(matchedPath, metadata);
    }
  }
}

// after
for (const [sidecarPath, text] of sidecarTexts) {
  const matches = matchSidecarToMedia(sidecarPath, text, mediaPaths);
  if (matches.length === 0) {
    continue;
  }
  const metadata = parseGoogleTakeoutSidecar(text);
  if (!metadata) {
    continue;
  }
  for (const matchedPath of matches) {
    metadataMap.set(matchedPath, metadata);
  }
}
```

Around line 310 (inside `scanFolderFiles`): same substitution (the outer loop iterates `sidecarFiles` and the inner body is identical in shape).

**Step 6: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts src/lib/utils/google-takeout-scanner.spec.ts
```

**Step 7: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts web/src/lib/utils/google-takeout-scanner.ts
git commit -m "feat(takeout-import): cascade matchers + multi-match sidecar binding"
```

---

## Task 9 — Port immich-go's `matcher_test.go` table as a `describe.each` sweep

Belt-and-braces regression coverage on the full cascade. Grab the test rows from `https://raw.githubusercontent.com/simulot/immich-go/cc928edbce49216584647e5f756a2af6478bb7ea/adapters/googlePhotos/matcher_test.go` and port them as data rows.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Fetch the upstream test table.**

```bash
curl -sL https://raw.githubusercontent.com/simulot/immich-go/cc928edbce49216584647e5f756a2af6478bb7ea/adapters/googlePhotos/matcher_test.go -o /tmp/matcher_test.go
# Field name may be `jsonName`, `JsonName`, `jsonname`, or unlabelled. Try in order:
grep -nE '(json|JSON)[Nn]?ame' /tmp/matcher_test.go | head -30
grep -nE '\{[^}]*"[^"]*\.json"[^}]*"[^"]*\.(jpg|png|mp4|heic|JPG|HEIC)"' /tmp/matcher_test.go | head -30
```

Read through whichever pattern matches — the test table is a `[]struct{ …, … string }` literal with one `.json` sidecar name and one media filename per row. Extract each row, noting whether `want` is `""` (no match expected) or a matcher function name (which one doesn't matter for our port, only that `shouldMatch = want !== ""`).

**Step 2: Write a single `describe.each` block.**

Add at the bottom of the `describe('matchSidecarToMedia', …)` block:

```ts
describe('immich-go matcher_test.go parity', () => {
  // Each row: [jsonName (basename), fileName (basename), shouldMatch]
  // Ported from adapters/googlePhotos/matcher_test.go @ cc928edbce4 (AGPL-3.0).
  // REPLACE THIS ARRAY ENTIRELY with the actual rows from /tmp/matcher_test.go —
  // the two entries below are illustrative shapes, not real upstream data.
  const rows: Array<[string, string, boolean]> = [
    ['PXL_20230922_144751370.jpg.json', 'PXL_20230922_144751370.jpg', true],
    ['PXL_20230922_144751370.jpg(1).json', 'PXL_20230922_144751370(1).jpg', true],
  ];

  it.each(rows)('%s + %s → %s', (jsonName, fileName, shouldMatch) => {
    const sidecarPath = `Takeout/Google Photos/Album/${jsonName}`;
    const mediaPath = `Takeout/Google Photos/Album/${fileName}`;
    const result = matchSidecarToMedia(sidecarPath, validSidecar, [mediaPath]);
    if (shouldMatch) {
      expect(result).toContain(mediaPath);
    } else {
      expect(result).not.toContain(mediaPath);
    }
  });
});
```

Replace the array entirely with the actual ~30 rows from the upstream file. Preserve the exact string literals (including any UTF-8 characters like emoji or localized suffixes).

**Step 3: Run — some rows may FAIL if our cascade disagrees with immich-go.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

If any row fails, note the exact row. Decide per-row:

- Row tests an in-scope behavior we should handle → fix the matcher, commit the fix separately with a clear message.
- Row tests an out-of-scope behavior (Gap #5 Live Photo, additional locales we deliberately omitted) → flip the `shouldMatch` to `false` for our port, add a `// immich-go matches this, we do not — see design §Out of scope` comment next to the row.

**Step 4: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "test(takeout-import): port immich-go matcher test table"
```

---

## Task 10 — Add `derivePhotoRoots` helper + tests

Extracts the Photos root folder names from items that successfully matched a sidecar (i.e. `metadata !== undefined`).

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

```ts
import { derivePhotoRoots } from '$lib/utils/google-takeout-parser';

describe('derivePhotoRoots', () => {
  const validMeta = {
    title: 'x',
    description: undefined,
    dateTaken: new Date(0),
    latitude: undefined,
    longitude: undefined,
    isFavorite: false,
    isArchived: false,
  };

  it('returns empty set for empty input', () => {
    expect(derivePhotoRoots([])).toEqual(new Set());
  });

  it('collects parts[1] from items with metadata under Takeout/', () => {
    const items = [
      { path: 'Takeout/Google Photos/A/img.jpg', file: new File([], 'img.jpg'), metadata: validMeta },
      { path: 'Takeout/Google Fotos/B/img.jpg', file: new File([], 'img.jpg'), metadata: validMeta },
    ];
    expect(derivePhotoRoots(items)).toEqual(new Set(['Google Photos', 'Google Fotos']));
  });

  it('ignores items without metadata', () => {
    const items = [
      { path: 'Takeout/Google Photos/A/img.jpg', file: new File([], 'img.jpg'), metadata: undefined },
      { path: 'Takeout/Google Fotos/B/img.jpg', file: new File([], 'img.jpg'), metadata: validMeta },
    ];
    expect(derivePhotoRoots(items)).toEqual(new Set(['Google Fotos']));
  });

  it('ignores items not under Takeout/', () => {
    const items = [{ path: 'Other/Google Photos/A/img.jpg', file: new File([], 'img.jpg'), metadata: validMeta }];
    expect(derivePhotoRoots(items)).toEqual(new Set());
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

Add near `detectAlbums` in `parser.ts`:

```ts
/**
 * Identify the Google Photos root folder names in a batch of scanned items.
 * A root is the segment `parts[1]` of every item whose sidecar parsed
 * successfully (proven by `metadata !== undefined`) and whose path begins
 * with `Takeout/`. A full Google Account export may include `YouTube/`,
 * `Gmail/`, etc. alongside the Photos root; only the Photos root passes
 * this shape filter.
 */
export function derivePhotoRoots(items: TakeoutMediaItem[]): Set<string> {
  const roots = new Set<string>();
  for (const item of items) {
    if (item.metadata === undefined) {
      continue;
    }
    const parts = item.path.split('/');
    if (parts[0] === 'Takeout' && parts[1]) {
      roots.add(parts[1]);
    }
  }
  return roots;
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add derivePhotoRoots helper"
```

---

## Task 11 — Update `detectAlbums` to take `photoRoots`

Replace `parts.indexOf('Google Photos')` with `photoRoots.has(parts[1])`. Signature gains a `photoRoots` parameter. Existing spec inputs update to pass the Set explicitly.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts` (function at ~line 209)
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts` (existing `detectAlbums` tests)

**Step 1: Pre-flight — inspect every existing `detectAlbums` caller.**

The new function filters on `parts[0] === 'Takeout'` in addition to the root check. Any existing test case whose input path doesn't start with `Takeout/` will silently flip from "returns an album" to "returns no albums". Pre-flight before changing code:

```bash
grep -nE "detectAlbums\(|path: '[^']*'" web/src/lib/utils/google-takeout-parser.spec.ts | grep -A 1 detectAlbums
```

Review each matched test's fixture paths. If any path doesn't begin with `Takeout/`, that test will need its fixture adjusted (prefix `Takeout/` to keep behavior stable) in the same commit. Record the affected test names before moving to step 2.

**Step 2: Update existing `detectAlbums` specs to pass `photoRoots` explicitly.**

Find the existing `describe('detectAlbums', …)` block. For each existing test, pass a second argument: `new Set(['Google Photos'])`. Example:

```ts
// before
const albums = detectAlbums(items);
// after
const albums = detectAlbums(items, new Set(['Google Photos']));
```

**Step 3: Add new localized-folder test cases.**

Inside the same `describe` block:

```ts
it('detects albums under a localized Photos root', () => {
  const items: TakeoutMediaItem[] = [
    { path: 'Takeout/Google Fotos/Sommer/IMG_001.jpg', file: new File([], 'IMG_001.jpg') },
    { path: 'Takeout/Google Fotos/Sommer/IMG_002.jpg', file: new File([], 'IMG_002.jpg') },
  ];
  const albums = detectAlbums(items, new Set(['Google Fotos']));
  expect(albums).toHaveLength(1);
  expect(albums[0].name).toBe('Sommer');
});

it('handles multiple Photos roots in one scan', () => {
  const items: TakeoutMediaItem[] = [
    { path: 'Takeout/Google Photos/A/img.jpg', file: new File([], 'img.jpg') },
    { path: 'Takeout/Google Fotos/B/img.jpg', file: new File([], 'img.jpg') },
  ];
  const albums = detectAlbums(items, new Set(['Google Photos', 'Google Fotos']));
  expect(albums.map((a) => a.name).sort()).toEqual(['A', 'B']);
});

it('ignores items under paths NOT in photoRoots', () => {
  const items: TakeoutMediaItem[] = [
    { path: 'Takeout/YouTube/playlists/playlist.json', file: new File([], 'x.json') },
    { path: 'Takeout/Google Fotos/Album/img.jpg', file: new File([], 'img.jpg') },
  ];
  const albums = detectAlbums(items, new Set(['Google Fotos']));
  expect(albums).toHaveLength(1);
  expect(albums[0].name).toBe('Album');
});
```

**Step 4: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Update `detectAlbums` signature + body.**

Replace the existing function (around line 209). New version:

```ts
/**
 * Extract album information from the folder structure of Takeout items.
 * Uses `photoRoots` (from `derivePhotoRoots`) to distinguish Google Photos
 * content from other Takeout services (YouTube, Drive, etc.) in the same
 * export. Items whose `parts[1]` is not in `photoRoots` are ignored.
 *
 * Expected structure: `Takeout/<root>/<AlbumName>/<filename>`.
 * Nested albums flatten: `Takeout/<root>/Parent/Child/file.jpg` → album "Child".
 */
export function detectAlbums(items: TakeoutMediaItem[], photoRoots: Set<string>): TakeoutAlbum[] {
  const albumMap = new Map<string, string[]>();

  for (const item of items) {
    const parts = item.path.split('/');
    if (parts.length < 4) {
      continue;
    }
    if (parts[0] !== 'Takeout' || !photoRoots.has(parts[1])) {
      continue;
    }

    const albumName = parts.at(-2);
    if (!albumName) {
      continue;
    }

    const existing = albumMap.get(albumName);
    if (existing) {
      existing.push(item.path);
    } else {
      albumMap.set(albumName, [item.path]);
    }
  }

  return [...albumMap.entries()].map(([name, itemPaths]) => ({
    name,
    itemCount: itemPaths.length,
    isAutoGenerated: isAutoGeneratedAlbum(name),
    itemPaths,
  }));
}
```

**Step 6: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 7: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): detectAlbums takes photoRoots, supports localized folders"
```

---

## Task 12 — Add `finalizeItemAlbumNames` helper + tests

Writes the authoritative `item.albumName` the uploader consumes. Called once after `derivePhotoRoots`. Items not under a Photos root get `albumName` forced to `undefined`.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-parser.ts`
- Modify: `web/src/lib/utils/google-takeout-parser.spec.ts`

**Step 1: Write failing tests.**

```ts
import { finalizeItemAlbumNames } from '$lib/utils/google-takeout-parser';

describe('finalizeItemAlbumNames', () => {
  it('sets albumName from parts[2] when item is under a photo root', () => {
    const items: TakeoutMediaItem[] = [{ path: 'Takeout/Google Fotos/Sommer/img.jpg', file: new File([], 'img.jpg') }];
    finalizeItemAlbumNames(items, new Set(['Google Fotos']));
    expect(items[0].albumName).toBe('Sommer');
  });

  it('forces albumName to undefined when item is NOT under a photo root', () => {
    const items: TakeoutMediaItem[] = [
      // tentative value from the extraction-time heuristic
      { path: 'Takeout/YouTube/playlists/playlist.json', file: new File([], 'x.json'), albumName: 'playlists' },
    ];
    finalizeItemAlbumNames(items, new Set(['Google Photos']));
    expect(items[0].albumName).toBeUndefined();
  });

  it('leaves albumName undefined for items loose in the Photos root (no album subfolder)', () => {
    const items: TakeoutMediaItem[] = [
      { path: 'Takeout/Google Fotos/img.jpg', file: new File([], 'img.jpg'), albumName: 'whatever' },
    ];
    finalizeItemAlbumNames(items, new Set(['Google Fotos']));
    expect(items[0].albumName).toBeUndefined();
  });

  it('is a no-op on empty items array', () => {
    const items: TakeoutMediaItem[] = [];
    finalizeItemAlbumNames(items, new Set(['Google Fotos']));
    expect(items).toEqual([]);
  });
});
```

**Step 2: Run — expected FAIL.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 3: Implement.**

Add near `detectAlbums`:

```ts
/**
 * Finalize `item.albumName` in place using the authoritative `photoRoots`.
 * Writes `parts[2]` when the item sits under `Takeout/<root>/<album>/…`
 * and `<root>` is a confirmed Photos root; otherwise clears albumName to
 * `undefined` (overriding any tentative value the extraction-time heuristic
 * left on the item).
 */
export function finalizeItemAlbumNames(items: TakeoutMediaItem[], photoRoots: Set<string>): void {
  for (const item of items) {
    const parts = item.path.split('/');
    if (parts.length >= 4 && parts[0] === 'Takeout' && photoRoots.has(parts[1]) && parts[2]) {
      item.albumName = parts[2];
    } else {
      item.albumName = undefined;
    }
  }
}
```

**Step 4: Run — expected PASS.**

```bash
pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts
```

**Step 5: Commit.**

```bash
git add web/src/lib/utils/google-takeout-parser.ts web/src/lib/utils/google-takeout-parser.spec.ts
git commit -m "feat(takeout-import): add finalizeItemAlbumNames helper"
```

---

## Task 13 — Wire scanner to the new post-extraction flow + update 3 hard-coded sites

The scanner currently uses `parts.indexOf('Google Photos')` in three places. Swap all three for shape-detection plumbing.

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.ts`

**Step 1: Update `trackItemStats` (around line 119-149) — tentative heuristic for progress display.**

```ts
// before
function trackItemStats(
  metadata: TakeoutMetadata | undefined,
  filePath: string,
  progress: ScanProgress,
): string | undefined {
  const parts = filePath.split('/');
  const googlePhotosIndex = parts.indexOf('Google Photos');
  let albumName: string | undefined;
  if (googlePhotosIndex !== -1 && googlePhotosIndex < parts.length - 2) {
    albumName = parts[googlePhotosIndex + 1];
    progress.albumNames.add(albumName);
  }

  progress.mediaCount++;
  // … stats tracking unchanged …
  return albumName;
}

// after
function trackItemStats(
  metadata: TakeoutMetadata | undefined,
  filePath: string,
  progress: ScanProgress,
): string | undefined {
  // Tentative album name for progress display only. Authoritative value is
  // written later by finalizeItemAlbumNames once photoRoots is known.
  const parts = filePath.split('/');
  let albumName: string | undefined;
  if (parts[0] === 'Takeout' && parts.length >= 4) {
    albumName = parts[2];
    progress.albumNames.add(albumName);
  }

  progress.mediaCount++;
  // … stats tracking unchanged …
  return albumName;
}
```

**Step 2: Update hot extraction loop in `scanZipFile` (around line 195-201).**

```ts
// before
const parts = entry.filename.split('/');
const gpIdx = parts.indexOf('Google Photos');
if (gpIdx !== -1 && gpIdx < parts.length - 2) {
  progress.albumNames.add(parts[gpIdx + 1]);
}

// after
// Tentative — see comment in trackItemStats.
const parts = entry.filename.split('/');
if (parts[0] === 'Takeout' && parts.length >= 4) {
  progress.albumNames.add(parts[2]);
}
```

**Step 3: Update post-extraction item-build loop in `scanZipFile` (around line 249-256).**

Drop the inline album-name logic entirely — `finalizeItemAlbumNames` will write the authoritative value later.

```ts
// before
for (const [path, blob] of mediaBlobs) {
  // …
  const parts = path.split('/');
  const googlePhotosIndex = parts.indexOf('Google Photos');
  let albumName: string | undefined;
  if (googlePhotosIndex !== -1 && googlePhotosIndex < parts.length - 2) {
    albumName = parts[googlePhotosIndex + 1];
  }
  // … stats tracking …
  allItems.push({ path, file, metadata, albumName });
  onProgress?.(progress);
}

// after
for (const [path, blob] of mediaBlobs) {
  // … (drop the parts/googlePhotosIndex/albumName block) …
  // … stats tracking unchanged …
  // albumName is finalized later by finalizeItemAlbumNames — leave undefined here.
  allItems.push({ path, file, metadata, albumName: undefined });
  onProgress?.(progress);
}
```

**Step 4: Update `scanTakeoutFiles` to call the new helpers before returning.**

Import the new helpers at the top:

```ts
import {
  derivePhotoRoots,
  detectAlbums,
  finalizeItemAlbumNames,
  matchSidecarToMedia,
  parseGoogleTakeoutSidecar,
} from '$lib/utils/google-takeout-parser';
```

In `scanTakeoutFiles`, replace the existing album/stats finalization block (around lines 390-413) with:

```ts
// after all extraction (scanZipFile + scanFolderFiles) has run
const photoRoots = derivePhotoRoots(allItems);
finalizeItemAlbumNames(allItems, photoRoots);
const albums = detectAlbums(allItems, photoRoots);

// Reconcile progress.albumNames — the extraction-time heuristic may have
// over-counted (e.g. YouTube playlist folders under a full Takeout export).
// Rebuild from the authoritative album list and fire onProgress one last time
// so the UI snaps to the correct count. Reassigning the property (rather than
// clearing + re-adding) is safe because the progress-UI callback snapshots
// with `new Set(p.albumNames)` on receive — it doesn't hold a reference.
progress.albumNames = new Set(albums.map((a) => a.name));
onProgress?.(progress);

// Compute date range
const dates = allItems.filter((item) => item.metadata?.dateTaken).map((item) => item.metadata!.dateTaken!);

let dateRange: { earliest: Date; latest: Date } | undefined;
if (dates.length > 0) {
  const sorted = dates.sort((a, b) => a.getTime() - b.getTime());
  dateRange = { earliest: sorted[0], latest: sorted.at(-1)! };
}

return {
  items: allItems,
  albums,
  stats: {
    totalMedia: allItems.length,
    withLocation: progress.withLocation,
    withDate: progress.withDate,
    favorites: progress.favorites,
    archived: progress.archived,
    dateRange,
  },
};
```

**Step 5: Update `scanFolderFiles` item-build loop (around lines 320-338).**

Drop `albumName` from the item construction and discard `trackItemStats`'s return value (its side effect of updating `progress.albumNames` is still wanted):

```ts
// before
for (const file of mediaFiles) {
  checkAbort(signal);
  const filePath = getFilePath(file);
  progress.currentFile = filePath;

  const metadata = metadataMap.get(filePath);
  const albumName = trackItemStats(metadata, filePath, progress);

  const item: TakeoutMediaItem = {
    path: filePath,
    file,
    metadata,
    albumName,
  };
  allItems.push(item);
  onProgress?.(progress);
}

// after
for (const file of mediaFiles) {
  checkAbort(signal);
  const filePath = getFilePath(file);
  progress.currentFile = filePath;

  const metadata = metadataMap.get(filePath);
  // Side effect only: updates progress.albumNames tentatively + mediaCount + stats.
  trackItemStats(metadata, filePath, progress);

  const item: TakeoutMediaItem = {
    path: filePath,
    file,
    metadata,
    // albumName is finalized later by finalizeItemAlbumNames.
    albumName: undefined,
  };
  allItems.push(item);
  onProgress?.(progress);
}
```

**Step 6: Verify no `'Google Photos'` or `googlePhotosIndex` remains in the runtime path.**

```bash
grep -n "googlePhotosIndex\|'Google Photos'" web/src/lib/utils/google-takeout-scanner.ts
```

Expected: zero matches. Any remaining references must be in re-export types or comments only.

**Step 7: Run existing scanner specs.**

```bash
pnpm vitest run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: all existing tests still pass (they use `Takeout/Google Photos/…` paths, which survive because `derivePhotoRoots` picks up `Google Photos` from items with matched sidecars).

**Step 8: Commit.**

```bash
git add web/src/lib/utils/google-takeout-scanner.ts
git commit -m "feat(takeout-import): wire shape detection + reconciliation in scanner"
```

---

## Task 14 — Scanner integration tests: localized folders + mixed locale + empty Takeout

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`

**Step 1: Add a new `describe` block at the end of the file.**

```ts
describe('localized Google Photos root (Gap #1)', () => {
  let scanTakeoutFiles: typeof import('$lib/utils/google-takeout-scanner').scanTakeoutFiles;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-scanner');
    scanTakeoutFiles = mod.scanTakeoutFiles;
  });

  it('detects albums under German "Google Fotos" folder', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Chengdu City 2009/IMG_001.jpg', content: 'fake-image-data' },
      { path: 'Takeout/Google Fotos/Chengdu City 2009/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].albumName).toBe('Chengdu City 2009');
    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].name).toBe('Chengdu City 2009');
  });

  it('detects albums under Japanese "Google フォト" folder', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google フォト/旅行/IMG_001.jpg', content: 'fake-image-data' },
      { path: 'Takeout/Google フォト/旅行/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items[0].albumName).toBe('旅行');
    expect(result.albums[0].name).toBe('旅行');
  });

  it('handles mixed locales in a single zip', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Photos/English Album/IMG_001.jpg', content: 'fake' },
      { path: 'Takeout/Google Photos/English Album/IMG_001.jpg.json', content: makeSidecar() },
      { path: 'Takeout/Google Fotos/Deutsches Album/IMG_002.jpg', content: 'fake' },
      { path: 'Takeout/Google Fotos/Deutsches Album/IMG_002.jpg.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(2);
    expect(result.albums.map((a) => a.name).sort()).toEqual(['Deutsches Album', 'English Album']);
  });

  it('does NOT hallucinate albums from non-Photos Takeout services', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Album/IMG_001.jpg', content: 'fake' },
      { path: 'Takeout/Google Fotos/Album/IMG_001.jpg.json', content: makeSidecar() },
      // Non-photo JSON that must not create an album:
      { path: 'Takeout/YouTube/playlists/playlist.json', content: '{"kind":"playlist","items":[]}' },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].name).toBe('Album');
    // No item should have albumName === 'playlists'
    expect(result.items.every((i) => i.albumName !== 'playlists')).toBe(true);
  });

  it('detects auto-generated "Photos from YYYY" album under a localized root', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Photos from 2023/IMG_001.jpg', content: 'fake' },
      { path: 'Takeout/Google Fotos/Photos from 2023/IMG_001.jpg.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.albums).toHaveLength(1);
    expect(result.albums[0].name).toBe('Photos from 2023');
    expect(result.albums[0].isAutoGenerated).toBe(true);
  });

  it('yields zero albums for a Takeout with no valid photo sidecars', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Drive/document.pdf.json', content: '{"kind":"drive#file"}' },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(0);
    expect(result.albums).toHaveLength(0);
  });

  it('works via the scanFolderFiles (drag-and-drop) path with a localized folder', async () => {
    // scanFolderFiles uses File.webkitRelativePath rather than zip entries.
    // Exercise that entry-point explicitly with a File constructor trick.
    const mkFile = (content: string, relPath: string, type = 'application/octet-stream'): File => {
      const file = new File([content], relPath.split('/').pop() ?? 'file', { type });
      Object.defineProperty(file, 'webkitRelativePath', { value: relPath });
      return file;
    };

    const result = await scanTakeoutFiles({
      files: [
        mkFile('fake-image-bytes', 'Takeout/Google Fotos/Sommer/IMG_001.jpg', 'image/jpeg'),
        mkFile(makeSidecar(), 'Takeout/Google Fotos/Sommer/IMG_001.jpg.json', 'application/json'),
      ],
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].path).toBe('Takeout/Google Fotos/Sommer/IMG_001.jpg');
    expect(result.items[0].albumName).toBe('Sommer');
    expect(result.items[0].metadata).toBeDefined();
    expect(result.albums.map((a) => a.name)).toEqual(['Sommer']);
  });
});
```

**Step 2: Run.**

```bash
pnpm vitest run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: all 7 new tests pass.

**Step 3: Commit.**

```bash
git add web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "test(takeout-import): scanner e2e specs for localized Photos roots"
```

---

## Task 15 — Scanner integration tests: Gap #3 multi-match + Gap #4 missing-ext + progress reconciliation

**Files:**

- Modify: `web/src/lib/utils/google-takeout-scanner.spec.ts`

**Step 1: Add a second `describe` block at the end of the file.**

```ts
describe('sidecar matching edge cases end-to-end', () => {
  let scanTakeoutFiles: typeof import('$lib/utils/google-takeout-scanner').scanTakeoutFiles;

  beforeEach(async () => {
    vi.resetAllMocks();
    const mod = await import('$lib/utils/google-takeout-scanner');
    scanTakeoutFiles = mod.scanTakeoutFiles;
  });

  it('Gap #3: one sidecar binds to both original and -edited variant', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Album/IMAG.JPG', content: 'original-bytes' },
      { path: 'Takeout/Google Fotos/Album/IMAG-edited.JPG', content: 'edited-bytes' },
      { path: 'Takeout/Google Fotos/Album/IMAG.JPG.supplemental-metadata.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(2);
    const withMetadata = result.items.filter((i) => i.metadata !== undefined);
    expect(withMetadata).toHaveLength(2);
    expect(withMetadata.every((i) => i.metadata!.latitude === 48.8566)).toBe(true);
  });

  it('Gap #4: sidecar missing media extension still matches via matchForgottenDuplicates', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Album/Peanut Butter Balls.jpg', content: 'fake' },
      { path: 'Takeout/Google Fotos/Album/Peanut Butter Balls.supplemental-metadata.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].metadata).toBeDefined();
    expect(result.items[0].metadata!.latitude).toBe(48.8566);
  });

  it('progress.albumNames reconciles to drop tentatively-added non-Photos folders', async () => {
    // This fixture MUST include a MEDIA file under a non-Photos subtree, so the
    // extraction-time tentative heuristic (in scanZipFile's per-entry loop)
    // actually over-counts. A bare non-media file like a YouTube playlist JSON
    // won't trigger the heuristic and leaves nothing for reconciliation to
    // correct — the test would pass even if reconciliation were missing.
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Real Album/IMG_001.jpg', content: 'fake' },
      { path: 'Takeout/Google Fotos/Real Album/IMG_001.jpg.json', content: makeSidecar() },
      // Media file under Drive/. The hot-loop heuristic adds 'Videos' to
      // progress.albumNames tentatively. No matching sidecar → item has no
      // metadata → derivePhotoRoots does not include 'Drive' → detectAlbums
      // excludes this item → reconciliation must drop 'Videos'.
      { path: 'Takeout/Drive/Videos/clip.mp4', content: 'fake-video' },
    ]);

    const progressSnapshots: ScanProgress[] = [];
    await scanTakeoutFiles({
      files: [blobToFile(zipBlob, 'takeout.zip')],
      onProgress: (p) => progressSnapshots.push({ ...p, albumNames: new Set(p.albumNames) }),
    });

    // At least one mid-extraction snapshot saw the transient over-count.
    const sawTransientOverCount = progressSnapshots.some((p) => p.albumNames.has('Videos'));
    expect(sawTransientOverCount).toBe(true);

    // The final snapshot is the reconciled one — 'Videos' must be gone.
    const last = progressSnapshots.at(-1)!;
    expect(last.albumNames).toEqual(new Set(['Real Album']));
    expect(last.albumNames.has('Videos')).toBe(false);
  });

  it('Gap #3: German -bearbeitet variant binds to the same sidecar (scanner level)', async () => {
    const zipBlob = await createZipBlob([
      { path: 'Takeout/Google Fotos/Album/IMAG.JPG', content: 'original-bytes' },
      { path: 'Takeout/Google Fotos/Album/IMAG-bearbeitet.JPG', content: 'edited-bytes' },
      { path: 'Takeout/Google Fotos/Album/IMAG.JPG.supplemental-metadata.json', content: makeSidecar() },
    ]);

    const result = await scanTakeoutFiles({ files: [blobToFile(zipBlob, 'takeout.zip')] });

    expect(result.items).toHaveLength(2);
    expect(result.items.filter((i) => i.metadata !== undefined)).toHaveLength(2);
  });
});
```

**Step 2: Run.**

```bash
pnpm vitest run src/lib/utils/google-takeout-scanner.spec.ts
```

Expected: all 4 new tests pass.

**Step 3: Commit.**

```bash
git add web/src/lib/utils/google-takeout-scanner.spec.ts
git commit -m "test(takeout-import): scanner e2e for Gap #3, Gap #4, progress reconciliation"
```

---

## Task 16 — Manual E2E repro + PR body

Final verification against a real Takeout zip before opening the PR.

**Step 1: Full lint + type check.**

From worktree root:

```bash
make check-web
make lint-web
```

Expected: both green.

**Step 2: Run the full web test suite once.**

```bash
cd web && pnpm vitest run
```

Expected: all tests pass. Previously-unrelated failures (unrelated transform errors from missing SDK) should not appear — the `make build-sdk` we ran at the start of the session still covers this, but re-run if needed: `cd .. && make build-sdk`.

**Step 3: Start dev stack + manual upload.**

```bash
make dev
```

Open `http://localhost:2283`, sign in, go to the Takeout import wizard. Upload `~/Downloads/sample.zip` (the German-locale sample). Observe the scan summary screen.

Expected counts:

- Media items: 20
- Albums: 1 named "Chengdu City 2009"
- With date: 20
- With location: 0 or non-zero depending on whether sidecars have GPS (the sample zip has small sidecars ~700-780 bytes — inspect one if needed)

Record the actual numbers; any deviation is a finding.

**Step 4: Draft PR body with repro steps.**

Include in the PR description (no code change):

- Reference to #405 (landed sibling PR).
- Reference to the gap tracker (`docs/plans/2026-04-22-google-takeout-gaps.md`).
- Summary of each gap fixed with a one-line before/after.
- Steps to manually reproduce with `~/Downloads/sample.zip` and the expected scan-summary numbers.
- Explicit note that Gap #5 (Live Photo (N)) is deferred with a reference to the design doc.

**Step 5: Rebase onto main if #405 has merged, then open the PR.**

```bash
git fetch origin
# If #405 has landed:
git rebase origin/main
# Push and open:
git push -u origin feat/google-takeout-gaps
gh pr create --title "fix(takeout-import): localized folder + (N)/edited/missing-ext sidecar matching" --body "$(cat <<'EOF'
## Summary

- Detect the Google Photos root folder by JSON shape (fixes non-English Takeouts: `Google Fotos`, `Google フォト`, etc. silently dropping album detection).
- Port immich-go's 4-matcher cascade into `matchSidecarToMedia`; it now returns `string[]` so one sidecar can bind to original + `-edited` variant.
- Covers gaps #1–#4 from `docs/plans/2026-04-22-google-takeout-gaps.md`, plus immich-go's `matchForgottenDuplicates`. Gap #5 (Live Photo `(N)`) is deferred with context in the design doc.

## Test plan

- [ ] New scanner specs pass (`pnpm vitest run src/lib/utils/google-takeout-scanner.spec.ts`).
- [ ] New parser specs pass (`pnpm vitest run src/lib/utils/google-takeout-parser.spec.ts`).
- [ ] Manual repro: upload a German-locale Takeout zip through the import wizard; confirm album is detected and items carry metadata.
- [ ] `make check-web` and `make lint-web` green.
EOF
)"
```

No commit for this task — the PR creation is the deliverable.

---

## Appendix — Rollback notes

If the cascade port introduces a regression we can't triage quickly, revert commits from Task 8 (matchSidecarToMedia signature change) forward. Tasks 1–7 add pure helpers and are safe to keep; tasks 9–15 hang off the new cascade and would need reverting too. The shape-detection work (Tasks 10–13) is independent of the matcher cascade and can be kept as a standalone shipable if needed — open a narrower PR from a revert branch if the matcher port turns out to need more soak time.
