# Video Trim Download Fix & Edited Indicator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix downloading trimmed videos (returns JPEG instead of MP4) and add an "Edited" badge in the asset viewer.

**Architecture:** Server-side query fix in `buildGetForOriginal` to prefer `EncodedVideo` over `FullSize` for edited files, plus a UI badge in the asset viewer nav bar.

**Tech Stack:** Kysely (SQL query builder), Svelte 5, `@immich/ui`, `@mdi/js` icons

**Note on test coverage:** The bug is in a Kysely query (`buildGetForOriginal`). All existing unit tests mock the repository at the service layer, so they cannot catch this query bug directly. The service-level tests below verify correct behavior when the repository returns the right data. Full query-level verification requires a medium test (`pnpm test:medium`) with a real database — that is deferred to a follow-up since the query change is straightforward (same pattern as `getForVideo`). Manual verification: trim a video in dev, download it, confirm you get an MP4 not a JPEG.

---

### Task 1: Write failing tests for trimmed video download

**Files:**

- Modify: `server/src/services/asset-media.service.spec.ts` (in the `downloadOriginal` describe block, after line ~603)
- Modify: `server/src/services/download.service.spec.ts` (in the `downloadArchive` describe block, after line ~207)

**Step 1: Write the failing test for single-file download of a trimmed video**

Add this test to the `downloadOriginal` describe block in `asset-media.service.spec.ts`. It creates a video asset with a trim edit and an `EncodedVideo` edited file, mocks `getForOriginal` to return the `EncodedVideo` path as `editedPath`, and asserts the response has `video/mp4` content type:

```typescript
it('should download trimmed video file (EncodedVideo, not FullSize frame)', async () => {
  const trimmedVideoFile = AssetFileFactory.create({ type: AssetFileType.EncodedVideo, isEdited: true });
  const editedAsset = AssetFactory.from({ type: AssetType.Video })
    .edit({ action: AssetEditAction.Trim })
    .file({ type: AssetFileType.EncodedVideo })
    .file({ type: AssetFileType.FullSize, isEdited: true })
    .file(trimmedVideoFile)
    .build();

  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([editedAsset.id]));
  mocks.asset.getForOriginal.mockResolvedValue({ ...editedAsset, editedPath: trimmedVideoFile.path });

  await expect(sut.downloadOriginal(AuthFactory.create(), editedAsset.id, {})).resolves.toEqual(
    new ImmichFileResponse({
      path: trimmedVideoFile.path,
      fileName: expect.stringMatching(/\.mp4$/),
      contentType: 'video/mp4',
      cacheControl: CacheControl.PrivateWithCache,
    }),
  );
});
```

Note: You will need to add `AssetType` to the imports from `src/enum` and `AssetFileFactory` from `test/factories/asset-file.factory` if not already imported. Check existing imports at the top of the file.

**Step 2: Write the failing test for batch download of a trimmed video**

Add this test to the `downloadArchive` describe block in `download.service.spec.ts`:

```typescript
it('should use EncodedVideo editedPath for trimmed video in archive', async () => {
  const archiveMock = {
    addFile: vitest.fn(),
    finalize: vitest.fn(),
    stream: new Readable(),
  };
  const asset = AssetFactory.create({ type: AssetType.Video });
  const editedAsset = { ...asset, editedPath: '/encoded-video/owner/asset_edited.mp4' };

  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForOriginals.mockResolvedValue([editedAsset]);
  mocks.storage.createZipStream.mockReturnValue(archiveMock);

  await expect(sut.downloadArchive(authStub.admin, { assetIds: [asset.id], edited: true })).resolves.toEqual({
    stream: archiveMock.stream,
  });

  expect(archiveMock.addFile).toHaveBeenCalledTimes(1);
  expect(archiveMock.addFile).toHaveBeenCalledWith('/encoded-video/owner/asset_edited.mp4', asset.originalFileName);
});
```

Note: Add `AssetType` to the imports from `src/enum` if not already imported.

**Step 3: Run tests to verify they pass with mocked data**

Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts src/services/download.service.spec.ts`

Expected: All tests pass (including the new ones — since mocks bypass the real query, these pass immediately to establish the expected behavior contract).

**Step 4: Commit**

```bash
git add server/src/services/asset-media.service.spec.ts server/src/services/download.service.spec.ts
git commit -m "test: add download tests for trimmed video (EncodedVideo vs FullSize)"
```

---

### Task 2: Fix `buildGetForOriginal` query

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:1256-1273`

**Step 1: Write the fix**

Replace the current `buildGetForOriginal` method. The current LEFT JOIN filters `type = FullSize`, which returns the extracted JPEG frame for trimmed videos instead of the trimmed MP4 (`EncodedVideo`). Replace with a correlated subquery that checks both types, ordering by `type` ascending so `encoded_video` (alphabetically before `fullsize`) is preferred:

```typescript
private buildGetForOriginal(ids: string[], isEdited: boolean) {
  return this.db
    .selectFrom('asset')
    .select('asset.id')
    .select('originalFileName')
    .where('asset.id', 'in', ids)
    .$if(isEdited, (qb) =>
      qb.select((eb) =>
        eb
          .selectFrom('asset_file')
          .select('asset_file.path')
          .whereRef('asset_file.assetId', '=', 'asset.id')
          .where('asset_file.isEdited', '=', true)
          .where('asset_file.type', 'in', [AssetFileType.FullSize, AssetFileType.EncodedVideo])
          .orderBy('asset_file.type', 'asc')
          .limit(1)
          .as('editedPath'),
      ),
    )
    .select('originalPath');
}
```

