<script lang="ts">
  import { page } from '$app/state';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import HotModuleReload from '$lib/elements/HotModuleReload.svelte';
  import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
  import type { PhotostreamSegment } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';

  interface Props {
    segment: Snippet<
      [
        {
          segment: PhotostreamSegment;
          scrollToFunction: (top: number) => void;
          onScrollCompensationMonthInDOM: (compensation: { heightDelta?: number; scrollTop?: number }) => void;
        },
      ]
    >;
    skeleton: Snippet<
      [
        {
          segment: PhotostreamSegment;
        },
      ]
    >;

    showScrollbar?: boolean;
    /** `true` if this asset grid responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: PhotostreamManager;

    showSkeleton?: boolean;
    isShowDeleteConfirmation?: boolean;
    styleMarginRightOverride?: string;

    header?: Snippet<[scrollToFunction: (top: number) => void]>;
    children?: Snippet;
    empty?: Snippet;
    handleTimelineScroll?: () => void;
  }

  let {
    segment,

    enableRouting,
    timelineManager = $bindable(),
    showSkeleton = $bindable(true),
    styleMarginRightOverride,
    isShowDeleteConfirmation = $bindable(false),
    showScrollbar,
    children,
    skeleton,
    empty,
    header,
    handleTimelineScroll = () => {},
  }: Props = $props();

  let { gridScrollTarget } = assetViewingStore;

  let element: HTMLElement | undefined = $state();
  let timelineElement: HTMLElement | undefined = $state();

  const maxMd = $derived(mobileDevice.maxMd);
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
    updateSlidingWindow();
  };

  const scrollBy = (y: number) => {
    if (element) {
      element.scrollBy(0, y);
    }
    updateSlidingWindow();
  };

  const handleTriggeredScrollCompensation = (compensation: { heightDelta?: number; scrollTop?: number }) => {
    const { heightDelta, scrollTop } = compensation;
    if (heightDelta !== undefined) {
      scrollBy(heightDelta);
    } else if (scrollTop !== undefined) {
      scrollTo(scrollTop);
    }
    timelineManager.clearScrollCompensation();
  };

  const getAssetHeight = (assetId: string, monthGroup: PhotostreamSegment) => {
    // the following method may trigger any layouts, so need to
    // handle any scroll compensation that may have been set
    const height = monthGroup.findAssetAbsolutePosition(assetId);

    // this is in a while loop, since scrollCompensations invoke scrolls
    // which may load months, triggering more scrollCompensations. Call
    // this in a loop, until no more layouts occur.
    while (timelineManager.scrollCompensation.monthGroup) {
      handleTriggeredScrollCompensation(timelineManager.scrollCompensation);
    }
    return height;
  };

  export const scrollToAssetId = async (assetId: string) => {
    const monthGroup = await timelineManager.findSegmentForAssetId(assetId);
    if (!monthGroup) {
      return false;
    }

    const height = getAssetHeight(assetId, monthGroup);
    scrollTo(height);
    return true;
  };

  export const completeAfterNavigate = async ({ scrollToAssetQueryParam }: { scrollToAssetQueryParam: boolean }) => {
    if (timelineManager.viewportHeight === 0 || timelineManager.viewportWidth === 0) {
      // this can happen if you do the following navigation order
      // /photos?at=<id>, /photos/<id>, http://example.com, browser back, browser back
      const rect = element?.getBoundingClientRect();
      if (rect) {
        timelineManager.viewportHeight = rect.height;
        timelineManager.viewportWidth = rect.width;
      }
    }
    if (scrollToAssetQueryParam) {
      const scrollTarget = $gridScrollTarget?.at;
      let scrolled = false;
      if (scrollTarget) {
        scrolled = await scrollToAssetId(scrollTarget);
      }
      if (!scrolled) {
        // if the asset is not found, scroll to the top
        scrollTo(0);
      }
    }
    showSkeleton = false;
  };

  const updateIsScrolling = () => (timelineManager.scrolling = true);
  // Yes, updateSlideWindow() is called by the onScroll event. However, if you also just scrolled
  // by explicitly invoking element.scrollX functions, there may be a delay with enough time to
  // set the intersecting property of the monthGroup to false, then true, which causes the DOM
  // nodes to be recreated, causing bad perf, and also, disrupting focus of those elements.
  // Also note: don't throttle, debounce, or otherwise do this function async - it causes flicker
  const updateSlidingWindow = () => timelineManager.updateSlidingWindow(element?.scrollTop || 0);

  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (timelineManager.topSectionHeight = height);

  onMount(() => {
    if (!enableRouting) {
      showSkeleton = false;
    }
  });
</script>

<HotModuleReload
  onAfterUpdate={(payload: UpdatePayload) => {
    // when hmr happens, skeleton is initialized to true by default
    // normally, loading asset-grid is part of a navigation event, and the completion of
    // that event triggers a scroll-to-asset, if necessary, when then clears the skeleton.
    // this handler will run the navigation/scroll-to-asset handler when hmr is performed,
    // preventing skeleton from showing after hmr
    const finishHmr = () => {
      const asset = page.url.searchParams.get('at');
      if (asset) {
        $gridScrollTarget = { at: asset };
      }
      void completeAfterNavigate({ scrollToAssetQueryParam: true });
    };
    const assetGridUpdate = payload.updates.some((update) => update.path.endsWith('Photostream.svelte'));
    if (assetGridUpdate) {
      // wait 500ms for the update to be fully swapped in
      setTimeout(finishHmr, 500);
    }
  }}
/>

{@render header?.(scrollTo)}

<!-- Right margin MUST be equal to the width of scrubber -->
<section
  id="asset-grid"
  class={[
    'h-full overflow-y-auto outline-none',
    { 'scrollbar-hidden': !showScrollbar },
    { 'm-0': isEmpty },
    { 'ms-0': !isEmpty },
  ]}
  style:margin-right={styleMarginRightOverride}
  style:scrollbar-width={showScrollbar ? 'auto' : 'none'}
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

    {#each timelineManager.months as monthGroup (monthGroup.id)}
      {@const shouldDisplay = monthGroup.intersecting}
      {@const absoluteHeight = monthGroup.top}
      <div
        class="month-group"
        style:height={monthGroup.height + 'px'}
        style:position="absolute"
        style:transform={`translate3d(0,${absoluteHeight}px,0)`}
        style:width="100%"
      >
        {#if !shouldDisplay}
          {@render skeleton({ segment: monthGroup })}
        {:else}
          {@render segment({
            segment: monthGroup,
            scrollToFunction: scrollTo,
            onScrollCompensationMonthInDOM: handleTriggeredScrollCompensation,
          })}
        {/if}
      </div>
    {/each}
    <!-- spacer for lead-out -->
    <div
      class="h-[60px]"
      style:position="absolute"
      style:left="0"
      style:right="0"
      style:transform={`translate3d(0,${timelineManager.timelineHeight}px,0)`}
    ></div>
  </section>
</section>

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
