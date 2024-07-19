<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import { resizeObserver } from '$lib/actions/resize-observer';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import Skeleton from '$lib/components/photos-page/skeleton.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import {
    AssetBucket,
    AssetStore,
    isSelectingAllAssets,
    lastScrollTime,
    queuePostScrollTask,
    type Viewport,
  } from '$lib/stores/assets.store';
  import { locale, showDeleteModal } from '$lib/stores/preferences.store';
  import { isSearchEnabled } from '$lib/stores/search.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { formatGroupTitle, splitBucketIntoDateGroups, TUNABLES } from '$lib/utils/timeline-util';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';
  import { throttle } from 'lodash-es';
  import { createEventDispatcher, onMount } from 'svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrollbar from '../shared-components/scrollbar/scrollbar.svelte';
  import ShowShortcuts from '../shared-components/show-shortcuts.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';

  export let isSelectionMode = false;
  export let singleSelect = false;
  /* true if this asset grid is responds to navigation events; if true, then look at the
   * AssetViewingStore.gridScrollTarget and load and scroll to the asset specified, and
   * additionally, update the page location/url with the asset as the asset-grid is scrolled */
  export let participatesInRouting: boolean;
  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;
  export let removeAction: AssetAction | null = null;
  export let withStacked = false;
  export let showArchiveIcon = false;
  export let isShared = false;
  export let album: AlbumResponseDto | null = null;
  export let isShowDeleteConfirmation = false;

  const { assetSelectionCandidates, assetSelectionStart, selectedGroup, selectedAssets, isMultiSelectState } =
    assetInteractionStore;
  const viewport: Viewport = { width: 0, height: 0, x: 0, y: 0 };
  const safeViewport: Viewport = { width: 0, height: 0, x: 0, y: 0 };
  let { isViewing: showAssetViewer, asset: viewingAsset, preloadAssets, gridScrollTarget } = assetViewingStore;

  let element: HTMLElement;
  let timelineElement: HTMLElement;
  let showShortcuts = false;
  let showSkeleton = true;
  let internalScroll = false;
  let navigating = false;
  let preMeasure: AssetBucket[] = [];
  let lastIntersectedBucketDate: string | undefined;

  $: isTrashEnabled = $featureFlags.loaded && $featureFlags.trash;
  $: timelineY = element?.scrollTop || 0;
  $: isEmpty = $assetStore.initialized && $assetStore.buckets.length === 0;
  $: idsSelectedAssets = [...$selectedAssets].map(({ id }) => id);
  $: isAllArchived = [...$selectedAssets].every((asset) => asset.isArchived);
  $: {
    if (isEmpty) {
      assetInteractionStore.clearMultiselect();
    }
  }
  $: {
    if (element && isViewportOrigin()) {
      const rect = element.getBoundingClientRect();
      viewport.height = rect.height;
      viewport.width = rect.width;
      viewport.x = rect.x;
      viewport.y = rect.y;
    }
    if (!isViewportOrigin() && !isEqual(viewport, safeViewport)) {
      safeViewport.height = viewport.height;
      safeViewport.width = viewport.width;
      safeViewport.x = viewport.x;
      safeViewport.y = viewport.y;
      updateViewport();
    }
  }
  const dispatch = createEventDispatcher<{ select: AssetResponseDto; escape: void }>();

  const isViewportOrigin = () => {
    return viewport.height === 0 && viewport.width === 0;
  };

  const isEqual = (a: Viewport, b: Viewport) => {
    return a.height == b.height && a.width == b.width && a.x === b.x && a.y === b.y;
  };

  const completeNav = () => {
    navigating = false;
    if (internalScroll) {
      internalScroll = false;
      return;
    }

    if ($gridScrollTarget?.at) {
      void $assetStore.scheduleScrollToAssetId($gridScrollTarget);
    } else {
      element.scrollTo({ top: 0 });
      showSkeleton = false;
    }
  };

  afterNavigate((nav) => {
    const { complete, type } = nav;
    if (type === 'enter') {
      return;
    }
    complete.then(completeNav, completeNav);
  });

  beforeNavigate(() => {
    navigating = true;
  });

  const hmrSupport = () => {
    // when hmr happens, skeleton is initialized to true by default
    // normally, loading asset-grid is part of a navigation event, and the completion of
    // that event triggers a scroll-to-asset, if necessary, when then clears the skeleton.
    // this handler will run the navigation/scroll-to-asset handler when hmr is performed,
    // preventing skeleton from showing after hmr
    if (import.meta && import.meta.hot) {
      const afterApdate = (payload) => {
        const assetGridUpdate = payload.updates.some(
          (update) => update.path.endsWith('asset-grid.svelte') || update.path.endsWith('assets-store.ts'),
        );
        if (assetGridUpdate) {
          setTimeout(() => {
            const asset = $page.url.searchParams.get('at');
            if (asset) {
              $gridScrollTarget = { at: asset };
              void navigate(
                { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
                { replaceState: true, forceNavigate: true },
              );
            } else {
              element.scrollTo({ top: 0 });
              showSkeleton = false;
            }
          }, 500);
        }
      };
      import.meta.hot?.on('vite:afterUpdate', afterApdate);
      import.meta.hot?.on('vite:beforeUpdate', (payload) => {
        const assetGridUpdate = payload.updates.some((update) => update.path.endsWith('asset-grid.svelte'));
        if (assetGridUpdate) {
          assetStore.destroy();
        }
      });

      return () => import.meta.hot?.off('vite:afterUpdate', afterApdate);
    }
    return () => void 0;
  };

  const _updateLastIntersectedBucketDate = () => {
    let elem = document.elementFromPoint(safeViewport.x + 1, safeViewport.y + 1);
    while (elem != null) {
      if (elem.id === 'buck') {
        break;
      }
      elem = elem.parentElement;
    }
    if (elem) {
      lastIntersectedBucketDate = (elem as HTMLElement).dataset.bucketDate;
    }
  };
  const updateLastIntersectedBucketDate = throttle(_updateLastIntersectedBucketDate, 16, {
    leading: false,
    trailing: true,
  });

  const bucketListener = (bucketnotify, kind, dateGroup, delta) => {
    if (kind === 'intersecting') {
      updateLastIntersectedBucketDate();
    }
    if (kind === 'buckheight' && lastIntersectedBucketDate) {
      const currentIndex = $assetStore.buckets.findIndex((b) => b.bucketDate === lastIntersectedBucketDate);
      const deltaIndex = $assetStore.buckets.indexOf(bucketnotify);

      if (deltaIndex < currentIndex) {
        element?.scrollBy(0, delta);
      }
    }
  };

  onMount(() => {
    $assetStore.connect();
    void $assetStore.init({ bucketListener }).then(() => $assetStore.updateViewport(safeViewport));
    if (!participatesInRouting) {
      showSkeleton = false;
    }
    const dispose = hmrSupport();
    return () => {
      $assetStore.disconnect();
      dispose();
    };
  });

  const _updateViewport = () => void $assetStore.updateViewport(safeViewport);
  const updateViewport = throttle(_updateViewport, 16);

  const _handleScrollTimeline = ({ detail }: { detail: number }) => {
    element.scrollTop = detail;
  };
  const handleScrollTimeline = throttle(_handleScrollTimeline, 16, { leading: false, trailing: true });

  const _handleTimelineScroll = () => {
    timelineY = element?.scrollTop || 0;
  };
  const handleTimelineScroll = throttle(_handleTimelineScroll, 16, { leading: false, trailing: true });

  const _onAssetInGrid = async (asset: AssetResponseDto) => {
    if (!participatesInRouting || navigating || internalScroll) {
      return;
    }
    $gridScrollTarget = { at: asset.id };
    internalScroll = true;
    await navigate(
      { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
      { replaceState: true, forceNavigate: true },
    );
  };
  const onAssetInGrid = throttle(_onAssetInGrid, 16, { leading: false, trailing: true });

  const onScrollTarget = ({ bucket, offset }: { asset: AssetResponseDto; offset: number }) => {
    element.scrollTo({ top: offset });

    if (bucket.measured) {
      preMeasure.push(bucket);
    }
    showSkeleton = false;
    $assetStore.clearPendingScroll();
  };

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(
      !(isTrashEnabled && !force),
      (assetIds) => $assetStore.removeAssets(assetIds),
      idsSelectedAssets,
    );
    assetInteractionStore.clearMultiselect();
  };

  const onDelete = () => {
    const hasTrashedAsset = Array.from($selectedAssets).some((asset) => asset.isTrashed);

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

  const onStackAssets = async () => {
    const ids = await stackAssets(Array.from($selectedAssets));
    if (ids) {
      $assetStore.removeAssets(ids);
      dispatch('escape');
    }
  };

  const toggleArchive = async () => {
    const ids = await archiveAssets(Array.from($selectedAssets), !isAllArchived);
    if (ids) {
      $assetStore.removeAssets(ids);
      deselectAllAssets();
    }
  };

  const focusElement = () => {
    if (document.activeElement === document.body) {
      element.focus();
    }
  };

  $: shortcutList = (() => {
    if ($isSearchEnabled || $showAssetViewer) {
      return [];
    }

    const shortcuts: ShortcutOptions[] = [
      { shortcut: { key: 'Escape' }, onShortcut: () => dispatch('escape') },
      { shortcut: { key: '?', shift: true }, onShortcut: () => (showShortcuts = !showShortcuts) },
      { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
      { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets($assetStore, assetInteractionStore) },
      { shortcut: { key: 'PageDown' }, preventDefault: false, onShortcut: focusElement },
      { shortcut: { key: 'PageUp' }, preventDefault: false, onShortcut: focusElement },
    ];

    if ($isMultiSelectState) {
      shortcuts.push(
        { shortcut: { key: 'Delete' }, onShortcut: onDelete },
        { shortcut: { key: 'Delete', shift: true }, onShortcut: onForceDelete },
        { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
        { shortcut: { key: 's' }, onShortcut: () => onStackAssets() },
        { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
      );
    }

    return shortcuts;
  })();

  const handleSelectAsset = (asset: AssetResponseDto) => {
    if (!$assetStore.albumAssets.has(asset.id)) {
      assetInteractionStore.selectAsset(asset);
    }
  };

  function intersectedHandler(bucketDate: string) {
    queuePostScrollTask(() => {
      $assetStore.updateBucket(bucketDate, { intersecting: true });
      void $assetStore.loadBucket(bucketDate).catch(() => void 0);
    });
  }

  function seperatedHandler(bucketDate: string) {
    queuePostScrollTask(() => {
      $assetStore.updateBucket(bucketDate, { intersecting: false });
      $assetStore.getBucketByDate(bucketDate)?.cancel();
    });
  }

  const handlePrevious = async () => {
    const previousAsset = await $assetStore.getPreviousAsset($viewingAsset);

    if (previousAsset) {
      const preloadAsset = await $assetStore.getPreviousAsset(previousAsset);
      assetViewingStore.setAsset(previousAsset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: previousAsset.id });
    }

    return !!previousAsset;
  };

  const handleNext = async () => {
    const nextAsset = await $assetStore.getNextAsset($viewingAsset);

    if (nextAsset) {
      const preloadAsset = await $assetStore.getNextAsset(nextAsset);
      assetViewingStore.setAsset(nextAsset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: nextAsset.id });
    }

    return !!nextAsset;
  };

  const handleClose = async ({ detail: { asset } }: { detail: { asset: AssetResponseDto } }) => {
    showSkeleton = true;
    assetViewingStore.showAssetViewer(false);
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  const handleAction = async (action: AssetAction, asset: AssetResponseDto) => {
    switch (action) {
      case removeAction:
      case AssetAction.TRASH:
      case AssetAction.RESTORE:
      case AssetAction.DELETE: {
        // find the next asset to show or close the viewer
        (await handleNext()) || (await handlePrevious()) || (await handleClose({ detail: { asset } }));

        // delete after find the next one
        $assetStore.removeAssets([asset.id]);
        break;
      }

      case AssetAction.ARCHIVE:
      case AssetAction.UNARCHIVE:
      case AssetAction.FAVORITE:
      case AssetAction.UNFAVORITE: {
        $assetStore.updateAssets([asset]);
        break;
      }

      case AssetAction.ADD: {
        $assetStore.addAssets([asset]);
        break;
      }
    }
  };

  let lastAssetMouseEvent: AssetResponseDto | null = null;

  $: if (!lastAssetMouseEvent) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  let shiftKeyIsDown = false;

  const deselectAllAssets = () => {
    $isSelectingAllAssets = false;
    assetInteractionStore.clearMultiselect();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  $: if (!shiftKeyIsDown) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  $: if (shiftKeyIsDown && lastAssetMouseEvent) {
    selectAssetCandidates(lastAssetMouseEvent);
  }

  const handleSelectAssetCandidates = (asset: AssetResponseDto | null) => {
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleGroupSelect = (group: string, assets: AssetResponseDto[]) => {
    if ($selectedGroup.has(group)) {
      assetInteractionStore.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteractionStore.removeAssetFromMultiselectGroup(asset);
      }
    } else {
      assetInteractionStore.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        handleSelectAsset(asset);
      }
    }
  };

  const handleSelectAssets = async (asset: AssetResponseDto) => {
    if (!asset) {
      return;
    }

    dispatch('select', asset);

    if (singleSelect) {
      element.scrollTop = 0;
      return;
    }

    const rangeSelection = $assetSelectionCandidates.size > 0;
    const deselect = $selectedAssets.has(asset);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of $assetSelectionCandidates || []) {
        assetInteractionStore.removeAssetFromMultiselectGroup(candidate);
      }
      assetInteractionStore.removeAssetFromMultiselectGroup(asset);
    } else {
      for (const candidate of $assetSelectionCandidates || []) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteractionStore.clearAssetSelectionCandidates();

    if ($assetSelectionStart && rangeSelection) {
      let startBucketIndex = $assetStore.getBucketIndexByAssetId($assetSelectionStart.id);
      let endBucketIndex = $assetStore.getBucketIndexByAssetId(asset.id);

      if (startBucketIndex === null || endBucketIndex === null) {
        return;
      }

      if (endBucketIndex < startBucketIndex) {
        [startBucketIndex, endBucketIndex] = [endBucketIndex, startBucketIndex];
      }

      // Select/deselect assets in all intermediate buckets
      for (let bucketIndex = startBucketIndex + 1; bucketIndex < endBucketIndex; bucketIndex++) {
        const bucket = $assetStore.buckets[bucketIndex];
        await $assetStore.loadBucket(bucket.bucketDate);
        for (const asset of bucket.assets) {
          if (deselect) {
            assetInteractionStore.removeAssetFromMultiselectGroup(asset);
          } else {
            handleSelectAsset(asset);
          }
        }
      }

      // Update date group selection
      for (let bucketIndex = startBucketIndex; bucketIndex <= endBucketIndex; bucketIndex++) {
        const bucket = $assetStore.buckets[bucketIndex];

        // Split bucket into date groups and check each group
        const assetsGroupByDate = splitBucketIntoDateGroups(bucket, $locale);
        for (const dateGroup of assetsGroupByDate) {
          const dateGroupTitle = formatGroupTitle(dateGroup.date);
          if (dateGroup.assets.every((a) => $selectedAssets.has(a))) {
            assetInteractionStore.addGroupToMultiselectGroup(dateGroupTitle);
          } else {
            assetInteractionStore.removeGroupFromMultiselectGroup(dateGroupTitle);
          }
        }
      }
    }

    assetInteractionStore.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = (asset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const rangeStart = $assetSelectionStart;
    if (!rangeStart) {
      return;
    }

    let start = $assetStore.assets.indexOf(rangeStart);
    let end = $assetStore.assets.indexOf(asset);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteractionStore.setAssetSelectionCandidates($assetStore.assets.slice(start, end + 1));
  };

  const onSelectStart = (e: Event) => {
    if ($isMultiSelectState && shiftKeyIsDown) {
      e.preventDefault();
    }
  };

  function created(e: HTMLElement, createFn) {
    createFn(e);
  }
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} on:selectstart={onSelectStart} use:shortcuts={shortcutList} />

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={idsSelectedAssets.length}
    on:cancel={() => (isShowDeleteConfirmation = false)}
    on:confirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if showShortcuts}
  <ShowShortcuts on:close={() => (showShortcuts = !showShortcuts)} />
{/if}

<Scrollbar
  invisible={showSkeleton}
  {assetStore}
  height={safeViewport.height}
  {timelineY}
  on:scrollTimeline={handleScrollTimeline}
/>

<!-- Right margin MUST be equal to the width of immich-scrubbable-scrollbar -->
<section
  id="asset-grid"
  class="scrollbar-hidden h-full overflow-y-auto outline-none {isEmpty ? 'm-0' : 'ml-4 tall:ml-0 mr-[60px]'}"
  tabindex="-1"
  use:resizeObserver={({ height, width }) => ((viewport.width = width), (viewport.height = height))}
  bind:this={element}
  on:scroll={() => (($lastScrollTime = Date.now()), handleTimelineScroll())}
>
  {#if element}
    <div class:invisible={showSkeleton}>
      <slot />
      {#if isEmpty}
        <!-- (optional) empty placeholder -->
        <slot name="empty" />
      {/if}
    </div>

    <section
      bind:this={timelineElement}
      id="virtual-timeline"
      class:invisible={showSkeleton}
      style:height={$assetStore.timelineHeight + 'px'}
    >
      {#each $assetStore.buckets as bucket (bucket.bucketDate)}
        {@const isPremeasure = preMeasure.includes(bucket)}
        {@const display = bucket.intersecting || bucket === $assetStore.pendingScrollBucket || isPremeasure}
        <div
          id="buck"
          use:intersectionObserver={{
            onIntersect: () => intersectedHandler(bucket.bucketDate),
            onSeparate: () => seperatedHandler(bucket.bucketDate),
            top: TUNABLES.BUCKET.INTERSECTION_ROOT_TOP,
            bottom: TUNABLES.BUCKET.INTERSECTION_ROOT_BOTTOM,
            root: element,
          }}
          data-bucket-date={bucket.bucketDate}
          style:height={bucket.bucketHeight + 'px'}
        >
          {#key bucket}
            {#if display && !bucket.measured}
              <section
                id="measure-asset-group-by-date"
                class="flex flex-wrap gap-x-12"
                use:created={async (e) => {
                  try {
                    await bucket.complete;
                    const t1 = Date.now();
                    let heightPending = bucket.dateGroups.some((group) => !group.heightActual);
                    if (heightPending) {
                      const listener = (bucketnotify, kind, dateGroup) => {
                        if (bucketnotify === bucket && kind === 'height') {
                          heightPending = bucket.dateGroups.some((group) => !group.heightActual);
                          if (!heightPending) {
                            const height = e.getBoundingClientRect().height;
                            if (height !== 0) {
                              $assetStore.updateBucket(bucket.bucketDate, { height: height, measured: true });
                            }

                            preMeasure = preMeasure.filter((b) => b !== bucket);
                            $assetStore.removeListener(listener);
                            const t2 = Date.now();
                            console.log(t2 - t1);
                          }
                        }
                      };
                      assetStore.addListener(listener);
                    }
                  } catch {
                    // ignore if complete rejects (canceled load)
                  }
                }}
              >
                {#each bucket.dateGroups as dateGroup (dateGroup.date)}
                  <div id="date-group" data-display={display} data-date-group={dateGroup.date}>
                    <div
                      use:resizeObserver={({ height }) =>
                        $assetStore.updateBucketDateGroup(bucket, dateGroup, { height: height })}
                    >
                      <div
                        class="flex z-[100] sticky top-[-1px] pt-7 pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
                        style:width={dateGroup.geometry.containerWidth + 'px'}
                      >
                        <span class="w-full truncate first-letter:capitalize">
                          {dateGroup.groupTitle}
                        </span>
                      </div>

                      <div
                        class="relative overflow-clip"
                        style:height={dateGroup.geometry.containerHeight + 'px'}
                        style:width={dateGroup.geometry.containerWidth + 'px'}
                        style:background-color={'white'}
                      ></div>
                    </div>
                  </div>
                {/each}
              </section>
            {/if}
          {/key}
          {#if !display || !bucket.measured}
            <Skeleton height={bucket.bucketHeight + 'px'} title={`${bucket.bucketDateFormattted}`} />
          {/if}
          {#if display && bucket.measured}
            <AssetDateGroup
              assetGridElement={element}
              renderThumbsAtTopMargin={TUNABLES.THUMBNAIL.INTERSECTION_ROOT_TOP}
              renderThumbsAtBottomMargin={TUNABLES.THUMBNAIL.INTERSECTION_ROOT_BOTTOM}
              {withStacked}
              {showArchiveIcon}
              {assetStore}
              {assetInteractionStore}
              {isSelectionMode}
              {singleSelect}
              {onScrollTarget}
              {onAssetInGrid}
              {bucket}
              viewport={safeViewport}
              on:select={({ detail: group }) => handleGroupSelect(group.title, group.assets)}
              on:selectAssetCandidates={({ detail: asset }) => handleSelectAssetCandidates(asset)}
              on:selectAssets={({ detail: asset }) => handleSelectAssets(asset)}
            />
          {/if}
        </div>
      {/each}
      <div class="h-[60px]"></div>
    </section>
  {/if}
</section>

<Portal target="body">
  {#if $showAssetViewer}
    {#await import('../asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
      <AssetViewer
        {withStacked}
        {assetStore}
        asset={$viewingAsset}
        preloadAssets={$preloadAssets}
        {isShared}
        {album}
        on:previous={handlePrevious}
        on:next={handleNext}
        on:close={handleClose}
        on:action={({ detail: action }) => handleAction(action.type, action.asset)}
      />
    {/await}
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: strict;
    scrollbar-width: none;
  }
</style>
