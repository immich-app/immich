# Cmdk v1.5A Selection Commands Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add v1.5A command-palette actions for the current asset selection: add to album, add to a writable target space, add to this writable space, add to favorites, archive, and delete.

**Architecture:** Add a route-scoped `SelectionCommandContext` to the existing command context manager, then keep command behavior in a focused handler module that command registry entries delegate to. Pages opt in by registering live selection thunks and page-local update callbacks; command availability is derived from the latest context snapshot at provider and activation time.

**Tech Stack:** Svelte 5, TypeScript, Vitest, svelte-testing-library, svelte-i18n, oazapfts Immich SDK

---

## Source Spec

Implement the approved design in:

- `docs/superpowers/specs/2026-04-27-cmdk-v1.5a-selection-commands-design.md`
- `docs/superpowers/specs/2026-04-28-cmdk-add-selected-to-space-design.md`

The spec is authoritative. If a conflict appears between this plan and the spec, stop and fix the plan or implementation before continuing.

## File Structure

- Modify: `web/src/lib/managers/command-context-manager.svelte.ts`
  Responsibility: define `SelectionCommandContext`, store route-scoped selection registration options, and expose live `ctx.selection` snapshots from `getContext()`.

- Create: `web/src/lib/managers/__tests__/register-selection-context-harness.svelte`
  Responsibility: small Svelte harness for exercising `registerSelectionContext()` lifecycle in Vitest.

- Modify: `web/src/lib/managers/command-context-manager.spec.ts`
  Responsibility: red/green coverage for empty selection, live thunks, dedupe, ownership flags, dynamic callback getters, route gating, and cleanup.

- Create: `web/src/lib/managers/selection-command-handlers.ts`
  Responsibility: implement the six v1.5A command handlers and their availability predicates without reaching into page globals.

- Create: `web/src/lib/managers/selection-command-handlers.spec.ts`
  Responsibility: red/green coverage for modal delegation, SDK calls, page callback calls, clear/no-clear behavior, force delete, undo wiring, and failure paths.

- Modify: `web/src/lib/managers/command-items.ts`
  Responsibility: register six new `cmd:selection_*` entries with labels, icons, availability predicates, handlers, and destructive delete flag.

- Modify: `web/src/lib/managers/command-items.spec.ts`
  Responsibility: update registry-count drift guards and test command availability/handler delegation.

- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
  Responsibility: prove selection commands are provider-gated from live context and activation uses a fresh context snapshot.

- Modify: `i18n/en.json`
  Responsibility: add English labels/descriptions for the six selection commands.

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
  Responsibility: register photo-page selection context matching the existing visible toolbar actions.

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
  Responsibility: prove photo page registers add-to-album/favorite/archive/delete/undo callbacks.

- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: register album detail selection context only in `AlbumPageViewMode.VIEW`.

- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts`
  Responsibility: prove album page registers view-mode callbacks and hides them in add-assets mode.

- Modify: `web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: register tag page selection context matching the visible toolbar actions.

- Create: `web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts`
  Responsibility: focused route test for tag-page selection context registration.

- Modify: `web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: register archive page add-to-album/favorite/delete callbacks and intentionally omit archive.

- Create: `web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts`
  Responsibility: focused route test for archive-page selection context registration.

- Modify: `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: register search-page callbacks, including archive updates that remove rows when the active visibility filter excludes archived assets.

- Create: `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts`
  Responsibility: focused route test for search-page selection context registration and callback behavior.

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
  Responsibility: register space selection context for normal view favorite/archive and select-assets add-to-current-space only.

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`
  Responsibility: prove space page dynamic callbacks by mode, writable gating, limit checks, plus-button reuse, and success cleanup.

- Create: `web/src/lib/managers/selection-command-page-boundaries.spec.ts`
  Responsibility: source-boundary regression test proving v1.5A registration remains limited to the approved page set.

## Global Implementation Requirements

- Use TDD in every task: write or update failing tests first, run them to confirm red, implement the minimum code, then rerun the same tests to confirm green.
- Do not wire v1.5A selection context on favorites, people, folders, map, trash, locked, utilities, or memory pages.
- Do not add an in-palette secondary picker. `cmd:selection_add_to_album` opens the existing `AssetAddToAlbumModal`.
- `cmd:selection_add_to_current_space` appears only on a writable space page in existing `viewMode === 'select-assets'`.
- `cmd:selection_delete` must keep both confirmation layers: cmdk inline destructive confirmation first, then `AssetDeleteConfirmModal` for force delete when `$showDeleteModal` is true.
- Commit after each task using the commit message listed in the task.

## Task 1: Selection Context Infrastructure

**Files:**

- Modify: `web/src/lib/managers/command-context-manager.svelte.ts`
- Create: `web/src/lib/managers/__tests__/register-selection-context-harness.svelte`
- Modify: `web/src/lib/managers/command-context-manager.spec.ts`

- [ ] **Step 1: Write the failing registration harness**

Create `web/src/lib/managers/__tests__/register-selection-context-harness.svelte`:

```svelte
<script lang="ts">
  import { registerSelectionContext, type RegisterSelectionContextOptions } from '$lib/managers/command-context-manager.svelte';

  let { options }: { options: RegisterSelectionContextOptions } = $props();

  registerSelectionContext(options);
</script>
```

- [ ] **Step 2: Add failing context-manager tests**

In `web/src/lib/managers/command-context-manager.spec.ts`, add this import beside the existing harness imports:

```typescript
import RegisterSelectionContextHarness from './__tests__/register-selection-context-harness.svelte';
import { AssetVisibility } from '@immich/sdk';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
```

If `AssetVisibility` is already imported from `@immich/sdk`, merge the import instead of duplicating it.

Add helpers near the existing `makeAlbum` / `makeSpace` helpers:

```typescript
const PHOTOS_ROUTE = '/(user)/photos/[[assetId=id]]';

const makeAsset = (overrides: Partial<TimelineAsset> = {}): TimelineAsset =>
  ({
    id: 'asset-1',
    ownerId: 'u-me',
    ratio: 1,
    thumbhash: null,
    localDateTime: '2026-01-01T00:00:00.000Z',
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    visibility: AssetVisibility.Timeline,
    isFavorite: false,
    isTrashed: false,
    isVideo: false,
    isImage: true,
    stack: null,
    duration: null,
    projectionType: null,
    livePhotoVideoId: null,
    city: null,
    country: null,
    people: null,
    ...overrides,
  }) as unknown as TimelineAsset;
