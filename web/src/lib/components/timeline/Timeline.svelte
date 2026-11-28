<script lang="ts">
  import AssetViewerEvents from '#lib/components/AssetViewerEvents.svelte';
  import Thumbnail from '#lib/components/assets/thumbnail/Thumbnail.svelte';
  import Month from '#lib/components/timeline/Month.svelte';
  import Scrubber from '#lib/components/timeline/Scrubber.svelte';
  import TimelineAssetViewer from '#lib/components/timeline/TimelineAssetViewer.svelte';
  import TimelineKeyboardActions from '#lib/components/timeline/actions/TimelineKeyboardActions.svelte';
  import { focusAsset } from '#lib/components/timeline/actions/focus-actions.ts';
  import HotModuleReload from '#lib/elements/HotModuleReload.svelte';
  import Portal from '#lib/elements/Portal.svelte';
  import Skeleton from '#lib/elements/Skeleton.svelte';
  import type { AssetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { isIntersecting } from '#lib/managers/timeline-manager/internal/intersection-support.svelte.ts';
  import type { TimelineDay } from '#lib/managers/timeline-manager/timeline-day.svelte.ts';
  import { TimelineManager } from '#lib/managers/timeline-manager/timeline-manager.svelte.ts';
  import type { TimelineMonth } from '#lib/managers/timeline-manager/timeline-month.svelte.ts';
  import type {
    AssetRangeEndpoint,
    TimelineAsset,
    TimelineManagerOptions,
    ViewportTopMonth,
  } from '#lib/managers/timeline-manager/types.ts';
  import { assetsSnapshot } from '#lib/managers/timeline-manager/utils.svelte.ts';
  import { getAssetInfoQuery } from '#lib/queries/asset.query.ts';
  import { queryClient } from '#lib/queries/client.ts';
  import { keyboardManager } from '#lib/stores/keyboard-manager.svelte.ts';
  import { mediaQueryManager } from '#lib/stores/media-query-manager.svelte.ts';
  import { isAssetViewerRoute, navigate } from '#lib/utils/navigation.ts';
  import { getTimes, toTimelineAsset, type ScrubberListener } from '#lib/utils/timeline-util.ts';
  import {
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type UserResponseDto,
  } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { onDestroy, onMount, tick, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/state';

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
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album,
    albumUsers = [],
    person,
    onSelect = () => {},
    onEscape = () => assetInteraction.clear(),
    children,
    empty,
    customThumbnailLayout,
    onThumbnailClick,
  }: Props = $props();

  timelineManager = new TimelineManager();
  onDestroy(() => timelineManager.destroy());
  $effect(() => options && void timelineManager.updateOptions(options));

  const onAssetReturn = async (asset: AssetResponseDto) => {
    timelineManager.upsertAssets([toTimelineAsset(asset)]);
    assetViewerManager.setAsset(await queryClient.query(getAssetInfoQuery({ ...authManager.params, id: asset.id })));
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  let scrollableElement: HTMLElement | undefined = $state();
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
      // /photos?at=<id>, /photos/<id>, https://example.com, browser back, browser back
      const rect = scrollableElement?.getBoundingClientRect();
      if (rect) {
        timelineManager.viewportHeight = rect.height;
        timelineManager.viewportWidth = rect.width;
      }
    }
    const scrollTarget = assetViewerManager.gridScrollTarget?.at;
    const scrolled = scrollTarget ? await scrollAndLoadAsset(scrollTarget) : false;
    if (!scrolled) {
      timelineManager.scrollTo(scrollTarget ? lastVisibleScrollTop : 0);
    }

    invisible = false;

    if (scrolled && scrollTarget) {
      await tick();
      focusAsset(scrollTarget);
    }
  };

  // note: only modified once in afterNavigate()
  let initialLoadWasAssetViewer: boolean | null = null;
  // only modified in beforeNavigate()
  let hasNavigatedToOrFromAssetViewer: boolean = false;
  // The layout sets `display: none` on this subtree while the viewer is open.
  // Browsers drop the scroll offset of a hidden element.
  let lastVisibleScrollTop = 0;

  const setTopSectionHeight = (height: number) => {
    if (!assetViewerManager.isViewing) {
      timelineManager.topSectionHeight = height;
    }
  };

  // beforeNavigate is only called AFTER a svelte route has already been loaded
  // and a new route is being navigated to. It will never be called on direct
  // navigations by the browser.
  beforeNavigate(({ from, to, shallow, type }) => {
    if (shallow && type === 'goto') return;

    timelineManager.suspendTransitions = true;
    const isNavigatingToAssetViewer = isAssetViewerRoute(to);
    const isNavigatingFromAssetViewer = isAssetViewerRoute(from);
    hasNavigatedToOrFromAssetViewer = isNavigatingToAssetViewer !== isNavigatingFromAssetViewer;
  });

  // afterNavigate is only called after navigation to a new URL, {complete} will resolve
  // after successful navigation.
  afterNavigate(({ complete, shallow, type }) => {
    if (shallow && type === 'goto') return;

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
    scrollableElement?.focus({ preventScroll: true });
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
    if (!assetViewerManager.isViewing) {
      lastVisibleScrollTop = scrollableElement.scrollTop;
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

  let hoveredSelectionEnd = $state.raw<AssetRangeEndpoint | null>(null);
  let selectionRequest = 0;

  const getDaySelectionEndpoint = (assets: TimelineAsset[]): AssetRangeEndpoint | null => {
    const first = assets.at(0);
    return first ? { id: first.id, lastId: assets.at(-1)?.id } : null;
  };

  const setGroupSelected = (groupTitle: string, selected: boolean) => {
    if (selected) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }
  };

  const updateSelectedGroup = (groupTitle: string, assets: TimelineAsset[]) => {
    setGroupSelected(
      groupTitle,
      assets.every(({ id }) => assetInteraction.hasSelectedAsset(id)),
    );
  };

  const updateRangeGroups = (range: TimelineAsset[]) => {
    const firstAsset = range.at(0);
    const lastAsset = range.at(-1);
    if (!firstAsset || !lastAsset) {
      return;
    }
    const months = timelineManager.months;
    const first = timelineManager.getTimelineMonthByAssetId(firstAsset.id);
    const last = timelineManager.getTimelineMonthByAssetId(lastAsset.id);
    if (!first || !last) {
      return;
    }
    for (const month of months.slice(months.indexOf(first), months.indexOf(last) + 1)) {
      for (const day of month.timelineDays) {
        updateSelectedGroup(day.groupTitle, day.getAssets());
      }
    }
  };

  const onSelectAssets = async (
    assetsInDay: TimelineAsset[],
    groupTitle: string,
    asset?: TimelineAsset,
    shift = keyboardManager.shift,
  ) => {
    const end = asset ? { id: asset.id } : getDaySelectionEndpoint(assetsInDay);
    if (!end) {
      return;
    }
    if (asset) {
      onSelect(asset);
    }

    const request = ++selectionRequest;
    const start = assetInteraction.startAsset;
    const deselect = asset
      ? assetInteraction.hasSelectedAsset(asset.id)
      : assetInteraction.selectedGroup.has(groupTitle);
    const range = shift && start ? await timelineManager.retrieveRange(start, end) : [];
    if (request !== selectionRequest || start !== assetInteraction.startAsset) {
      return;
    }

    const assets = range.length > 0 ? range : asset ? [asset] : assetsInDay;
    if (deselect) {
      for (const { id } of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(id);
      }
    } else {
      for (const selected of assetsSnapshot(assets)) {
        handleSelectAsset(selected);
      }
    }

    if (range.length > 0) {
      updateRangeGroups(range);
    } else if (asset) {
      updateSelectedGroup(groupTitle, assetsInDay);
    } else {
      setGroupSelected(groupTitle, !deselect);
    }

    assetInteraction.clearCandidates();
    assetInteraction.setAssetSelectionStart(deselect ? null : end);
    assetInteraction.selectAll = timelineManager.assetCount === assetInteraction.assets.length;
  };

  $effect(() => {
    const start = assetInteraction.startAsset;
    const end = hoveredSelectionEnd;
    assetInteraction.clearCandidates();
    if (!keyboardManager.shift || !start || !end) {
      return;
    }

    let active = true;
    const request = selectionRequest;
    void timelineManager.retrieveRange(start, end).then((assets) => {
      if (active && request === selectionRequest) {
        assetInteraction.setAssetSelectionCandidates(assetsSnapshot(assets));
      }
    });
    return () => {
      active = false;
    };
  });

  $effect(() => {
    if (!(assetViewerManager.asset && assetViewerManager.isViewing)) {
      return;
    }

    const { localDateTime } = getTimes(assetViewerManager.asset.fileCreatedAt, DateTime.local().offset / 60);
    void timelineManager.loadTimelineMonth({ year: localDateTime.year, month: localDateTime.month });
  });

  const _onClick = (_: TimelineManager, assets: TimelineAsset[], groupTitle: string, asset: TimelineAsset) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      void onSelectAssets(assets, groupTitle, asset);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };
</script>

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

<AssetViewerEvents {onAssetReturn} />

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
      let amount = keyboardManager.shift ? 500 : 50;
      if (evt.key === 'ArrowUp') {
        amount = -amount;
        if (keyboardManager.shift) {
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
  class={['h-full scrollbar-hidden overflow-y-auto outline-none', { 'm-0': isEmpty }, { 'ms-0': !isEmpty }]}
  style:margin-inline-end={(usingMobileDevice ? 0 : scrubberWidth) + 'px'}
  tabindex="-1"
  bind:clientHeight={timelineManager.viewportHeight}
  bind:clientWidth={timelineManager.viewportWidth}
  bind:this={scrollableElement}
  onscroll={() => (handleTimelineScroll(), timelineManager.updateSlidingWindow(), updateIsScrolling())}
>
  <section id="virtual-timeline" class:invisible style:height={timelineManager.totalViewerHeight + 'px'}>
    <section
      bind:clientHeight={null, setTopSectionHeight}
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
      {#if !timelineMonth.isLoaded}
        <div
          style:height={timelineMonth.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${timelineMonth.top}px,0)`}
          style:width="100%"
        >
          <Skeleton {invisible} height={timelineMonth.height} title={timelineMonth.title} />
        </div>
      {:else if timelineMonth.isInOrNearViewport}
        <div
          class="timeline-month"
          style:height={timelineMonth.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${timelineMonth.top}px,0)`}
          style:width="100%"
        >
          <Month
            {assetInteraction}
            {customThumbnailLayout}
            {singleSelect}
            {timelineMonth}
            manager={timelineManager}
            onTimelineDaySelect={(day, shift) => void onSelectAssets(day.getAssets(), day.groupTitle, undefined, shift)}
            onTimelineDayHover={(day) => (hoveredSelectionEnd = day ? getDaySelectionEndpoint(day.getAssets()) : null)}
          >
            {#snippet thumbnail({ asset, position, timelineDay, groupIndex })}
              {const isAssetSelectionCandidate = $derived(assetInteraction.hasSelectionCandidate(asset.id))}
              {const isAssetSelected = $derived(
                assetInteraction.hasSelectedAsset(asset.id) || timelineManager.albumAssets.has(asset.id),
              )}
              {const isAssetDisabled = $derived(timelineManager.albumAssets.has(asset.id))}
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
                onSelect={() => void onSelectAssets(timelineDay.getAssets(), timelineDay.groupTitle, asset)}
                onMouseEvent={({ isMouseOver }) => (hoveredSelectionEnd = isMouseOver ? { id: asset.id } : null)}
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
    <TimelineAssetViewer bind:invisible {timelineManager} {withStacked} {isShared} {album} {person} />
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
