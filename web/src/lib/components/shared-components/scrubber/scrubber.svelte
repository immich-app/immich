<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { AssetStore, LiteBucket } from '$lib/stores/assets-store.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { getFocusable } from '$lib/utils/focus-util';
  import { fromLocalDateTime, type ScrubberListener } from '$lib/utils/timeline-util';
  import { mdiPlay } from '@mdi/js';
  import { clamp } from 'lodash-es';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    timelineTopOffset?: number;
    timelineBottomOffset?: number;
    height?: number;
    assetStore: AssetStore;
    scrubOverallPercent?: number;
    scrubBucketPercent?: number;
    scrubBucket?: { bucketDate: string | undefined };
    leadout?: boolean;
    scrubberWidth?: number;
    onScrub?: ScrubberListener;
    onScrubKeyDown?: (event: KeyboardEvent, element: HTMLElement) => void;
    startScrub?: ScrubberListener;
    stopScrub?: ScrubberListener;
  }

  let {
    timelineTopOffset = 0,
    timelineBottomOffset = 0,
    height = 0,
    assetStore,
    scrubOverallPercent = 0,
    scrubBucketPercent = 0,
    scrubBucket = undefined,
    leadout = false,
    onScrub = undefined,
    onScrubKeyDown = undefined,
    startScrub = undefined,
    stopScrub = undefined,
    scrubberWidth = $bindable(),
  }: Props = $props();

  let isHover = $state(false);
  let isDragging = $state(false);
  let isHoverOnPaddingTop = $state(false);
  let isHoverOnPaddingBottom = $state(false);
  let hoverY = $state(0);
  let clientY = 0;
  let windowHeight = $state(0);
  let scrollBar: HTMLElement | undefined = $state();

  const toScrollY = (percent: number) => percent * (height - (PADDING_TOP + PADDING_BOTTOM));
  const toTimelineY = (scrollY: number) => scrollY / (height - (PADDING_TOP + PADDING_BOTTOM));

  const usingMobileDevice = $derived(mobileDevice.pointerCoarse);

  const MOBILE_WIDTH = 20;
  const DESKTOP_WIDTH = 60;
  const HOVER_DATE_HEIGHT = 31.75;
  const PADDING_TOP = $derived(usingMobileDevice ? 25 : HOVER_DATE_HEIGHT);
  const PADDING_BOTTOM = $derived(usingMobileDevice ? 25 : 10);
  const MIN_YEAR_LABEL_DISTANCE = 16;
  const MIN_DOT_DISTANCE = 8;

  const width = $derived.by(() => {
    if (isDragging) {
      return '100vw';
    }
    if (usingMobileDevice) {
      if (assetStore.scrolling) {
        return MOBILE_WIDTH + 'px';
      }
      return '0px';
    }
    return DESKTOP_WIDTH + 'px';
  });
  $effect(() => {
    scrubberWidth = usingMobileDevice ? MOBILE_WIDTH : DESKTOP_WIDTH;
  });

  const toScrollFromBucketPercentage = (
    scrubBucket: { bucketDate: string | undefined } | undefined,
    scrubBucketPercent: number,
    scrubOverallPercent: number,
  ) => {
    if (scrubBucket) {
      let offset = relativeTopOffset;
      let match = false;
      for (const segment of segments) {
        if (segment.bucketDate === scrubBucket.bucketDate) {
          offset += scrubBucketPercent * segment.height;
          match = true;
          break;
        }
        offset += segment.height;
      }
      if (!match) {
        offset += scrubBucketPercent * relativeBottomOffset;
      }
      return offset;
    } else if (leadout) {
      let offset = relativeTopOffset;
      for (const segment of segments) {
        offset += segment.height;
      }
      offset += scrubOverallPercent * relativeBottomOffset;
      return offset;
    } else {
      return scrubOverallPercent * (height - (PADDING_TOP + PADDING_BOTTOM));
    }
  };
  let scrollY = $derived(toScrollFromBucketPercentage(scrubBucket, scrubBucketPercent, scrubOverallPercent));
  let timelineFullHeight = $derived(assetStore.scrubberTimelineHeight + timelineTopOffset + timelineBottomOffset);
  let relativeTopOffset = $derived(toScrollY(timelineTopOffset / timelineFullHeight));
  let relativeBottomOffset = $derived(toScrollY(timelineBottomOffset / timelineFullHeight));

  type Segment = {
    count: number;
    height: number;
    dateFormatted: string;
    bucketDate: string;
    date: DateTime;
    hasLabel: boolean;
    hasDot: boolean;
  };

  const calculateSegments = (buckets: LiteBucket[]) => {
    let height = 0;
    let dotHeight = 0;

    let segments: Segment[] = [];
    let previousLabeledSegment: Segment | undefined;

    let top = 0;
    for (const [i, bucket] of buckets.entries()) {
      const scrollBarPercentage = bucket.bucketHeight / timelineFullHeight;

      const segment = {
        top,
        count: bucket.assetCount,
        height: toScrollY(scrollBarPercentage),
        bucketDate: bucket.bucketDate,
        date: fromLocalDateTime(bucket.bucketDate),
        dateFormatted: bucket.bucketDateFormattted,
        hasLabel: false,
        hasDot: false,
      };
      top += segment.height;
      if (i === 0) {
        segment.hasDot = true;
        segment.hasLabel = true;
        previousLabeledSegment = segment;
      } else {
        if (previousLabeledSegment?.date?.year !== segment.date.year && height > MIN_YEAR_LABEL_DISTANCE) {
          height = 0;
          segment.hasLabel = true;
          previousLabeledSegment = segment;
        }
        if (i !== 1 && segment.height > 5 && dotHeight > MIN_DOT_DISTANCE) {
          segment.hasDot = true;
          dotHeight = 0;
        }

        height += segment.height;
        dotHeight += segment.height;
      }
      segments.push(segment);
    }

    return segments;
  };
  let activeSegment: HTMLElement | undefined = $state();
  const segments = $derived(calculateSegments(assetStore.scrubberBuckets));
  const hoverLabel = $derived.by(() => {
    if (isHoverOnPaddingTop) {
      return segments.at(0)?.dateFormatted;
    }
    if (isHoverOnPaddingBottom) {
      return segments.at(-1)?.dateFormatted;
    }
    return activeSegment?.dataset.label;
  });
  const bucketDate = $derived(activeSegment?.dataset.timeSegmentBucketDate);
  const scrollSegment = $derived.by(() => {
    const y = scrollY;
    let cur = relativeTopOffset;
    for (const segment of segments) {
      if (y < cur + segment.height) {
        return segment;
      }
      cur += segment.height;
    }
    return null;
  });
  const scrollHoverLabel = $derived(scrollSegment?.dateFormatted || '');

  const findElementBestY = (elements: Element[], y: number, ...ids: string[]) => {
    if (ids.length === 0) {
      return undefined;
    }
    const filtered = elements.filter((element) => {
      if (element instanceof HTMLElement && element.dataset.id) {
        return ids.includes(element.dataset.id);
      }
      return false;
    }) as HTMLElement[];
    const imperfect = [];
    for (const element of filtered) {
      const boundingClientRect = element.getBoundingClientRect();
      if (boundingClientRect.y > y) {
        imperfect.push({
          element,
          boundingClientRect,
        });
        continue;
      }
      if (y <= boundingClientRect.y + boundingClientRect.height) {
        return {
          element,
          boundingClientRect,
        };
      }
    }
    return imperfect.at(0);
  };

  const getActive = (x: number, y: number) => {
    const elements = document.elementsFromPoint(x, y);
    const bestElement = findElementBestY(elements, y, 'time-segment', 'lead-in', 'lead-out');

    if (bestElement) {
      const segment = bestElement.element;
      const boundingClientRect = bestElement.boundingClientRect;
      const sy = boundingClientRect.y;
      const relativeY = y - sy;
      const bucketPercentY = relativeY / boundingClientRect.height;
      return {
        isOnPaddingTop: false,
        isOnPaddingBottom: false,
        segment,
        bucketPercentY,
      };
    }

    // check if padding
    const bar = findElementBestY(elements, 0, 'immich-scrubbable-scrollbar');
    let isOnPaddingTop = false;
    let isOnPaddingBottom = false;

    if (bar) {
      const sr = bar.boundingClientRect;
      if (y < sr.top + PADDING_TOP) {
        isOnPaddingTop = true;
      }
      if (y > sr.bottom - PADDING_BOTTOM - 1) {
        isOnPaddingBottom = true;
      }
    }

    return {
      isOnPaddingTop,
      isOnPaddingBottom,
      segment: undefined,
      bucketPercentY: 0,
    };
  };

  const handleMouseEvent = (event: { clientY: number; isDragging?: boolean }) => {
    const wasDragging = isDragging;

    isDragging = event.isDragging ?? isDragging;
    clientY = event.clientY;

    if (!scrollBar) {
      return;
    }

    const rect = scrollBar.getBoundingClientRect()!;
    const lower = 0;
    const upper = rect?.height - (PADDING_TOP + PADDING_BOTTOM);
    hoverY = clamp(clientY - rect?.top - PADDING_TOP, lower, upper);
    const x = rect!.left + rect!.width / 2;
    const { segment, bucketPercentY, isOnPaddingTop, isOnPaddingBottom } = getActive(x, clientY);
    activeSegment = segment;
    isHoverOnPaddingTop = isOnPaddingTop;
    isHoverOnPaddingBottom = isOnPaddingBottom;

    const scrollPercent = toTimelineY(hoverY);
    if (wasDragging === false && isDragging) {
      void startScrub?.(bucketDate, scrollPercent, bucketPercentY);
      void onScrub?.(bucketDate, scrollPercent, bucketPercentY);
    }

    if (wasDragging && !isDragging) {
      void stopScrub?.(bucketDate, scrollPercent, bucketPercentY);
      return;
    }

    if (!isDragging) {
      return;
    }

    void onScrub?.(bucketDate, scrollPercent, bucketPercentY);
  };
  const getTouch = (event: TouchEvent) => {
    if (event.touches.length === 1) {
      return event.touches[0];
    }
    return null;
  };
  const onTouchStart = (event: TouchEvent) => {
    const touch = getTouch(event);
    if (!touch) {
      isHover = false;
      return;
    }
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const isHoverScrollbar =
      findElementBestY(elements, 0, 'immich-scrubbable-scrollbar', 'time-label', 'lead-in', 'lead-out') !== undefined;

    isHover = isHoverScrollbar;

    if (isHoverScrollbar) {
      handleMouseEvent({
        clientY: touch.clientY,
        isDragging: true,
      });
    }
  };
  const onTouchEnd = () => {
    if (isHover) {
      isHover = false;
    }
    handleMouseEvent({
      clientY,
      isDragging: false,
    });
  };
  const onTouchMove = (event: TouchEvent) => {
    const touch = getTouch(event);
    if (touch && isDragging) {
      handleMouseEvent({
        clientY: touch.clientY,
      });
    } else {
      isHover = false;
    }
  };
  onMount(() => {
    document.addEventListener('touchmove', onTouchMove, true);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
    };
  });

  onMount(() => {
    document.addEventListener('touchstart', onTouchStart, true);
    document.addEventListener('touchend', onTouchEnd, true);
    return () => {
      document.addEventListener('touchstart', onTouchStart, true);
      document.addEventListener('touchend', onTouchEnd, true);
    };
  });

  const isTabEvent = (event: KeyboardEvent) => event?.key === 'Tab';
  const isTabForward = (event: KeyboardEvent) => isTabEvent(event) && !event.shiftKey;
  const isTabBackward = (event: KeyboardEvent) => isTabEvent(event) && event.shiftKey;
  const isArrowUp = (event: KeyboardEvent) => event?.key === 'ArrowUp';
  const isArrowDown = (event: KeyboardEvent) => event?.key === 'ArrowDown';

  const handleFocus = (event: KeyboardEvent) => {
    const forward = isTabForward(event);
    const backward = isTabBackward(event);
    if (forward || backward) {
      event.preventDefault();

      const focusable = getFocusable(document);
      if (scrollBar) {
        const index = focusable.indexOf(scrollBar);
        if (index !== -1) {
          let next: HTMLElement;
          next = forward
            ? (focusable[(index + 1) % focusable.length] as HTMLElement)
            : (focusable[(index - 1) % focusable.length] as HTMLElement);
          next.focus();
        }
      }
    }
  };
  const handleAccessibility = (event: KeyboardEvent) => {
    if (isTabEvent(event)) {
      handleFocus(event);
      return true;
    }
    if (isArrowUp(event)) {
      let next;
      if (scrollSegment) {
        const idx = segments.indexOf(scrollSegment);
        next = idx === -1 ? segments.at(-2) : segments[idx - 1];
      } else {
        next = segments.at(-2);
      }
      if (next) {
        event.preventDefault();
        void onScrub?.(next.bucketDate, -1, 0);
        return true;
      }
    }
    if (isArrowDown(event) && scrollSegment) {
      const idx = segments.indexOf(scrollSegment);
      if (idx !== -1) {
        const next = segments[idx + 1];
        if (next) {
          event.preventDefault();
          void onScrub?.(next.bucketDate, -1, 0);
          return true;
        }
      }
    }
    return false;
  };
  const keydown = (event: KeyboardEvent) => {
    let handled = handleAccessibility(event);
    if (!handled) {
      onScrubKeyDown?.(event, event.currentTarget as HTMLElement);
    }
  };
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  onmousemove={({ clientY }) => (isDragging || isHover) && handleMouseEvent({ clientY })}
  onmousedown={({ clientY }) => isHover && handleMouseEvent({ clientY, isDragging: true })}
  onmouseup={({ clientY }) => handleMouseEvent({ clientY, isDragging: false })}