```

Add this `describe` block:

```typescript
describe('registerSelectionContext', () => {
  beforeEach(() => {
    mockPage.route.id = PHOTOS_ROUTE;
    mockUser.current = { id: 'u-me', isAdmin: false };
  });

  it('returns selection:null when no selection context is registered', () => {
    expect(commandContextManager.getContext().selection).toBeNull();
  });

  it('returns selection:null when getAssets returns an empty array', () => {
    const { unmount } = render(RegisterSelectionContextHarness, {
      props: {
        options: {
          getAssets: () => [],
          clearSelection: vi.fn(),
        },
      },
    });

    expect(commandContextManager.getContext().selection).toBeNull();
    unmount();
  });

  it('builds a live, deduped selection snapshot in selected order', () => {
    let assets = [
      makeAsset({ id: 'asset-1', ownerId: 'u-me' }),
      makeAsset({ id: 'asset-2', ownerId: 'u-other' }),
      makeAsset({ id: 'asset-1', ownerId: 'u-me' }),
    ];
    const clearSelection = vi.fn();
    const { unmount } = render(RegisterSelectionContextHarness, {
      props: { options: { getAssets: () => assets, clearSelection } },
    });

    const first = commandContextManager.getContext().selection;
    expect(first?.assets.map((asset) => asset.id)).toEqual(['asset-1', 'asset-2']);
    expect(first?.selectedAssetIds).toEqual(['asset-1', 'asset-2']);
    expect(first?.ownedSelectedAssetIds).toEqual(['asset-1']);
    expect(first?.isAllUserOwned).toBe(false);
    expect(first?.clearSelection).toBe(clearSelection);

    assets = [makeAsset({ id: 'asset-3', ownerId: 'u-me', isFavorite: true })];
    const second = commandContextManager.getContext().selection;
    expect(second?.selectedAssetIds).toEqual(['asset-3']);
    expect(second?.ownedSelectedAssetIds).toEqual(['asset-3']);
    expect(second?.isAllUserOwned).toBe(true);
    expect(second?.isAllFavorite).toBe(true);
    unmount();
  });

  it('computes archive/trash/favorite flags from the live assets', () => {
    let assets = [
      makeAsset({ id: 'asset-1', visibility: AssetVisibility.Archive, isFavorite: true, isTrashed: true }),
      makeAsset({ id: 'asset-2', visibility: AssetVisibility.Archive, isFavorite: true, isTrashed: true }),
    ];
    const { unmount } = render(RegisterSelectionContextHarness, {
      props: { options: { getAssets: () => assets, clearSelection: vi.fn() } },
    });

    expect(commandContextManager.getContext().selection).toMatchObject({
      isAllFavorite: true,
      isAllArchived: true,
      isAllTrashed: true,
    });

    assets = [makeAsset({ id: 'asset-3', visibility: AssetVisibility.Timeline, isFavorite: false, isTrashed: false })];
    expect(commandContextManager.getContext().selection).toMatchObject({
      isAllFavorite: false,
      isAllArchived: false,
      isAllTrashed: false,
    });
    unmount();
  });

  it('resolves canAddToAlbum and callbacks through live getters', () => {
    let canAddToAlbum = false;
    let favorite = vi.fn();
    const archive = vi.fn();
    const onDelete = vi.fn();
    const onUndoDelete = vi.fn();
    const addSelectedToCurrentSpace = vi.fn().mockResolvedValue(true);

    const { unmount } = render(RegisterSelectionContextHarness, {
      props: {
        options: {
          getAssets: () => [makeAsset()],
          clearSelection: vi.fn(),
          canAddToAlbum: () => canAddToAlbum,
          getOnFavorite: () => favorite,
          getOnArchive: () => archive,
          getOnDelete: () => onDelete,
          getOnUndoDelete: () => onUndoDelete,
          getAddSelectedToCurrentSpace: () => addSelectedToCurrentSpace,
        },
      },
    });

    expect(commandContextManager.getContext().selection?.canAddToAlbum).toBe(false);
    canAddToAlbum = true;
    expect(commandContextManager.getContext().selection?.canAddToAlbum).toBe(true);
    expect(commandContextManager.getContext().selection?.onFavorite).toBe(favorite);
    favorite = vi.fn();
    expect(commandContextManager.getContext().selection?.onFavorite).toBe(favorite);
    expect(commandContextManager.getContext().selection?.onArchive).toBe(archive);
    expect(commandContextManager.getContext().selection?.onDelete).toBe(onDelete);
    expect(commandContextManager.getContext().selection?.onUndoDelete).toBe(onUndoDelete);
    expect(commandContextManager.getContext().selection?.addSelectedToCurrentSpace).toBe(addSelectedToCurrentSpace);
    unmount();
  });

  it('hides a stored selection context after route navigation and restores it on the original route', () => {
    const { unmount } = render(RegisterSelectionContextHarness, {
      props: { options: { getAssets: () => [makeAsset()], clearSelection: vi.fn() } },
    });

    expect(commandContextManager.getContext().selection?.selectedAssetIds).toEqual(['asset-1']);
    mockPage.route.id = SPACE_ROUTE;
    expect(commandContextManager.getContext().selection).toBeNull();
    mockPage.route.id = PHOTOS_ROUTE;
    expect(commandContextManager.getContext().selection?.selectedAssetIds).toEqual(['asset-1']);
    unmount();
  });

  it('clears selection registration on unmount', () => {
    const { unmount } = render(RegisterSelectionContextHarness, {
      props: { options: { getAssets: () => [makeAsset()], clearSelection: vi.fn() } },
    });
    expect(commandContextManager.getContext().selection).not.toBeNull();
    unmount();
    expect(commandContextManager.getContext().selection).toBeNull();
  });
});
```

- [ ] **Step 3: Run the context tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run src/lib/managers/command-context-manager.spec.ts
```

Expected: FAIL because `registerSelectionContext`, `RegisterSelectionContextOptions`, and `ctx.selection` do not exist.

- [ ] **Step 4: Implement the selection context manager**

In `web/src/lib/managers/command-context-manager.svelte.ts`, add imports:

```typescript
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { OnArchive, OnDelete, OnFavorite, OnUndoDelete } from '$lib/utils/actions';
import { AssetVisibility } from '@immich/sdk';
```

Merge `AssetVisibility` into the existing `@immich/sdk` import instead of creating a duplicate import.

Add these interfaces below `SpaceContext`:

```typescript
export interface SelectionCommandContext {
  assets: TimelineAsset[];
  selectedAssetIds: string[];
  ownedAssets: TimelineAsset[];
  ownedSelectedAssetIds: string[];
  canAddToAlbum: boolean;
  isAllUserOwned: boolean;
  isAllFavorite: boolean;
  isAllArchived: boolean;
  isAllTrashed: boolean;
  clearSelection: () => void;
  onFavorite?: OnFavorite;
  onArchive?: OnArchive;
  onDelete?: OnDelete;
  onUndoDelete?: OnUndoDelete;
  addSelectedToCurrentSpace?: () => Promise<boolean>;
}

export type RegisterSelectionContextOptions = {
  getAssets: () => TimelineAsset[];
  clearSelection: () => void;
  canAddToAlbum?: () => boolean;
  getOnFavorite?: () => OnFavorite | undefined;
  getOnArchive?: () => OnArchive | undefined;
  getOnDelete?: () => OnDelete | undefined;
  getOnUndoDelete?: () => OnUndoDelete | undefined;
  getAddSelectedToCurrentSpace?: () => (() => Promise<boolean>) | undefined;
};

type RegisteredSelectionContext = {
  routeId: string | null;
  options: RegisterSelectionContextOptions;
};
```

Add `selection: SelectionCommandContext | null;` to `CommandContext`.

Inside `CommandContextManager`, add state and setter:

```typescript
private _selection: RegisteredSelectionContext | null = $state(null);

setSelection(selection: RegisteredSelectionContext | null) {
  this._selection = selection;
}
```

Add these private helpers inside `CommandContextManager`:

```typescript
private getSelection(routeId: string | null, currentUserId: string | null): SelectionCommandContext | null {
  const registered = this._selection;
  if (!registered || registered.routeId !== routeId) {
    return null;
  }

  const assets = this.uniqueAssets(registered.options.getAssets());
  if (assets.length === 0) {
    return null;
  }

  const ownedAssets = currentUserId === null ? [] : assets.filter((asset) => asset.ownerId === currentUserId);
  const selectedAssetIds = assets.map((asset) => asset.id);
  const ownedSelectedAssetIds = ownedAssets.map((asset) => asset.id);

  return {
    assets,
    selectedAssetIds,
    ownedAssets,
    ownedSelectedAssetIds,
    canAddToAlbum: registered.options.canAddToAlbum?.() ?? false,
    isAllUserOwned: currentUserId !== null && ownedAssets.length === assets.length,
    isAllFavorite: assets.every((asset) => asset.isFavorite),
    isAllArchived: assets.every((asset) => asset.visibility === AssetVisibility.Archive),
    isAllTrashed: assets.every((asset) => asset.isTrashed),
    clearSelection: registered.options.clearSelection,
    onFavorite: registered.options.getOnFavorite?.(),
    onArchive: registered.options.getOnArchive?.(),
    onDelete: registered.options.getOnDelete?.(),
    onUndoDelete: registered.options.getOnUndoDelete?.(),
    addSelectedToCurrentSpace: registered.options.getAddSelectedToCurrentSpace?.(),
  };
}

private uniqueAssets(assets: TimelineAsset[]) {
  const seen = new Set<string>();
  const unique: TimelineAsset[] = [];
  for (const asset of assets) {
    if (seen.has(asset.id)) {
      continue;
    }
    seen.add(asset.id);
    unique.push(asset);
  }
  return unique;
}
```

