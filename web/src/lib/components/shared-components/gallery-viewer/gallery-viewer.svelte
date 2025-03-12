<script lang="ts">
  import { type ShortcutOptions, shortcuts } from '$lib/actions/shortcut';
  import { goto } from '$app/navigation';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { Viewport } from '$lib/stores/assets-store.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, getAssetRatio } from '$lib/utils/asset-utils';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import { navigate } from '$lib/utils/navigation';
  import { calculateWidth } from '$lib/utils/timeline-util';
  import { type AssetResponseDto } from '@immich/sdk';
  import justifiedLayout from 'justified-layout';
  import { t } from 'svelte-i18n';
  import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
  import ShowShortcuts from '../show-shortcuts.svelte';
  import Portal from '../portal/portal.svelte';
  import { handlePromiseError } from '$lib/utils';
  import DeleteAssetDialog from '../../photos-page/delete-asset-dialog.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    assets: AssetResponseDto[];
    assetInteraction: AssetInteraction;
    disableAssetSelect?: boolean;
    showArchiveIcon?: boolean;
    viewport: Viewport;
    onIntersected?: (() => void) | undefined;
    showAssetName?: boolean;
    isShowDeleteConfirmation?: boolean;
    onPrevious?: (() => Promise<AssetResponseDto | undefined>) | undefined;
    onNext?: (() => Promise<AssetResponseDto | undefined>) | undefined;
    onRandom?: (() => Promise<AssetResponseDto | undefined>) | undefined;
  }

  let {
    assets = $bindable(),
    assetInteraction,
    disableAssetSelect = false,
    showArchiveIcon = false,
    viewport,
    onIntersected = undefined,
    showAssetName = false,
    isShowDeleteConfirmation = $bindable(false),
    onPrevious = undefined,
    onNext = undefined,
    onRandom = undefined,
  }: Props = $props();

  let { isViewing: isViewerOpen, asset: viewingAsset, setAsset } = assetViewingStore;

  let showShortcuts = $state(false);
  let currentViewAssetIndex = 0;
  let shiftKeyIsDown = $state(false);
  let lastAssetMouseEvent: AssetResponseDto | null = $state(null);

  const viewAssetHandler = async (asset: AssetResponseDto) => {
    currentViewAssetIndex = assets.findIndex((a) => a.id == asset.id);
    setAsset(assets[currentViewAssetIndex]);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
  };

  const selectAllAssets = () => {
    assetInteraction.selectAssets(assets);
  };

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  const handleSelectAssets = (asset: AssetResponseDto) => {
    if (!asset) {
      return;
    }
    const deselect = assetInteraction.selectedAssets.has(asset);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.selectAsset(candidate);
      }
      assetInteraction.selectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();
    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const handleSelectAssetCandidates = (asset: AssetResponseDto | null) => {
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const selectAssetCandidates = (endAsset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    let start = assets.findIndex((a) => a.id === startAsset.id);
    let end = assets.findIndex((a) => a.id === endAsset.id);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteraction.setAssetSelectionCandidates(assets.slice(start, end + 1));
  };

  const onSelectStart = (e: Event) => {
    if (assetInteraction.selectionActive && shiftKeyIsDown) {
      e.preventDefault();
    }
  };

  const onDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssetsArray.some((asset) => asset.isTrashed);

    if ($showDeleteModal && (!isTrashEnabled || hasTrashedAsset)) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const onForceDelete = () => {
    if ($showDeleteModal) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(true));
  };

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(
      !(isTrashEnabled && !force),
      (assetIds) => (assets = assets.filter((asset) => !assetIds.includes(asset.id))),
      idsSelectedAssets,
    );
    assetInteraction.clearMultiselect();
  };

  const toggleArchive = async () => {
    const ids = await archiveAssets(assetInteraction.selectedAssetsArray, !assetInteraction.isAllArchived);
    if (ids) {
      assets.filter((asset) => !ids.includes(asset.id));
      deselectAllAssets();
    }
  };

  const focusNextAsset = () => {
    if (assetInteraction.focussedAssetId === null && assets.length > 0) {
      assetInteraction.focussedAssetId = assets[0].id;
    } else if (assetInteraction.focussedAssetId !== null && assets.length > 0) {
      const currentIndex = assets.findIndex((a) => a.id === assetInteraction.focussedAssetId);
      if (currentIndex !== -1 && currentIndex + 1 < assets.length) {
        assetInteraction.focussedAssetId = assets[currentIndex + 1].id;
      }
    }
  };

  const focusPreviousAsset = () => {
    if (assetInteraction.focussedAssetId !== null && assets.length > 0) {
      const currentIndex = assets.findIndex((a) => a.id === assetInteraction.focussedAssetId);
      if (currentIndex >= 1) {
        assetInteraction.focussedAssetId = assets[currentIndex - 1].id;
      }
    }
  };

  let shortcutList = $derived(
    (() => {
      if ($isViewerOpen) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: '?', shift: true }, onShortcut: () => (showShortcuts = !showShortcuts) },
        { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets() },
        { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: focusNextAsset },
        { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: focusPreviousAsset },
      ];

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          { shortcut: { key: 'Escape' }, onShortcut: deselectAllAssets },
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: onForceDelete },
          { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
          { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
        );
      }

      return shortcuts;
    })(),
  );

  const handleNext = async (): Promise<boolean> => {
    try {
      let asset: AssetResponseDto | undefined;
      if (onNext) {
        asset = await onNext();
      } else {
        currentViewAssetIndex = currentViewAssetIndex + 1;
        asset = currentViewAssetIndex < assets.length ? assets[currentViewAssetIndex] : undefined;
      }

      if (!asset) {
        return false;
      }

      await navigateToAsset(asset);
      return true;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
      return false;
    }
  };

  const handleRandom = async (): Promise<AssetResponseDto | null> => {
    try {
      let asset: AssetResponseDto | undefined;
      if (onRandom) {
        asset = await onRandom();
      } else {
        if (assets.length > 0) {
          const randomIndex = Math.floor(Math.random() * assets.length);
          asset = assets[randomIndex];
        }
      }

      if (!asset) {
        return null;
      }

      await navigateToAsset(asset);
      return asset;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
      return null;
    }
  };

  const handlePrevious = async (): Promise<boolean> => {
    try {
      let asset: AssetResponseDto | undefined;
      if (onPrevious) {
        asset = await onPrevious();
      } else {
        currentViewAssetIndex = currentViewAssetIndex - 1;
        asset = currentViewAssetIndex >= 0 ? assets[currentViewAssetIndex] : undefined;
      }

      if (!asset) {
        return false;
      }

      await navigateToAsset(asset);
      return true;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_previous_asset'));
      return false;
    }
  };

  const navigateToAsset = async (asset?: AssetResponseDto) => {
    if (asset && asset.id !== $viewingAsset.id) {
      setAsset(asset);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    }
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        assets.splice(
          assets.findIndex((a) => a.id === action.asset.id),
          1,
        );
        if (assets.length === 0) {
          await goto(AppRoute.PHOTOS);
        } else if (currentViewAssetIndex === assets.length) {
          await handlePrevious();
        } else {
          setAsset(assets[currentViewAssetIndex]);
        }
        break;
      }
    }
  };

  const assetMouseEventHandler = (asset: AssetResponseDto | null) => {
    if (assetInteraction.selectionActive) {
      handleSelectAssetCandidates(asset);
    }
  };

  const assetOnFocusHandler = (asset: AssetResponseDto) => {
    assetInteraction.focussedAssetId = asset.id;
  };

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  let idsSelectedAssets = $derived(assetInteraction.selectedAssetsArray.map(({ id }) => id));

  let geometry = $derived(
    (() => {
      const justifiedLayoutResult = justifiedLayout(
        assets.map((asset) => getAssetRatio(asset)),
        {
          boxSpacing: 2,
          containerWidth: Math.floor(viewport.width),
          containerPadding: 0,
          targetRowHeightTolerance: 0.15,
          targetRowHeight: 235,
        },
      );

      return {
        ...justifiedLayoutResult,
        containerWidth: calculateWidth(justifiedLayoutResult.boxes),
      };
    })(),
  );

  $effect(() => {
    if (!lastAssetMouseEvent) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (!shiftKeyIsDown) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      selectAssetCandidates(lastAssetMouseEvent);
    }
  });
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} onselectstart={onSelectStart} use:shortcuts={shortcutList} />

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={assetInteraction.selectedAssets.size}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if showShortcuts}
  <ShowShortcuts onClose={() => (showShortcuts = !showShortcuts)} />
{/if}

