<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import Month from '$lib/components/timeline/Month.svelte';
  import Scrubber from '$lib/components/timeline/Scrubber.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/TimelineAssetViewer.svelte';
  import TimelineKeyboardActions from '$lib/components/timeline/actions/TimelineKeyboardActions.svelte';
  import { focusAsset } from '$lib/components/timeline/actions/focus-actions';
  import { AssetAction } from '$lib/constants';
  import HotModuleReload from '$lib/elements/HotModuleReload.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import type { AssetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import type { TimelineDay } from '$lib/managers/timeline-manager/timeline-day.svelte';
  import { isIntersecting } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
  import type { TimelineMonth } from '$lib/managers/timeline-manager/timeline-month.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset, TimelineManagerOptions, ViewportTopMonth } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { mediaQueryManager } from '$lib/stores/media-query-manager.svelte';
  import { isAssetViewerRoute, navigate } from '$lib/utils/navigation';
  import { getTimes, type ScrubberListener } from '$lib/utils/timeline-util';
  import { type AlbumResponseDto, type PersonResponseDto, type UserResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { onDestroy, onMount, tick, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the timeline is scrolled */
    enableRouting: boolean;
    timelineManager?: TimelineManager;
    options?: TimelineManagerOptions;
    assetInteraction: AssetMultiSelectManager;
    removeAction?: AssetAction.UNARCHIVE | AssetAction.ARCHIVE | AssetAction.SET_VISIBILITY_TIMELINE | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto;
    albumUsers?: UserResponseDto[];
    person?: PersonResponseDto;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    onThumbnailClick?: (
      asset: TimelineAsset,
      timelineManager: TimelineManager,
      timelineDay: TimelineDay,
      onClick: (
        timelineManager: TimelineManager,
        assets: TimelineAsset[],
        groupTitle: string,
        asset: TimelineAsset,
      ) => void,
    ) => void;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    options,
    assetInteraction,
    removeAction = null,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album,
    albumUsers = [],
    person,
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
    customThumbnailLayout,
    onThumbnailClick,
  }: Props = $props();

  timelineManager = new TimelineManager();
  onDestroy(() => timelineManager.destroy());
  $effect(() => options && void timelineManager.updateOptions(options));

  let scrollableElement: HTMLElement | undefined = $state();
  let timelineElement: HTMLElement | undefined = $state();
  let invisible = $state(true);
  // The percentage of scroll through the month that is currently intersecting the top boundary of the viewport.
  // Note: There may be multiple months visible within the viewport at any given time.
  let viewportTopMonthScrollPercent = $state(0);
  // The timeline month intersecting the top position of the viewport
  let viewportTopMonth: ViewportTopMonth = $state(undefined);
  // Overall scroll percentage through the entire timeline (0-1)
  let timelineScrollPercent: number = $state(0);
  let scrubberWidth = $state(0);

  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  const maxMd = $derived(mediaQueryManager.maxMd);
  const usingMobileDevice = $derived(mediaQueryManager.pointerCoarse);

  $effect(() => {
    const layoutOptions = maxMd
      ? {
          rowHeight: 100,
          headerHeight: 32,
        }
      : {
          rowHeight: 235,
          headerHeight: 48,
        };
    timelineManager.setLayoutOptions(layoutOptions);
  });

  $effect(() => {
    timelineManager.scrollableElement = scrollableElement;
  });

  const getAssetPosition = (assetId: string, timelineMonth: TimelineMonth) =>
    timelineMonth.findAssetAbsolutePosition(assetId);

  const scrollToAssetPosition = (assetId: string, timelineMonth: TimelineMonth) => {
    const position = getAssetPosition(assetId, timelineMonth);

    if (!position) {
      return;
    }

    // Need to update window positions/intersections because <Portal> may have
    // gone from invisible to visible.
    timelineManager.updateSlidingWindow();

    const assetTop = position.top;
    const assetBottom = position.top + position.height;
    const visibleTop = timelineManager.visibleWindow.top;
    const visibleBottom = timelineManager.visibleWindow.bottom;

    // Check if the asset is already at least partially visible in the viewport
    if (isIntersecting(assetTop, assetBottom, visibleTop, visibleBottom)) {
      return;
    }

    const currentTop = scrollableElement?.scrollTop || 0;
    const viewportHeight = visibleBottom - visibleTop;

    // Calculate the minimum scroll needed to bring the asset into view.
    // Compare two alignment strategies and choose whichever requires less scroll distance:
    // 1. Align asset top with viewport top
    // 2. Align asset bottom with viewport bottom

    // Option 1: Scroll so the top of the asset is at the top of the viewport
    const scrollToAlignTop = assetTop;
    const distanceToAlignTop = Math.abs(scrollToAlignTop - currentTop);

    // Option 2: Scroll so the bottom of the asset is at the bottom of the viewport
    const scrollToAlignBottom = assetBottom - viewportHeight;
    const distanceToAlignBottom = Math.abs(scrollToAlignBottom - currentTop);

    // Choose whichever option requires the minimum scroll distance
    const scrollTarget = distanceToAlignTop < distanceToAlignBottom ? scrollToAlignTop : scrollToAlignBottom;

    timelineManager.scrollTo(scrollTarget);
  };

  const scrollAndLoadAsset = async (assetId: string) => {
    try {
      // This flag prevents layout deferral to fix scroll positioning issues.
      // When layouts are deferred and we scroll to an asset at the end of the timeline,
      // we can calculate the asset's position, but the scrollableElement's scrollHeight
      // hasn't been updated yet to reflect the new layout. This creates a mismatch that
      // breaks scroll positioning. By disabling layout deferral in this case, we maintain
      // the performance benefits of deferred layouts while still supporting deep linking
      // to assets at the end of the timeline.
      timelineManager.isScrollingOnLoad = true;
      const timelineMonth = await timelineManager.findTimelineMonthForAsset({ id: assetId });
      if (!timelineMonth) {
        return false;
      }
      scrollToAssetPosition(assetId, timelineMonth);
      return true;
    } finally {
      timelineManager.isScrollingOnLoad = false;
    }
  };

  const scrollToAsset = (asset: TimelineAsset) => {
    const timelineMonth = timelineManager.getTimelineMonthByAssetId(asset.id);
    if (!timelineMonth) {
      return false;
    }
    scrollToAssetPosition(asset.id, timelineMonth);
    return true;
  };

  export const scrollAfterNavigate = async () => {
    if (timelineManager.viewportHeight === 0 || timelineManager.viewportWidth === 0) {
      // this can happen if you do the following navigation order
      // /photos?at=<id>, /photos/<id>, http://example.com, browser back, browser back
      const rect = scrollableElement?.getBoundingClientRect();
      if (rect) {
        timelineManager.viewportHeight = rect.height;
        timelineManager.viewportWidth = rect.width;
      }
    }
    const scrollTarget = assetViewerManager.gridScrollTarget?.at;
    let scrolled = false;
    if (scrollTarget) {
      scrolled = await scrollAndLoadAsset(scrollTarget);
    }
    if (!scrolled) {
      // if the asset is not found, scroll to the top
      timelineManager.scrollTo(0);
    } else if (scrollTarget) {
      await tick();
      focusAsset(scrollTarget);
    }
    invisible = false;
  };

  // note: only modified once in afterNavigate()
  let initialLoadWasAssetViewer: boolean | null = null;
  // only modified in beforeNavigate()
  let hasNavigatedToOrFromAssetViewer: boolean = false;

  // beforeNavigate is only called AFTER a svelte route has already been loaded
  // and a new route is being navigated to. It will never be called on direct
  // navigations by the browser.
  beforeNavigate(({ from, to }) => {
    timelineManager.suspendTransitions = true;
    const isNavigatingToAssetViewer = isAssetViewerRoute(to);
    const isNavigatingFromAssetViewer = isAssetViewerRoute(from);
    hasNavigatedToOrFromAssetViewer = isNavigatingToAssetViewer !== isNavigatingFromAssetViewer;
  });

  // afterNavigate is only called after navigation to a new URL, {complete} will resolve
  // after successful navigation.
  afterNavigate(({ complete }) => {
    void complete.finally(() => {
      const isAssetViewerPage = isAssetViewerRoute(page);

      // Set initial load state only once - if initialLoadWasAssetViewer is null, then
      // this is a direct browser navigation.
      const isDirectNavigation = initialLoadWasAssetViewer === null;
      if (isDirectNavigation) {
        initialLoadWasAssetViewer = isAssetViewerPage && !hasNavigatedToOrFromAssetViewer;
      }

      void scrollAfterNavigate();
    });
  });

  const updateIsScrolling = () => (timelineManager.scrolling = true);
  // note: don't throttle, debounch, or otherwise do this function async - it causes flicker

  onMount(() => {
    if (!enableRouting) {
      invisible = false;
    }
  });

  const scrollToSegmentPercentage = (segmentTop: number, segmentHeight: number, timelineMonthScrollPercent: number) => {
    const topOffset = segmentTop;
    const maxScrollPercent = timelineManager.maxScrollPercent;
    const delta = segmentHeight * timelineMonthScrollPercent;
    const scrollToTop = (topOffset + delta) * maxScrollPercent;

    timelineManager.scrollTo(scrollToTop);
  };

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function scrolls the timeline to the specified month group and offset, based on scrubber interaction
  const onScrub: ScrubberListener = (scrubberData) => {
    const { scrubberMonth, overallScrollPercent, scrubberMonthScrollPercent } = scrubberData;

    const leadIn = scrubberMonth === 'lead-in';
    const leadOut = scrubberMonth === 'lead-out';
    const noMonth = !scrubberMonth;

    if (noMonth || timelineManager.limitedScroll) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      const maxScroll = timelineManager.maxScrollPercent;
      const offset = maxScroll * overallScrollPercent * timelineManager.totalViewerHeight;
      timelineManager.scrollTo(offset);
    } else if (leadIn) {
      scrollToSegmentPercentage(0, timelineManager.topSectionHeight, scrubberMonthScrollPercent);
    } else if (leadOut) {
      scrollToSegmentPercentage(
        timelineManager.topSectionHeight + timelineManager.bodySectionHeight,
        timelineManager.bottomSectionHeight,
        scrubberMonthScrollPercent,
      );
    } else {
      const timelineMonth = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubberMonth.year && month === scrubberMonth.month,
      );
      if (!timelineMonth) {
        return;
      }
      scrollToSegmentPercentage(timelineMonth.top, timelineMonth.height, scrubberMonthScrollPercent);
    }
  };

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  const handleTimelineScroll = () => {
    if (!scrollableElement) {
      return;
    }

    if (timelineManager.limitedScroll) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = timelineManager.maxScroll;

      timelineScrollPercent = Math.min(1, scrollableElement.scrollTop / maxScroll);
      viewportTopMonth = undefined;
      viewportTopMonthScrollPercent = 0;
    } else {
      timelineScrollPercent = 0;

      let top = scrollableElement.scrollTop;
      let maxScrollPercent = timelineManager.maxScrollPercent;

      const monthsLength = timelineManager.months.length;
      for (let i = -1; i < monthsLength + 1; i++) {
        let timelineMonth: ViewportTopMonth;
        let timelineMonthHeight: number;
        if (i === -1) {
          // lead-in
          timelineMonth = 'lead-in';
          timelineMonthHeight = timelineManager.topSectionHeight;
        } else if (i === monthsLength) {
          // lead-out
          timelineMonth = 'lead-out';
          timelineMonthHeight = timelineManager.bottomSectionHeight;
        } else {
          timelineMonth = timelineManager.months[i].yearMonth;
          timelineMonthHeight = timelineManager.months[i].height;
        }

        let next = top - timelineMonthHeight * maxScrollPercent;
        // instead of checking for < 0, add a little wiggle room for subpixel resolution
        if (next < -1 && timelineMonth) {
          viewportTopMonth = timelineMonth;

          // allowing next to be at least 1 may cause percent to go negative, so ensure positive percentage
          viewportTopMonthScrollPercent = Math.max(0, top / (timelineMonthHeight * maxScrollPercent));

          // compensate for lost precision/rounding errors advance to the next bucket, if present
          if (viewportTopMonthScrollPercent > 0.9999 && i + 1 < monthsLength - 1) {
            viewportTopMonth = timelineManager.months[i + 1].yearMonth;
            viewportTopMonthScrollPercent = 0;
          }
          break;
        }
        top = next;
      }
    }
  };

  const handleSelectAsset = (asset: TimelineAsset) => {
    if (!timelineManager.albumAssets.has(asset.id)) {
      assetInteraction.selectAsset(asset);
    }
  };

  let lastAssetMouseEvent: TimelineAsset | null = $state(null);

  let shiftKeyIsDown = $state(false);

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
  const handleSelectAssetCandidates = (asset: TimelineAsset | null) => {
    if (asset) {
      void selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleGroupSelect = (timelineDay: TimelineDay, assets: TimelineAsset[]) => {
    const group = timelineDay.groupTitle;
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

    assetInteraction.selectAll = timelineManager.assetCount === assetInteraction.assets.length;
  };

  const onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect(asset);

    const rangeSelection = assetInteraction.candidates.length > 0;
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.candidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.candidates) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteraction.clearCandidates();

    if (assetInteraction.startAsset && rangeSelection) {
      const startBucket = timelineManager.getTimelineMonthByAssetId(assetInteraction.startAsset.id);
      const endBucket = timelineManager.getTimelineMonthByAssetId(asset.id);

      if (!startBucket || !endBucket) {
        return;
      }

      const timelineMonths = timelineManager.months;
      const startBucketIndex = timelineMonths.indexOf(startBucket);
      const endBucketIndex = timelineMonths.indexOf(endBucket);

      if (startBucketIndex === -1 || endBucketIndex === -1) {
        return;
      }

      const rangeStartIndex = Math.min(startBucketIndex, endBucketIndex);
      const rangeEndIndex = Math.max(startBucketIndex, endBucketIndex);

      // Select/deselect assets in range (start,end)
      for (let index = rangeStartIndex + 1; index < rangeEndIndex; index++) {
        const timelineMonth = timelineMonths[index];
        await timelineManager.loadTimelineMonth(timelineMonth.yearMonth);
        for (const monthAsset of timelineMonth.assetsIterator()) {
          if (deselect) {
            assetInteraction.removeAssetFromMultiselectGroup(monthAsset.id);
          } else {
            handleSelectAsset(monthAsset);
          }
        }
      }

      // Update date group selection in range [start,end]
      for (let index = rangeStartIndex; index <= rangeEndIndex; index++) {
        const timelineMonth = timelineMonths[index];

        // Split month group into day groups and check each group
        for (const timelineDay of timelineMonth.timelineDays) {
          const timelineDayTitle = timelineDay.groupTitle;
          if (timelineDay.getAssets().every((a) => assetInteraction.hasSelectedAsset(a.id))) {
            assetInteraction.addGroupToMultiselectGroup(timelineDayTitle);
          } else {
            assetInteraction.removeGroupFromMultiselectGroup(timelineDayTitle);
          }
        }
      }
    }

    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = async (endAsset: TimelineAsset) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.startAsset;
    if (!startAsset) {
      return;
    }

    const assets = assetsSnapshot(await timelineManager.retrieveRange(startAsset, endAsset));
    assetInteraction.setAssetSelectionCandidates(assets);
  };

  $effect(() => {
    if (!lastAssetMouseEvent) {
      assetInteraction.clearCandidates();
    }
  });

  $effect(() => {
    if (!shiftKeyIsDown) {
      assetInteraction.clearCandidates();
    }
  });

  $effect(() => {
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      void selectAssetCandidates(lastAssetMouseEvent);
    }
  });

  $effect(() => {
    if (assetViewerManager.asset && assetViewerManager.isViewing) {
      const { localDateTime } = getTimes(assetViewerManager.asset.fileCreatedAt, DateTime.local().offset / 60);
      void timelineManager.loadTimelineMonth({ year: localDateTime.year, month: localDateTime.month });
    }
  });

  const assetSelectHandler = (
    timelineManager: TimelineManager,
    asset: TimelineAsset,
    assetsInTimelineDay: TimelineAsset[],
    groupTitle: string,
  ) => {
    void onSelectAssets(asset);

    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInTimelineDay.filter(({ id }) =>
      assetInteraction.hasSelectedAsset(id),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount === assetsInTimelineDay.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }

    assetInteraction.selectAll = timelineManager.assetCount === assetInteraction.assets.length;
  };

  const _onClick = (
    timelineManager: TimelineManager,
    assets: TimelineAsset[],
    groupTitle: string,
    asset: TimelineAsset,
  ) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      assetSelectHandler(timelineManager, asset, assets, groupTitle);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} />