Update `getContext()` to compute `selection` from the same route/user snapshot:

```typescript
const u = authManager.authenticated ? authManager.user : null;
const routeId = page.route.id;
const userId = u?.id ?? null;
return {
  routeId,
  params: { ...page.params },
  album: isAlbumsRoute(routeId) ? this._album : null,
  space: isSpacesRoute(routeId) ? this._space : null,
  selection: this.getSelection(routeId, userId),
  userId,
  isAdmin: u?.isAdmin ?? false,
};
```

Add the registration helper below `registerSpaceContext()`:

```typescript
export function registerSelectionContext(options: RegisterSelectionContextOptions) {
  $effect(() => {
    const routeId = page.route.id;
    commandContextManager.setSelection({ routeId, options });
    return () => commandContextManager.setSelection(null);
  });
}
```

Update the existing `beforeEach()` in `command-context-manager.spec.ts`:

```typescript
commandContextManager.setSelection(null);
```

- [ ] **Step 5: Run the context tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run src/lib/managers/command-context-manager.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 1**

Run:

```bash
git add web/src/lib/managers/command-context-manager.svelte.ts web/src/lib/managers/command-context-manager.spec.ts web/src/lib/managers/__tests__/register-selection-context-harness.svelte
git commit -m "feat(web): add cmdk selection context"
```

## Task 2: Selection Command Handler Module

**Files:**

- Create: `web/src/lib/managers/selection-command-handlers.ts`
- Create: `web/src/lib/managers/selection-command-handlers.spec.ts`

- [ ] **Step 1: Write failing handler tests**

Create `web/src/lib/managers/selection-command-handlers.spec.ts` with tests covering these exact behaviors:

```typescript
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import AssetAddToAlbumModal from '$lib/modals/AssetAddToAlbumModal.svelte';
import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
import { showDeleteModal } from '$lib/stores/preferences.store';
import * as handleErrorModule from '$lib/utils/handle-error';
import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets, updateAssets } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandContext, SelectionCommandContext } from './command-context-manager.svelte';
import {
  canAddSelectedToAlbum,
  canAddSelectedToCurrentSpace,
  canArchiveSelected,
  canDeleteSelected,
  canFavoriteSelected,
  handleAddSelectedToAlbum,
  handleAddSelectedToCurrentSpace,
  handleArchiveSelected,
  handleDeleteSelected,
  handleFavoriteSelected,
} from './selection-command-handlers';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';

vi.mock('@immich/ui', async (orig) => {
  const actual = await orig<typeof import('@immich/ui')>();
  return {
    ...actual,
    modalManager: { show: vi.fn().mockResolvedValue(true) },
    toastManager: { primary: vi.fn(), danger: vi.fn(), warning: vi.fn(), success: vi.fn(), info: vi.fn() },
  };
});

vi.mock('@immich/sdk', async (orig) => ({
  ...(await orig<typeof import('@immich/sdk')>()),
  updateAssets: vi.fn().mockResolvedValue(undefined),
  deleteAssets: vi.fn().mockResolvedValue(undefined),
  restoreAssets: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/managers/feature-flags-manager.svelte', () => ({
  featureFlagsManager: { value: { trash: true } },
}));
```

Then add local helpers:

```typescript
const makeAsset = (overrides: Partial<TimelineAsset> = {}): TimelineAsset =>
  ({
    id: 'asset-1',
    ownerId: 'u-me',
    ratio: 1,
    thumbhash: null,
    localDateTime: '2026-01-01T00:00:00.000Z',
    fileCreatedAt: '2026-01-01T00:00:00.000Z',
    visibility: AssetVisibility.Timeline,
    isFavorite: false,
    isTrashed: false,
    isVideo: false,
    isImage: true,
    stack: null,
    duration: null,
    projectionType: null,
    livePhotoVideoId: null,
    city: null,
    country: null,
    people: null,
    ...overrides,
  }) as unknown as TimelineAsset;

const makeSelection = (overrides: Partial<SelectionCommandContext> = {}): SelectionCommandContext => {
  const assets = overrides.assets ?? [makeAsset()];
  const ownedAssets = overrides.ownedAssets ?? assets;
  return {
    assets,
    selectedAssetIds: assets.map((asset) => asset.id),
    ownedAssets,
    ownedSelectedAssetIds: ownedAssets.map((asset) => asset.id),
    canAddToAlbum: true,
    isAllUserOwned: true,
    isAllFavorite: assets.every((asset) => asset.isFavorite),
    isAllArchived: assets.every((asset) => asset.visibility === AssetVisibility.Archive),
    isAllTrashed: assets.every((asset) => asset.isTrashed),
    clearSelection: vi.fn(),
    onFavorite: vi.fn(),
    onArchive: vi.fn(),
    onDelete: vi.fn(),
    onUndoDelete: vi.fn(),
    ...overrides,
  };
};

const makeCtx = (selection: SelectionCommandContext | null): CommandContext => ({
  routeId: '/(user)/photos/[[assetId=id]]',
  params: {},
  album: null,
  space: null,
  selection,
  userId: 'u-me',
  isAdmin: false,
});
```

Write assertions for:

- `canAddSelectedToAlbum(makeCtx(selection))` true only when `selection.canAddToAlbum` is true.
- `handleAddSelectedToAlbum()` calls `modalManager.show(AssetAddToAlbumModal, { assetIds: [...] })` and does not call `clearSelection`.
- `canAddSelectedToCurrentSpace()` true only when `selection.addSelectedToCurrentSpace` exists.
- `handleAddSelectedToCurrentSpace()` awaits that callback and does not call SDK functions directly.
- `canFavoriteSelected()` requires selection, all-owned, `onFavorite`, and at least one non-favorite asset.
- `handleFavoriteSelected()` calls `updateAssets({ assetBulkUpdateDto: { ids, isFavorite: true } })` only for non-favorite ids, mutates those asset refs, calls `onFavorite(ids, true)`, toasts, and clears after success.
- Favorite no-ops when the filtered id list is empty.
- Favorite failure calls `handleError`, does not call `onFavorite`, and does not clear.
- `canArchiveSelected()` requires selection, all-owned, `onArchive`, and at least one non-archived asset.
- `handleArchiveSelected()` calls `updateAssets({ assetBulkUpdateDto: { ids, visibility: AssetVisibility.Archive } })`, calls `onArchive(ids, AssetVisibility.Archive)`, toasts, and clears after success.
- Archive no-ops when the filtered id list is empty.
- Archive failure calls `handleError`, does not call `onArchive`, and does not clear.
- `canDeleteSelected()` requires selection, all-owned, and `onDelete`.
- `handleDeleteSelected()` calls `deleteBulk({ assetBulkDeleteDto: { ids, force: false } })`, calls `onDelete(ids)`, includes an undo button when `onUndoDelete` exists and `force` is false, and clears after success.
- The undo button calls `restoreAssets({ bulkIdsDto: { ids } })` and then `onUndoDelete(assets)`.
- Delete uses `force: true` when `featureFlagsManager.value.trash = false`.
- Delete uses `force: true` when any selected owned asset has `isTrashed: true`.
- Force delete passes no undo button.
- Force delete with `showDeleteModal.set(true)` opens `AssetDeleteConfirmModal`; cancel prevents SDK, callback, and clear.
- Delete SDK failure calls `handleError`, does not call `onDelete`, and does not clear.
- Passing `makeCtx(null)` to every handler is a no-op.

