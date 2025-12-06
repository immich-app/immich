<script lang="ts">
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { ScrubberMonth, ViewportTopMonth } from '$lib/managers/timeline-manager/types';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { getTabbable } from '$lib/utils/focus-util';
  import { type ScrubberListener } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiPlay } from '@mdi/js';
  import { clamp } from 'lodash-es';
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    invisible: boolean;
    /** Offset from the top of the timeline (e.g., for headers) */
    timelineTopOffset?: number;
    /** Offset from the bottom of the timeline (e.g., for footers) */
    timelineBottomOffset?: number;
    /** Total height of the scrubber component */
    height?: number;
    /** Timeline manager instance that controls the timeline state */
    timelineManager: TimelineManager;
    /** Overall scroll percentage through the entire timeline (0-1), used when no specific month is targeted */
    timelineScrollPercent?: number;
    /** The percentage of scroll through the month that is currently intersecting the top boundary of the viewport */
    viewportTopMonthScrollPercent?: number;
    /** The year/month of the timeline month at the top of the viewport */
    viewportTopMonth?: ViewportTopMonth;

    /** Width of the scrubber component in pixels (bindable for parent component margin adjustments) */
    scrubberWidth?: number;
    /** Callback fired when user interacts with the scrubber to navigate */
    onScrub?: ScrubberListener;
    /** Callback fired when keyboard events occur on the scrubber */
    onScrubKeyDown?: (event: KeyboardEvent, element: HTMLElement) => void;
    /** Callback fired when scrubbing starts */
    startScrub?: ScrubberListener;
    /** Callback fired when scrubbing stops */
    stopScrub?: ScrubberListener;
  }

  let {
    invisible = false,
    timelineTopOffset = 0,
    timelineBottomOffset = 0,
    height = 0,
    timelineManager,
    timelineScrollPercent = 0,
    viewportTopMonthScrollPercent = 0,
    viewportTopMonth = undefined,
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
      if (timelineManager.scrolling) {
        return MOBILE_WIDTH + 'px';
      }
      return '0px';
    }
    return DESKTOP_WIDTH + 'px';
  });
  $effect(() => {
    scrubberWidth = usingMobileDevice ? MOBILE_WIDTH : DESKTOP_WIDTH;
  });

  const toScrollFromMonthGroupPercentage = (
    scrubberMonth: ViewportTopMonth,
    scrubberMonthPercent: number,
    scrubOverallPercent: number,
  ) => {
    if (scrubberMonth === 'lead-in') {
      return relativeTopOffset * scrubberMonthPercent;
    } else if (scrubberMonth === 'lead-out') {
      let offset = relativeTopOffset;
      for (const segment of segments) {
        offset += segment.height;
      }
      return offset + relativeBottomOffset * scrubberMonthPercent;
    } else if (scrubberMonth) {
      let offset = relativeTopOffset;
      let match = false;
      for (const segment of segments) {
        if (segment.month === scrubberMonth.month && segment.year === scrubberMonth.year) {
          offset += scrubberMonthPercent * segment.height;
          match = true;
          break;
        }
        offset += segment.height;
      }
      if (!match) {
        offset += scrubberMonthPercent * relativeBottomOffset;
      }
      return offset;
    } else {
      return scrubOverallPercent * (height - (PADDING_TOP + PADDING_BOTTOM));
    }
  };
  const scrollY = $derived(
    toScrollFromMonthGroupPercentage(viewportTopMonth, viewportTopMonthScrollPercent, timelineScrollPercent),
  );
  const timelineFullHeight = $derived(timelineManager.scrubberTimelineHeight);
  const relativeTopOffset = $derived(toScrollY(timelineTopOffset / timelineFullHeight));
  const relativeBottomOffset = $derived(toScrollY(timelineBottomOffset / timelineFullHeight));

  type Segment = {
    count: number;
    height: number;
    dateFormatted: string;
    year: number;
    month: number;
    hasLabel: boolean;
    hasDot: boolean;
  };

  const calculateSegments = (months: ScrubberMonth[]) => {
    let verticalSpanWithoutLabel = 0;
    let verticalSpanWithoutDot = 0;

    let segments: Segment[] = [];
    let previousLabeledSegment: Segment | undefined;

    let top = 0;

    // Process months in reverse order to pick labels, then reverse for display
    const reversed = [...months].reverse();

    for (const scrubMonth of reversed) {
      const scrollBarPercentage = scrubMonth.height / timelineFullHeight;

      const segment = {
        top,
        count: scrubMonth.assetCount,
        height: toScrollY(scrollBarPercentage),
        dateFormatted: scrubMonth.title,
        year: scrubMonth.year,
        month: scrubMonth.month,
        hasLabel: false,
        hasDot: false,
      };
      top += segment.height;
      if (previousLabeledSegment) {
        if (previousLabeledSegment.year !== segment.year && verticalSpanWithoutLabel > MIN_YEAR_LABEL_DISTANCE) {
          verticalSpanWithoutLabel = 0;
          segment.hasLabel = true;
          previousLabeledSegment = segment;
        }
        if (segment.height > 5 && verticalSpanWithoutDot > MIN_DOT_DISTANCE) {
          segment.hasDot = true;
          verticalSpanWithoutDot = 0;
        }
      } else {
        segment.hasDot = true;
        segment.hasLabel = true;
        previousLabeledSegment = segment;
      }
      verticalSpanWithoutLabel += segment.height;
      verticalSpanWithoutDot += segment.height;
      segments.push(segment);
    }
    segments.reverse();

    return segments;
  };
  let activeSegment: HTMLElement | undefined = $state();
  const segments = $derived(calculateSegments(timelineManager.scrubberMonths));
  const hoverLabel = $derived.by(() => {
    if (isHoverOnPaddingTop) {
      return segments.at(0)?.dateFormatted;
    }
    if (isHoverOnPaddingBottom) {
      return segments.at(-1)?.dateFormatted;
    }
    return activeSegment?.dataset.label;
  });
  const segmentDate: ViewportTopMonth = $derived.by(() => {
    if (activeSegment?.dataset.id === 'lead-in') {
      return 'lead-in';
    }
    if (activeSegment?.dataset.id === 'lead-out') {
      return 'lead-out';
    }
    if (!activeSegment?.dataset.segmentYearMonth) {
      return undefined;
    }
    const [year, month] = activeSegment.dataset.segmentYearMonth.split('-').map(Number);
    return { year, month };
  });
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
  const scrollHoverLabel = $derived.by(() => {
    if (scrollY !== undefined) {
      if (scrollY < relativeTopOffset) {
        return segments.at(0)?.dateFormatted;
      } else {
        let offset = relativeTopOffset;
        for (const segment of segments) {
          offset += segment.height;
        }
        if (scrollY > offset) {
          return segments.at(-1)?.dateFormatted;
        }
      }
    }
    return scrollSegment?.dateFormatted || '';
  });

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
      const monthGroupPercentY = relativeY / boundingClientRect.height;
      return {
        isOnPaddingTop: false,
        isOnPaddingBottom: false,
        segment,
        monthGroupPercentY,
      };
    }

    // check if padding
    const bar = findElementBestY(elements, 0, 'scrubber');
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
      monthGroupPercentY: 0,
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
    const { segment, monthGroupPercentY, isOnPaddingTop, isOnPaddingBottom } = getActive(x, clientY);
    activeSegment = segment;
    isHoverOnPaddingTop = isOnPaddingTop;
    isHoverOnPaddingBottom = isOnPaddingBottom;

    const scrubData = {
      scrubberMonth: segmentDate,
      overallScrollPercent: toTimelineY(hoverY),
      scrubberMonthScrollPercent: monthGroupPercentY,
    };
    if (wasDragging === false && isDragging) {
      void startScrub?.(scrubData);
      void onScrub?.(scrubData);
    }
    if (wasDragging && !isDragging) {
      void stopScrub?.(scrubData);
      return;
    }
    if (!isDragging) {
      return;
    }
    void onScrub?.(scrubData);
  };
  const getTouch = (event: TouchEvent) => {
    // desktop safari does not support this since Apple does not have desktop touch devices
    // eslint-disable-next-line tscompat/tscompat
    if (event.touches.length === 1) {
      // eslint-disable-next-line tscompat/tscompat
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
    // desktop safari does not support this since Apple does not have desktop touch devices
    // eslint-disable-next-line tscompat/tscompat
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const isHoverScrollbar =
      findElementBestY(elements, 0, 'scrubber', 'time-label', 'lead-in', 'lead-out') !== undefined;

    isHover = isHoverScrollbar;

    if (isHoverScrollbar) {
      handleMouseEvent({
        // eslint-disable-next-line tscompat/tscompat
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
        // eslint-disable-next-line tscompat/tscompat
        clientY: touch.clientY,
      });
    } else {
      isHover = false;
    }
  };
  onMount(() => {
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    return () => {
      document.removeEventListener('touchmove', onTouchMove, true);
    };
  });

  onMount(() => {
    document.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    document.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart, true);
      document.removeEventListener('touchend', onTouchEnd, true);
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

      const focusable = getTabbable(document.body);
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
        void onScrub?.({
          scrubberMonth: { year: next.year, month: next.month },
          overallScrollPercent: -1,
          scrubberMonthScrollPercent: 0,
        });
        return true;
      }
    }
    if (isArrowDown(event) && scrollSegment) {
      const idx = segments.indexOf(scrollSegment);
      if (idx !== -1) {
        const next = segments[idx + 1];
        if (next) {
          event.preventDefault();
          void onScrub?.({
            scrubberMonth: { year: next.year, month: next.month },
            overallScrollPercent: -1,
            scrubberMonthScrollPercent: 0,
          });
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
  data-id="scrubber"
  class="absolute end-0 z-1 select-none hover:cursor-row-resize"
  class:invisible
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
        'bg-light truncate opacity-85 pointer-events-none absolute end-0 min-w-20 max-w-64 w-fit rounded-ss-md border-b-2 border-primary py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] z-1',
      ]}
      style:top="{hoverY + 2}px"
    >
      {hoverLabel}
    </div>
  {/if}
  {#if usingMobileDevice && ((timelineManager.scrolling && scrollHoverLabel) || isHover || isDragging)}
    <div
      id="time-label"
      class="rounded-s-full w-8 ps-2 text-white bg-immich-primary dark:bg-gray-600 hover:cursor-pointer select-none"
      style:top="{PADDING_TOP + (scrollY - 50 / 2)}px"
      style:height="50px"
      style:right="0"
      style:position="absolute"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
    >
      <Icon icon={mdiPlay} size="20" class="-rotate-90 relative top-[9px] -end-0.5" />
      <Icon icon={mdiPlay} size="20" class="rotate-90 relative top-px -end-0.5" />
      {#if (timelineManager.scrolling && scrollHoverLabel) || isHover || isDragging}
        <p
          transition:fade={{ duration: 200 }}
          style:bottom={50 / 2 - 30 / 2 + 'px'}
          style:right="36px"
          style:width="fit-content"
          class="truncate pointer-events-none absolute text-sm rounded-full w-8 py-2 px-4 text-white bg-immich-primary/90 dark:bg-gray-500 hover:cursor-pointer select-none font-semibold"
        >
          {scrollHoverLabel}
        </p>
      {/if}
    </div>
  {/if}
  <!-- Scroll Position Indicator Line -->
  {#if !usingMobileDevice && !isDragging}
    <div class="absolute end-0 h-0.5 w-10 bg-primary" style:top="{scrollY + PADDING_TOP - 2}px">
      {#if timelineManager.scrolling && scrollHoverLabel && !isHover}
        <p
          transition:fade={{ duration: 200 }}
          class="truncate pointer-events-none absolute end-0 bottom-0 min-w-20 max-w-64 w-fit rounded-tl-md border-b-2 border-immich-primary bg-subtle/90 z-1 py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:text-immich-dark-fg"
        >
          {scrollHoverLabel}
        </p>
      {/if}
    </div>
  {/if}
  <div
    class="relative"
    style:height={relativeTopOffset + 'px'}
    data-id="lead-in"
    data-label={segments.at(0)?.dateFormatted}
  ></div>
  <!-- Time Segment -->
  {#each segments as segment (segment.year + '-' + segment.month)}
    <div
      class="relative"
      data-id="time-segment"
      data-segment-year-month={segment.year + '-' + segment.month}
      data-label={segment.dateFormatted}
      style:height={segment.height + 'px'}
    >
      {#if !usingMobileDevice}
        {#if segment.hasLabel}
          <div class="absolute end-5 text-[12px] dark:text-immich-dark-fg font-immich-mono bottom-0">
            {segment.year}
          </div>
        {/if}
        {#if segment.hasDot}
          <div class="absolute end-3 bottom-0 h-1 w-1 rounded-full bg-gray-300"></div>
        {/if}
      {/if}
    </div>
  {/each}
  <div
    data-id="lead-out"
    class="relative"
    style:height={relativeBottomOffset + 'px'}
    data-label={segments.at(-1)?.dateFormatted}
  ></div>
</div>