<HotModuleReload
  onAfterUpdate={() => {
    const asset = page.url.searchParams.get('at');
    if (asset) {
      assetViewerManager.gridScrollTarget = { at: asset };
    }
    void scrollAfterNavigate();
  }}
  onBeforeUpdate={(payload: UpdatePayload) => {
    const timelineUpdate = payload.updates.some((update) => update.path.endsWith('Timeline.svelte'));
    if (timelineUpdate) {
      timelineManager.destroy();
    }
  }}
/>

<TimelineKeyboardActions
  scrollToAsset={(asset) => scrollToAsset(asset) ?? false}
  {timelineManager}
  {assetInteraction}
  {onEscape}
/>

{#if timelineManager.months.length > 0}
  <Scrubber
    {timelineManager}
    height={timelineManager.viewportHeight}
    timelineTopOffset={timelineManager.topSectionHeight}
    timelineBottomOffset={timelineManager.bottomSectionHeight}
    {timelineScrollPercent}
    {viewportTopMonthScrollPercent}
    {viewportTopMonth}
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
          scrollableElement?.scrollBy({ top: amount, behavior: 'smooth' });
        }
      } else if (evt.key === 'ArrowDown') {
        scrollableElement?.scrollBy({ top: amount, behavior: 'smooth' });
      }
    }}
  />
{/if}