- [ ] **Step 2: Run handler tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run src/lib/managers/selection-command-handlers.spec.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `selection-command-handlers.ts`**

Create `web/src/lib/managers/selection-command-handlers.ts`:

```typescript
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import type { CommandContext, SelectionCommandContext } from '$lib/managers/command-context-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import AssetAddToAlbumModal from '$lib/modals/AssetAddToAlbumModal.svelte';
import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
import { showDeleteModal } from '$lib/stores/preferences.store';
import type { OnUndoDelete } from '$lib/utils/actions';
import { handleError } from '$lib/utils/handle-error';
import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets, updateAssets } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

const getSelection = (ctx?: CommandContext): SelectionCommandContext | null => ctx?.selection ?? null;

export const canAddSelectedToAlbum = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection !== null && selection.canAddToAlbum;
};

export const canAddSelectedToCurrentSpace = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection?.addSelectedToCurrentSpace !== undefined;
};

export const canFavoriteSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return (
    selection !== null && selection.isAllUserOwned && selection.onFavorite !== undefined && !selection.isAllFavorite
  );
};

export const canArchiveSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return (
    selection !== null && selection.isAllUserOwned && selection.onArchive !== undefined && !selection.isAllArchived
  );
};

export const canDeleteSelected = (ctx: CommandContext) => {
  const selection = getSelection(ctx);
  return selection !== null && selection.isAllUserOwned && selection.onDelete !== undefined;
};

export function handleAddSelectedToAlbum(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection?.canAddToAlbum) {
    return;
  }
  return modalManager.show(AssetAddToAlbumModal, { assetIds: selection.selectedAssetIds });
}

export async function handleAddSelectedToCurrentSpace(ctx?: CommandContext) {
  const addSelectedToCurrentSpace = getSelection(ctx)?.addSelectedToCurrentSpace;
  if (!addSelectedToCurrentSpace) {
    return false;
  }
  return addSelectedToCurrentSpace();
}

export async function handleFavoriteSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onFavorite) {
    return;
  }

  const assets = selection.ownedAssets.filter((asset) => !asset.isFavorite);
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return;
  }

  const $t = get(t);
  try {
    await updateAssets({ assetBulkUpdateDto: { ids, isFavorite: true } });
    for (const asset of assets) {
      asset.isFavorite = true;
    }
    selection.onFavorite(ids, true);
    toastManager.primary($t('added_to_favorites_count', { values: { count: ids.length } }));
    selection.clearSelection();
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: true } }));
  }
}

export async function handleArchiveSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onArchive) {
    return;
  }

  const visibility = AssetVisibility.Archive;
  const assets = selection.ownedAssets.filter((asset) => asset.visibility !== visibility);
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return;
  }

  const $t = get(t);
  try {
    await updateAssets({ assetBulkUpdateDto: { ids, visibility } });
    selection.onArchive(ids, visibility);
    toastManager.primary($t('archived_count', { values: { count: ids.length } }));
    selection.clearSelection();
  } catch (error) {
    handleError(error, $t('errors.unable_to_archive_unarchive', { values: { archived: true } }));
  }
}

export async function handleDeleteSelected(ctx?: CommandContext) {
  const selection = getSelection(ctx);
  if (!selection || !selection.isAllUserOwned || !selection.onDelete) {
    return false;
  }

  const assets = selection.ownedAssets;
  const ids = assets.map((asset) => asset.id);
  if (ids.length === 0) {
    return false;
  }

  const force = !featureFlagsManager.value.trash || assets.some((asset) => asset.isTrashed);
  if (force && get(showDeleteModal)) {
    const confirmed = await modalManager.show(AssetDeleteConfirmModal, { size: ids.length });
    if (!confirmed) {
      return false;
    }
  }

  const onUndoDelete = force ? undefined : selection.onUndoDelete;
  const $t = get(t);
  try {
    await deleteBulk({ assetBulkDeleteDto: { ids, force } });
    selection.onDelete(ids);
    toastManager.primary(
      {
        description: force
          ? $t('assets_permanently_deleted_count', { values: { count: ids.length } })
          : $t('assets_trashed_count', { values: { count: ids.length } }),
        button: onUndoDelete
          ? {
              label: $t('undo'),
              color: 'secondary' as const,
              onclick: () => void undoDeleteAssets(onUndoDelete, assets),
            }
          : undefined,
      },
      { timeout: 5000 },
    );
    selection.clearSelection();
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_assets'));
    return false;
  }
}

async function undoDeleteAssets(onUndoDelete: OnUndoDelete, assets: TimelineAsset[]) {
  const ids = assets.map((asset) => asset.id);
  const $t = get(t);
  try {
    await restoreAssets({ bulkIdsDto: { ids } });
    onUndoDelete(assets);
  } catch (error) {
    handleError(error, $t('errors.unable_to_restore_assets'));
  }
}
```

If the `modalManager.show()` generic complains about `AssetAddToAlbumModal` or `AssetDeleteConfirmModal`, follow the existing cast style used elsewhere in this codebase rather than changing modal props.

- [ ] **Step 4: Run handler tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run src/lib/managers/selection-command-handlers.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add web/src/lib/managers/selection-command-handlers.ts web/src/lib/managers/selection-command-handlers.spec.ts
git commit -m "feat(web): add cmdk selection command handlers"
```

## Task 3: Command Registry, i18n, and Manager Integration Tests

**Files:**

- Modify: `web/src/lib/managers/command-items.ts`
- Modify: `web/src/lib/managers/command-items.spec.ts`
- Modify: `web/src/lib/managers/global-search-manager.svelte.spec.ts`
- Modify: `i18n/en.json`

- [ ] **Step 1: Add failing command registry tests**

In `web/src/lib/managers/command-items.spec.ts`, update all local `makeCtx()` helpers so returned `CommandContext` objects include `selection: null`.

Update the count test:

```typescript
it('has 32 entries (7 v1.3.0 + 8 v1.3.1 + 5 v1.4 album + 6 v1.4 space + 6 v1.5A selection)', () => {
  expect(COMMAND_ITEMS).toHaveLength(32);
});
```

Mock handler module near existing mocks:

```typescript
vi.mock('./selection-command-handlers', async () => {
  const actual = await vi.importActual<typeof import('./selection-command-handlers')>('./selection-command-handlers');
  return {
    ...actual,
    handleAddSelectedToAlbum: vi.fn(),
    handleAddSelectedToCurrentSpace: vi.fn(),
    handleFavoriteSelected: vi.fn(),
    handleArchiveSelected: vi.fn(),
    handleDeleteSelected: vi.fn(),
  };
});
```

Import the mocked handlers:

```typescript
import * as selectionHandlers from './selection-command-handlers';
```

Add a `selection-context commands` describe block that:

- Asserts ids exist:
  - `cmd:selection_add_to_album`
  - `cmd:selection_add_to_current_space`
  - `cmd:selection_favorite`
  - `cmd:selection_archive`
  - `cmd:selection_delete`
- Asserts `cmd:selection_delete.destructive === true`.
- Asserts the other four selection commands are not destructive.
- Builds contexts with a minimal `selection` object and verifies each command delegates to the matching handler.
- Verifies availability:
  - add-to-album shows only when `selection.canAddToAlbum` is true.
  - add-to-current-space shows only when `selection.addSelectedToCurrentSpace` exists.
  - favorite hides when selection is mixed ownership, missing `onFavorite`, or already all favorite.
  - archive hides when selection is mixed ownership, missing `onArchive`, or already all archived.
  - delete hides when selection is mixed ownership or missing `onDelete`.

- [ ] **Step 2: Add failing global-search manager tests**

In `web/src/lib/managers/global-search-manager.svelte.spec.ts`, add tests to the existing `commands provider` / `activate("command")` coverage:

```typescript
it('selection commands are hidden under bare > when ctx.selection is null', async () => {
  commandContextManager.setSelection(null);
  manager.setQuery('>');
  await flushMicrotasks();
  const section = manager.sections.commands;
  expect(section.status).toBe('ok');
  if (section.status === 'ok') {
    expect(section.items.some((item) => item.id.startsWith('cmd:selection_'))).toBe(false);
  }
});

