<script lang="ts">
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import AssetGridActions from '$lib/components/timeline/actions/timeline-keyboard-actions.svelte';
  import Skeleton from '$lib/components/timeline/base-components/skeleton.svelte';
  import SelectableTimelineDay from '$lib/components/timeline/internal-components/selectable-timeline-day.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/internal-components/timeline-asset-viewer.svelte';
  import { AssetAction } from '$lib/constants';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { navigate } from '$lib/utils/navigation';
  import { type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { onMount, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';
  import Portal from '../../shared-components/portal/portal.svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    header?: Snippet<[handleScrollTop: (top: number) => void]>;
    children?: Snippet;
    empty?: Snippet;
    handleTimelineScroll?: () => void;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,
    removeAction,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
    onSelect = (asset: TimelineAsset) => void 0,
    onEscape = () => {},
    children,
    empty,
    header,
    handleTimelineScroll = () => {},
  }: Props = $props();

  let { isViewing: showAssetViewer, gridScrollTarget } = assetViewingStore;

  let element: HTMLElement | undefined = $state();

  let timelineElement: HTMLElement | undefined = $state();
  let showSkeleton = $state(true);

  let scrubberWidth = $state(0);

  const maxMd = $derived(mobileDevice.maxMd);
  const usingMobileDevice = $derived(mobileDevice.pointerCoarse);
  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);

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
  const onScrollToTop = scrollToTop;

  const getAssetHeight = (assetId: string, monthGroup: MonthGroup) => {
    // the following method may trigger any layouts, so need to
    // handle any scroll compensation that may have been set
    const height = monthGroup!.findAssetAbsolutePosition(assetId);

    while (timelineManager.scrollCompensation.monthGroup) {
      scrollCompensation(timelineManager.scrollCompensation);
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
            showSkeleton = false;
          }, 500);
        }
      };
      import.meta.hot?.on('vite:afterUpdate', afterApdate);
      import.meta.hot?.on('vite:beforeUpdate', (payload) => {
        const assetGridUpdate = payload.updates.some((update) => update.path.endsWith('asset-grid.svelte'));
        if (assetGridUpdate) {
          timelineManager.destroy();
        }
      });

      return () => import.meta.hot?.off('vite:afterUpdate', afterApdate);
    }
    return () => void 0;
  };

  const updateIsScrolling = () => (timelineManager.scrolling = true);
  // note: don't throttle, debounch, or otherwise do this function async - it causes flicker
  const updateSlidingWindow = () => timelineManager.updateSlidingWindow(element?.scrollTop || 0);

  const scrollCompensation = ({ heightDelta, scrollTop }: { heightDelta?: number; scrollTop?: number }) => {
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
  const onScrollCompensation = scrollCompensation;

  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (timelineManager.topSectionHeight = height);

  onMount(() => {
    if (!enableRouting) {
      showSkeleton = false;
    }
    const disposeHmr = hmrSupport();
    return () => {
      disposeHmr();
    };
  });
</script>

<AssetGridActions {scrollToAsset} {timelineManager} {assetInteraction} bind:isShowDeleteConfirmation {onEscape}
></AssetGridActions>

{@render header?.(scrollTop)}

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
          <SelectableTimelineDay
            {withStacked}
            {showArchiveIcon}
            {assetInteraction}
            {timelineManager}
            {isSelectionMode}
            {singleSelect}
            {monthGroup}
            {onSelect}
            {onScrollToTop}
            {onScrollCompensation}
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
