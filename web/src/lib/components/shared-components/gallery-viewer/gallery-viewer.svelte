<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect } from '$lib/utils/asset-utils';
  import { moveFocus } from '$lib/utils/focus-util';
  import { handleError } from '$lib/utils/handle-error';
  import { getJustifiedLayoutFromAssets, type CommonJustifiedLayout } from '$lib/utils/layout-utils';
  import { navigate } from '$lib/utils/navigation';
  import { isTimelineAsset, toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { debounce } from 'lodash-es';
  import { t } from 'svelte-i18n';
  import AssetViewer from '../../asset-viewer/asset-viewer.svelte';
  import DeleteAssetDialog from '../../photos-page/delete-asset-dialog.svelte';

  interface Props {
    initialAssetId?: string;
    assets: (TimelineAsset | AssetResponseDto)[];
    assetInteraction: AssetInteraction;
    disableAssetSelect?: boolean;
    showArchiveIcon?: boolean;
    viewport: Viewport;
    onIntersected?: (() => void) | undefined;
    showAssetName?: boolean;
    isShowDeleteConfirmation?: boolean;
    onPrevious?: (() => Promise<{ id: string } | undefined>) | undefined;
    onNext?: (() => Promise<{ id: string } | undefined>) | undefined;
    onRandom?: (() => Promise<{ id: string } | undefined>) | undefined;
    onReload?: (() => void) | undefined;
    pageHeaderOffset?: number;
    slidingWindowOffset?: number;
    arrowNavigation?: boolean;
  }

  let {
    initialAssetId = undefined,
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
    onReload = undefined,
    slidingWindowOffset = 0,
    pageHeaderOffset = 0,
    arrowNavigation = true,
  }: Props = $props();

  let { isViewing: isViewerOpen, asset: viewingAsset, setAssetId } = assetViewingStore;

  let geometry: CommonJustifiedLayout | undefined = $state();

  $effect(() => {
    const _assets = assets;
    updateSlidingWindow();

    const rowWidth = Math.floor(viewport.width);
    const rowHeight = rowWidth < 850 ? 100 : 235;

    geometry = getJustifiedLayoutFromAssets(_assets, {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight,
      rowWidth,
    });
  });

  let assetLayouts = $derived.by(() => {
    const assetLayout = [];
    let containerHeight = 0;
    let containerWidth = 0;
    if (geometry) {
      containerHeight = geometry.containerHeight;
      containerWidth = geometry.containerWidth;
      for (const [index, asset] of assets.entries()) {
        const top = geometry.getTop(index);
        const left = geometry.getLeft(index);
        const width = geometry.getWidth(index);
        const height = geometry.getHeight(index);

        const layoutTopWithOffset = top + pageHeaderOffset;
        const layoutBottom = layoutTopWithOffset + height;

        const display = layoutTopWithOffset < slidingWindow.bottom && layoutBottom > slidingWindow.top;

        const layout = {
          asset,
          top,
          left,
          width,
          height,
          display,
        };

        assetLayout.push(layout);
      }
    }

    return {
      assetLayout,
      containerHeight,
      containerWidth,
    };
  });

  let currentIndex = 0;
  if (initialAssetId && assets.length > 0) {
    const index = assets.findIndex(({ id }) => id === initialAssetId);
    if (index !== -1) {
      currentIndex = index;
    }
  }

  let shiftKeyIsDown = $state(false);
  let lastAssetMouseEvent: TimelineAsset | null = $state(null);
  let slidingWindow = $state({ top: 0, bottom: 0 });

  const updateSlidingWindow = () => {
    const v = $state.snapshot(viewport);
    const top = (document.scrollingElement?.scrollTop || 0) - slidingWindowOffset;
    const bottom = top + v.height;
    const w = {
      top,
      bottom,
    };
    slidingWindow = w;
  };
  const debouncedOnIntersected = debounce(() => onIntersected?.(), 750, { maxWait: 100, leading: true });

  let lastIntersectedHeight = 0;
  $effect(() => {
    // Intersect if there's only one viewport worth of assets left to scroll.
    if (assetLayouts.containerHeight - slidingWindow.bottom <= viewport.height) {
      // Notify we got to (near) the end of scroll.
      const intersectedHeight = assetLayouts.containerHeight;
      if (lastIntersectedHeight !== intersectedHeight) {
        debouncedOnIntersected();
        lastIntersectedHeight = intersectedHeight;
      }
    }
  });
  const viewAssetHandler = async (asset: TimelineAsset) => {
    currentIndex = assets.findIndex((a) => a.id == asset.id);
    await setAssetId(assets[currentIndex].id);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
  };

  const selectAllAssets = () => {
    assetInteraction.selectAssets(assets.map((a) => toTimelineAsset(a)));
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

  const handleSelectAssets = (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.selectAsset(candidate);
      }
      assetInteraction.selectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();
    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const handleSelectAssetCandidates = (asset: TimelineAsset | null) => {
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const selectAssetCandidates = (endAsset: TimelineAsset) => {
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

    assetInteraction.setAssetSelectionCandidates(assets.slice(start, end + 1).map((a) => toTimelineAsset(a)));
  };

  const onSelectStart = (event: Event) => {
    if (assetInteraction.selectionActive && shiftKeyIsDown) {
      event.preventDefault();
    }
  };

  const onDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssets.some((asset) => asset.isTrashed);

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
      assetInteraction.selectedAssets,
      onReload,
    );
    assetInteraction.clearMultiselect();
  };

  const toggleArchive = async () => {
    const ids = await archiveAssets(
      assetInteraction.selectedAssets,
      assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive,
    );
    if (ids) {
      assets = assets.filter((asset) => !ids.includes(asset.id));
      deselectAllAssets();
    }
  };

  const focusNextAsset = () => moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'next');
  const focusPreviousAsset = () =>
    moveFocus((element) => element.dataset.thumbnailFocusContainer !== undefined, 'previous');

  let isShortcutModalOpen = false;

  const handleOpenShortcutModal = async () => {
    if (isShortcutModalOpen) {
      return;
    }

    isShortcutModalOpen = true;
    await modalManager.show(ShortcutsModal, {});
    isShortcutModalOpen = false;
  };

  const shortcutList = $derived(
    (() => {
      if ($isViewerOpen) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: '?', shift: true }, onShortcut: handleOpenShortcutModal },
        { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets() },
        ...(arrowNavigation
          ? [
              { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: focusNextAsset },
              { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: focusPreviousAsset },
            ]
          : []),
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
      let asset: { id: string } | undefined;
      if (onNext) {
        asset = await onNext();
      } else {
        if (currentIndex >= assets.length - 1) {
          return false;
        }

        currentIndex = currentIndex + 1;
        asset = currentIndex < assets.length ? assets[currentIndex] : undefined;
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

  const handleRandom = async (): Promise<{ id: string } | undefined> => {
    try {
      let asset: { id: string } | undefined;
      if (onRandom) {
        asset = await onRandom();
      } else {
        if (assets.length > 0) {
          const randomIndex = Math.floor(Math.random() * assets.length);
          asset = assets[randomIndex];
        }
      }

      if (!asset) {
        return;
      }

      await navigateToAsset(asset);
      return asset;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
      return;
    }
  };

  const handlePrevious = async (): Promise<boolean> => {
    try {
      let asset: { id: string } | undefined;
      if (onPrevious) {
        asset = await onPrevious();
      } else {
        if (currentIndex <= 0) {
          return false;
        }

        currentIndex = currentIndex - 1;
        asset = currentIndex >= 0 ? assets[currentIndex] : undefined;
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

  const navigateToAsset = async (asset?: { id: string }) => {
    if (asset && asset.id !== $viewingAsset.id) {
      await setAssetId(asset.id);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    }
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        assets.splice(
          assets.findIndex((currentAsset) => currentAsset.id === action.asset.id),
          1,
        );
        if (assets.length === 0) {
          await goto(AppRoute.PHOTOS);
        } else if (currentIndex === assets.length) {
          await handlePrevious();
        } else {
          await setAssetId(assets[currentIndex].id);
        }
        break;
      }
    }
  };

  const assetMouseEventHandler = (asset: TimelineAsset | null) => {
    if (assetInteraction.selectionActive) {
      handleSelectAssetCandidates(asset);
    }
  };

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);

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

<svelte:document
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  onselectstart={onSelectStart}
  use:shortcuts={shortcutList}
  onscroll={() => updateSlidingWindow()}
/>

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={assetInteraction.selectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if assets.length > 0}
  <div
    style:position="relative"
    style:height={assetLayouts.containerHeight + 'px'}
    style:width={assetLayouts.containerWidth - 1 + 'px'}
  >
    {#each assetLayouts.assetLayout as layout, layoutIndex (layout.asset.id + '-' + layoutIndex)}
      {@const currentAsset = layout.asset}

      {#if layout.display}
        <div
          class="absolute"
          style:overflow="clip"
          style="width: {layout.width}px; height: {layout.height}px; top: {layout.top}px; left: {layout.left}px"
        >
          <Thumbnail
            readonly={disableAssetSelect}
            onClick={() => {
              if (assetInteraction.selectionActive) {
                handleSelectAssets(toTimelineAsset(currentAsset));
                return;
              }
              void viewAssetHandler(toTimelineAsset(currentAsset));
            }}
            onSelect={() => handleSelectAssets(toTimelineAsset(currentAsset))}
            onMouseEvent={() => assetMouseEventHandler(toTimelineAsset(currentAsset))}
            {showArchiveIcon}
            asset={toTimelineAsset(currentAsset)}
            selected={assetInteraction.hasSelectedAsset(currentAsset.id)}
            selectionCandidate={assetInteraction.hasSelectionCandidate(currentAsset.id)}
            thumbnailWidth={layout.width}
            thumbnailHeight={layout.height}
          />
          {#if showAssetName && !isTimelineAsset(currentAsset)}
            <div
              class="absolute text-center p-1 text-xs font-mono font-semibold w-full bottom-0 bg-linear-to-t bg-slate-50/75 dark:bg-slate-800/75 overflow-clip text-ellipsis whitespace-pre-wrap"
            >
              {currentAsset.originalFileName}
            </div>
          {/if}
        </div>
      {/if}
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
