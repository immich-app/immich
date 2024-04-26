<script lang="ts">
  import type { AssetStore, AssetBucket } from '$lib/stores/assets.store';
  import type { DateTime } from 'luxon';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import { onDestroy } from 'svelte';
  import { clamp } from 'lodash-es';
  import { locale } from '$lib/stores/preferences.store';
  import { isUserUsingMouse, isUserUsingTouchDevice } from '$lib/stores/input-device.store.js';
  import { fade } from 'svelte/transition';
  import { currentMediaBreakpoint, MediaBreakpoint } from '$lib/stores/media-breakpoint.store';
  import { mdiPlay } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let timelineY = 0;
  export let timelineHeight = 0;
  export let height = 0;
  export let assetStore: AssetStore;
  export let onScroll: ((position: number) => unknown) | undefined;

  const HOVER_DATE_HEIGHT = 30;
  const SMALL_SCROLL_HANDLE_HEIGHT = 50;
  const MIN_YEAR_LABEL_DISTANCE = 16;

  let isHover = false;
  let isDragging = false;
  let isAnimating = false;
  let showHandle = false;
  let hideHandleTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let hoverTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let hoverLabel = '';
  let hoverY = 0;
  let clientY = 0;
  let windowHeight = 0;

  $: useSmallScrollbar = $currentMediaBreakpoint <= MediaBreakpoint.SM || $isUserUsingTouchDevice;
  $: scrollY = toScrollBarPosY(timelineY);
  $: segments = calculateSegments($assetStore.buckets);

  $: {
    const cursorY = height - windowHeight + clientY;
    if (useSmallScrollbar) {
      hoverY = clamp(cursorY - SMALL_SCROLL_HANDLE_HEIGHT * 0.5, 0, height);
      if (height > 0) {
        // Make sure the cursor stays vertically centered:
        hoverY = clamp(hoverY + (hoverY / height) * SMALL_SCROLL_HANDLE_HEIGHT, 0, height);
      }
    } else {
      hoverY = clamp(cursorY, 0, height);
    }
    updateLabel(hoverY);
  }

  interface Segment {
    count: number;
    height: number;
    timeGroup: string;
    date: DateTime;
    hasLabel: boolean;
  }

  const calculateSegments = (buckets: AssetBucket[]) => {
    let height = 0;
    let previous: Segment | undefined;
    return buckets.map((bucket) => {
      const segment: Segment = {
        count: bucket.assets.length,
        height: toScrollBarPosY(bucket.bucketHeight),
        timeGroup: bucket.bucketDate,
        date: fromLocalDateTime(bucket.bucketDate),
        hasLabel: false,
      };

      if (previous && previous.date.year !== segment.date.year && height > MIN_YEAR_LABEL_DISTANCE) {
        previous.hasLabel = true;
        height = 0;
      }

      height += segment.height;
      previous = segment;
      return segment;
    });
  };

  const toScrollBarPosY = (timelineY: number) => {
    return timelineHeight > 0 ? height * (timelineY / timelineHeight) : 0;
  };

  const scrollTimeline = () => {
    if (onScroll && height > 0) {
      const position = (timelineHeight - height) * (hoverY / height);
      onScroll(position);
    }
  };

  const findSegment = (posY: number) => {
    if (!segments || segments.length === 0) {
      return null;
    }
    let height = 0;
    for (const segment of segments) {
      height += segment.height;
      if (posY <= height) {
        return segment;
      }
    }
    return segments.at(-1);
  };

  const updateLabel = (cursorY: number) => {
    const segment = findSegment(cursorY);
    if (segment) {
      hoverLabel = segment.date.toJSDate().toLocaleString($locale, {
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    }
  };

  const handleMouseEvent = (event: { clientY: number; isDragging?: boolean }) => {
    const wasDragging = isDragging;

    isDragging = event.isDragging ?? isDragging;
    clientY = event.clientY;

    if (wasDragging === false && isDragging) {
      scrollTimeline();
    }

    if (!isDragging || isAnimating) {
      return;
    }

    isAnimating = true;

    window.requestAnimationFrame(() => {
      scrollTimeline();
      isAnimating = false;
    });
  };

  const showSmallScrollHandle = () => {
    showHandle = true;
    hideHandleTimeoutId = clearTimeoutId(hideHandleTimeoutId);
    hideHandleTimeoutId = setTimeout(() => (showHandle = false), 1000);
  };

  const clearTimeoutId = (timeout?: ReturnType<typeof setTimeout>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    return undefined;
  };

  const setIsHover = (state: boolean, timeout?: number) => {
    hoverTimeoutId = clearTimeoutId(hoverTimeoutId);
    if (timeout) {
      hoverTimeoutId = setTimeout(() => (isHover = state), timeout);
    } else {
      isHover = state;
    }
  };

  const setIsMouseHover = (state: boolean) => {
    if ($isUserUsingMouse) {
      setIsHover(state);
    }
  };

  const onMouseDown = ({ clientY }: MouseEvent) => {
    if ($isUserUsingMouse && isHover) {
      handleMouseEvent({
        clientY,
        isDragging: true,
      });
    }
  };

  const onMouseUp = ({ clientY }: MouseEvent) => {
    if ($isUserUsingMouse) {
      handleMouseEvent({
        clientY,
        isDragging: false,
      });
    }
  };

  const onMouseMove = ({ clientY }: MouseEvent) => {
    if ($isUserUsingMouse) {
      showSmallScrollHandle();
      if (isDragging || isHover) {
        handleMouseEvent({
          clientY,
        });
      }
    }
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
      setIsHover(false);
      return;
    }
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const isHoverScrollbar = elements.some(({ id }) => {
      return id === 'immich-scrubbable-scrollbar' || id === 'immich-small-scrollbar-handle';
    });
    setIsHover(isHoverScrollbar);
    if (isHoverScrollbar) {
      handleMouseEvent({
        clientY: touch.clientY,
        isDragging: true,
      });
    }
  };

  const onTouchEnd = () => {
    if (isHover) {
      setIsHover(false, 750);
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
      setIsHover(false);
    }
  };

  onDestroy(() => {
    hideHandleTimeoutId = clearTimeoutId(hideHandleTimeoutId);
    hoverTimeoutId = clearTimeoutId(hoverTimeoutId);
  });
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  on:mousedown={onMouseDown}
  on:mousemove={onMouseMove}
  on:mouseup={onMouseUp}
  on:touchstart={onTouchStart}
  on:touchmove={onTouchMove}
  on:touchend={onTouchEnd}
  on:touchcancel={onTouchEnd}
  on:scroll|capture={showSmallScrollHandle}
/>

{#if timelineHeight > height + 50}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  {#if useSmallScrollbar && showHandle}
    {@const maxHeight = height - SMALL_SCROLL_HANDLE_HEIGHT}
    {@const positionTop = clamp(scrollY * (maxHeight / height), 0, maxHeight)}
    <div class="absolute right-0 select-none">
      <div
        id="immich-small-scrollbar-handle"
        class="rounded-l-full w-[32px] pl-2 text-white bg-gray-400 dark:bg-gray-500 hover:cursor-pointer select-none"
        style:top="{positionTop}px"
        style:height="{SMALL_SCROLL_HANDLE_HEIGHT}px"
        on:mouseenter={() => setIsMouseHover(true)}
        on:mouseleave={() => setIsMouseHover(false)}
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 200 }}
      >
        <Icon path={mdiPlay} size="20" class="-rotate-90 relative top-[9px]" />
        <Icon path={mdiPlay} size="20" class="rotate-90 relative top-[1px]" />
        {#if isDragging}
          <div
            id="small-time-label"
            in:fade={{ duration: 100 }}
            out:fade={{ duration: 200 }}
            class="absolute right-[45px] top-[0.65rem] px-3 py-1 rounded-full bg-gray-400 dark:bg-gray-500
            text-sm font-medium whitespace-nowrap"
          >
            {hoverLabel}
          </div>
        {/if}
      </div>
    </div>
  {:else if !useSmallScrollbar}
    <div
      id="immich-scrubbable-scrollbar"
      class="absolute right-0 z-[1] select-none hover:cursor-row-resize"
      style:width={isDragging ? '100vw' : '60px'}
      style:height={height + 'px'}
      draggable="false"
      on:mouseenter={() => setIsMouseHover(true)}
      on:mouseleave={() => setIsMouseHover(false)}
    >
      {#if isHover || isDragging}
        {@const positionTop = clamp(hoverY - HOVER_DATE_HEIGHT, 0, height - HOVER_DATE_HEIGHT - 2)}
        <div
          id="time-label"
          in:fade={{ duration: 100 }}
          out:fade={{ duration: 200 }}
          class="pointer-events-none w-[100px] rounded-tl-md border-b-2 border-immich-primary bg-immich-bg p-1
          text-sm font-medium dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
          style:top="{positionTop}px"
        >
          {hoverLabel}
        </div>
      {/if}

      <!-- Scroll Position Indicator Line -->
      {#if !isDragging}
        {@const positionTop = Math.min(scrollY, height - 2)}
        <div
          class="absolute right-0 h-[2px] w-10 bg-immich-primary dark:bg-immich-dark-primary"
          style:top="{positionTop}px"
        />
      {/if}
      <!-- Time Segment -->
      {#each segments as segment}
        {@const ariaLabel = `${segment.timeGroup} ${segment.count}`}
        <div id="time-segment" class="relative" style:height="{segment.height}px" aria-label={ariaLabel}>
          {#if segment.hasLabel}
            <div
              aria-label={ariaLabel}
              class="absolute right-0 bottom-0 z-10 pr-5 text-[12px] dark:text-immich-dark-fg font-immich-mono"
            >
              {segment.date.year}
            </div>
          {:else if segment.height > 5}
            <div aria-label={ariaLabel} class="absolute right-0 mr-3 block h-[4px] w-[4px] rounded-full bg-gray-300" />
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style lang="postcss">
  #immich-scrubbable-scrollbar,
  #time-segment {
    contain: layout;
  }

  #time-label,
  #immich-small-scrollbar-handle {
    @apply absolute right-0 z-[100];
  }

  #time-label,
  #small-time-label,
  #immich-small-scrollbar-handle {
    @apply shadow-[0_0_8px_rgba(0,0,0,0.25)];
  }
</style>
