<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AppRoute, AssetAction } from '$lib/constants';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import {
    AssetBucket,
    AssetStore,
    isSelectingAllAssets,
    type BucketListener,
    type ViewportXY,
  } from '$lib/stores/assets.store';
  import { locale, showDeleteModal } from '$lib/stores/preferences.store';
  import { isSearchEnabled } from '$lib/stores/search.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import {
    formatGroupTitle,
    splitBucketIntoDateGroups,
    type ScrubberListener,
    type ScrollTargetListener,
  } from '$lib/utils/timeline-util';
  import { TUNABLES } from '$lib/utils/tunables';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';
  import { throttle } from 'lodash-es';
  import { onDestroy, onMount } from 'svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrubber from '../shared-components/scrubber/scrubber.svelte';
  import ShowShortcuts from '../shared-components/show-shortcuts.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';

  import { resizeObserver } from '$lib/actions/resize-observer';
  import MeasureDateGroup from '$lib/components/photos-page/measure-date-group.svelte';
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import Skeleton from '$lib/components/photos-page/skeleton.svelte';
  import { page } from '$app/stores';
  import type { UpdatePayload } from 'vite';
  import { generateId } from '$lib/utils/generate-id';

  export let isSelectionMode = false;
  export let singleSelect = false;

  /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
   `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
   additionally, update the page location/url with the asset as the asset-grid is scrolled */
  export let enableRouting: boolean;

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;
  export let removeAction:
    | AssetAction.UNARCHIVE
    | AssetAction.ARCHIVE
    | AssetAction.FAVORITE
    | AssetAction.UNFAVORITE
    | null = null;
  export let withStacked = false;
  export let showArchiveIcon = false;
  export let isShared = false;
  export let album: AlbumResponseDto | null = null;
  export let isShowDeleteConfirmation = false;
  export let onSelect: (asset: AssetResponseDto) => void = () => {};
  export let onEscape: () => void = () => {};

  let { isViewing: showAssetViewer, asset: viewingAsset, preloadAssets, gridScrollTarget } = assetViewingStore;
  const { assetSelectionCandidates, assetSelectionStart, selectedGroup, selectedAssets, isMultiSelectState } =
    assetInteractionStore;

  const viewport: ViewportXY = { width: 0, height: 0, x: 0, y: 0 };
  const safeViewport: ViewportXY = { width: 0, height: 0, x: 0, y: 0 };

  const componentId = generateId();
  let element: HTMLElement;
  let timelineElement: HTMLElement;
  let showShortcuts = false;
  let showSkeleton = true;
  let internalScroll = false;
  let navigating = false;
  let preMeasure: AssetBucket[] = [];
  let lastIntersectedBucketDate: string | undefined;
  let scrubBucketPercent = 0;
  let scrubBucket: { bucketDate: string | undefined } | undefined;
  let scrubOverallPercent: number = 0;
  let topSectionHeight = 0;
  let topSectionOffset = 0;
  // 60 is the bottom spacer element at 60px
  let bottomSectionHeight = 60;
  let leadout = false;

  $: isTrashEnabled = $featureFlags.loaded && $featureFlags.trash;
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
  const {
    ASSET_GRID: { NAVIGATE_ON_ASSET_IN_VIEW },
    BUCKET: {
      INTERSECTION_ROOT_TOP: BUCKET_INTERSECTION_ROOT_TOP,
      INTERSECTION_ROOT_BOTTOM: BUCKET_INTERSECTION_ROOT_BOTTOM,
    },
    THUMBNAIL: {
      INTERSECTION_ROOT_TOP: THUMBNAIL_INTERSECTION_ROOT_TOP,
      INTERSECTION_ROOT_BOTTOM: THUMBNAIL_INTERSECTION_ROOT_BOTTOM,
    },
  } = TUNABLES;

  const isViewportOrigin = () => {
    return viewport.height === 0 && viewport.width === 0;
  };

  const isEqual = (a: ViewportXY, b: ViewportXY) => {
    return a.height == b.height && a.width == b.width && a.x === b.x && a.y === b.y;
  };

  const completeNav = () => {
    navigating = false;
    if (internalScroll) {
      internalScroll = false;
      return;
    }

    if ($gridScrollTarget?.at) {
      void $assetStore.scheduleScrollToAssetId($gridScrollTarget, () => {
        element.scrollTo({ top: 0 });
        showSkeleton = false;
      });
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
      const afterApdate = (payload: UpdatePayload) => {
        const assetGridUpdate = payload.updates.some(
          (update) => update.path.endsWith('asset-grid.svelte') || update.path.endsWith('assets-store.ts'),
        );

        if (assetGridUpdate) {
          setTimeout(() => {
            void $assetStore.updateViewport(safeViewport, true);
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
      if (elem.id === 'bucket') {
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

  const scrollTolastIntersectedBucket = (adjustedBucket: AssetBucket, delta: number) => {
    if (!lastIntersectedBucketDate) {
      _updateLastIntersectedBucketDate();
    }
    if (lastIntersectedBucketDate) {
      const currentIndex = $assetStore.buckets.findIndex((b) => b.bucketDate === lastIntersectedBucketDate);
      const deltaIndex = $assetStore.buckets.indexOf(adjustedBucket);

      if (deltaIndex < currentIndex) {
        element?.scrollBy(0, delta);
      }
    }
  };

  const bucketListener: BucketListener = (event) => {
    const { type } = event;
    if (type === 'bucket-height') {
      const { bucket, delta } = event;
      scrollTolastIntersectedBucket(bucket, delta);
    }
  };

  onMount(() => {
    void $assetStore
      .init({ bucketListener })
      .then(() => ($assetStore.connect(), $assetStore.updateViewport(safeViewport)));
    if (!enableRouting) {
      showSkeleton = false;
    }
    const dispose = hmrSupport();
    return () => {
      $assetStore.disconnect();
      $assetStore.destroy();
      dispose();
    };
  });

  function getOffset(bucketDate: string) {
    let offset = 0;
    for (let a = 0; a < assetStore.buckets.length; a++) {
      if (assetStore.buckets[a].bucketDate === bucketDate) {
        break;
      }
      offset += assetStore.buckets[a].bucketHeight;
    }
    return offset;
  }
  const _updateViewport = () => void $assetStore.updateViewport(safeViewport);
  const updateViewport = throttle(_updateViewport, 16);

  const getMaxScrollPercent = () =>
    ($assetStore.timelineHeight + bottomSectionHeight + topSectionHeight - safeViewport.height) /
    ($assetStore.timelineHeight + bottomSectionHeight + topSectionHeight);

  const getMaxScroll = () =>
    topSectionHeight + bottomSectionHeight + (timelineElement.clientHeight - element.clientHeight);

  const scrollToBucketAndOffset = (bucket: AssetBucket, bucketScrollPercent: number) => {
    const topOffset = getOffset(bucket.bucketDate) + topSectionHeight + topSectionOffset;
    const maxScrollPercent = getMaxScrollPercent();
    const delta = bucket.bucketHeight * bucketScrollPercent;
    const scrollTop = (topOffset + delta) * maxScrollPercent;
    element.scrollTop = scrollTop;
  };

  const _onScrub: ScrubberListener = (
    bucketDate: string | undefined,
    scrollPercent: number,
    bucketScrollPercent: number,
  ) => {
    if (!bucketDate || $assetStore.timelineHeight < safeViewport.height * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead

      const maxScroll = getMaxScroll();
      const offset = maxScroll * scrollPercent;
      element.scrollTop = offset;
    } else {
      const bucket = assetStore.buckets.find((b) => b.bucketDate === bucketDate);
      if (!bucket) {
        return;
      }
      scrollToBucketAndOffset(bucket, bucketScrollPercent);
    }
  };
  const onScrub = throttle(_onScrub, 16, { leading: false, trailing: true });

  const stopScrub: ScrubberListener = async (
    bucketDate: string | undefined,
    _scrollPercent: number,
    bucketScrollPercent: number,
  ) => {
    if (!bucketDate || $assetStore.timelineHeight < safeViewport.height * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      return;
    }
    const bucket = assetStore.buckets.find((b) => b.bucketDate === bucketDate);
    if (!bucket) {
      return;
    }
    if (bucket && !bucket.measured) {
      preMeasure.push(bucket);
      if (!bucket.loaded) {
        await assetStore.loadBucket(bucket.bucketDate);
      }
      // Wait here, and collect the deltas that are above offset, which affect offset position
      await bucket.measuredPromise;
      scrollToBucketAndOffset(bucket, bucketScrollPercent);
    }
  };

  const _handleTimelineScroll = () => {
    leadout = false;
    if ($assetStore.timelineHeight < safeViewport.height * 2) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = getMaxScroll();
      scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);

      scrubBucket = undefined;
      scrubBucketPercent = 0;
    } else {
      let top = element?.scrollTop;
      if (top < topSectionHeight) {
        // in the lead-in area
        scrubBucket = undefined;
        scrubBucketPercent = 0;
        const maxScroll = getMaxScroll();

        scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);
        return;
      }

      let maxScrollPercent = getMaxScrollPercent();
      let found = false;

      // create virtual buckets....
      const vbuckets = [
        { bucketHeight: topSectionHeight, bucketDate: undefined },
        ...assetStore.buckets,
        { bucketHeight: bottomSectionHeight, bucketDate: undefined },
      ];

      for (const bucket of vbuckets) {
        let next = top - bucket.bucketHeight * maxScrollPercent;
        if (next < 0) {
          scrubBucket = bucket;
          scrubBucketPercent = top / (bucket.bucketHeight * maxScrollPercent);
          found = true;
          break;
        }
        top = next;
      }
      if (!found) {
        leadout = true;
        scrubBucket = undefined;
        scrubBucketPercent = 0;
        scrubOverallPercent = 1;
      }
    }
  };
  const handleTimelineScroll = throttle(_handleTimelineScroll, 16, { leading: false, trailing: true });

  const _onAssetInGrid = async (asset: AssetResponseDto) => {
    if (!enableRouting || navigating || internalScroll) {
      return;
    }
    $gridScrollTarget = { at: asset.id };
    internalScroll = true;
    await navigate(
      { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
      { replaceState: true, forceNavigate: true },
    );
  };
  const onAssetInGrid = NAVIGATE_ON_ASSET_IN_VIEW
    ? throttle(_onAssetInGrid, 16, { leading: false, trailing: true })
    : () => void 0;

  const onScrollTarget: ScrollTargetListener = ({ bucket, offset }) => {
    element.scrollTo({ top: offset });
    if (!bucket.measured) {
      preMeasure.push(bucket);
    }
    showSkeleton = false;
    $assetStore.clearPendingScroll();
    // set intersecting true manually here, to reduce flicker that happens when
    // clearing pending scroll, but the intersection observer hadn't yet had time to run
    $assetStore.updateBucket(bucket.bucketDate, { intersecting: true });
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
      onEscape();
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
      { shortcut: { key: 'Escape' }, onShortcut: onEscape },
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

  function handleIntersect(bucket: AssetBucket) {
    updateLastIntersectedBucketDate();
    const task = () => {
      $assetStore.updateBucket(bucket.bucketDate, { intersecting: true });
      void $assetStore.loadBucket(bucket.bucketDate);
    };
    $assetStore.taskManager.intersectedBucket(componentId, bucket, task);
  }

  function handleSeparate(bucket: AssetBucket) {
    const task = () => {
      $assetStore.updateBucket(bucket.bucketDate, { intersecting: false });
      bucket.cancel();
    };
    $assetStore.taskManager.separatedBucket(componentId, bucket, task);
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

  const handleClose = async ({ asset }: { asset: AssetResponseDto }) => {
    assetViewingStore.showAssetViewer(false);
    showSkeleton = true;
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case removeAction:
      case AssetAction.TRASH:
      case AssetAction.RESTORE:
      case AssetAction.DELETE: {
        // find the next asset to show or close the viewer
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (await handleNext()) || (await handlePrevious()) || (await handleClose({ asset: action.asset }));

        // delete after find the next one
        assetStore.removeAssets([action.asset.id]);
        break;
      }

      case AssetAction.ARCHIVE:
      case AssetAction.UNARCHIVE:
      case AssetAction.FAVORITE:
      case AssetAction.UNFAVORITE: {
        assetStore.updateAssets([action.asset]);
        break;
      }

      case AssetAction.ADD: {
        assetStore.addAssets([action.asset]);
        break;
      }

      case AssetAction.UNSTACK: {
        assetStore.addAssets(action.assets);
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

    onSelect(asset);

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
  onDestroy(() => {
    assetStore.taskManager.removeAllTasksForComponent(componentId);
  });
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} on:selectstart={onSelectStart} use:shortcuts={shortcutList} />

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={idsSelectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if showShortcuts}
  <ShowShortcuts onClose={() => (showShortcuts = !showShortcuts)} />
{/if}
{#if assetStore.buckets.length > 0}
  <Scrubber
    invisible={showSkeleton}
    {assetStore}
    height={safeViewport.height}
    timelineTopOffset={topSectionHeight}
    timelineBottomOffset={bottomSectionHeight}
    {leadout}
    {scrubOverallPercent}
    {scrubBucketPercent}
    {scrubBucket}
    {onScrub}
    {stopScrub}
  />
{/if}

<!-- Right margin MUST be equal to the width of immich-scrubbable-scrollbar -->
<section
  id="asset-grid"
  class="scrollbar-hidden h-full overflow-y-auto outline-none {isEmpty ? 'm-0' : 'ml-4 tall:ml-0 mr-[60px]'}"
  tabindex="-1"
  use:resizeObserver={({ height, width }) => ((viewport.width = width), (viewport.height = height))}
  bind:this={element}
  on:scroll={() => ((assetStore.lastScrollTime = Date.now()), handleTimelineScroll())}
>
  <section
    use:resizeObserver={({ target, height }) => ((topSectionHeight = height), (topSectionOffset = target.offsetTop))}
    class:invisible={showSkeleton}
  >
    <slot />
    {#if isEmpty}
      <!-- (optional) empty placeholder -->
      <slot name="empty" />
    {/if}
  </section>

  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible={showSkeleton}
    style:height={$assetStore.timelineHeight + 'px'}
  >
    {#each $assetStore.buckets as bucket (bucket.viewId)}
      {@const isPremeasure = preMeasure.includes(bucket)}
      {@const display = bucket.intersecting || bucket === $assetStore.pendingScrollBucket || isPremeasure}
      <div
        id="bucket"
        use:intersectionObserver={{
          key: bucket.viewId,
          onIntersect: () => handleIntersect(bucket),
          onSeparate: () => handleSeparate(bucket),
          top: BUCKET_INTERSECTION_ROOT_TOP,
          bottom: BUCKET_INTERSECTION_ROOT_BOTTOM,
          root: element,
        }}
        data-bucket-display={bucket.intersecting}
        data-bucket-date={bucket.bucketDate}
        style:height={bucket.bucketHeight + 'px'}
      >
        {#if display && !bucket.measured}
          <MeasureDateGroup
            {bucket}
            {assetStore}
            onMeasured={() => (preMeasure = preMeasure.filter((b) => b !== bucket))}
          ></MeasureDateGroup>
        {/if}

        {#if !display || !bucket.measured}
          <Skeleton height={bucket.bucketHeight + 'px'} title={`${bucket.bucketDateFormattted}`} />
        {/if}
        {#if display && bucket.measured}
          <AssetDateGroup
            assetGridElement={element}
            renderThumbsAtTopMargin={THUMBNAIL_INTERSECTION_ROOT_TOP}
            renderThumbsAtBottomMargin={THUMBNAIL_INTERSECTION_ROOT_BOTTOM}
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
            onSelect={({ title, assets }) => handleGroupSelect(title, assets)}
            onSelectAssetCandidates={handleSelectAssetCandidates}
            onSelectAssets={handleSelectAssets}
          />
        {/if}
      </div>
    {/each}
    <div class="h-[60px]"></div>
  </section>
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
        onAction={handleAction}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClose={handleClose}
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
