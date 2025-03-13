<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetBucket, AssetStore, type BucketListener, type ViewportXY } from '$lib/stores/assets-store.svelte';
  import { locale, showDeleteModal } from '$lib/stores/preferences.store';
  import { isSearchEnabled } from '$lib/stores/search.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import {
    formatGroupTitle,
    splitBucketIntoDateGroups,
    type ScrubberListener,
    type ScrollTargetListener,
  } from '$lib/utils/timeline-util';
  import { TUNABLES } from '$lib/utils/tunables';
  import type { AlbumResponseDto, AssetResponseDto, PersonResponseDto } from '@immich/sdk';
  import { throttle } from 'lodash-es';
  import { onDestroy, onMount, type Snippet } from 'svelte';
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
  import { isTimelineScrolling } from '$lib/stores/timeline.store';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    assetStore: AssetStore;
    assetInteraction: AssetInteraction;
    removeAction?: AssetAction.UNARCHIVE | AssetAction.ARCHIVE | AssetAction.FAVORITE | AssetAction.UNFAVORITE | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onSelect?: (asset: AssetResponseDto) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    assetStore = $bindable(),
    assetInteraction,
    removeAction = null,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
  }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, preloadAssets, gridScrollTarget } = assetViewingStore;

  const viewport: ViewportXY = $state({ width: 0, height: 0, x: 0, y: 0 });
  const safeViewport: ViewportXY = $state({ width: 0, height: 0, x: 0, y: 0 });

  const componentId = generateId();
  let element: HTMLElement | undefined = $state();
  let timelineElement: HTMLElement | undefined = $state();
  let showShortcuts = $state(false);
  let showSkeleton = $state(true);
  let internalScroll = false;
  let navigating = false;
  let preMeasure: AssetBucket[] = $state([]);
  let lastIntersectedBucketDate: string | undefined;
  let scrubBucketPercent = $state(0);
  let scrubBucket: { bucketDate: string | undefined } | undefined = $state();
  let scrubOverallPercent: number = $state(0);
  let topSectionHeight = $state(0);
  let topSectionOffset = $state(0);
  // 60 is the bottom spacer element at 60px
  let bottomSectionHeight = 60;
  let leadout = $state(false);

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
      void assetStore.scheduleScrollToAssetId($gridScrollTarget, () => {
        element?.scrollTo({ top: 0 });
        showSkeleton = false;
      });
    } else {
      element?.scrollTo({ top: 0 });
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
            void assetStore.updateViewport(safeViewport, true);
            const asset = $page.url.searchParams.get('at');
            if (asset) {
              $gridScrollTarget = { at: asset };
              void navigate(
                { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
                { replaceState: true, forceNavigate: true },
              );
            } else {
              element?.scrollTo({ top: 0 });
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

  const scrollTolastIntersectedBucket = (adjustedBucket: AssetBucket, delta: number) => {
    if (lastIntersectedBucketDate) {
      const currentIndex = assetStore.buckets.findIndex((b) => b.bucketDate === lastIntersectedBucketDate);
      const deltaIndex = assetStore.buckets.indexOf(adjustedBucket);

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
    void assetStore
      .init({ bucketListener })
      .then(() => (assetStore.connect(), assetStore.updateViewport(safeViewport)));
    if (!enableRouting) {
      showSkeleton = false;
    }
    const dispose = hmrSupport();
    return () => {
      assetStore.disconnect();
      assetStore.destroy();
      dispose();
    };
  });

  const _updateViewport = () => void assetStore.updateViewport(safeViewport);
  const updateViewport = throttle(_updateViewport, 16);

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

  const getMaxScrollPercent = () =>
    (assetStore.timelineHeight + bottomSectionHeight + topSectionHeight - safeViewport.height) /
    (assetStore.timelineHeight + bottomSectionHeight + topSectionHeight);

  const getMaxScroll = () => {
    if (!element || !timelineElement) {
      return 0;
    }

    return topSectionHeight + bottomSectionHeight + (timelineElement.clientHeight - element.clientHeight);
  };

  const scrollToBucketAndOffset = (bucket: AssetBucket, bucketScrollPercent: number) => {
    const topOffset = getOffset(bucket.bucketDate) + topSectionHeight + topSectionOffset;
    const maxScrollPercent = getMaxScrollPercent();
    const delta = bucket.bucketHeight * bucketScrollPercent;
    const scrollTop = (topOffset + delta) * maxScrollPercent;

    if (!element) {
      return;
    }

    element.scrollTop = scrollTop;
  };

  const _onScrub: ScrubberListener = (
    bucketDate: string | undefined,
    scrollPercent: number,
    bucketScrollPercent: number,
  ) => {
    if (!bucketDate || assetStore.timelineHeight < safeViewport.height * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead

      const maxScroll = getMaxScroll();
      const offset = maxScroll * scrollPercent;

      if (!element) {
        return;
      }

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
    if (!bucketDate || assetStore.timelineHeight < safeViewport.height * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      return;
    }
    const bucket = assetStore.buckets.find((b) => b.bucketDate === bucketDate);
    if (!bucket) {
      return;
    }
    if (bucket && !bucket.measured) {
      preMeasure.push(bucket);
      await assetStore.loadBucket(bucketDate, { preventCancel: true, pending: true });
      await bucket.measuredPromise;
      scrollToBucketAndOffset(bucket, bucketScrollPercent);
    }
  };

  let scrollObserverTimer: NodeJS.Timeout;

  const _handleTimelineScroll = () => {
    $isTimelineScrolling = true;
    if (scrollObserverTimer) {
      clearTimeout(scrollObserverTimer);
    }
    scrollObserverTimer = setTimeout(() => {
      $isTimelineScrolling = false;
    }, 1000);

    leadout = false;

    if (!element) {
      return;
    }

    if (assetStore.timelineHeight < safeViewport.height * 2) {
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
    element?.scrollTo({ top: offset });
    if (!bucket.measured) {
      preMeasure.push(bucket);
    }
    showSkeleton = false;
    assetStore.clearPendingScroll();
    // set intersecting true manually here, to reduce flicker that happens when
    // clearing pending scroll, but the intersection observer hadn't yet had time to run
    assetStore.updateBucket(bucket.bucketDate, { intersecting: true });
  };

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(!(isTrashEnabled && !force), (assetIds) => assetStore.removeAssets(assetIds), idsSelectedAssets);
    assetInteraction.clearMultiselect();
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

  const onStackAssets = async () => {
    const ids = await stackAssets(assetInteraction.selectedAssetsArray);
    if (ids) {
      assetStore.removeAssets(ids);
      onEscape();
    }
  };

  const toggleArchive = async () => {
    const ids = await archiveAssets(assetInteraction.selectedAssetsArray, !assetInteraction.isAllArchived);
    if (ids) {
      assetStore.removeAssets(ids);
      deselectAllAssets();
    }
  };

  const focusElement = () => {
    if (document.activeElement === document.body) {
      element?.focus();
    }
  };

  const handleSelectAsset = (asset: AssetResponseDto) => {
    if (!assetStore.albumAssets.has(asset.id)) {
      assetInteraction.selectAsset(asset);
    }
  };

  function handleIntersect(bucket: AssetBucket) {
    // updateLastIntersectedBucketDate();
    const task = () => {
      assetStore.updateBucket(bucket.bucketDate, { intersecting: true });
      void assetStore.loadBucket(bucket.bucketDate);
    };
    assetStore.taskManager.intersectedBucket(componentId, bucket, task);
  }

  function handleSeparate(bucket: AssetBucket) {
    const task = () => {
      assetStore.updateBucket(bucket.bucketDate, { intersecting: false });
      bucket.cancel();
    };
    assetStore.taskManager.separatedBucket(componentId, bucket, task);
  }

  const handlePrevious = async () => {
    const previousAsset = await assetStore.getPreviousAsset($viewingAsset);

    if (previousAsset) {
      const preloadAsset = await assetStore.getPreviousAsset(previousAsset);
      assetViewingStore.setAsset(previousAsset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: previousAsset.id });
    }

    return !!previousAsset;
  };

  const handleNext = async () => {
    const nextAsset = await assetStore.getNextAsset($viewingAsset);

    if (nextAsset) {
      const preloadAsset = await assetStore.getNextAsset(nextAsset);
      assetViewingStore.setAsset(nextAsset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: nextAsset.id });
    }

    return !!nextAsset;
  };

  const handleRandom = async () => {
    const randomAsset = await assetStore.getRandomAsset();

    if (randomAsset) {
      const preloadAsset = await assetStore.getNextAsset(randomAsset);
      assetViewingStore.setAsset(randomAsset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: randomAsset.id });
    }

    return randomAsset;
  };

  const handleClose = async ({ asset }: { asset: AssetResponseDto }) => {
    assetViewingStore.showAssetViewer(false);
    showSkeleton = true;
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  const handlePreAction = async (action: Action) => {
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
    }
  };
  const handleAction = (action: Action) => {
    switch (action.type) {
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

  let lastAssetMouseEvent: AssetResponseDto | null = $state(null);

  let shiftKeyIsDown = $state(false);

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
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

  const handleSelectAssetCandidates = (asset: AssetResponseDto | null) => {
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleGroupSelect = (group: string, assets: AssetResponseDto[]) => {
    if (assetInteraction.selectedGroup.has(group)) {
      assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(asset);
      }
    } else {
      assetInteraction.addGroupToMultiselectGroup(group);
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

    if (singleSelect && element) {
      element.scrollTop = 0;
      return;
    }

    const rangeSelection = assetInteraction.assetSelectionCandidates.size > 0;
    const deselect = assetInteraction.selectedAssets.has(asset);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();

    if (assetInteraction.assetSelectionStart && rangeSelection) {
      let startBucketIndex = assetStore.getBucketIndexByAssetId(assetInteraction.assetSelectionStart.id);
      let endBucketIndex = assetStore.getBucketIndexByAssetId(asset.id);

      if (startBucketIndex === null || endBucketIndex === null) {
        return;
      }

      if (endBucketIndex < startBucketIndex) {
        [startBucketIndex, endBucketIndex] = [endBucketIndex, startBucketIndex];
      }

      // Select/deselect assets in all intermediate buckets
      for (let bucketIndex = startBucketIndex + 1; bucketIndex < endBucketIndex; bucketIndex++) {
        const bucket = assetStore.buckets[bucketIndex];
        await assetStore.loadBucket(bucket.bucketDate);
        for (const asset of bucket.assets) {
          if (deselect) {
            assetInteraction.removeAssetFromMultiselectGroup(asset);
          } else {
            handleSelectAsset(asset);
          }
        }
      }

      // Update date group selection
      for (let bucketIndex = startBucketIndex; bucketIndex <= endBucketIndex; bucketIndex++) {
        const bucket = assetStore.buckets[bucketIndex];

        // Split bucket into date groups and check each group
        const assetsGroupByDate = splitBucketIntoDateGroups(bucket, $locale);
        for (const dateGroup of assetsGroupByDate) {
          const dateGroupTitle = formatGroupTitle(dateGroup.date);
          if (dateGroup.assets.every((a) => assetInteraction.selectedAssets.has(a))) {
            assetInteraction.addGroupToMultiselectGroup(dateGroupTitle);
          } else {
            assetInteraction.removeGroupFromMultiselectGroup(dateGroupTitle);
          }
        }
      }
    }

    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = (endAsset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    let start = assetStore.assets.findIndex((a) => a.id === startAsset.id);
    let end = assetStore.assets.findIndex((a) => a.id === endAsset.id);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteraction.setAssetSelectionCandidates(assetStore.assets.slice(start, end + 1));
  };

  const onSelectStart = (e: Event) => {
    if (assetInteraction.selectionActive && shiftKeyIsDown) {
      e.preventDefault();
    }
  };

  const focusNextAsset = async () => {
    if (assetInteraction.focussedAssetId === null) {
      const firstAsset = assetStore.getFirstAsset();
      if (firstAsset !== null) {
        assetInteraction.focussedAssetId = firstAsset.id;
      }
    } else {
      const focussedAsset = assetStore.assets.find((asset) => asset.id === assetInteraction.focussedAssetId);
      if (focussedAsset) {
        const nextAsset = await assetStore.getNextAsset(focussedAsset);
        if (nextAsset !== null) {
          assetInteraction.focussedAssetId = nextAsset.id;
        }
      }
    }
  };

  const focusPreviousAsset = async () => {
    if (assetInteraction.focussedAssetId !== null) {
      const focussedAsset = assetStore.assets.find((asset) => asset.id === assetInteraction.focussedAssetId);
      if (focussedAsset) {
        const previousAsset = await assetStore.getPreviousAsset(focussedAsset);
        if (previousAsset) {
          assetInteraction.focussedAssetId = previousAsset.id;
        }
      }
    }
  };

  onDestroy(() => {
    assetStore.taskManager.removeAllTasksForComponent(componentId);
  });
  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  let isEmpty = $derived(assetStore.initialized && assetStore.buckets.length === 0);
  let idsSelectedAssets = $derived(assetInteraction.selectedAssetsArray.map(({ id }) => id));

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  $effect(() => {
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
  });

  let shortcutList = $derived(
    (() => {
      if ($isSearchEnabled || $showAssetViewer) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: 'Escape' }, onShortcut: onEscape },
        { shortcut: { key: '?', shift: true }, onShortcut: () => (showShortcuts = !showShortcuts) },
        { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets(assetStore, assetInteraction) },
        { shortcut: { key: 'PageDown' }, preventDefault: false, onShortcut: focusElement },
        { shortcut: { key: 'PageUp' }, preventDefault: false, onShortcut: focusElement },
        { shortcut: { key: 'ArrowRight' }, preventDefault: false, onShortcut: focusNextAsset },
        { shortcut: { key: 'ArrowLeft' }, preventDefault: false, onShortcut: focusPreviousAsset },
      ];

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: onForceDelete },
          { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
          { shortcut: { key: 's' }, onShortcut: () => onStackAssets() },
          { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
        );
      }

      return shortcuts;
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
  onscroll={() => ((assetStore.lastScrollTime = Date.now()), handleTimelineScroll())}
>
  <section
    use:resizeObserver={({ target, height }) => ((topSectionHeight = height), (topSectionOffset = target.offsetTop))}
    class:invisible={showSkeleton}
  >
    {@render children?.()}
    {#if isEmpty}
      <!-- (optional) empty placeholder -->
      {@render empty?.()}
    {/if}
  </section>

  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible={showSkeleton}
    style:height={assetStore.timelineHeight + 'px'}
  >
    {#each assetStore.buckets as bucket (bucket.viewId)}
      {@const isPremeasure = preMeasure.includes(bucket)}
      {@const display = bucket.intersecting || bucket === assetStore.pendingScrollBucket || isPremeasure}

      <div
        class="bucket"
        style:overflow={bucket.measured ? 'visible' : 'clip'}
        use:intersectionObserver={[
          {
            key: bucket.viewId,
            onIntersect: () => handleIntersect(bucket),
            onSeparate: () => handleSeparate(bucket),
            top: BUCKET_INTERSECTION_ROOT_TOP,
            bottom: BUCKET_INTERSECTION_ROOT_BOTTOM,
            root: element,
          },
          {
            key: bucket.viewId + '.bucketintersection',
            onIntersect: () => (lastIntersectedBucketDate = bucket.bucketDate),
            top: '0px',
            bottom: '-' + Math.max(0, safeViewport.height - 1) + 'px',
            left: '0px',
            right: '0px',
          },
        ]}
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
            {assetInteraction}
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
        asset={$viewingAsset}
        preloadAssets={$preloadAssets}
        {isShared}
        {album}
        {person}
        preAction={handlePreAction}
        onAction={handleAction}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onRandom={handleRandom}
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

  .bucket {
    contain: layout size;
  }
</style>