it('selection commands appear from the live provider context', async () => {
  mockPage.route.id = '/(user)/photos/[[assetId=id]]';
  commandContextManager.setSelection({
    routeId: mockPage.route.id,
    options: {
      getAssets: () => [makeTimelineAsset({ id: 'asset-1', ownerId: 'test-user' })],
      clearSelection: vi.fn(),
      canAddToAlbum: () => true,
      getOnFavorite: () => vi.fn(),
      getOnArchive: () => vi.fn(),
      getOnDelete: () => vi.fn(),
      getOnUndoDelete: () => vi.fn(),
    },
  });

  manager.setQuery('>');
  await flushMicrotasks();
  const section = manager.sections.commands;
  expect(section.status).toBe('ok');
  if (section.status === 'ok') {
    expect(section.items.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        'cmd:selection_add_to_album',
        'cmd:selection_favorite',
        'cmd:selection_archive',
        'cmd:selection_delete',
      ]),
    );
    expect(section.items.some((item) => item.id === 'cmd:selection_add_to_current_space')).toBe(false);
  }
});

it('command activation passes a fresh selection context after selection changes while the palette is open', async () => {
  mockPage.route.id = '/(user)/photos/[[assetId=id]]';
  let assets = [makeTimelineAsset({ id: 'asset-before', ownerId: 'test-user' })];
  commandContextManager.setSelection({
    routeId: mockPage.route.id,
    options: {
      getAssets: () => assets,
      clearSelection: vi.fn(),
      canAddToAlbum: () => true,
    },
  });

  const cmd = COMMAND_ITEMS.find((item) => item.id === 'cmd:selection_add_to_album')!;
  const handlerSpy = vi.spyOn(cmd, 'handler');
  assets = [makeTimelineAsset({ id: 'asset-after', ownerId: 'test-user' })];
  manager.activate('command', cmd);
  await flushMicrotasks();

  expect(handlerSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      selection: expect.objectContaining({ selectedAssetIds: ['asset-after'] }),
    }),
  );
  handlerSpy.mockRestore();
});
```

Add a local `makeTimelineAsset()` helper to this spec if one does not already exist, using the `TimelineAsset` shape from Task 1.

- [ ] **Step 3: Add failing i18n keys**

Add a command-items assertion that every selection command label/description key exists in `i18n/en.json`, or rely on the repository-wide i18n test if it already checks key presence. Add these keys to `i18n/en.json` in Step 5:

```json
"cmdk_cmd_selection_add_to_album_description": "Open the album picker for the selected assets",
"cmdk_cmd_selection_add_to_album_label": "Add selected to album...",
"cmdk_cmd_selection_add_to_current_space_description": "Add the selected assets to this writable space",
"cmdk_cmd_selection_add_to_current_space_label": "Add selected to this space",
"cmdk_cmd_selection_archive_description": "Move the selected assets to archive",
"cmdk_cmd_selection_archive_label": "Archive selected",
"cmdk_cmd_selection_delete_description": "Move selected assets to trash or permanently delete trashed assets",
"cmdk_cmd_selection_delete_label": "Delete selected",
"cmdk_cmd_selection_favorite_description": "Mark the selected assets as favorites",
"cmdk_cmd_selection_favorite_label": "Add selected to favorites",
```

- [ ] **Step 4: Run registry/manager tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run src/lib/managers/command-items.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/i18n.spec.ts
```

Expected: FAIL because command items and i18n keys are not registered yet.

- [ ] **Step 5: Register the command items**

In `web/src/lib/managers/command-items.ts`, import handler functions:

```typescript
import {
  canAddSelectedToAlbum,
  canAddSelectedToCurrentSpace,
  canArchiveSelected,
  canDeleteSelected,
  canFavoriteSelected,
  handleAddSelectedToAlbum,
  handleAddSelectedToCurrentSpace,
  handleArchiveSelected,
  handleDeleteSelected,
  handleFavoriteSelected,
} from '$lib/managers/selection-command-handlers';
```

Add icons to the `@mdi/js` import:

```typescript
mdiArchiveArrowDownOutline,
mdiHeartOutline,
mdiImagePlusOutline,
```

Add these entries after the v1.4 space commands or immediately before them with a clear `// v1.5A` comment:

```typescript
{
  id: 'cmd:selection_add_to_album',
  labelKey: 'cmdk_cmd_selection_add_to_album_label',
  descriptionKey: 'cmdk_cmd_selection_add_to_album_description',
  icon: mdiPlaylistPlus,
  isAvailable: canAddSelectedToAlbum,
  handler: handleAddSelectedToAlbum,
},
{
  id: 'cmd:selection_add_to_current_space',
  labelKey: 'cmdk_cmd_selection_add_to_current_space_label',
  descriptionKey: 'cmdk_cmd_selection_add_to_current_space_description',
  icon: mdiImagePlusOutline,
  isAvailable: canAddSelectedToCurrentSpace,
  handler: handleAddSelectedToCurrentSpace,
},
{
  id: 'cmd:selection_favorite',
  labelKey: 'cmdk_cmd_selection_favorite_label',
  descriptionKey: 'cmdk_cmd_selection_favorite_description',
  icon: mdiHeartOutline,
  isAvailable: canFavoriteSelected,
  handler: handleFavoriteSelected,
},
{
  id: 'cmd:selection_archive',
  labelKey: 'cmdk_cmd_selection_archive_label',
  descriptionKey: 'cmdk_cmd_selection_archive_description',
  icon: mdiArchiveArrowDownOutline,
  isAvailable: canArchiveSelected,
  handler: handleArchiveSelected,
},
{
  id: 'cmd:selection_delete',
  labelKey: 'cmdk_cmd_selection_delete_label',
  descriptionKey: 'cmdk_cmd_selection_delete_description',
  icon: mdiDeleteOutline,
  destructive: true,
  isAvailable: canDeleteSelected,
  handler: handleDeleteSelected,
},
```

Add the i18n keys from Step 3 in sorted `cmdk_cmd_*` order near the existing cmdk keys in `i18n/en.json`.

- [ ] **Step 6: Run registry/manager tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run src/lib/managers/command-items.spec.ts src/lib/managers/global-search-manager.svelte.spec.ts src/lib/i18n.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit Task 3**

Run:

```bash
git add web/src/lib/managers/command-items.ts web/src/lib/managers/command-items.spec.ts web/src/lib/managers/global-search-manager.svelte.spec.ts i18n/en.json
git commit -m "feat(web): register cmdk selection commands"
```

## Task 4: Photos and Album Page Selection Wiring

**Files:**

- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts`
- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts`

- [ ] **Step 1: Write failing photo-page tests**

In `photos-page.spec.ts`, extend the command context mock:

