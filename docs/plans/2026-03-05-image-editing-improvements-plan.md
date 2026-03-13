# Image Editing Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 confirmed image editing bugs and add quick-rotate (viewer) + batch-rotate (timeline) features.

**Architecture:** Bug fixes are server-side Kysely query corrections. Quick-rotate adds an ActionItem to the asset viewer navbar that calls the existing edit API (read-then-write pattern). Batch-rotate adds a timeline action component that loops through selected assets applying rotations via individual API calls.

**Tech Stack:** NestJS/Kysely (server), SvelteKit 5/TypeScript (web), `@immich/sdk` (API client), `@mdi/js` (icons), `svelte-i18n` (translations)

---

## Phase 1: Bug Fixes

### Task 1: Fix person thumbnail scalar subquery (#26045)

**Files:**

- Modify: `server/src/repositories/person.repository.ts:285-293`
- Test: `server/src/services/media.service.spec.ts` (existing tests + new test)

**Step 1: Write a failing test**

In `server/src/services/media.service.spec.ts`, add a test near line 1501 (within the `handleGeneratePersonThumbnail` describe block) that exercises the scenario where the face thumbnail asset has both original and edited preview files. Use the existing `personThumbnailStub.newThumbnailMiddle` pattern but note that the actual bug is in the SQL query (scalar subquery returning multiple rows), so the unit test should verify that person thumbnail generation still works when the mock returns data — the real fix is in the repository query.

Since the existing tests already cover the happy path and the actual bug is a SQL-level issue (not testable via unit tests with mocks), verify the fix by inspecting the generated SQL.

**Step 2: Fix the query**

In `server/src/repositories/person.repository.ts`, the scalar subquery at lines 285-293:

```typescript
.select((eb) =>
  eb
    .selectFrom('asset_file')
    .select('asset_file.path')
    .whereRef('asset_file.assetId', '=', 'asset.id')
    .where('asset_file.type', '=', sql.lit(AssetFileType.Preview))
    .where('asset_file.isEdited', '=', false)
    .as('previewPath'),
)
```

The `isEdited = false` filter should handle it, but add `.limit(1)` as a safety guard in case multiple non-edited preview files exist:

```typescript
.select((eb) =>
  eb
    .selectFrom('asset_file')
    .select('asset_file.path')
    .whereRef('asset_file.assetId', '=', 'asset.id')
    .where('asset_file.type', '=', sql.lit(AssetFileType.Preview))
    .where('asset_file.isEdited', '=', false)
    .limit(1)
    .as('previewPath'),
)
```

**Step 3: Run existing tests to verify no regressions**

Run: `cd server && pnpm test -- --run src/services/media.service.spec.ts`
Expected: All existing `handleGeneratePersonThumbnail` tests PASS

**Step 4: Regenerate SQL docs**

Run: `cd server && npx tsx src/utils/sql.ts`
Expected: `server/src/queries/person.repository.sql` updated with `LIMIT 1`

**Step 5: Commit**

```bash
git add server/src/repositories/person.repository.ts server/src/queries/person.repository.sql
git commit -m "fix(server): add limit to person thumbnail preview subquery (#26045)"
```

---

### Task 2: Fix download-as-album serving original instead of edited (#26182)

**Files:**

- Modify: `server/src/repositories/asset.repository.ts:1086-1106`
- Test: `server/src/services/download.service.spec.ts`

**Step 1: Write a failing test**

In `server/src/services/download.service.spec.ts`, add a test case that verifies edited assets use the edited path when `edited: true` is passed:

