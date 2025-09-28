<script lang="ts">
  import { page } from '$app/state';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import HotModuleReload from '$lib/elements/HotModuleReload.svelte';
  import type { PhotostreamManager } from '$lib/managers/photostream-manager/PhotostreamManager.svelte';
  import type { PhotostreamSegment } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    segment: Snippet<
      [
        {
          segment: PhotostreamSegment;
          scrollToFunction: (top: number) => void;
        },
      ]
    >;
    skeleton: Snippet<
      [
        {
          segment: PhotostreamSegment;
          stylePaddingHorizontalPx: number;
        },
      ]
    >;

    showScrollbar?: boolean;
    /** `true` if this asset grid responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: PhotostreamManager;

    alwaysShowScrollbar?: boolean;
    showSkeleton?: boolean;
    isShowDeleteConfirmation?: boolean;

    header?: Snippet<[scrollToFunction: (top: number) => void]>;
    children?: Snippet;
    empty?: Snippet;
    handleTimelineScroll?: () => void;

    smallHeaderHeight?: {
      rowHeight: number;
      headerHeight: number;
    };

    largeHeaderHeight?: {
      rowHeight: number;
      headerHeight: number;
    };
    stylePaddingHorizontalPx?: number;
    styleMarginTopPx?: number;
    styleMarginRightPx?: number;
  }

  let {
    segment,

    enableRouting,
    timelineManager = $bindable(),
    showSkeleton = $bindable(true),
    showScrollbar,
    styleMarginRightPx = 0,
    stylePaddingHorizontalPx = 0,
    styleMarginTopPx = 0,
    alwaysShowScrollbar,

    isShowDeleteConfirmation = $bindable(false),

    children,
    skeleton,
    empty,
    header,
    handleTimelineScroll = () => {},
    smallHeaderHeight = {
      rowHeight: 100,
      headerHeight: 32,
    },
    largeHeaderHeight = {
      rowHeight: 235,
      headerHeight: 48,
    },
  }: Props = $props();

  let { gridScrollTarget } = assetViewingStore;

  let element: HTMLElement | undefined = $state();
  let timelineElement: HTMLElement | undefined = $state();

  const maxMd = $derived(mobileDevice.maxMd);
  const isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);

  $effect(() => {
    const layoutOptions = maxMd ? smallHeaderHeight : largeHeaderHeight;
    timelineManager.setLayoutOptions(layoutOptions);
  });

  const scrollTo = (top: number) => {
    if (element) {
      element.scrollTo({ top });
    }
    updateSlidingWindow();
  };

  export const scrollToAssetId = async (assetId: string) => {
    const monthGroup = await timelineManager.findSegmentForAssetId(assetId);
    if (!monthGroup) {
      return false;
    }

    const height = monthGroup.findAssetAbsolutePosition(assetId);
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
  onAfterUpdate={() => {
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

    // wait 500ms for the update to be fully swapped in
    setTimeout(finishHmr, 500);
  }}
/>

{@render header?.(scrollTo)}

<!-- Right margin MUST be equal to the width of scrubber -->
<photostream
  id="asset-grid"
  class={[
    'overflow-y-auto outline-none',
    { 'scrollbar-hidden': !showScrollbar },
    { 'overflow-y-scroll': alwaysShowScrollbar },
    { 'm-0': isEmpty },
    { 'ms-0': !isEmpty },
  ]}
  style:height={`calc(100% - ${styleMarginTopPx}px)`}
  style:margin-top={styleMarginTopPx + 'px'}
  style:margin-right={styleMarginRightPx + 'px'}
  style:padding-left={stylePaddingHorizontalPx + 'px'}
  style:padding-right={stylePaddingHorizontalPx + 'px'}
  style:scrollbar-width={showScrollbar ? 'thin' : 'none'}
  tabindex="-1"
  bind:clientHeight={timelineManager.viewportHeight}
  bind:clientWidth={
    null, (v: number) => ((timelineManager.viewportWidth = v - stylePaddingHorizontalPx * 2), updateSlidingWindow())
  }
  bind:this={element}
  onscroll={() => (handleTimelineScroll(), updateSlidingWindow(), updateIsScrolling())}
>
  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:relative={true}
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
      {@const shouldDisplay = monthGroup.intersecting && monthGroup.isLoaded}
      {@const absoluteHeight = monthGroup.top}

      <div
        class="month-group"
        style:margin-bottom={timelineManager.createLayoutOptions().spacing + 'px'}
        style:position="absolute"
        style:transform={`translate3d(0,${absoluteHeight}px,0)`}
        style:height={`${monthGroup.height}px`}
        style:width="100%"
      >
        {#if !shouldDisplay}
          {@render skeleton({ segment: monthGroup, stylePaddingHorizontalPx })}
        {:else}
          {@render segment({
            segment: monthGroup,
            scrollToFunction: scrollTo,
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
</photostream>

<style>
  photostream {
    display: block;
  }
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