```typescript
const { mockRegisterSelectionContext } = vi.hoisted(() => ({
  mockRegisterSelectionContext: vi.fn(),
}));

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerSelectionContext: mockRegisterSelectionContext,
}));
```

If the file already has a `vi.hoisted()` block, add `mockRegisterSelectionContext` to it instead of creating a second block.

Add tests:

```typescript
it('registers cmdk selection context with photo-page callbacks', () => {
  renderPage();

  expect(mockRegisterSelectionContext).toHaveBeenCalledOnce();
  const options = mockRegisterSelectionContext.mock.calls[0][0];
  expect(options.getAssets()).toBe(mockAssetMultiSelectManager.assets);
  expect(options.canAddToAlbum()).toBe(true);
  expect(options.getOnFavorite()).toEqual(expect.any(Function));
  expect(options.getOnArchive()).toEqual(expect.any(Function));
  expect(options.getOnDelete()).toEqual(expect.any(Function));
  expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
});

it('photo-page cmdk callbacks are live functions and clearSelection delegates to the selection manager', () => {
  renderPage();
  const options = mockRegisterSelectionContext.mock.calls[0][0];

  expect(options.getOnFavorite()).toEqual(expect.any(Function));
  expect(options.getOnArchive()).toEqual(expect.any(Function));
  expect(options.getOnDelete()).toEqual(expect.any(Function));
  expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
  options.clearSelection();
  expect(mockAssetMultiSelectManager.clear).toHaveBeenCalledOnce();
});
```

The lower-level handler tests cover callback side effects. This route test only proves the page registers the expected live getters.

- [ ] **Step 2: Write failing album-page tests**

In `page.route.spec.ts`, change the command context mock:

```typescript
const registerAlbumContextMock = vi.fn();
const registerSelectionContextMock = vi.fn();

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerAlbumContext: registerAlbumContextMock,
  registerSelectionContext: registerSelectionContextMock,
}));
```

Add tests:

```typescript
it('registers cmdk selection context for album view mode only', async () => {
  renderPage();

  expect(registerSelectionContextMock).toHaveBeenCalledOnce();
  const options = registerSelectionContextMock.mock.calls[0][0];
  expect(options.canAddToAlbum()).toBe(true);
  expect(options.getAssets()).toBe(assetMultiSelectManager.assets);
  expect(options.getOnFavorite()).toEqual(expect.any(Function));
  expect(options.getOnArchive()).toEqual(expect.any(Function));
  expect(options.getOnDelete()).toEqual(expect.any(Function));
  expect(options.getOnUndoDelete()).toEqual(expect.any(Function));

  await fireEvent.click(screen.getByLabelText('add_photos'));
  expect(options.getAssets()).toEqual([]);
  expect(options.canAddToAlbum()).toBe(false);
  expect(options.getOnFavorite()).toBeUndefined();
  expect(options.getOnArchive()).toBeUndefined();
  expect(options.getOnDelete()).toBeUndefined();
  expect(options.getOnUndoDelete()).toBeUndefined();
});
```

Import `assetMultiSelectManager` in the spec if needed.

- [ ] **Step 3: Run photo/album tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts'
```

Expected: FAIL because the pages do not register selection context.

- [ ] **Step 4: Wire the photos page**

In `web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte`, import:

```typescript
import { registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
import { AssetVisibility } from '@immich/sdk';
```

Merge `AssetVisibility` into the existing `@immich/sdk` import.

After `handleSetVisibility`, add:

```typescript
registerSelectionContext({
  getAssets: () => assetMultiSelectManager.assets,
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => true,
  getOnFavorite: () =>
    timelineManager
      ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
      : undefined,
  getOnArchive: () =>
    timelineManager
      ? (ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))
      : undefined,
  getOnDelete: () => (timelineManager ? (assetIds) => timelineManager.removeAssets(assetIds) : undefined),
  getOnUndoDelete: () => (timelineManager ? (assets) => timelineManager.upsertAssets(assets) : undefined),
});
```

Do not change the visible toolbar.

- [ ] **Step 5: Wire the album page**

In `web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte`, merge the import:

```typescript
import { registerAlbumContext, registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
```

After `registerAlbumContext(() => album);`, add:

```typescript
registerSelectionContext({
  getAssets: () => (viewMode === AlbumPageViewMode.VIEW ? assetMultiSelectManager.assets : []),
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => viewMode === AlbumPageViewMode.VIEW,
  getOnFavorite: () =>
    viewMode === AlbumPageViewMode.VIEW && timelineManager
      ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
      : undefined,
  getOnArchive: () =>
    viewMode === AlbumPageViewMode.VIEW && timelineManager
      ? (ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))
      : undefined,
  getOnDelete: () => (viewMode === AlbumPageViewMode.VIEW ? handleRemoveAssets : undefined),
  getOnUndoDelete: () => (viewMode === AlbumPageViewMode.VIEW ? handleUndoRemoveAssets : undefined),
});
```

This intentionally ignores `timelineMultiSelectManager` in album add-assets mode.

- [ ] **Step 6: Run photo/album tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts'
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add 'web/src/routes/(user)/photos/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' 'web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts'
git commit -m "feat(web): wire cmdk selection context on photo and album pages"
```

## Task 5: Tags, Archive, Search, and Boundary Wiring

**Files:**

- Modify: `web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Create: `web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts`
- Modify: `web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Create: `web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts`
- Modify: `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Create: `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts`
- Create: `web/src/lib/managers/selection-command-page-boundaries.spec.ts`

- [ ] **Step 1: Write failing tags/archive/search route tests**

Create focused route specs that mock `registerSelectionContext` and assert the captured options.

For tags:

```typescript
expect(options.canAddToAlbum()).toBe(true);
expect(options.getOnFavorite()).toEqual(expect.any(Function));
expect(options.getOnArchive()).toEqual(expect.any(Function));
expect(options.getOnDelete()).toEqual(expect.any(Function));
expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
expect(options.getAddSelectedToCurrentSpace?.()).toBeUndefined();
```

For archive:

```typescript
expect(options.canAddToAlbum()).toBe(true);
expect(options.getOnFavorite()).toEqual(expect.any(Function));
expect(options.getOnArchive()).toBeUndefined();
expect(options.getOnDelete()).toEqual(expect.any(Function));
expect(options.getOnUndoDelete?.()).toBeUndefined();
```

For search:

```typescript
expect(options.canAddToAlbum()).toBe(true);
expect(options.getOnFavorite()).toEqual(expect.any(Function));
expect(options.getOnArchive()).toEqual(expect.any(Function));
expect(options.getOnDelete()).toEqual(expect.any(Function));
expect(options.getOnUndoDelete()).toEqual(expect.any(Function));
```

Also add one search-page callback test proving archive removes rows when `terms.visibility === AssetVisibility.Timeline`:

```typescript
options.getOnArchive()(['asset-1'], AssetVisibility.Archive);
expect(screen.queryByTestId('asset-row-asset-1')).not.toBeInTheDocument();
```

Use local component mocks like `photos-page.spec.ts`; keep these tests focused on registration and callbacks, not full page rendering.

- [ ] **Step 2: Write failing source-boundary test**

Create `web/src/lib/managers/selection-command-page-boundaries.spec.ts`:

```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../..');
const allowedPages = [
  'src/routes/(user)/photos/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
];

const deniedPages = [
  'src/routes/(user)/favorites/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/people/[personId]/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/folders/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/map/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/trash/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/locked/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/utilities/duplicates/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/utilities/large-files/[[photos=photos]]/[[assetId=id]]/+page.svelte',
  'src/routes/(user)/memory/[[photos=photos]]/[[assetId=id]]/+page.svelte',
];