<!-- Right margin MUST be equal to the width of scrubber -->
<section
  id="asset-grid"
  class={['scrollbar-hidden h-full overflow-y-auto outline-none', { 'm-0': isEmpty }, { 'ms-0': !isEmpty }]}
  style:margin-inline-end={(usingMobileDevice ? 0 : scrubberWidth) + 'px'}
  tabindex="-1"
  bind:clientHeight={timelineManager.viewportHeight}
  bind:clientWidth={timelineManager.viewportWidth}
  bind:this={scrollableElement}
  onscroll={() => (handleTimelineScroll(), timelineManager.updateSlidingWindow(), updateIsScrolling())}
>
  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible
    style:height={timelineManager.totalViewerHeight + 'px'}
  >
    <section
      bind:clientHeight={timelineManager.topSectionHeight}
      class:invisible
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

    {#each timelineManager.months as timelineMonth (timelineMonth.viewId)}
      {@const isInOrNearViewport = timelineMonth.isInOrNearViewport}
      {@const absoluteHeight = timelineMonth.top}

      {#if !timelineMonth.isLoaded}
        <div
          style:height={timelineMonth.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Skeleton {invisible} height={timelineMonth.height} title={timelineMonth.title} />
        </div>
      {:else if isInOrNearViewport}
        <div
          class="timeline-month"
          style:height={timelineMonth.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Month
            {assetInteraction}
            {customThumbnailLayout}
            {singleSelect}
            {timelineMonth}
            manager={timelineManager}
            onTimelineDaySelect={handleGroupSelect}
          >
            {#snippet thumbnail({ asset, position, timelineDay, groupIndex })}
              {@const isAssetSelectionCandidate = assetInteraction.hasSelectionCandidate(asset.id)}
              {@const isAssetSelected =
                assetInteraction.hasSelectedAsset(asset.id) || timelineManager.albumAssets.has(asset.id)}
              {@const isAssetDisabled = timelineManager.albumAssets.has(asset.id)}
              <Thumbnail
                showStackedIcon={withStacked}
                {showArchiveIcon}
                {asset}
                {albumUsers}
                {groupIndex}
                onClick={(asset) => {
                  if (typeof onThumbnailClick === 'function') {
                    onThumbnailClick(asset, timelineManager, timelineDay, _onClick);
                  } else {
                    _onClick(timelineManager, timelineDay.getAssets(), timelineDay.groupTitle, asset);
                  }
                }}
                onSelect={() => {
                  if (isSelectionMode || assetInteraction.selectionActive) {
                    assetSelectHandler(timelineManager, asset, timelineDay.getAssets(), timelineDay.groupTitle);
                    return;
                  }
                  void onSelectAssets(asset);
                }}
                onMouseEvent={() => handleSelectAssetCandidates(asset)}
                onPreview={isSelectionMode || assetInteraction.selectionActive
                  ? (asset) => void navigate({ targetRoute: 'current', assetId: asset.id })
                  : undefined}
                selected={isAssetSelected}
                selectionCandidate={isAssetSelectionCandidate}
                disabled={isAssetDisabled}
                thumbnailWidth={position.width}
                thumbnailHeight={position.height}
              />
            {/snippet}
          </Month>
        </div>
      {/if}
    {/each}
    <!-- spacer for leadout -->
    <div
      style:height={timelineManager.bottomSectionHeight + 'px'}
      style:position="absolute"
      style:left="0"
      style:right="0"
      style:transform={`translate3d(0,${timelineManager.topSectionHeight + timelineManager.bodySectionHeight}px,0)`}
    ></div>
  </section>
</section>

<Portal target="body">
  {#if assetViewerManager.isViewing}
    <TimelineAssetViewer bind:invisible {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} />
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: strict;
    scrollbar-width: none;
  }

  .timeline-month {
    contain: layout size paint;
    transform-style: flat;
    backface-visibility: hidden;
    transform-origin: center center;
  }
</style>
