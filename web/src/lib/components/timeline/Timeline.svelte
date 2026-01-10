<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
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
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import { isIntersecting } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset, TimelineManagerOptions, ViewportTopMonth } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
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
    assetInteraction: AssetInteraction;
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
      dayGroup: DayGroup,
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

  let { isViewing: showAssetViewer, asset: viewingAsset, gridScrollTarget } = assetViewingStore;

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
  const maxMd = $derived(mobileDevice.maxMd);
  const usingMobileDevice = $derived(mobileDevice.pointerCoarse);

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

  const getAssetPosition = (assetId: string, monthGroup: MonthGroup) => monthGroup.findAssetAbsolutePosition(assetId);

  const scrollToAssetPosition = (assetId: string, monthGroup: MonthGroup) => {
    const position = getAssetPosition(assetId, monthGroup);

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
      const monthGroup = await timelineManager.findMonthGroupForAsset({ id: assetId });
      if (!monthGroup) {
        return false;
      }
      scrollToAssetPosition(assetId, monthGroup);
      return true;
    } finally {
      timelineManager.isScrollingOnLoad = false;
    }
  };

  const scrollToAsset = (asset: TimelineAsset) => {
    const monthGroup = timelineManager.getMonthGroupByAssetId(asset.id);
    if (!monthGroup) {
      return false;
    }
    scrollToAssetPosition(asset.id, monthGroup);
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
    const scrollTarget = $gridScrollTarget?.at;
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

  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (timelineManager.topSectionHeight = height);

  onMount(() => {
    if (!enableRouting) {
      invisible = false;
    }
  });

  const scrollToSegmentPercentage = (segmentTop: number, segmentHeight: number, monthGroupScrollPercent: number) => {
    const topOffset = segmentTop;
    const maxScrollPercent = timelineManager.maxScrollPercent;
    const delta = segmentHeight * monthGroupScrollPercent;
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
      const monthGroup = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubberMonth.year && month === scrubberMonth.month,
      );
      if (!monthGroup) {
        return;
      }
      scrollToSegmentPercentage(monthGroup.top, monthGroup.height, scrubberMonthScrollPercent);
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
        let monthGroup: ViewportTopMonth;
        let monthGroupHeight = 0;
        if (i === -1) {
          // lead-in
          monthGroup = 'lead-in';
          monthGroupHeight = timelineManager.topSectionHeight;
        } else if (i === monthsLength) {
          // lead-out
          monthGroup = 'lead-out';
          monthGroupHeight = timelineManager.bottomSectionHeight;
        } else {
          monthGroup = timelineManager.months[i].yearMonth;
          monthGroupHeight = timelineManager.months[i].height;
        }

        let next = top - monthGroupHeight * maxScrollPercent;
        // instead of checking for < 0, add a little wiggle room for subpixel resolution
        if (next < -1 && monthGroup) {
          viewportTopMonth = monthGroup;

          // allowing next to be at least 1 may cause percent to go negative, so ensure positive percentage
          viewportTopMonthScrollPercent = Math.max(0, top / (monthGroupHeight * maxScrollPercent));

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

  const handleGroupSelect = (dayGroup: DayGroup, assets: TimelineAsset[]) => {
    const group = dayGroup.groupTitle;
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

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect(asset);

    if (singleSelect) {
      timelineManager.scrollTo(0);
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
      let startBucket = timelineManager.getMonthGroupByAssetId(assetInteraction.assetSelectionStart.id);
      let endBucket = timelineManager.getMonthGroupByAssetId(asset.id);

      if (startBucket === null || endBucket === null) {
        return;
      }

      // Select/deselect assets in range (start,end)
      let started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === endBucket) {
          break;
        }
        if (started) {
          await timelineManager.loadMonthGroup(monthGroup.yearMonth);
          for (const asset of monthGroup.assetsIterator()) {
            if (deselect) {
              assetInteraction.removeAssetFromMultiselectGroup(asset.id);
            } else {
              handleSelectAsset(asset);
            }
          }
        }
        if (monthGroup === startBucket) {
          started = true;
        }
      }

      // Update date group selection in range [start,end]
      started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === startBucket) {
          started = true;
        }
        if (started) {
          // Split month group into day groups and check each group
          for (const dayGroup of monthGroup.dayGroups) {
            const dayGroupTitle = dayGroup.groupTitle;
            if (dayGroup.getAssets().every((a) => assetInteraction.hasSelectedAsset(a.id))) {
              assetInteraction.addGroupToMultiselectGroup(dayGroupTitle);
            } else {
              assetInteraction.removeGroupFromMultiselectGroup(dayGroupTitle);
            }
          }
        }
        if (monthGroup === endBucket) {
          break;
        }
      }
    }

    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = async (endAsset: TimelineAsset) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    const assets = assetsSnapshot(await timelineManager.retrieveRange(startAsset, endAsset));
    assetInteraction.setAssetSelectionCandidates(assets);
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
      void selectAssetCandidates(lastAssetMouseEvent);
    }
  });

  $effect(() => {
    if ($showAssetViewer) {
      const { localDateTime } = getTimes($viewingAsset.fileCreatedAt, DateTime.local().offset / 60);
      void timelineManager.loadMonthGroup({ year: localDateTime.year, month: localDateTime.month });
    }
  });

  const assetSelectHandler = (
    timelineManager: TimelineManager,
    asset: TimelineAsset,
    assetsInDayGroup: TimelineAsset[],
    groupTitle: string,
  ) => {
    void onSelectAssets(asset);

    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInDayGroup.filter(({ id }) => assetInteraction.hasSelectedAsset(id)).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount === assetsInDayGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }

    isSelectingAllAssets.set(timelineManager.assetCount === assetInteraction.selectedAssets.length);
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
      $gridScrollTarget = { at: asset };
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
  style:margin-right={(usingMobileDevice ? 0 : scrubberWidth) + 'px'}
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
      use:resizeObserver={topSectionResizeObserver}
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

    {#each timelineManager.months as monthGroup (monthGroup.viewId)}
      {@const display = monthGroup.intersecting}
      {@const absoluteHeight = monthGroup.top}

      {#if !monthGroup.isLoaded}
        <div
          style:height={monthGroup.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Skeleton {invisible} height={monthGroup.height} title={monthGroup.monthGroupTitle} />
        </div>
      {:else if display}
        <div
          class="month-group"
          style:height={monthGroup.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Month
            {assetInteraction}
            {customThumbnailLayout}
            {singleSelect}
            {monthGroup}
            manager={timelineManager}
            onDayGroupSelect={handleGroupSelect}
          >
            {#snippet thumbnail({ asset, position, dayGroup, groupIndex })}
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
                    onThumbnailClick(asset, timelineManager, dayGroup, _onClick);
                  } else {
                    _onClick(timelineManager, dayGroup.getAssets(), dayGroup.groupTitle, asset);
                  }
                }}
                onSelect={() => {
                  if (isSelectionMode || assetInteraction.selectionActive) {
                    assetSelectHandler(timelineManager, asset, dayGroup.getAssets(), dayGroup.groupTitle);
                    return;
                  }
                  void onSelectAssets(asset);
                }}
                onMouseEvent={() => handleSelectAssetCandidates(asset)}
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
  {#if $showAssetViewer}
    <TimelineAssetViewer bind:invisible {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} />
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: strict;
    scrollbar-width: none;
  }

  .month-group {
    contain: layout size paint;
    transform-style: flat;
    backface-visibility: hidden;
    transform-origin: center center;
  }
</style>
