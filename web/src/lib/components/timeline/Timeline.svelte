<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import MonthSegment from '$lib/components/timeline/MonthSegment.svelte';
  import Scrubber from '$lib/components/timeline/Scrubber.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/TimelineAssetViewer.svelte';
  import TimelineKeyboardActions from '$lib/components/timeline/actions/TimelineKeyboardActions.svelte';
  import { AssetAction } from '$lib/constants';
  import HotModuleReload from '$lib/elements/HotModuleReload.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { navigate } from '$lib/utils/navigation';
  import {
    getSegmentIdentifier,
    getTimes,
    type ScrubberListener,
    type TimelineYearMonth,
  } from '$lib/utils/timeline-util';
  import { type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { onMount, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the timeline is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE
      | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
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
    customThumbnailLayout,
    onThumbnailClick,
  }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, gridScrollTarget } = assetViewingStore;

  let element: HTMLElement | undefined = $state();

  let timelineElement: HTMLElement | undefined = $state();
  let showSkeleton = $state(true);
  // The percentage of scroll through the month that is currently intersecting the top boundary of the viewport.
  // Note: There may be multiple months visible within the viewport at any given time.
  let viewportTopMonthScrollPercent = $state(0);
  // The timeline month intersecting the top position of the viewport
  let viewportTopMonth: { year: number; month: number } | undefined = $state(undefined);
  // Overall scroll percentage through the entire timeline (0-1)
  let timelineScrollPercent: number = $state(0);
  let scrubberWidth = $state(0);

  // 60 is the bottom spacer element at 60px
  let bottomSectionHeight = 60;
  // Indicates whether the viewport is currently in the lead-out section (after all months)
  let isInLeadOutSection = $state(false);

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

  const scrollTo = (top: number) => {
    if (element) {
      element.scrollTo({ top });
    }
  };
  const scrollTop = (top: number) => {
    if (element) {
      element.scrollTop = top;
    }
  };
  const scrollBy = (y: number) => {
    if (element) {
      element.scrollBy(0, y);
    }
  };
  const scrollToTop = () => {
    scrollTo(0);
  };

  const getAssetHeight = (assetId: string, monthGroup: MonthGroup) => {
    // the following method may trigger any layouts, so need to
    // handle any scroll compensation that may have been set
    const height = monthGroup!.findAssetAbsolutePosition(assetId);

    while (timelineManager.scrollCompensation.monthGroup) {
      handleScrollCompensation(timelineManager.scrollCompensation);
      timelineManager.clearScrollCompensation();
    }
    return height;
  };

  const assetIsVisible = (assetTop: number): boolean => {
    if (!element) {
      return false;
    }

    const { clientHeight, scrollTop } = element;
    return assetTop >= scrollTop && assetTop < scrollTop + clientHeight;
  };

  const scrollToAssetId = async (assetId: string) => {
    const monthGroup = await timelineManager.findMonthGroupForAsset(assetId);
    if (!monthGroup) {
      return false;
    }

    const height = getAssetHeight(assetId, monthGroup);

    // If the asset is already visible, then don't scroll.
    if (assetIsVisible(height)) {
      return true;
    }

    scrollTo(height);
    updateSlidingWindow();
    return true;
  };

  const scrollToAsset = (asset: TimelineAsset) => {
    const monthGroup = timelineManager.getMonthGroupByAssetId(asset.id);
    if (!monthGroup) {
      return false;
    }
    const height = getAssetHeight(asset.id, monthGroup);
    scrollTo(height);
    updateSlidingWindow();
    return true;
  };

  const completeNav = async () => {
    const scrollTarget = $gridScrollTarget?.at;
    let scrolled = false;
    if (scrollTarget) {
      scrolled = await scrollToAssetId(scrollTarget);
    }
    if (!scrolled) {
      // if the asset is not found, scroll to the top
      scrollToTop();
    }
    showSkeleton = false;
  };

  beforeNavigate(() => (timelineManager.suspendTransitions = true));

  afterNavigate((nav) => {
    const { complete } = nav;
    complete.then(completeNav, completeNav);
  });

  const handleAfterUpdate = (payload: UpdatePayload) => {
    const timelineUpdate = payload.updates.some(
      (update) => update.path.endsWith('Timeline.svelte') || update.path.endsWith('assets-store.ts'),
    );

    if (timelineUpdate) {
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
        showSkeleton = false;
      }, 500);
    }
  };

  const handleBeforeUpdate = (payload: UpdatePayload) => {
    const timelineUpdate = payload.updates.some((update) => update.path.endsWith('Timeline.svelte'));
    if (timelineUpdate) {
      timelineManager.destroy();
    }
  };

  const updateIsScrolling = () => (timelineManager.scrolling = true);
  // note: don't throttle, debounch, or otherwise do this function async - it causes flicker
  const updateSlidingWindow = () => timelineManager.updateSlidingWindow(element?.scrollTop || 0);

  const handleScrollCompensation = ({ heightDelta, scrollTop }: { heightDelta?: number; scrollTop?: number }) => {
    if (heightDelta !== undefined) {
      scrollBy(heightDelta);
    } else if (scrollTop !== undefined) {
      scrollTo(scrollTop);
    }
    // Yes, updateSlideWindow() is called by the onScroll event triggered as a result of
    // the above calls. However, this delay is enough time to set the intersecting property
    // of the monthGroup to false, then true, which causes the DOM nodes to be recreated,
    // causing bad perf, and also, disrupting focus of those elements.
    updateSlidingWindow();
  };

  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (timelineManager.topSectionHeight = height);

  onMount(() => {
    if (!enableRouting) {
      showSkeleton = false;
    }
  });

  const getMaxScrollPercent = () => {
    const totalHeight = timelineManager.timelineHeight + bottomSectionHeight + timelineManager.topSectionHeight;
    return (totalHeight - timelineManager.viewportHeight) / totalHeight;
  };

  const getMaxScroll = () => {
    if (!element || !timelineElement) {
      return 0;
    }
    return (
      timelineManager.topSectionHeight + bottomSectionHeight + (timelineElement.clientHeight - element.clientHeight)
    );
  };

  const scrollToMonthGroupAndOffset = (monthGroup: MonthGroup, monthGroupScrollPercent: number) => {
    const topOffset = monthGroup.top;
    const maxScrollPercent = getMaxScrollPercent();
    const delta = monthGroup.height * monthGroupScrollPercent;
    const scrollToTop = (topOffset + delta) * maxScrollPercent;

    scrollTop(scrollToTop);
  };

  // note: don't throttle, debounce, or otherwise make this function async - it causes flicker
  // this function scrolls the timeline to the specified month group and offset, based on scrubber interaction
  const onScrub: ScrubberListener = (scrubberData) => {
    const { scrubberMonth, overallScrollPercent, scrubberMonthScrollPercent } = scrubberData;

    if (!scrubberMonth || timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      const maxScroll = getMaxScroll();
      const offset = maxScroll * overallScrollPercent;
      scrollTop(offset);
    } else {
      const monthGroup = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubberMonth.year && month === scrubberMonth.month,
      );
      if (!monthGroup) {
        return;
      }
      scrollToMonthGroupAndOffset(monthGroup, scrubberMonthScrollPercent);
    }
  };

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  const handleTimelineScroll = () => {
    isInLeadOutSection = false;

    if (!element) {
      return;
    }

    if (timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = getMaxScroll();
      timelineScrollPercent = Math.min(1, element.scrollTop / maxScroll);

      viewportTopMonth = undefined;
      viewportTopMonthScrollPercent = 0;
    } else {
      let top = element.scrollTop;
      if (top < timelineManager.topSectionHeight) {
        // in the lead-in area
        viewportTopMonth = undefined;
        viewportTopMonthScrollPercent = 0;
        const maxScroll = getMaxScroll();

        timelineScrollPercent = Math.min(1, element.scrollTop / maxScroll);
        return;
      }

      let maxScrollPercent = getMaxScrollPercent();
      let found = false;

      const monthsLength = timelineManager.months.length;
      for (let i = -1; i < monthsLength + 1; i++) {
        let monthGroup: TimelineYearMonth | undefined;
        let monthGroupHeight = 0;
        if (i === -1) {
          // lead-in
          monthGroupHeight = timelineManager.topSectionHeight;
        } else if (i === monthsLength) {
          // lead-out
          monthGroupHeight = bottomSectionHeight;
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

          found = true;
          break;
        }
        top = next;
      }
      if (!found) {
        isInLeadOutSection = true;
        viewportTopMonth = undefined;
        viewportTopMonthScrollPercent = 0;
        timelineScrollPercent = 1;
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
      scrollTop(0);
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
          await timelineManager.loadSegment(monthGroup.identifier);
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
      void timelineManager.loadSegment(getSegmentIdentifier({ year: localDateTime.year, month: localDateTime.month }));
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
    let selectedAssetsInGroupCount = assetsInDayGroup.filter((asset) =>
      assetInteraction.hasSelectedAsset(asset.id),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDayGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
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

<HotModuleReload onAfterUpdate={handleAfterUpdate} onBeforeUpdate={handleBeforeUpdate} />

<TimelineKeyboardActions
  scrollToAsset={(asset) => scrollToAsset(asset) ?? false}
  {timelineManager}
  {assetInteraction}
  bind:isShowDeleteConfirmation
  {onEscape}
/>

{#if timelineManager.months.length > 0}
  <Scrubber
    {timelineManager}
    height={timelineManager.viewportHeight}
    timelineTopOffset={timelineManager.topSectionHeight}
    timelineBottomOffset={bottomSectionHeight}
    {isInLeadOutSection}
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
          element?.scrollBy({ top: amount, behavior: 'smooth' });
        }
      } else if (evt.key === 'ArrowDown') {
        element?.scrollBy({ top: amount, behavior: 'smooth' });
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
  bind:clientWidth={null, (v: number) => ((timelineManager.viewportWidth = v), updateSlidingWindow())}
  bind:this={element}
  onscroll={() => (handleTimelineScroll(), updateSlidingWindow(), updateIsScrolling())}
>
  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible={showSkeleton}
    style:height={timelineManager.timelineHeight + 'px'}
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
          <Skeleton
            height={monthGroup.height - monthGroup.timelineManager.headerHeight}
            title={monthGroup.monthGroupTitle}
          />
        </div>
      {:else if display}
        <div
          class="month-group"
          style:height={monthGroup.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <MonthSegment
            {assetInteraction}
            {customThumbnailLayout}
            {singleSelect}
            {monthGroup}
            {timelineManager}
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
          </MonthSegment>
        </div>
      {/if}
    {/each}
    <!-- spacer for leadout -->
    <div
      class="h-[60px]"
      style:position="absolute"
      style:left="0"
      style:right="0"
      style:transform={`translate3d(0,${timelineManager.timelineHeight}px,0)`}
    ></div>
  </section>
</section>

<Portal target="body">
  {#if $showAssetViewer}
    <TimelineAssetViewer bind:showSkeleton {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} />
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