```typescript
it('should use edited path when edited flag is true and editedPath exists', async () => {
  const archiveMock = {
    addFile: vitest.fn(),
    finalize: vitest.fn(),
    stream: new Readable(),
  };
  const asset = AssetFactory.create();
  const editedAsset = { ...asset, editedPath: '/edited/path.jpg' };

  mocks.access.asset.checkOwnerAccess.mockResolvedValue(new Set([asset.id]));
  mocks.asset.getForOriginals.mockResolvedValue([editedAsset]);
  mocks.storage.createZipStream.mockReturnValue(archiveMock);

  await expect(sut.downloadArchive(authStub.admin, { assetIds: [asset.id], edited: true })).resolves.toEqual({
    stream: archiveMock.stream,
  });

  expect(archiveMock.addFile).toHaveBeenCalledWith('/edited/path.jpg', asset.originalFileName);
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/services/download.service.spec.ts`
Expected: FAIL — `addFile` called with `originalPath` instead of `/edited/path.jpg`

**Step 3: Investigate the actual query**

The `buildGetForOriginal` method at `server/src/repositories/asset.repository.ts:1086-1106` already has the correct logic — it conditionally joins `asset_file` and selects `editedPath` when `isEdited` is true. The download service at line 87 passes `dto.edited ?? false`.

Verify by checking: does `DownloadArchiveDto` include the `edited` field? Check `server/src/dtos/download.dto.ts`.

**Step 4: Verify the real issue and fix**

The `buildGetForOriginal` already selects `editedPath` correctly when `isEdited=true`. The issue is likely that the `DownloadArchiveDto` doesn't expose the `edited` field from the API, OR the download endpoints that call `getDownloadInfo` don't pass it through. Check the actual download flow end-to-end.

If the query works but the DTO doesn't expose `edited`, add it. If the query is correct and the test actually passes (the mock sidesteps the DB), then the bug is only visible at DB level — note it in the commit message.

**Step 5: Run tests**

