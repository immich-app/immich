import { MAX_SPACE_ASSETS_PER_REQUEST } from '$lib/constants';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import AssetAddToAlbumModal from '$lib/modals/AssetAddToAlbumModal.svelte';
import AssetAddToSpaceModal from '$lib/modals/AssetAddToSpaceModal.svelte';
import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
import { showDeleteModal } from '$lib/stores/preferences.store';
import * as handleErrorModule from '$lib/utils/handle-error';
import { AssetVisibility, deleteAssets as deleteBulk, restoreAssets, updateAssets } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { get } from 'svelte/store';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandContext, SelectionCommandContext } from './command-context-manager.svelte';
import {
  canAddSelectedToAlbum,
  canAddSelectedToCurrentSpace,
  canAddSelectedToSpace,
  canArchiveSelected,
  canDeleteSelected,
  canFavoriteSelected,
  handleAddSelectedToAlbum,
  handleAddSelectedToCurrentSpace,
  handleAddSelectedToSpace,
  handleArchiveSelected,
  handleDeleteSelected,
  handleFavoriteSelected,
} from './selection-command-handlers';

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
    canAddToSpace: true,
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

const makeCtx = (
  selection: SelectionCommandContext | null,
  overrides: Partial<CommandContext> = {},
): CommandContext => ({
  routeId: '/(user)/photos/[[assetId=id]]',
  params: {},
  album: null,
  space: null,
  selection,
  userId: 'u-me',
  isAdmin: false,
  ...overrides,
});

const makeWritableSpaceContext = (): NonNullable<CommandContext['space']> => ({
  id: 'space-1',
  name: 'Writable Space',
  createdById: 'u-me',
  isOwner: true,
  isMember: true,
  canWrite: true,
  raw: { id: 'space-1', name: 'Writable Space', createdById: 'u-me' } as never,
  members: [],
});

let handleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(modalManager.show).mockResolvedValue(true as never);
  vi.mocked(updateAssets).mockResolvedValue(undefined as never);
  vi.mocked(deleteBulk).mockResolvedValue(undefined as never);
  vi.mocked(restoreAssets).mockResolvedValue(undefined as never);
  featureFlagsManager.value.trash = true;
  showDeleteModal.set(false);
  expect(get(showDeleteModal)).toBe(false);
  handleErrorSpy = vi.spyOn(handleErrorModule, 'handleError').mockImplementation(() => {});
});

afterEach(() => {
  handleErrorSpy.mockRestore();
});

