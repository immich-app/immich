<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { resizeObserver } from '$lib/actions/resize-observer';
  import { AppRoute, AssetAction } from '$lib/constants';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetBucket, AssetStore, isSelectingAllAssets, type Viewport } from '$lib/stores/assets.store';
  import { locale, showDeleteModal } from '$lib/stores/preferences.store';
  import { isSearchEnabled } from '$lib/stores/search.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { deleteAssets } from '$lib/utils/actions';
  import { type ShortcutOptions, shortcuts } from '$lib/actions/shortcut';
  import { formatGroupTitle, splitBucketIntoDateGroups } from '$lib/utils/timeline-util';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { afterUpdate, beforeUpdate, createEventDispatcher, onMount } from 'svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrollbar from '../shared-components/scrollbar/scrollbar.svelte';
  import ShowShortcuts from '../shared-components/show-shortcuts.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import { archiveAssets, stackAssets } from '$lib/utils/asset-utils';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { selectAllAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { page } from '$app/stores';
  import { throttle } from 'lodash-es';
  import Skeleton from '$lib/components/photos-page/skeleton.svelte';
  import { intersectionObserver } from '$lib/actions/intersection-observer';

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
  const viewport: Viewport = { width: 0, height: 0 };
  const safeViewport: Viewport = { width: 0, height: 0 };
  let { isViewing: showAssetViewer, asset: viewingAsset, preloadAssets, gridScrollTarget } = assetViewingStore;

  let element: HTMLElement;
  let timelineElement: HTMLElement;
  let showShortcuts = false;
  let showSkeleton = true;
  let internalScroll = false;
  let navigating = false;
  let intersectingBucketElement: HTMLElement;

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
    }
    if (!isViewportOrigin() && !isEqual(viewport, safeViewport)) {
      safeViewport.height = viewport.height;
      safeViewport.width = viewport.width;
      void $assetStore.updateViewport(safeViewport);
    }
  }
  const dispatch = createEventDispatcher<{ select: AssetResponseDto; escape: void }>();

  const isViewportOrigin = () => {
    return viewport.height === 0 && viewport.width === 0;
  };

  const isEqual = (a: Viewport, b: Viewport) => {
    return a.height == b.height && a.width == b.width;
  };

  const completeNav = () => {
    navigating = false;
    if (internalScroll) {
      internalScroll = false;
      return;
    }
    void $assetStore.scheduleScrollToAssetId($gridScrollTarget);
    $gridScrollTarget?.at ? void 0 : (element.scrollTo({ top: 0 }), (showSkeleton = false));
  };

  afterNavigate(({ complete }) => {
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
      const afterApdate = () => {
        const asset = $page.url.searchParams.get('at');
        $gridScrollTarget = { at: asset };
        completeNav();
      };
      import.meta.hot?.on('vite:afterUpdate', afterApdate);
      return () => import.meta.hot?.off('vite:afterUpdate', afterApdate);
    }
    return () => void 0;
  };

  const loading = new Set();
  const bucketListener = (bucket: AssetBucket, kind: 'load' | 'cancel') => {
    if (kind === 'load') {
      loading.add(bucket);
      setIntersectingBucketElement();
    } else {
      console.log('delete!', bucket.bucketDateFormattted);
      loading.delete(bucket);
    }
  };

  onMount(() => {
    if ($assetStore.initialized) {
      showSkeleton = false;
    } else {
      $assetStore.connect();
      void $assetStore.init({ bucketListener }).then(() => $assetStore.updateViewport(safeViewport));
    }
    if (!participatesInRouting) {
      showSkeleton = false;
    }
    element.scrollTo({ top: 0 });
    const dispose = hmrSupport();
    return () => {
      $assetStore.disconnect();
      dispose();
    };
  });

  const _handleScrollTimeline = ({ detail }: { detail: number }) => {
    element.scrollTop = detail;
  };
  const handleScrollTimeline = throttle(_handleScrollTimeline, 16);

  const _handleTimelineScroll = () => {
    timelineY = element?.scrollTop || 0;
  };
  const handleTimelineScroll = throttle(_handleTimelineScroll, 16);

  const onAssetInGrid = async (asset: AssetResponseDto) => {
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

  const onScrollTarget = ({ bucket, offset }: { bucket: AssetBucket; offset: number }) => {
    element.scrollTo({ top: offset });
    $assetStore.clearPendingScroll();
    showSkeleton = false;

    const bucketElement = document.querySelector('[data-bucket-date="' + bucket.bucketDate + '"]');
    // Needed to set intersectingBucketElement here, because setIntersectingBucketElement()
    // may not have been called yet
    intersectingBucketElement = bucketElement as HTMLElement;
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

  const setIntersectingBucketElement = () => {
    let element = document.elementFromPoint(272, 80.5);
    while (element) {
      if (element.id === 'buck') {
        intersectingBucketElement = element as HTMLElement;
        break;
      }
      element = element.parentElement;
    }
  };

  function onBucketHeight(bucket: AssetBucket, actualBucketHeight: number) {
    if (actualBucketHeight <= 0) {
      return;
    }
    // this is in resize listener we are listening to DOM changes here, this is before the component updates the DOM, but after the load of a bucket.
    // this is a good place to maintain any scroll positions

    // find out if  bucket param is above the current intersectingBucketElement
    if (intersectingBucketElement) {
      const buckets = $assetStore.buckets;
      const buckIdx = buckets.indexOf(bucket);
      const currentIdx = buckets.findIndex((b) => b.bucketDate === intersectingBucketElement.dataset.bucketDate);

      if (buckIdx < currentIdx) {
        const { delta } = $assetStore.updateBucket(bucket.bucketDate, { height: actualBucketHeight });
        if (delta) {
          element.scrollBy(0, delta);
        }
        return;
      }
    }
    $assetStore.updateBucket(bucket.bucketDate, { height: actualBucketHeight });
  }

  function intersectedHandler(bucketDate: string) {
    $assetStore.updateBucket(bucketDate, { intersecting: true });
    void $assetStore.loadBucket(bucketDate);
  }

  function seperatedHandler(bucketDate: string) {
    $assetStore.updateBucket(bucketDate, { intersecting: false });
    $assetStore.getBucketByDate(bucketDate)?.cancel();
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
        const assetsGroupByDate = splitBucketIntoDateGroups(bucket.assets, $locale);

        for (const dateGroup of assetsGroupByDate) {
          const dateGroupTitle = formatGroupTitle(DateTime.fromISO(dateGroup[0].fileCreatedAt).startOf('day'));
          if (dateGroup.every((a) => $selectedAssets.has(a))) {
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
  class="scrollbar-hidden h-full overflow-y-auto outline-none pb-[60px] {isEmpty ? 'm-0' : 'ml-4 tall:ml-0 mr-[60px]'}"
  tabindex="-1"
  use:resizeObserver={({ height, width }) => ((viewport.width = width), (viewport.height = height))}
  bind:this={element}
  on:scroll={handleTimelineScroll}
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
        {@const display = bucket.intersecting || bucket === $assetStore.pendingScrollBucket}
        <div
          use:intersectionObserver={{
            onIntersect: () => intersectedHandler(bucket.bucketDate),
            onSeparate: () => seperatedHandler(bucket.bucketDate),
            top: '100%',
            bottom: '100%',
            root: element,
          }}
          data-bucket-date={bucket.bucketDate}
          data-bucket-display={display}
          style:height={bucket.bucketHeight + 'px'}
        >
          {#if !display}
            <Skeleton
              count={bucket.bucketCount}
              height={bucket.bucketHeight + 'px'}
              title={`${bucket.bucketDateFormattted}`}
            />
          {/if}
          {#if display}
            <AssetDateGroup
              assetGridElement={element}
              renderThumbsAtBottomMargin={'200%'}
              renderThumbsAtTopMargin={'200%'}
              {withStacked}
              {showArchiveIcon}
              {assetStore}
              {assetInteractionStore}
              {isSelectionMode}
              {singleSelect}
              {onScrollTarget}
              {onAssetInGrid}
              {onBucketHeight}
              {bucket}
              viewport={safeViewport}
              on:select={({ detail: group }) => handleGroupSelect(group.title, group.assets)}
              on:selectAssetCandidates={({ detail: asset }) => handleSelectAssetCandidates(asset)}
              on:selectAssets={({ detail: asset }) => handleSelectAssets(asset)}
            />
          {/if}
        </div>
      {/each}
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
    contain: layout;
    scrollbar-width: none;
  }
</style>