const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('v1.5A selection command page boundaries', () => {
  it('registers selection context only on approved pages in this slice', () => {
    for (const path of allowedPages) {
      expect(read(path), `${path} should register v1.5A selection context`).toContain('registerSelectionContext');
    }
    for (const path of deniedPages) {
      expect(read(path), `${path} is out of scope for v1.5A`).not.toContain('registerSelectionContext');
    }
  });
});
```

- [ ] **Step 3: Run tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts' 'src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts' 'src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts' src/lib/managers/selection-command-page-boundaries.spec.ts
```

Expected: FAIL because pages are not wired and the new specs do not pass yet.

- [ ] **Step 4: Wire the tags page**

In `web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte`, import:

```typescript
import { registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
```

After `handleSetVisibility`, add:

```typescript
registerSelectionContext({
  getAssets: () => assetMultiSelectManager.assets,
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => true,
  getOnFavorite: () =>
    timelineManager
      ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
      : undefined,
  getOnArchive: () =>
    timelineManager
      ? (ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))
      : undefined,
  getOnDelete: () => (timelineManager ? (assetIds) => timelineManager.removeAssets(assetIds) : undefined),
  getOnUndoDelete: () => (timelineManager ? (assets) => timelineManager.upsertAssets(assets) : undefined),
});
```

- [ ] **Step 5: Wire the archive page**

In `web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte`, import:

```typescript
import { registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
```

After `handleSetVisibility`, add:

```typescript
registerSelectionContext({
  getAssets: () => assetMultiSelectManager.assets,
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => true,
  getOnFavorite: () =>
    timelineManager
      ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
      : undefined,
  getOnDelete: () => (timelineManager ? (assetIds) => timelineManager.removeAssets(assetIds) : undefined),
});
```

Do not register `getOnArchive` on archive page. That keeps `cmd:selection_archive` hidden because “Unarchive selected” is deferred.

- [ ] **Step 6: Wire the search page**

In `web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte`, import:

```typescript
import { registerSelectionContext } from '$lib/managers/command-context-manager.svelte';
import { AssetVisibility } from '@immich/sdk';
```

Merge `AssetVisibility` into the existing SDK import.

Add helpers after `handleSetVisibility`:

```typescript
const onFavorite = (ids: string[], isFavorite: boolean) => {
  for (const id of ids) {
    const asset = searchResultAssets.find((asset) => asset.id === id);
    if (asset) {
      asset.isFavorite = isFavorite;
    }
  }
};

const onArchive = (ids: string[], visibility: AssetVisibility) => {
  const idSet = new Set(ids);
  if (terms.visibility && terms.visibility !== visibility) {
    searchResultAssets = searchResultAssets.filter((asset) => !idSet.has(asset.id));
    return;
  }
  for (const id of ids) {
    const asset = searchResultAssets.find((asset) => asset.id === id);
    if (asset) {
      asset.visibility = visibility;
    }
  }
};

const onUndoDelete = () => {
  void onSearchQueryUpdate();
};

registerSelectionContext({
  getAssets: () => assetMultiSelectManager.assets,
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => true,
  getOnFavorite: () => onFavorite,
  getOnArchive: () => onArchive,
  getOnDelete: () => onAssetDelete,
  getOnUndoDelete: () => onUndoDelete,
});
```

Update the existing visible `FavoriteAction` to call `onFavorite` instead of duplicating the loop. Update `ArchiveAction` to pass `onArchive={onArchive}`. Keep existing `DeleteAssets` callbacks.

- [ ] **Step 7: Run tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts' 'src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts' 'src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts' src/lib/managers/selection-command-page-boundaries.spec.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 5**

Run:

```bash
git add 'web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts' 'web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts' 'web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts' web/src/lib/managers/selection-command-page-boundaries.spec.ts
git commit -m "feat(web): wire cmdk selection context on timeline pages"
```

## Task 6: Space Page Selection and Current-Space Command

**Files:**

- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte`
- Modify: `web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts`
- Modify: `web/src/lib/managers/selection-command-page-boundaries.spec.ts`

- [ ] **Step 1: Write failing space-page tests**

In `spaces-page.spec.ts`, extend the command context mock:

```typescript
const { mockRegisterSelectionContext, mockRegisterSpaceContext } = vi.hoisted(() => ({
  mockRegisterSelectionContext: vi.fn(),
  mockRegisterSpaceContext: vi.fn(),
}));

vi.mock('$lib/managers/command-context-manager.svelte', () => ({
  registerSpaceContext: mockRegisterSpaceContext,
  registerSelectionContext: mockRegisterSelectionContext,
}));
```

Add tests:

```typescript
it('registers normal space view favorite/archive callbacks and no add-to-current-space', () => {
  renderPage();
  const options = mockRegisterSelectionContext.mock.calls[0][0];

  expect(options.canAddToAlbum()).toBe(false);
  expect(options.getAssets()).toBe(mockAssetMultiSelectManager.assets);
  expect(options.getOnFavorite()).toEqual(expect.any(Function));
  expect(options.getOnArchive()).toEqual(expect.any(Function));
  expect(options.getOnDelete()).toBeUndefined();
  expect(options.getAddSelectedToCurrentSpace()).toBeUndefined();
});

it('select-assets mode exposes only addSelectedToCurrentSpace for writable users', async () => {
  renderPage();
  const options = mockRegisterSelectionContext.mock.calls[0][0];

  await fireEvent.click(screen.getByLabelText('add_photos'));
  expect(options.getOnFavorite()).toBeUndefined();
  expect(options.getOnArchive()).toBeUndefined();
  expect(options.getOnDelete()).toBeUndefined();
  expect(options.getAddSelectedToCurrentSpace()).toEqual(expect.any(Function));
});

it('viewer select-assets mode hides addSelectedToCurrentSpace', async () => {
  renderPage({
    members: [makeMember({ role: SharedSpaceRole.Viewer })],
  });
  const options = mockRegisterSelectionContext.mock.calls[0][0];

  await fireEvent.click(screen.getByLabelText('add_photos'));
  expect(options.getAddSelectedToCurrentSpace()).toBeUndefined();
});

it('addSelectedToCurrentSpace rejects empty and over-limit selections', async () => {
  renderPage();
  const options = mockRegisterSelectionContext.mock.calls[0][0];
  await fireEvent.click(screen.getByLabelText('add_photos'));
  const addSelected = options.getAddSelectedToCurrentSpace();

  mockAssetMultiSelectManager.assets = [];
  await expect(addSelected()).resolves.toBe(false);

  mockAssetMultiSelectManager.assets = Array.from({ length: MAX_SPACE_ASSETS_PER_REQUEST + 1 }, (_, index) =>
    makeTimelineAsset({ id: `asset-${index}` }),
  );
  await expect(addSelected()).resolves.toBe(false);
  expect(sdkMock.addAssets).not.toHaveBeenCalled();
});

it('addSelectedToCurrentSpace and plus button share the awaited helper', async () => {
  renderPage();
  mockAssetMultiSelectManager.assets = [makeTimelineAsset({ id: 'asset-1' })];
  const options = mockRegisterSelectionContext.mock.calls[0][0];

  await fireEvent.click(screen.getByLabelText('add_photos'));
  await expect(options.getAddSelectedToCurrentSpace()()).resolves.toBe(true);
  expect(sdkMock.addAssets).toHaveBeenCalledWith({
    id: 'space-1',
    sharedSpaceAssetAddDto: { assetIds: ['asset-1'] },
  });
  expect(mockEventManager.emit).toHaveBeenCalledWith('SpaceAddAssets', { assetIds: ['asset-1'], spaceId: 'space-1' });
  expect(mockAssetMultiSelectManager.clear).toHaveBeenCalled();

  vi.clearAllMocks();
  mockAssetMultiSelectManager.assets = [makeTimelineAsset({ id: 'asset-2' })];
  await fireEvent.click(screen.getByLabelText('add_to_space'));
  expect(sdkMock.addAssets).toHaveBeenCalledWith({
    id: 'space-1',
    sharedSpaceAssetAddDto: { assetIds: ['asset-2'] },
  });
});
```

Adjust `renderPage()` to accept data overrides if it does not already. Import `fireEvent`, `MAX_SPACE_ASSETS_PER_REQUEST`, and a local `makeTimelineAsset()` helper as needed.

- [ ] **Step 2: Run space tests and confirm they fail**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts' src/lib/managers/selection-command-page-boundaries.spec.ts
```