{#if assets.length > 0}
  <div class="relative" style="height: {geometry.containerHeight}px;width: {geometry.containerWidth}px ">
    {#each assets as asset, i (i)}
      <div
        class="absolute"
        style="width: {geometry.boxes[i].width}px; height: {geometry.boxes[i].height}px; top: {geometry.boxes[i]
          .top}px; left: {geometry.boxes[i].left}px"
        title={showAssetName ? asset.originalFileName : ''}
      >
        <Thumbnail
          readonly={disableAssetSelect}
          onClick={(asset) => {
            if (assetInteraction.selectionActive) {
              handleSelectAssets(asset);
              return;
            }
            void viewAssetHandler(asset);
          }}
          onSelect={(asset) => handleSelectAssets(asset)}
          onMouseEvent={() => assetMouseEventHandler(asset)}
          handleFocus={() => assetOnFocusHandler(asset)}
          onIntersected={() => (i === Math.max(1, assets.length - 7) ? onIntersected?.() : void 0)}
          {showArchiveIcon}
          {asset}
          selected={assetInteraction.selectedAssets.has(asset)}
          focussed={assetInteraction.isFocussedAsset(asset)}
          selectionCandidate={assetInteraction.assetSelectionCandidates.has(asset)}
          thumbnailWidth={geometry.boxes[i].width}
          thumbnailHeight={geometry.boxes[i].height}
        />
        {#if showAssetName}
          <div
            class="absolute text-center p-1 text-xs font-mono font-semibold w-full bottom-0 bg-gradient-to-t bg-slate-50/75 overflow-clip text-ellipsis whitespace-pre-wrap"
          >
            {asset.originalFileName}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<!-- Overlay Asset Viewer -->
{#if $isViewerOpen}
  <Portal target="body">
    <AssetViewer
      asset={$viewingAsset}
      onAction={handleAction}
      onPrevious={handlePrevious}
      onNext={handleNext}
      onRandom={handleRandom}
      onClose={() => {
        assetViewingStore.showAssetViewer(false);
        handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
      }}
    />
  </Portal>
{/if}