Why `orderBy('type', 'asc')`: The enum values are `encoded_video` and `fullsize`. Alphabetically `encoded_video` < `fullsize`, so ascending order puts `EncodedVideo` first. For image assets, only `FullSize` edited files exist, so they get that one. For trimmed videos, both exist but `EncodedVideo` wins. This avoids any raw SQL or CASE expressions.

The `@GenerateSql` decorator params on `getForOriginal` (line 1275) and `getForOriginals` (line 1280) do not need changes — the method signatures are unchanged.

Pattern reference: `getForVideo` at line 1299 uses a similar correlated subquery on `asset_file`.

**Step 2: Regenerate SQL query docs**

Run: `cd server && pnpm build && pnpm sync:sql`

This updates `server/src/queries/asset.repository.sql`. Verify the generated SQL for `getForOriginal` now contains a subquery with `type in ('fullsize', 'encoded_video')` and `order by type asc limit 1`.

**Step 3: Run server unit tests**

Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts src/services/download.service.spec.ts`

Expected: All tests pass (including the new ones from Task 1).

**Step 4: Commit**

```bash
git add server/src/repositories/asset.repository.ts server/src/queries/asset.repository.sql
git commit -m "fix: download trimmed video returns video instead of still frame

buildGetForOriginal now uses a subquery checking both EncodedVideo and
FullSize edited files, preferring EncodedVideo (for trimmed videos) over
FullSize (for edited images) via alphabetical ordering."
```

---

### Task 3: Write failing tests for edited badge, then implement

**Files:**

- Modify: `web/src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts`
- Modify: `web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte:41,43-50,114`
- Modify: `i18n/en.json` (add "edited" key)

**Step 1: Write the failing tests**

Add two test cases to the existing describe block in `asset-viewer-nav-bar.spec.ts`:

```typescript
it('shows edited badge when asset is edited', () => {
  const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
  preferencesStore.set(prefs);

  const asset = assetFactory.build({ isEdited: true, isTrashed: false });
  const { getByText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
  expect(getByText('edited')).toBeInTheDocument();
});

it('does not show edited badge when asset is not edited', () => {
  const prefs = preferencesFactory.build({ cast: { gCastEnabled: false } });
  preferencesStore.set(prefs);

  const asset = assetFactory.build({ isEdited: false, isTrashed: false });
  const { queryByText } = renderWithTooltips(AssetViewerNavBar, { asset, ...additionalProps });
  expect(queryByText('edited')).not.toBeInTheDocument();
});
```

Note: The i18n mock in tests returns the key string as-is (e.g., `$t('edited')` returns `'edited'`), matching the pattern used in existing tests like `getByLabelText('go_back')` at line 52.

**Step 2: Run tests to verify they fail**

Run: `cd web && pnpm test -- --run src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts`

Expected: The "shows edited badge" test FAILS with `Unable to find an element with the text: edited`. The "does not show" test passes.

**Step 3: Add the i18n translation key**

In `i18n/en.json`, find the `"edit"` key (line 993) and add `"edited"` after it:

```json
"edited": "Edited",
```

**Step 4: Add the badge to the nav bar**

In `web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte`:

Add `mdiPencilOutline` to the `@mdi/js` import block (line 43-50):

```typescript
import {
  mdiArrowLeft,
  mdiArrowRight,
  mdiCompare,
  mdiDotsVertical,
  mdiImageSearch,
  mdiPencilOutline,
  mdiPresentationPlay,
  mdiVideoOutline,
} from '@mdi/js';
```

Add `Icon` to the `@immich/ui` import (line 41):

```typescript
import { ActionButton, CommandPaletteDefaultProvider, Icon, Tooltip, type ActionItem } from '@immich/ui';
```

Add the badge as the first element inside the right-side action div (after line 114, before the `{#if assetViewerManager.isImageLoading}` block):

```svelte
{#if asset.isEdited}
  <div class="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white">
    <Icon icon={mdiPencilOutline} size="14" />
    <span>{$t('edited')}</span>
  </div>
{/if}
```

**Step 5: Run tests to verify they pass**

Run: `cd web && pnpm test -- --run src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts`

Expected: All tests pass, including the two new ones.

**Step 6: Commit**

```bash
git add web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte web/src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts i18n/en.json
git commit -m "feat: add edited badge to asset viewer nav bar"
```

---

### Task 4: Lint, format, and type-check

**Step 1: Run prettier on changed files**

Run: `npx prettier --write server/src/repositories/asset.repository.ts server/src/services/asset-media.service.spec.ts server/src/services/download.service.spec.ts web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte web/src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts i18n/en.json`

**Step 2: Run server ESLint**

Run: `cd server && npx eslint src/repositories/asset.repository.ts src/services/asset-media.service.spec.ts src/services/download.service.spec.ts --max-warnings 0`

Expected: No errors or warnings.

**Step 3: Run server type-check**

Run: `cd server && npx tsc --noEmit`

Expected: No type errors.

**Step 4: Run web ESLint**

Run: `cd web && npx eslint src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte src/lib/components/asset-viewer/asset-viewer-nav-bar.spec.ts --max-warnings 0`

Expected: No errors or warnings.

**Step 5: Run web type-check**

Run: `make check-web`

Expected: No errors from svelte-check or tsc.

**Step 6: Commit any formatting fixes**

```bash
git add -u && git diff --cached --quiet || git commit -m "style: format changed files"
```