describe('selection command availability', () => {
  it('canAddSelectedToAlbum is true only when selection.canAddToAlbum is true', () => {
    expect(canAddSelectedToAlbum(makeCtx(makeSelection({ canAddToAlbum: true })))).toBe(true);
    expect(canAddSelectedToAlbum(makeCtx(makeSelection({ canAddToAlbum: false })))).toBe(false);
    expect(canAddSelectedToAlbum(makeCtx(null))).toBe(false);
  });

  it('canAddSelectedToCurrentSpace requires a writable space, callback, and in-limit selection count', () => {
    const selection = makeSelection({ addSelectedToCurrentSpace: vi.fn().mockResolvedValue(true) });
    expect(
      canAddSelectedToCurrentSpace(
        makeCtx(selection, { routeId: '/(user)/spaces/[spaceId]', space: makeWritableSpaceContext() }),
      ),
    ).toBe(true);
    expect(canAddSelectedToCurrentSpace(makeCtx(selection))).toBe(false);
    expect(
      canAddSelectedToCurrentSpace(
        makeCtx(selection, {
          routeId: '/(user)/spaces/[spaceId]',
          space: { ...makeWritableSpaceContext(), canWrite: false },
        }),
      ),
    ).toBe(false);
    expect(
      canAddSelectedToCurrentSpace(
        makeCtx(makeSelection({ addSelectedToCurrentSpace: undefined }), {
          routeId: '/(user)/spaces/[spaceId]',
          space: makeWritableSpaceContext(),
        }),
      ),
    ).toBe(false);
    expect(
      canAddSelectedToCurrentSpace(
        makeCtx(makeSelection({ selectedAssetIds: [] }), {
          routeId: '/(user)/spaces/[spaceId]',
          space: makeWritableSpaceContext(),
        }),
      ),
    ).toBe(false);
    expect(
      canAddSelectedToCurrentSpace(
        makeCtx(
          makeSelection({
            selectedAssetIds: Array.from({ length: MAX_SPACE_ASSETS_PER_REQUEST + 1 }, (_, index) => `asset-${index}`),
            addSelectedToCurrentSpace: vi.fn().mockResolvedValue(true),
          }),
          { routeId: '/(user)/spaces/[spaceId]', space: makeWritableSpaceContext() },
        ),
      ),
    ).toBe(false);
    expect(canAddSelectedToCurrentSpace(makeCtx(null))).toBe(false);
  });

  it('canAddSelectedToSpace is true only when selection.canAddToSpace is true', () => {
    expect(canAddSelectedToSpace(makeCtx(makeSelection({ canAddToSpace: true })))).toBe(true);
    expect(canAddSelectedToSpace(makeCtx(makeSelection({ canAddToSpace: false })))).toBe(false);
    expect(canAddSelectedToSpace(makeCtx(null))).toBe(false);
  });

  it('canFavoriteSelected requires selection, all-owned, onFavorite, and at least one non-favorite asset', () => {
    const asset = makeAsset({ isFavorite: false });
    expect(canFavoriteSelected(makeCtx(makeSelection({ assets: [asset] })))).toBe(true);
    expect(canFavoriteSelected(makeCtx(null))).toBe(false);
    expect(canFavoriteSelected(makeCtx(makeSelection({ isAllUserOwned: false })))).toBe(false);
    expect(canFavoriteSelected(makeCtx(makeSelection({ onFavorite: undefined })))).toBe(false);
    expect(canFavoriteSelected(makeCtx(makeSelection({ assets: [makeAsset({ isFavorite: true })] })))).toBe(false);
  });

  it('canArchiveSelected requires selection, all-owned, onArchive, and at least one non-archived asset', () => {
    const asset = makeAsset({ visibility: AssetVisibility.Timeline });
    expect(canArchiveSelected(makeCtx(makeSelection({ assets: [asset] })))).toBe(true);
    expect(canArchiveSelected(makeCtx(null))).toBe(false);
    expect(canArchiveSelected(makeCtx(makeSelection({ isAllUserOwned: false })))).toBe(false);
    expect(canArchiveSelected(makeCtx(makeSelection({ onArchive: undefined })))).toBe(false);
    expect(
      canArchiveSelected(makeCtx(makeSelection({ assets: [makeAsset({ visibility: AssetVisibility.Archive })] }))),
    ).toBe(false);
  });

  it('canDeleteSelected requires selection, all-owned, and onDelete', () => {
    expect(canDeleteSelected(makeCtx(makeSelection()))).toBe(true);
    expect(canDeleteSelected(makeCtx(null))).toBe(false);
    expect(canDeleteSelected(makeCtx(makeSelection({ isAllUserOwned: false })))).toBe(false);
    expect(canDeleteSelected(makeCtx(makeSelection({ onDelete: undefined })))).toBe(false);
  });
});

describe('add selected to album', () => {
  it('opens AssetAddToAlbumModal with selected asset ids and does not clear selection', async () => {
    const assets = [makeAsset({ id: 'asset-1' }), makeAsset({ id: 'asset-2' })];
    const selection = makeSelection({ assets });

    await handleAddSelectedToAlbum(makeCtx(selection));

    expect(modalManager.show).toHaveBeenCalledWith(AssetAddToAlbumModal, { assetIds: ['asset-1', 'asset-2'] });
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });
});