/>

<div
  transition:fly={{ x: 50, duration: 250 }}
  tabindex="0"
  role="scrollbar"
  aria-controls="time-label"
  aria-valuetext={hoverLabel}
  aria-valuenow={scrollY + PADDING_TOP}
  aria-valuemax={toScrollY(1)}
  aria-valuemin={toScrollY(0)}
  data-id="immich-scrubbable-scrollbar"
  class="absolute right-0 z-[1] select-none bg-immich-bg hover:cursor-row-resize"
  style:padding-top={PADDING_TOP + 'px'}
  style:padding-bottom={PADDING_BOTTOM + 'px'}
  style:width
  style:height={height + 'px'}
  style:background-color={isDragging ? 'transparent' : 'transparent'}
  bind:this={scrollBar}
  onmouseenter={() => (isHover = true)}
  onmouseleave={() => (isHover = false)}
  onkeydown={keydown}
  draggable="false"
>
  {#if !usingMobileDevice && hoverLabel && (isHover || isDragging)}
    <div
      id="time-label"
      class={[
        { 'border-b-2': isDragging },
        { 'rounded-bl-md': !isDragging },
        'truncate opacity-85 pointer-events-none absolute right-0 z-[100] min-w-20 max-w-64 w-fit rounded-tl-md  border-immich-primary bg-immich-bg py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg',
      ]}
      style:top="{hoverY + 2}px"
    >
      {hoverLabel}
    </div>
  {/if}
  {#if usingMobileDevice && ((assetStore.scrolling && scrollHoverLabel) || isHover || isDragging)}
    <div
      id="time-label"
      class="rounded-l-full w-[32px] pl-2 text-white bg-immich-primary dark:bg-gray-600 hover:cursor-pointer select-none"
      style:top="{PADDING_TOP + (scrollY - 50 / 2)}px"
      style:height="50px"
      style:right="0"
      style:position="absolute"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
    >
      <Icon path={mdiPlay} size="20" class="-rotate-90 relative top-[9px] -right-[2px]" />
      <Icon path={mdiPlay} size="20" class="rotate-90 relative top-[1px] -right-[2px]" />
      {#if (assetStore.scrolling && scrollHoverLabel) || isHover || isDragging}
        <p
          transition:fade={{ duration: 200 }}
          style:bottom={50 / 2 - 30 / 2 + 'px'}
          style:right="36px"
          style:width="fit-content"
          class="truncate pointer-events-none absolute text-sm rounded-full w-[32px] py-2 px-4 text-white bg-immich-primary/90 dark:bg-gray-500 hover:cursor-pointer select-none font-semibold"
        >
          {scrollHoverLabel}
        </p>
      {/if}
    </div>
  {/if}
  <!-- Scroll Position Indicator Line -->
  {#if !usingMobileDevice && !isDragging}
    <div
      class="absolute right-0 h-[2px] w-10 bg-immich-primary dark:bg-immich-dark-primary"
      style:top="{scrollY + PADDING_TOP - 2}px"
    >
      {#if assetStore.scrolling && scrollHoverLabel && !isHover}
        <p
          transition:fade={{ duration: 200 }}
          class="truncate pointer-events-none absolute right-0 bottom-0 z-[100] min-w-20 max-w-64 w-fit rounded-tl-md border-b-2 border-immich-primary bg-immich-bg/80 py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray/80 dark:text-immich-dark-fg"
        >
          {scrollHoverLabel}
        </p>
      {/if}
    </div>
  {/if}
  <div
    class="relative z-10"
    style:height={relativeTopOffset + 'px'}
    data-id="lead-in"
    data-time-segment-bucket-date={segments.at(0)?.date}
    data-label={segments.at(0)?.dateFormatted}
  >
    {#if relativeTopOffset > 6}
      <div class="absolute right-[0.75rem] h-[4px] w-[4px] rounded-full bg-gray-300"></div>
    {/if}
  </div>
  <!-- Time Segment -->
  {#each segments as segment (segment.date)}
    <div
      class="relative"
      data-id="time-segment"
      data-time-segment-bucket-date={segment.date}
      data-label={segment.dateFormatted}
      style:height={segment.height + 'px'}
    >
      {#if !usingMobileDevice}
        {#if segment.hasLabel}
          <div class="absolute right-[1.25rem] top-[-16px] z-10 text-[12px] dark:text-immich-dark-fg font-immich-mono">
            {segment.date.year}
          </div>
        {/if}
        {#if segment.hasDot}
          <div class="absolute right-[0.75rem] bottom-0 h-[4px] w-[4px] rounded-full bg-gray-300"></div>
        {/if}
      {/if}
    </div>
  {/each}
  <div data-id="lead-out" class="relative" style:height={relativeBottomOffset + 'px'}></div>
</div>

<style>
</style>