Run: `cd server && pnpm test -- --run src/services/download.service.spec.ts`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add server/src/services/download.service.spec.ts server/src/repositories/asset.repository.ts
git commit -m "fix(server): serve edited files in download-as-album (#26182)"
```

---

### Task 3: Fix album thumbnail not using edited version (#25803)

**Files:**

- Modify: `server/src/repositories/asset-job.repository.ts:163-171`
- Test: `server/src/services/notification.service.spec.ts`

**Step 1: Understand the issue**

The `getAlbumThumbnailFiles` method at `asset-job.repository.ts:164-170` returns ALL `asset_file` rows for the thumbnail asset (both original and edited). The notification service at line 449 checks `albumThumbnailFiles.length !== 1` and bails if there are multiple files.

For edited assets, this returns 2+ files (original + edited), causing the album thumbnail email attachment to fail silently.

**Step 2: Fix the query to prefer edited files**

Update `getAlbumThumbnailFiles` to order by `isEdited desc` and limit to 1, so it prefers the edited version when one exists:

```typescript
getAlbumThumbnailFiles(id: string, fileType?: AssetFileType) {
  return this.db
    .selectFrom('asset_file')
    .select(columns.assetFiles)
    .where('asset_file.assetId', '=', id)
    .$if(!!fileType, (qb) => qb.where('asset_file.type', '=', fileType!))
    .orderBy('asset_file.isEdited', 'desc')
    .limit(1)
    .execute();
}
```

**Step 3: Run tests**

Run: `cd server && pnpm test -- --run src/services/notification.service.spec.ts`
Expected: ALL PASS

**Step 4: Regenerate SQL docs**

Run: `cd server && npx tsx src/utils/sql.ts`

**Step 5: Commit**

```bash
git add server/src/repositories/asset-job.repository.ts server/src/queries/asset-job.repository.sql
git commit -m "fix(server): prefer edited album thumbnail file (#25803)"
```

---

## Phase 2: Quick-Rotate in Viewer

### Task 4: Add i18n keys for quick-rotate

**Files:**

- Modify: `i18n/en.json`

**Step 1: Add new i18n keys**

Add the following keys to `i18n/en.json` (alphabetically placed):

```json
"quick_rotate_right": "Rotate right",
"quick_rotate_left": "Rotate left",
"quick_rotate_180": "Rotate 180°",
"rotate_error": "Failed to rotate image",
"rotated_count": "Rotated {count, plural, one {# asset} other {# assets}}"
```

**Step 2: Commit**

```bash
git add i18n/en.json
git commit -m "feat(i18n): add quick-rotate translation keys"
```

---

### Task 5: Add quick-rotate ActionItem to asset service

**Files:**

- Modify: `web/src/lib/services/asset.service.ts`

**Step 1: Read the full file**

Read `web/src/lib/services/asset.service.ts` to understand the existing action pattern and how `Edit` is defined (lines 226-239).

**Step 2: Add rotate action items**

Add `RotateRight` action next to the `Edit` action. Import `mdiRotateRight` from `@mdi/js`. Import `getAssetEdits`, `editAsset`, `AssetEditAction` from `@immich/sdk`. Import `waitForWebsocketEvent` from `$lib/stores/websocket`. Import `eventManager` from `$lib/managers/event-manager.svelte`. Import `toastManager` from `@immich/ui`.

The RotateRight action should:

- Have the same `$if` condition as `Edit` (owner, image, not live photo, not panorama, not GIF, not SVG)
- Use `mdiRotateRight` icon
- Use title `$t('quick_rotate_right')`
- `onAction` handler:
  1. Call `getAssetEdits({ id: asset.id })`
  2. Append `{ action: AssetEditAction.Rotate, parameters: { angle: 90 } }` to existing edits
  3. Set up websocket listener with `waitForWebsocketEvent('AssetEditReadyV1', ...)`
  4. Call `editAsset({ id: asset.id, assetEditsCreateDto: { edits: newEdits } })`
  5. Await websocket event
  6. Emit `eventManager.emit('AssetEditsApplied', asset.id)`
  7. On error: `toastManager.danger($t('rotate_error'))`

Also add `RotateLeft` and `Rotate180` action items for the More menu, using `mdiRotateLeft` and angles -90/180 respectively.

**Step 3: Export the new actions**

Make sure the new actions are included in the return value of `getAssetActions()`.

**Step 4: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS (or identify tests to update)

**Step 5: Commit**

```bash
git add web/src/lib/services/asset.service.ts
git commit -m "feat(web): add quick-rotate action items to asset service"
```

---

### Task 6: Add rotate button to viewer navbar

**Files:**

- Modify: `web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte`

**Step 1: Add rotate-right button to the toolbar**

In `asset-viewer-nav-bar.svelte`, add the `RotateRight` ActionButton before the `Edit` button (around line 125):

```svelte
<ActionButton action={Actions.RotateRight} />
<ActionButton action={Actions.Edit} />
```

**Step 2: Add rotate-left and rotate-180 to the More menu**

In the More dropdown (ButtonContextMenu), add menu items for rotate-left and rotate-180. Place them after the existing items, in an owner-only section with the editor-related actions:

```svelte
{#if isOwner}
  <ActionMenuItem action={Actions.RotateLeft} />
  <ActionMenuItem action={Actions.Rotate180} />
{/if}
```

**Step 3: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS

**Step 4: Commit**

```bash
git add web/src/lib/components/asset-viewer/asset-viewer-nav-bar.svelte
git commit -m "feat(web): add rotate button to viewer toolbar and More menu"
```

---

### Task 7: Handle asset refresh after quick-rotate

**Files:**

- Check: `web/src/lib/components/asset-viewer/asset-viewer.svelte`

**Step 1: Verify the refresh mechanism**

The `AssetEditsApplied` event is already emitted by `editManager.applyEdits()`. Check if the asset viewer component already listens for this event and refreshes. If it does, the quick-rotate's `eventManager.emit('AssetEditsApplied', assetId)` will trigger the same refresh.

Read `asset-viewer.svelte` and search for `AssetEditsApplied` handling. If it already handles it, no additional work needed.

**Step 2: Test manually (or write integration test)**

If the refresh is already wired up, verify the flow works end-to-end by checking the event listener pattern.

**Step 3: Commit if changes needed**

Only commit if modifications were required.

---

## Phase 3: Batch Rotate in Timeline

### Task 8: Add batch rotate timeline action component

**Files:**

- Create: `web/src/lib/components/timeline/actions/RotateAction.svelte`

**Step 1: Create the component**

Follow the `FavoriteAction.svelte` pattern at `web/src/lib/components/timeline/actions/FavoriteAction.svelte`. The batch rotate component should:

- Accept `menuItem` boolean prop (for dropdown vs inline)
- Use `getAssetControlContext()` to get `getOwnedAssets()` and `clearSelect()`
- Show a dropdown with 3 options: Rotate Right (90°), Rotate Left (-90°), Rotate 180°
- On click:
  1. Filter selected assets to images only (skip videos)
  2. Loop through each asset:
     a. `getAssetEdits({ id })` to read current edits
     b. Append the rotation edit
     c. `editAsset({ id, assetEditsCreateDto: { edits: newEdits } })` to save
  3. Show progress toast ("Rotating 5/20...")
  4. On completion: show success toast with count, clear selection
  5. On individual errors: continue, count failures, report at end

```svelte
<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/utils/context';
  import { handleError } from '$lib/utils/handle-error';
  import { editAsset, getAssetEdits, AssetEditAction, type AssetEditActionItemDto } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
  import { mdiRotateRight, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();
  let loading = $state(false);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleRotate = async (angle: number) => {
    loading = true;
    try {
      const assets = [...getOwnedAssets()].filter((asset) => asset.isImage);
      let success = 0;
      let failed = 0;

      for (const asset of assets) {
        try {
          const existing = await getAssetEdits({ id: asset.id });
          const newEdit: AssetEditActionItemDto = {
            action: AssetEditAction.Rotate,
            parameters: { angle },
          };
          const edits = [...existing.edits.map(({ action, parameters }) => ({ action, parameters })), newEdit];
          await editAsset({ id: asset.id, assetEditsCreateDto: { edits } });
          success++;
        } catch {
          failed++;
        }
      }

      if (failed > 0) {
        toastManager.warning($t('rotated_count', { values: { count: success } }) + ` (${failed} failed)`);
      } else {
        toastManager.success($t('rotated_count', { values: { count: success } }));
      }

      clearSelect();
    } catch (error) {
      handleError(error, $t('rotate_error'));
    } finally {
      loading = false;
    }
  };
</script>
```

For the template, render as a `MenuOption` with submenu (or 3 separate menu items).

**Step 2: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add web/src/lib/components/timeline/actions/RotateAction.svelte
git commit -m "feat(web): add batch rotate action component for timeline"
```

---

### Task 9: Wire batch rotate into timeline toolbar

**Files:**

- Modify: The component that renders the timeline multi-select toolbar

**Step 1: Find where timeline actions are rendered**

Search for where `FavoriteAction` and `ArchiveAction` are imported and rendered in the timeline/gallery view. This is the parent component that renders the multi-select action bar.

**Step 2: Add RotateAction**

Import and render `RotateAction` alongside the other batch actions. Place it near the other image-specific actions (like Favorite/Archive).

**Step 3: Run web tests**

Run: `cd web && pnpm test -- --run`
Expected: PASS

**Step 4: Commit**

```bash
git add <modified files>
git commit -m "feat(web): wire batch rotate into timeline multi-select toolbar"
```

---

### Task 10: Final linting and formatting

**Step 1: Run linting and formatting across all changed packages**

```bash
make lint-server && make lint-web && make format-server && make format-web
```

**Step 2: Run type checks**

```bash
make check-server && make check-web
```

**Step 3: Run all tests**

```bash
cd server && pnpm test -- --run
cd ../web && pnpm test -- --run
```

**Step 4: Fix any issues found**

Address lint/type/test errors.

**Step 5: Commit fixes**

```bash
git add -A
git commit -m "chore: fix lint and formatting"
```