describe('add selected to space', () => {
  it('opens AssetAddToSpaceModal with selected asset ids and does not clear selection', async () => {
    const assets = [makeAsset({ id: 'asset-1' }), makeAsset({ id: 'asset-2' })];
    const selection = makeSelection({ assets });

    await handleAddSelectedToSpace(makeCtx(selection));

    expect(modalManager.show).toHaveBeenCalledWith(AssetAddToSpaceModal, { assetIds: ['asset-1', 'asset-2'] });
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('no-ops when add-to-space is disabled for the selected page', async () => {
    const selection = makeSelection({ canAddToSpace: false });

    await handleAddSelectedToSpace(makeCtx(selection));

    expect(modalManager.show).not.toHaveBeenCalled();
  });
});

describe('add selected to current space', () => {
  it('awaits the context callback and does not call SDK functions directly', async () => {
    const addSelectedToCurrentSpace = vi.fn().mockResolvedValue(true);
    const selection = makeSelection({ addSelectedToCurrentSpace });

    await expect(
      handleAddSelectedToCurrentSpace(
        makeCtx(selection, { routeId: '/(user)/spaces/[spaceId]', space: makeWritableSpaceContext() }),
      ),
    ).resolves.toBe(true);

    expect(addSelectedToCurrentSpace).toHaveBeenCalledOnce();
    expect(updateAssets).not.toHaveBeenCalled();
    expect(deleteBulk).not.toHaveBeenCalled();
    expect(restoreAssets).not.toHaveBeenCalled();
  });

  it('returns false and does not call SDK functions when the callback is absent', async () => {
    const selection = makeSelection({ addSelectedToCurrentSpace: undefined });

    await expect(handleAddSelectedToCurrentSpace(makeCtx(selection))).resolves.toBe(false);

    expect(updateAssets).not.toHaveBeenCalled();
    expect(deleteBulk).not.toHaveBeenCalled();
    expect(restoreAssets).not.toHaveBeenCalled();
  });
});

describe('favorite selected', () => {
  it('favorites only non-favorite owned assets, mutates refs, notifies, toasts, and clears after success', async () => {
    const favorite = makeAsset({ id: 'favorite', isFavorite: true });
    const target = makeAsset({ id: 'target', isFavorite: false });
    const selection = makeSelection({ assets: [favorite, target] });

    await handleFavoriteSelected(makeCtx(selection));

    expect(updateAssets).toHaveBeenCalledWith({ assetBulkUpdateDto: { ids: ['target'], isFavorite: true } });
    expect(target.isFavorite).toBe(true);
    expect(favorite.isFavorite).toBe(true);
    expect(selection.onFavorite).toHaveBeenCalledWith(['target'], true);
    expect(toastManager.primary).toHaveBeenCalledOnce();
    expect(selection.clearSelection).toHaveBeenCalledOnce();
  });

  it('no-ops when the filtered id list is empty', async () => {
    const selection = makeSelection({ assets: [makeAsset({ isFavorite: true })] });

    await handleFavoriteSelected(makeCtx(selection));

    expect(updateAssets).not.toHaveBeenCalled();
    expect(selection.onFavorite).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('calls handleError, does not notify, and does not clear on failure', async () => {
    const error = new Error('favorite failed');
    vi.mocked(updateAssets).mockRejectedValueOnce(error);
    const selection = makeSelection();

    await handleFavoriteSelected(makeCtx(selection));

    expect(handleErrorSpy).toHaveBeenCalledWith(error, expect.any(String));
    expect(selection.onFavorite).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });
});

describe('archive selected', () => {
  it('archives only non-archived owned assets, notifies, toasts, and clears after success', async () => {
    const archived = makeAsset({ id: 'archived', visibility: AssetVisibility.Archive });
    const target = makeAsset({ id: 'target', visibility: AssetVisibility.Timeline });
    const selection = makeSelection({ assets: [archived, target] });

    await handleArchiveSelected(makeCtx(selection));

    expect(updateAssets).toHaveBeenCalledWith({
      assetBulkUpdateDto: { ids: ['target'], visibility: AssetVisibility.Archive },
    });
    expect(selection.onArchive).toHaveBeenCalledWith(['target'], AssetVisibility.Archive);
    expect(toastManager.primary).toHaveBeenCalledOnce();
    expect(selection.clearSelection).toHaveBeenCalledOnce();
  });

  it('no-ops when the filtered id list is empty', async () => {
    const selection = makeSelection({ assets: [makeAsset({ visibility: AssetVisibility.Archive })] });

    await handleArchiveSelected(makeCtx(selection));

    expect(updateAssets).not.toHaveBeenCalled();
    expect(selection.onArchive).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('calls handleError, does not notify, and does not clear on failure', async () => {
    const error = new Error('archive failed');
    vi.mocked(updateAssets).mockRejectedValueOnce(error);
    const selection = makeSelection();

    await handleArchiveSelected(makeCtx(selection));

    expect(handleErrorSpy).toHaveBeenCalledWith(error, expect.any(String));
    expect(selection.onArchive).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });
});

describe('delete selected', () => {
  it('trashes selected owned assets, notifies, includes undo, and clears after success', async () => {
    const assets = [makeAsset({ id: 'asset-1' }), makeAsset({ id: 'asset-2' })];
    const selection = makeSelection({ assets });

    await expect(handleDeleteSelected(makeCtx(selection))).resolves.toBe(true);

    expect(deleteBulk).toHaveBeenCalledWith({ assetBulkDeleteDto: { ids: ['asset-1', 'asset-2'], force: false } });
    expect(selection.onDelete).toHaveBeenCalledWith(['asset-1', 'asset-2']);
    expect(toastManager.primary).toHaveBeenCalledWith(
      expect.objectContaining({
        button: expect.objectContaining({
          label: expect.any(String),
          color: 'secondary',
          onclick: expect.any(Function),
        }),
      }),
      { timeout: 5000 },
    );
    expect(selection.clearSelection).toHaveBeenCalledOnce();
  });

  it('undo button restores deleted assets and then calls onUndoDelete with the original asset refs', async () => {
    const assets = [makeAsset({ id: 'asset-1' }), makeAsset({ id: 'asset-2' })];
    const selection = makeSelection({ assets });

    await handleDeleteSelected(makeCtx(selection));
    const toast = vi.mocked(toastManager.primary).mock.calls[0][0] as { button: { onclick: () => void } };
    toast.button.onclick();

    await vi.waitFor(() => expect(restoreAssets).toHaveBeenCalledWith({ bulkIdsDto: { ids: ['asset-1', 'asset-2'] } }));
    expect(selection.onUndoDelete).toHaveBeenCalledWith(assets);
  });

  it('undo restore failure calls handleError and does not call onUndoDelete', async () => {
    const error = new Error('restore failed');
    vi.mocked(restoreAssets).mockRejectedValueOnce(error);
    const selection = makeSelection();

    await handleDeleteSelected(makeCtx(selection));
    const toast = vi.mocked(toastManager.primary).mock.calls[0][0] as { button: { onclick: () => void } };
    toast.button.onclick();

    await vi.waitFor(() => expect(handleErrorSpy).toHaveBeenCalledWith(error, expect.any(String)));
    expect(selection.onUndoDelete).not.toHaveBeenCalled();
  });

  it('returns false without side effects when onDelete is missing', async () => {
    const selection = makeSelection({ onDelete: undefined });

    await expect(handleDeleteSelected(makeCtx(selection))).resolves.toBe(false);

    expect(deleteBulk).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('returns false without side effects when no owned ids are selected', async () => {
    const selection = makeSelection({
      assets: [],
      selectedAssetIds: [],
      ownedAssets: [],
      ownedSelectedAssetIds: [],
      isAllFavorite: true,
      isAllArchived: true,
      isAllTrashed: true,
    });

    await expect(handleDeleteSelected(makeCtx(selection))).resolves.toBe(false);

    expect(deleteBulk).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('uses force: true when trash feature flag is false', async () => {
    featureFlagsManager.value.trash = false;
    const selection = makeSelection();

    await handleDeleteSelected(makeCtx(selection));

    expect(deleteBulk).toHaveBeenCalledWith({ assetBulkDeleteDto: { ids: ['asset-1'], force: true } });
  });

  it('uses force: true when any selected owned asset is already trashed', async () => {
    const selection = makeSelection({
      assets: [makeAsset({ id: 'asset-1', isTrashed: true }), makeAsset({ id: 'asset-2' })],
    });

    await handleDeleteSelected(makeCtx(selection));

    expect(deleteBulk).toHaveBeenCalledWith({ assetBulkDeleteDto: { ids: ['asset-1', 'asset-2'], force: true } });
  });

  it('passes no undo button when force deleting', async () => {
    featureFlagsManager.value.trash = false;
    const selection = makeSelection();

    await handleDeleteSelected(makeCtx(selection));

    expect(toastManager.primary).toHaveBeenCalledWith(expect.objectContaining({ button: undefined }), {
      timeout: 5000,
    });
  });

  it('opens confirmation modal for force delete when showDeleteModal is true; cancel prevents SDK, callback, and clear', async () => {
    featureFlagsManager.value.trash = false;
    showDeleteModal.set(true);
    vi.mocked(modalManager.show).mockResolvedValueOnce(false as never);
    const selection = makeSelection();

    await expect(handleDeleteSelected(makeCtx(selection))).resolves.toBe(false);

    expect(modalManager.show).toHaveBeenCalledWith(AssetDeleteConfirmModal, { size: 1 });
    expect(deleteBulk).not.toHaveBeenCalled();
    expect(selection.onDelete).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });

  it('calls handleError, does not notify, and does not clear on SDK failure', async () => {
    const error = new Error('delete failed');
    vi.mocked(deleteBulk).mockRejectedValueOnce(error);
    const selection = makeSelection();

    await expect(handleDeleteSelected(makeCtx(selection))).resolves.toBe(false);

    expect(handleErrorSpy).toHaveBeenCalledWith(error, expect.any(String));
    expect(selection.onDelete).not.toHaveBeenCalled();
    expect(selection.clearSelection).not.toHaveBeenCalled();
  });
});

describe('null selection handlers', () => {
  it('passing makeCtx(null) to every handler is a no-op', async () => {
    const ctx = makeCtx(null);

    await handleAddSelectedToAlbum(ctx);
    await handleAddSelectedToCurrentSpace(ctx);
    await handleFavoriteSelected(ctx);
    await handleArchiveSelected(ctx);
    await handleDeleteSelected(ctx);

    expect(modalManager.show).not.toHaveBeenCalled();
    expect(updateAssets).not.toHaveBeenCalled();
    expect(deleteBulk).not.toHaveBeenCalled();
    expect(restoreAssets).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(handleErrorSpy).not.toHaveBeenCalled();
  });

  it('calling every handler without a context is a no-op', async () => {
    await handleAddSelectedToAlbum();
    await expect(handleAddSelectedToCurrentSpace()).resolves.toBe(false);
    await handleFavoriteSelected();
    await handleArchiveSelected();
    await expect(handleDeleteSelected()).resolves.toBe(false);

    expect(modalManager.show).not.toHaveBeenCalled();
    expect(updateAssets).not.toHaveBeenCalled();
    expect(deleteBulk).not.toHaveBeenCalled();
    expect(restoreAssets).not.toHaveBeenCalled();
    expect(toastManager.primary).not.toHaveBeenCalled();
    expect(handleErrorSpy).not.toHaveBeenCalled();
  });
});
