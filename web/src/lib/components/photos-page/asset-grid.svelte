<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetBucket, assetsSnapshot, AssetStore, isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { type ScrubberListener } from '$lib/utils/timeline-util';
  import type { AlbumResponseDto, AssetResponseDto, PersonResponseDto } from '@immich/sdk';
  import { onMount, type Snippet } from 'svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrubber from '../shared-components/scrubber/scrubber.svelte';
  import ShowShortcuts from '../shared-components/show-shortcuts.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import Skeleton from '$lib/components/photos-page/skeleton.svelte';
  import { page } from '$app/stores';
  import type { UpdatePayload } from 'vite';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';

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

  let element: HTMLElement | undefined = $state();

  let timelineElement: HTMLElement | undefined = $state();
  let showShortcuts = $state(false);
  let showSkeleton = $state(true);
  let scrubBucketPercent = $state(0);
  let scrubBucket: { bucketDate: string | undefined } | undefined = $state();
  let scrubOverallPercent: number = $state(0);
  let scrubberWidth = $state(0);

  // 60 is the bottom spacer element at 60px
  let bottomSectionHeight = 60;
  let leadout = $state(false);

  const maxMd = $derived(mobileDevice.maxMd);
  const usingMobileDevice = $derived(mobileDevice.pointerCoarse);

  $effect(() => {
    assetStore.rowHeight = maxMd ? 100 : 235;
  });

  const scrollTo = (top: number) => {
    element?.scrollTo({ top });
    showSkeleton = false;
  };

  const scrollToTop = () => {
    scrollTo(0);
  };

  const completeNav = async () => {
    const scrollTarget = $gridScrollTarget?.at;
    if (scrollTarget) {
      try {
        const bucket = await assetStore.findBucketForAsset(scrollTarget);
        if (bucket) {
          const height = bucket.findAssetAbsolutePosition(scrollTarget);
          if (height) {
            scrollTo(height);
            assetStore.updateIntersections();
            return;
          }
        }
      } catch {
        // ignore errors - asset may not be in the store
      }
    }
    scrollToTop();
  };
  beforeNavigate(() => (assetStore.suspendTransitions = true));
  afterNavigate((nav) => {
    const { complete } = nav;
    complete.then(completeNav, completeNav);
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
            const asset = $page.url.searchParams.get('at');
            if (asset) {
              $gridScrollTarget = { at: asset };
              void navigate(
                { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
                { replaceState: true, forceNavigate: true },
              );
            } else {
              scrollToTop();
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

  const updateIsScrolling = () => (assetStore.scrolling = true);
  // note: don't throttle, debounch, or otherwise do this function async - it causes flicker
  const updateSlidingWindow = () => assetStore.updateSlidingWindow(element?.scrollTop || 0);
  const compensateScrollCallback = ({ delta, top }: { delta?: number; top?: number }) => {
    if (delta) {
      element?.scrollBy(0, delta);
    } else if (top) {
      element?.scrollTo({ top });
    }
  };
  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (assetStore.topSectionHeight = height);

  onMount(() => {
    assetStore.setCompensateScrollCallback(compensateScrollCallback);
    if (!enableRouting) {
      showSkeleton = false;
    }
    const disposeHmr = hmrSupport();
    return () => {
      assetStore.setCompensateScrollCallback();
      disposeHmr();
    };
  });

  const getMaxScrollPercent = () => {
    const totalHeight = assetStore.timelineHeight + bottomSectionHeight + assetStore.topSectionHeight;
    return (totalHeight - assetStore.viewportHeight) / totalHeight;
  };

  const getMaxScroll = () => {
    if (!element || !timelineElement) {
      return 0;
    }
    return assetStore.topSectionHeight + bottomSectionHeight + (timelineElement.clientHeight - element.clientHeight);
  };

  const scrollToBucketAndOffset = (bucket: AssetBucket, bucketScrollPercent: number) => {
    const topOffset = bucket.top;
    const maxScrollPercent = getMaxScrollPercent();
    const delta = bucket.bucketHeight * bucketScrollPercent;
    const scrollTop = (topOffset + delta) * maxScrollPercent;

    if (element) {
      element.scrollTop = scrollTop;
    }
  };

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  const onScrub: ScrubberListener = (
    bucketDate: string | undefined,
    scrollPercent: number,
    bucketScrollPercent: number,
  ) => {
    if (!bucketDate || assetStore.timelineHeight < assetStore.viewportHeight * 2) {
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

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  const handleTimelineScroll = () => {
    leadout = false;

    if (!element) {
      return;
    }

    if (assetStore.timelineHeight < assetStore.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = getMaxScroll();
      scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);

      scrubBucket = undefined;
      scrubBucketPercent = 0;
    } else {
      let top = element.scrollTop;
      if (top < assetStore.topSectionHeight) {
        // in the lead-in area
        scrubBucket = undefined;
        scrubBucketPercent = 0;
        const maxScroll = getMaxScroll();

        scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);
        return;
      }

      let maxScrollPercent = getMaxScrollPercent();
      let found = false;

      const bucketsLength = assetStore.buckets.length;
      for (let i = -1; i < bucketsLength + 1; i++) {
        let bucket: { bucketDate: string | undefined } | undefined;
        let bucketHeight = 0;
        if (i === -1) {
          // lead-in
          bucketHeight = assetStore.topSectionHeight;
        } else if (i === bucketsLength) {
          // lead-out
          bucketHeight = bottomSectionHeight;
        } else {
          bucket = assetStore.buckets[i];
          bucketHeight = assetStore.buckets[i].bucketHeight;
        }

        let next = top - bucketHeight * maxScrollPercent;
        // instead of checking for < 0, add a little wiggle room for subpixel resolution
        if (next < -1 && bucket) {
          scrubBucket = bucket;

          // allowing next to be at least 1 may cause percent to go negative, so ensure positive percentage
          scrubBucketPercent = Math.max(0, top / (bucketHeight * maxScrollPercent));

          // compensate for lost precision/rouding errors advance to the next bucket, if present
          if (scrubBucketPercent > 0.9999 && i + 1 < bucketsLength - 1) {
            scrubBucket = assetStore.buckets[i + 1];
            scrubBucketPercent = 0;
          }

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

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(!(isTrashEnabled && !force), (assetIds) => assetStore.removeAssets(assetIds), idsSelectedAssets);
    assetInteraction.clearMultiselect();
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

  const onStackAssets = async () => {
    const result = await stackAssets(assetInteraction.selectedAssets);

    updateStackedAssetInTimeline(assetStore, result);

    onEscape();
  };

  const toggleArchive = async () => {
    await archiveAssets(assetInteraction.selectedAssets, !assetInteraction.isAllArchived);
    assetStore.updateAssets(assetInteraction.selectedAssets);
    deselectAllAssets();
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
      case AssetAction.DELETE:
      case AssetAction.ARCHIVE: {
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
        updateUnstackedAssetInTimeline(assetStore, action.assets);
      }
    }
  };

  let lastAssetMouseEvent: AssetResponseDto | null = $state(null);

  let shiftKeyIsDown = $state(false);

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
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

  const handleGroupSelect = (assetStore: AssetStore, group: string, assets: AssetResponseDto[]) => {
    if (assetInteraction.selectedGroup.has(group)) {
      assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(asset.id);
      }
    } else {
      assetInteraction.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        handleSelectAsset(asset);
      }
    }

    if (assetStore.getAssets().length == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
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

    const rangeSelection = assetInteraction.assetSelectionCandidates.length > 0;
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();

    if (assetInteraction.assetSelectionStart && rangeSelection) {
      let startBucket = assetStore.getBucketIndexByAssetId(assetInteraction.assetSelectionStart.id);
      let endBucket = assetStore.getBucketIndexByAssetId(asset.id);

      if (startBucket === null || endBucket === null) {
        return;
      }

      // Select/deselect assets in range (start,end]
      let started = false;
      for (const bucket of assetStore.buckets) {
        if (bucket === startBucket) {
          started = true;
        }
        if (bucket === endBucket) {
          break;
        }
        if (started) {
          await assetStore.loadBucket(bucket.bucketDate);
          for (const asset of bucket.getAssets()) {
            if (deselect) {
              assetInteraction.removeAssetFromMultiselectGroup(asset.id);
            } else {
              handleSelectAsset(asset);
            }
          }
        }
      }

      // Update date group selection
      started = false;
      for (const bucket of assetStore.buckets) {
        if (bucket === startBucket) {
          started = true;
        }
        if (bucket === endBucket) {
          break;
        }

        // Split bucket into date groups and check each group
        for (const dateGroup of bucket.dateGroups) {
          const dateGroupTitle = dateGroup.groupTitle;
          if (dateGroup.getAssets().every((a) => assetInteraction.hasSelectedAsset(a.id))) {
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

    const assets = assetsSnapshot(assetStore.getAssets());

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

  const focusNextAsset = async () => {
    if (assetInteraction.focussedAssetId === null) {
      const firstAsset = assetStore.getFirstAsset();
      if (firstAsset) {
        assetInteraction.focussedAssetId = firstAsset.id;
      }
    } else {
      const focussedAsset = assetStore.getAssets().find((asset) => asset.id === assetInteraction.focussedAssetId);
      if (focussedAsset) {
        const nextAsset = await assetStore.getNextAsset(focussedAsset);
        if (nextAsset) {
          assetInteraction.focussedAssetId = nextAsset.id;
        }
      }
    }
  };

  const focusPreviousAsset = async () => {
    if (assetInteraction.focussedAssetId !== null) {
      const focussedAsset = assetStore.getAssets().find((asset) => asset.id === assetInteraction.focussedAssetId);
      if (focussedAsset) {
        const previousAsset = await assetStore.getPreviousAsset(focussedAsset);
        if (previousAsset) {
          assetInteraction.focussedAssetId = previousAsset.id;
        }
      }
    }
  };

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  let isEmpty = $derived(assetStore.isInitialized && assetStore.buckets.length === 0);
  let idsSelectedAssets = $derived(assetInteraction.selectedAssets.map(({ id }) => id));

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  let shortcutList = $derived(
    (() => {
      if (searchStore.isSearchEnabled || $showAssetViewer) {
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
    {assetStore}
    height={assetStore.viewportHeight}
    timelineTopOffset={assetStore.topSectionHeight}
    timelineBottomOffset={bottomSectionHeight}
    {leadout}
    {scrubOverallPercent}
    {scrubBucketPercent}
    {scrubBucket}
    {onScrub}
    bind:scrubberWidth
    onScrubKeyDown={(evt) => {
      evt.preventDefault();
      let amount = 50;
      if (shiftKeyIsDown) {
        amount = 500;
      }
      if (evt.key === 'ArrowUp') {
        amount = -amount;
        if (shiftKeyIsDown) {
          element?.scrollBy({ top: amount, behavior: 'smooth' });
        }
      } else if (evt.key === 'ArrowDown') {
        element?.scrollBy({ top: amount, behavior: 'smooth' });
      }
    }}
  />
{/if}

<!-- Right margin MUST be equal to the width of immich-scrubbable-scrollbar -->
<section
  id="asset-grid"
  class={['scrollbar-hidden h-full overflow-y-auto outline-none', { 'm-0': isEmpty }, { 'ml-0': !isEmpty }]}
  style:margin-right={(usingMobileDevice ? 0 : scrubberWidth) + 'px'}
  tabindex="-1"
  bind:clientHeight={assetStore.viewportHeight}
  bind:clientWidth={null, (v) => ((assetStore.viewportWidth = v), updateSlidingWindow())}
  bind:this={element}
  onscroll={() => (handleTimelineScroll(), updateSlidingWindow(), updateIsScrolling())}
>
  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible={showSkeleton}
    style:height={assetStore.timelineHeight + 'px'}
  >
    <section
      use:resizeObserver={topSectionResizeObserver}
      class:invisible={showSkeleton}
      style:position="absolute"
      style:left="0"
      style:right="0"
    >
      {@render children?.()}
      {#if isEmpty}
        <!-- (optional) empty placeholder -->
        {@render empty?.()}
      {/if}
    </section>

    {#each assetStore.buckets as bucket (bucket.viewId)}
      {@const display = bucket.intersecting}
      {@const absoluteHeight = bucket.top}

      {#if !bucket.isLoaded}
        <div
          style:height={bucket.bucketHeight + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Skeleton height={bucket.bucketHeight - bucket.store.headerHeight} title={bucket.bucketDateFormatted} />
        </div>
      {:else if display}
        <div
          class="bucket"
          style:height={bucket.bucketHeight + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <AssetDateGroup
            {withStacked}
            {showArchiveIcon}
            {assetInteraction}
            {assetStore}
            {isSelectionMode}
            {singleSelect}
            {bucket}
            onSelect={({ title, assets }) => handleGroupSelect(assetStore, title, assets)}
            onSelectAssetCandidates={handleSelectAssetCandidates}
            onSelectAssets={handleSelectAssets}
          />
        </div>
      {/if}
    {/each}
    <!-- spacer for leadout -->
    <div
      class="h-[60px]"
      style:position="absolute"
      style:left="0"
      style:right="0"
      style:transform={`translate3d(0,${assetStore.timelineHeight}px,0)`}
    ></div>
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
    contain: layout size paint;
    transform-style: flat;
    backface-visibility: hidden;
    transform-origin: center center;
  }
</style>
