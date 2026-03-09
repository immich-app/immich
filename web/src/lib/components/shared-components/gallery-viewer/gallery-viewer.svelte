<script lang="ts">
  import { goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AssetAction } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
  import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import { Route } from '$lib/route';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import {
    archiveAssets,
    cancelMultiselect,
    getNextAsset,
    getPreviousAsset,
    navigateToAsset,
  } from '$lib/utils/asset-utils';
  import { moveFocus } from '$lib/utils/focus-util';
  import { handleError } from '$lib/utils/handle-error';
  import { getJustifiedLayoutFromAssets } from '$lib/utils/layout-utils';
  import { navigate } from '$lib/utils/navigation';
  import { isTimelineAsset, toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { debounce } from 'lodash-es';
  import { t } from 'svelte-i18n';

  type Props = {
    assets: AssetResponseDto[];
    viewerAssets?: AssetResponseDto[];
    assetInteraction: AssetInteraction;
    disableAssetSelect?: boolean;
    showArchiveIcon?: boolean;
    viewport: Viewport;
    onIntersected?: (() => void) | undefined;
    showAssetName?: boolean;
    onReload?: (() => void) | undefined;
    pageHeaderOffset?: number;
    slidingWindowOffset?: number;
    arrowNavigation?: boolean;
    allowDeletion?: boolean;
  };

  let {
    assets = $bindable(),
    viewerAssets,
    assetInteraction,
    disableAssetSelect = false,
    showArchiveIcon = false,
    viewport,
    onIntersected = undefined,
    showAssetName = false,
    onReload = undefined,
    slidingWindowOffset = 0,
    pageHeaderOffset = 0,
    arrowNavigation = true,
    allowDeletion = true,
  }: Props = $props();

  let { isViewing: isViewerOpen, asset: viewingAsset } = assetViewingStore;
  const navigationAssets = $derived(viewerAssets ?? assets);

  const geometry = $derived(
    getJustifiedLayoutFromAssets(assets, {
      spacing: 2,
      heightTolerance: 0.5,
      rowHeight: Math.floor(viewport.width) < 850 ? 100 : 235,
      rowWidth: Math.floor(viewport.width),
    }),
  );

  const getStyle = (i: number) => {
    const geo = geometry;
    return `top: ${geo.getTop(i)}px; left: ${geo.getLeft(i)}px; width: ${geo.getWidth(i)}px; height: ${geo.getHeight(i)}px;`;
  };

  const isIntersecting = (i: number) => {
    const geo = geometry;
    const window = slidingWindow;
    const top = geo.getTop(i);
    return top + pageHeaderOffset < window.bottom && top + geo.getHeight(i) > window.top;
  };

  let shiftKeyIsDown = $state(false);
  let lastAssetMouseEvent: TimelineAsset | null = $state(null);
  let scrollTop = $state(0);
  let slidingWindow = $derived.by(() => {
    const top = (scrollTop || 0) - slidingWindowOffset;
    const bottom = top + viewport.height + slidingWindowOffset;
    return {
      top,
      bottom,
    };
  });

  const updateCurrentAsset = (asset: AssetResponseDto) => {
    const index = assets.findIndex((oldAsset) => oldAsset.id === asset.id);
    assets[index] = asset;
  };

  const updateSlidingWindow = () => (scrollTop = document.scrollingElement?.scrollTop ?? 0);

  const debouncedOnIntersected = debounce(() => onIntersected?.(), 750, { maxWait: 100, leading: true });

  let lastIntersectedHeight = 0;
  $effect(() => {
    // Intersect if there's only one viewport worth of assets left to scroll.
    if (geometry.containerHeight - slidingWindow.bottom <= viewport.height) {
      // Notify we got to (near) the end of scroll.
      const intersectedHeight = geometry.containerHeight;
      if (lastIntersectedHeight !== intersectedHeight) {
        debouncedOnIntersected();
        lastIntersectedHeight = intersectedHeight;
      }
    }
  });

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
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const trashOrDelete = async (force: boolean = false) => {
    const forceOrNoTrash = force || !featureFlagsManager.value.trash;
    const selectedAssets = assetInteraction.selectedAssets;

    if ($showDeleteModal && forceOrNoTrash) {
      const confirmed = await modalManager.show(AssetDeleteConfirmModal, { size: selectedAssets.length });
      if (!confirmed) {
        return;
      }
    }

    await deleteAssets(
      forceOrNoTrash,
      (assetIds) => (assets = assets.filter((asset) => !assetIds.includes(asset.id))),
      selectedAssets,
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
        { shortcut: { key: '/' }, onShortcut: () => goto(Route.explore()) },
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
          { shortcut: { key: 'D', ctrl: true }, onShortcut: deselectAllAssets },
        );
        if (allowDeletion) {
          shortcuts.push(
            { shortcut: { key: 'Delete' }, onShortcut: onDelete },
            { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
            { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
          );
        }
      }

      return shortcuts;
    })(),
  );

  const handleRandom = async (): Promise<{ id: string } | undefined> => {
    if (navigationAssets.length === 0) {
      return;
    }
    try {
      const randomIndex = Math.floor(Math.random() * navigationAssets.length);
      const asset = navigationAssets[randomIndex];

      await navigateToAsset(asset);
      return asset;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
      return;
    }
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        const nextAsset = assetCursor.nextAsset ?? assetCursor.previousAsset;
        assets.splice(
          assets.findIndex((currentAsset) => currentAsset.id === action.asset.id),
          1,
        );
        if (assets.length === 0) {
          return await goto(Route.photos());
        }
        if (nextAsset) {
          await navigateToAsset(nextAsset);
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

  const assetCursor = $derived({
    current: $viewingAsset,
    nextAsset: getNextAsset(navigationAssets, $viewingAsset),
    previousAsset: getPreviousAsset(navigationAssets, $viewingAsset),
  });
</script>

<svelte:document
  onkeydown={onKeyDown}
  onkeyup={onKeyUp}
  onselectstart={onSelectStart}
  use:shortcuts={shortcutList}
  onscroll={() => updateSlidingWindow()}
/>

{#if assets.length > 0}
  <div
    style:position="relative"
    style:height={geometry.containerHeight + 'px'}
    style:width={geometry.containerWidth + 'px'}
  >
    {#each assets as asset, i (asset.id + '-' + i)}
      {#if isIntersecting(i)}
        {@const currentAsset = toTimelineAsset(asset)}
        <div class="absolute" style:overflow="clip" style={getStyle(i)}>
          <Thumbnail
            readonly={disableAssetSelect}
            onClick={() => {
              if (assetInteraction.selectionActive) {
                handleSelectAssets(currentAsset);
                return;
              }
              void navigateToAsset(asset);
            }}
            onSelect={() => handleSelectAssets(currentAsset)}
            onMouseEvent={() => assetMouseEventHandler(currentAsset)}
            {showArchiveIcon}
            asset={currentAsset}
            selected={assetInteraction.hasSelectedAsset(currentAsset.id)}
            selectionCandidate={assetInteraction.hasSelectionCandidate(currentAsset.id)}
            thumbnailWidth={geometry.getWidth(i)}
            thumbnailHeight={geometry.getHeight(i)}
          />
          {#if showAssetName && !isTimelineAsset(asset)}
            <div
              class="absolute text-center p-1 text-xs font-mono font-semibold w-full bottom-0 bg-linear-to-t bg-slate-50/75 dark:bg-slate-800/75 overflow-clip text-ellipsis whitespace-pre-wrap"
            >
              {asset.originalFileName}
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
    {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
      <AssetViewer
        cursor={assetCursor}
        onAction={handleAction}
        onRandom={handleRandom}
        onAssetChange={updateCurrentAsset}
        onClose={() => {
          assetViewingStore.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    {/await}
  </Portal>
{/if}
