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
  import { archiveAssets, cancelMultiselect, getNextAsset, getPreviousAsset, navigateToAsset } from '$lib/utils/asset-utils';
  import { moveFocus } from '$lib/utils/focus-util';
  import { handleError } from '$lib/utils/handle-error';
  import type { CommonJustifiedLayout } from '$lib/utils/layout-utils';
  import { getJustifiedLayoutFromAssets } from '$lib/utils/layout-utils';
  import { navigate } from '$lib/utils/navigation';
  import { formatGroupTitle, toTimelineAsset } from '$lib/utils/timeline-util';
  import { AssetVisibility, type AssetResponseDto } from '@immich/sdk';
  import { modalManager, Text } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { debounce } from 'lodash-es';
  import { t } from 'svelte-i18n';

  type DateGroup = {
    date: DateTime;
    title: string;
    assets: AssetResponseDto[];
    geometry: CommonJustifiedLayout;
    offsetTop: number;
  };

  type Props = {
    assets: AssetResponseDto[];
    assetInteraction: AssetInteraction;
    disableAssetSelect?: boolean;
    showArchiveIcon?: boolean;
    viewport: Viewport;
    onIntersected?: (() => void) | undefined;
    onReload?: (() => void) | undefined;
    slidingWindowOffset?: number;
  };

  let {
    assets = $bindable(),
    assetInteraction,
    disableAssetSelect = false,
    showArchiveIcon = false,
    viewport,
    onIntersected = undefined,
    onReload = undefined,
    slidingWindowOffset = 0,
  }: Props = $props();

  const HEADER_HEIGHT = 48;

  let { isViewing: isViewerOpen, asset: viewingAsset } = assetViewingStore;

  function groupAssetsByDate(items: AssetResponseDto[]): DateGroup[] {
    const groupEntries: { key: string; assets: AssetResponseDto[] }[] = [];

    for (const asset of items) {
      const date = DateTime.fromISO(asset.localDateTime, { zone: 'UTC' });
      const key = date.toISODate() ?? 'unknown';
      const last = groupEntries.at(-1);
      if (last && last.key === key) {
        last.assets.push(asset);
      } else {
        groupEntries.push({ key, assets: [asset] });
      }
    }

    const groups: DateGroup[] = [];
    let offsetTop = 0;
    const rowWidth = Math.floor(viewport.width);
    const rowHeight = rowWidth < 850 ? 100 : 235;

    for (const { key, assets: groupAssets } of groupEntries) {
      const date = DateTime.fromISO(key, { zone: 'local' });
      const geometry = getJustifiedLayoutFromAssets(groupAssets, {
        spacing: 2,
        heightTolerance: 0.5,
        rowHeight,
        rowWidth,
      });

      groups.push({
        date: date as DateTime<true>,
        title: formatGroupTitle(date),
        assets: groupAssets,
        geometry,
        offsetTop,
      });

      offsetTop += HEADER_HEIGHT + geometry.containerHeight;
    }

    return groups;
  }

  const dateGroups = $derived(groupAssetsByDate(assets));
  const totalHeight = $derived(
    dateGroups.length > 0
      ? dateGroups.at(-1)!.offsetTop + HEADER_HEIGHT + dateGroups.at(-1)!.geometry.containerHeight
      : 0,
  );

  let shiftKeyIsDown = $state(false);
  let lastAssetMouseEvent: TimelineAsset | null = $state(null);
  let scrollTop = $state(0);
  let slidingWindow = $derived.by(() => {
    const top = (scrollTop || 0) - slidingWindowOffset;
    const bottom = top + viewport.height + slidingWindowOffset;
    return { top, bottom };
  });

  const updateSlidingWindow = () => (scrollTop = document.scrollingElement?.scrollTop ?? 0);

  const debouncedOnIntersected = debounce(() => onIntersected?.(), 750, { maxWait: 100, leading: true });

  let lastIntersectedHeight = 0;
  $effect(() => {
    if (totalHeight - slidingWindow.bottom <= viewport.height && lastIntersectedHeight !== totalHeight) {
      debouncedOnIntersected();
      lastIntersectedHeight = totalHeight;
    }
  });

  function isGroupVisible(group: DateGroup): boolean {
    const groupTop = group.offsetTop;
    const groupBottom = groupTop + HEADER_HEIGHT + group.geometry.containerHeight;
    return groupTop < slidingWindow.bottom && groupBottom > slidingWindow.top;
  }

  function isAssetVisible(group: DateGroup, assetIndex: number): boolean {
    const assetTop = group.offsetTop + HEADER_HEIGHT + group.geometry.getTop(assetIndex);
    const assetBottom = assetTop + group.geometry.getHeight(assetIndex);
    return assetTop < slidingWindow.bottom && assetBottom > slidingWindow.top;
  }

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

      const sc: ShortcutOptions[] = [
        { shortcut: { key: '?', shift: true }, onShortcut: handleOpenShortcutModal },
        { shortcut: { key: '/' }, onShortcut: () => goto(Route.explore()) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets() },
        { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: focusNextAsset },
        { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: focusPreviousAsset },
      ];

      if (assetInteraction.selectionActive) {
        sc.push(
          { shortcut: { key: 'Escape' }, onShortcut: deselectAllAssets },
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: () => trashOrDelete(true) },
          { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
          { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
        );
      }

      return sc;
    })(),
  );

  const handleRandom = async (): Promise<{ id: string } | undefined> => {
    if (assets.length === 0) {
      return;
    }
    try {
      const randomIndex = Math.floor(Math.random() * assets.length);
      const asset = assets[randomIndex];
      await navigateToAsset(asset);
      return asset;
    } catch (error) {
      handleError(error, $t('errors.cannot_navigate_next_asset'));
      return;
    }
  };

  const updateCurrentAsset = (asset: AssetResponseDto) => {
    const index = assets.findIndex((oldAsset) => oldAsset.id === asset.id);
    assets[index] = asset;
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
    nextAsset: getNextAsset(assets, $viewingAsset),
    previousAsset: getPreviousAsset(assets, $viewingAsset),
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
  <div style:position="relative" style:height={totalHeight + 'px'} style:width={viewport.width + 'px'}>
    {#each dateGroups as group (group.date.toISODate())}
      {#if isGroupVisible(group)}
        <!-- Date header -->
        <div
          class="absolute flex items-center px-2"
          style:top={group.offsetTop + 'px'}
          style:height={HEADER_HEIGHT + 'px'}
          style:width="100%"
        >
          <Text fontWeight="medium" class="text-sm md:text-base">{group.title}</Text>
        </div>

        <!-- Thumbnails -->
        <div
          class="absolute"
          style:top={group.offsetTop + HEADER_HEIGHT + 'px'}
          style:height={group.geometry.containerHeight + 'px'}
          style:width={group.geometry.containerWidth + 'px'}
        >
          {#each group.assets as asset, i (asset.id)}
            {#if isAssetVisible(group, i)}
              {@const currentAsset = toTimelineAsset(asset)}
              <div
                class="absolute"
                style:overflow="clip"
                style:top={group.geometry.getTop(i) + 'px'}
                style:left={group.geometry.getLeft(i) + 'px'}
                style:width={group.geometry.getWidth(i) + 'px'}
                style:height={group.geometry.getHeight(i) + 'px'}
              >
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
                  thumbnailWidth={group.geometry.getWidth(i)}
                  thumbnailHeight={group.geometry.getHeight(i)}
                />
              </div>
            {/if}
          {/each}
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