Expected: FAIL because space page selection context and helper are not wired.

- [ ] **Step 3: Wire dynamic space selection context**

In the space page, merge the command context import:

```typescript
import { registerSelectionContext, registerSpaceContext } from '$lib/managers/command-context-manager.svelte';
```

Add selection registration after `registerSpaceContext(...)` or after `isEditor` is declared if the compiler needs the referenced derived values declared first:

```typescript
registerSelectionContext({
  getAssets: () => assetMultiSelectManager.assets,
  clearSelection: () => assetMultiSelectManager.clear(),
  canAddToAlbum: () => false,
  getOnFavorite: () =>
    viewMode === 'view' && timelineManager
      ? (ids, isFavorite) => timelineManager.update(ids, (asset) => (asset.isFavorite = isFavorite))
      : undefined,
  getOnArchive: () =>
    viewMode === 'view' && timelineManager
      ? (ids, visibility) => timelineManager.update(ids, (asset) => (asset.visibility = visibility))
      : undefined,
  getAddSelectedToCurrentSpace: () =>
    viewMode === 'select-assets' && isEditor ? addSelectedAssetsToCurrentSpace : undefined,
});
```

Keep `getOnDelete` omitted. Space toolbar removes assets from a space; it does not delete library assets.

- [ ] **Step 4: Extract the awaited add-to-current-space helper**

Replace `handleAddAssets` with this helper flow:

```typescript
let skipNextLocalSpaceAddEventForSpaceId: string | null = null;

const applySpaceAddSuccess = async () => {
  await Promise.all([refreshSpace(), loadActivities()]);
  assetMultiSelectManager.clear();
  viewMode = 'view';
};

const addSelectedAssetsToCurrentSpace = async () => {
  const assetIds = assetMultiSelectManager.assets.map((a) => a.id);
  if (assetIds.length === 0 || assetIds.length > MAX_SPACE_ASSETS_PER_REQUEST) {
    return false;
  }

  try {
    await addAssets({ id: space.id, sharedSpaceAssetAddDto: { assetIds } });
    skipNextLocalSpaceAddEventForSpaceId = space.id;
    eventManager.emit('SpaceAddAssets', { assetIds, spaceId: space.id });
    toastManager.success($t('added_to_space_count', { values: { count: assetIds.length } }));
    await applySpaceAddSuccess();
    return true;
  } catch (error) {
    handleError(error, $t('errors.error_adding_assets_to_space'));
    return false;
  } finally {
    skipNextLocalSpaceAddEventForSpaceId = null;
  }
};

const handleAddAssets = async () => {
  await addSelectedAssetsToCurrentSpace();
};
```

Update `onSpaceAddAssets` to avoid double-refreshing the local page after its own emitted event:

```typescript
const onSpaceAddAssets = async ({ spaceId }: { assetIds: string[]; spaceId: string }) => {
  if (spaceId !== space.id) {
    return;
  }
  if (skipNextLocalSpaceAddEventForSpaceId === spaceId) {
    return;
  }
  await applySpaceAddSuccess();
};
```

The skip flag is reset in the helper `finally`, so a later external `SpaceAddAssets` event for the same space still refreshes this page.

- [ ] **Step 5: Run space tests and confirm they pass**

Run:

```bash
pnpm --dir web test --run 'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts' src/lib/managers/selection-command-page-boundaries.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 6**

Run:

```bash
git add 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/+page.svelte' 'web/src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts' web/src/lib/managers/selection-command-page-boundaries.spec.ts
git commit -m "feat(web): add cmdk selected-assets space command"
```

## Task 7: Final Verification and Cleanup

**Files:**

- Modify only files already touched by Tasks 1-6 if verification exposes a defect.

- [ ] **Step 1: Run the focused v1.5A test suite**

Run:

```bash
pnpm --dir web test --run \
  src/lib/managers/command-context-manager.spec.ts \
  src/lib/managers/selection-command-handlers.spec.ts \
  src/lib/managers/command-items.spec.ts \
  src/lib/managers/global-search-manager.svelte.spec.ts \
  src/lib/managers/selection-command-page-boundaries.spec.ts \
  'src/routes/(user)/photos/[[assetId=id]]/photos-page.spec.ts' \
  'src/routes/(user)/albums/[albumId=id]/[[photos=photos]]/[[assetId=id]]/page.route.spec.ts' \
  'src/routes/(user)/tags/[[photos=photos]]/[[assetId=id]]/tags-page.spec.ts' \
  'src/routes/(user)/archive/[[photos=photos]]/[[assetId=id]]/archive-page.spec.ts' \
  'src/routes/(user)/search/[[photos=photos]]/[[assetId=id]]/search-page.spec.ts' \
  'src/routes/(user)/spaces/[spaceId]/[[photos=photos]]/[[assetId=id]]/spaces-page.spec.ts' \
  src/lib/i18n.spec.ts
```

Expected: PASS.

- [ ] **Step 2: Run type and lint checks for touched web code**

Run:

```bash
pnpm --dir web check
pnpm --dir web lint
```

Expected: both commands complete successfully. If either command is too broad or fails from unrelated pre-existing issues, capture the failing output, then run the narrowest available package script that validates the touched files and document the residual risk.

- [ ] **Step 3: Run a source audit for scope creep**

Run:

```bash
rg -n "registerSelectionContext|cmd:selection_|selection_add_to_current_space|AssetAddToAlbumModal" web/src i18n/en.json
```

Expected:

- `registerSelectionContext` appears only in the context manager, approved page files, tests, and harnesses.
- `cmd:selection_*` appears only in command registry/tests and global-search tests.
- `selection_add_to_current_space` appears only in command registry/tests/i18n and space-page tests.
- `AssetAddToAlbumModal` and `AssetAddToSpaceModal` usage for v1.5A is in `selection-command-handlers.ts`; no in-palette secondary picker exists.

- [ ] **Step 4: Commit final fixes if needed**

If Step 1 or Step 2 required fixes, commit the exact corrected files:

```bash
git add -A
git commit -m "fix(web): stabilize cmdk selection command coverage"
```

If no fixes were required, do not create an empty commit.

## Self-Review Checklist

- Spec coverage: Tasks 1-3 cover context, handlers, command registration, activation freshness, destructive confirm integration, and i18n. Tasks 4-6 cover approved page wiring and current-space behavior. Task 7 covers no-scope-creep verification.
- Test coverage: Context tests cover empty/live/dedupe/ownership/dynamic getters/route cleanup. Handler tests cover success, no-op, failure, force delete, undo, and modal cancel. Route tests cover page callback registration and space mode transitions.
- Edge cases covered: stale route context, selection changes while palette is open, empty selection at activation, all-favorite/all-archived no-op, SDK failure no-clear, mixed ownership hidden, force delete when trash disabled or selected asset is trashed, space max limit, read-only space member, and denied page registrations.
- Deferred behavior stays deferred: no in-palette album picker, no unarchive command, no favorites/trash/locked/person/folder/map/memory page wiring.
