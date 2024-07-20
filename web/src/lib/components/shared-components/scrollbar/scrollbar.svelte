<script lang="ts">
  import type { AssetStore, AssetBucket, BucketListener } from '$lib/stores/assets.store';
  import type { DateTime } from 'luxon';
  import { fromLocalDateTime, type ScrollBarListener } from '$lib/utils/timeline-util';
  import { clamp } from 'lodash-es';

  export let timelineTopOffset = 0;
  export let height = 0;
  export let assetStore: AssetStore;
  export let invisible = false;
  export let scrubOverallPercent: number = 0;
  export let scrubBucketPercent: number = 0;
  export let scrubBucket: AssetBucket | undefined = undefined;
  export let onScrub: ScrollBarListener | undefined = undefined;
  export let startScrub: ScrollBarListener | undefined = undefined;
  export let stopScrub: ScrollBarListener | undefined = undefined;

  let isHover = false;
  let isDragging = false;
  let hoverLabel: string | undefined;
  let bucketDate: string | undefined;
  let hoverY = 0;
  let clientY = 0;
  let windowHeight = 0;
  let scrollBar: HTMLElement | undefined;
  let segments: Segment[] = [];

  const toScrollY = (percent: number) => percent * height;
  const toTimelineY = (scrollY: number) => scrollY / height;

  const HOVER_DATE_HEIGHT = 30;
  const MIN_YEAR_LABEL_DISTANCE = 16;

  const toScrollFromBucketPercentage = (
    scrubBucket: AssetBucket | undefined,
    scrubBucketPercent: number,
    scrubOverallPercent: number,
  ) => {
    if (scrubBucket) {
      let offset = timelineTopOffset;
      for (const bucket of assetStore.buckets) {
        if (bucket === scrubBucket) {
          break;
        }
        offset += bucket.bucketHeight;
      }
      offset += scrubBucketPercent * scrubBucket.bucketHeight;
      const percent = offset / $assetStore.timelineHeight;
      const timelineY = percent * height;
      return timelineY;
    } else {
      return scrubOverallPercent * height - 2;
    }
  };
  $: scrollY = toScrollFromBucketPercentage(scrubBucket, scrubBucketPercent, scrubOverallPercent);

  const listener: BucketListener = (event) => {
    const { type } = event;
    if (type === 'viewport') {
      segments = calculateSegments($assetStore.buckets);
      assetStore.removeListener(listener);
    }
  };

  assetStore.addListener(listener);

  type Segment = {
    count: number;
    height: number;
    dateFormatted?: string;
    bucketDate?: string;
    date?: DateTime;
    hasLabel: boolean;
  };

  const calculateSegments = (buckets: AssetBucket[]) => {
    let height = 0;

    let segments: Segment[] = [];
    let previousLabeledSegment: Segment | undefined;

    for (const [i, bucket] of buckets.entries()) {
      const previous = segments[i - 1];

      const segment = {
        count: bucket.assets.length,
        height: toScrollY(bucket.scrollBarPercentage),
        bucketDate: bucket.bucketDate,
        date: fromLocalDateTime(bucket.bucketDate),
        dateFormatted: bucket.bucketDateFormattted,
        hasLabel: false,
      };

      if (i == 1) {
        height = 0;
        previous.hasLabel = true;
        previousLabeledSegment = segment;
      } else if (previousLabeledSegment?.date?.year !== segment.date.year && height > MIN_YEAR_LABEL_DISTANCE) {
        height = 0;
        segment.hasLabel = true;
        previousLabeledSegment = segment;
      }

      height += segment.height;
      segments.push(segment);
    }

    return segments;
  };

  const updateLabel = (cursorX: number, cursorY: number) => {
    const segment = document.elementsFromPoint(cursorX, cursorY).find(({ id }) => id === 'time-segment');
    if (!segment) {
      return;
    }
    hoverLabel = (segment as HTMLElement).dataset.label;
    bucketDate = (segment as HTMLElement).dataset.timeSegmentBucketDate;
  };

  const handleMouseEvent = (event: { clientY: number; isDragging?: boolean }) => {
    const wasDragging = isDragging;

    isDragging = event.isDragging ?? isDragging;
    clientY = event.clientY;

    hoverY = clamp(height - windowHeight + clientY, 0, height);

    const rect = scrollBar?.getBoundingClientRect();
    const x = rect!.left + rect!.width / 2;
    const y = rect!.top + Math.min(hoverY, height - 1);

    updateLabel(x, y);

    const segment = document.elementsFromPoint(x, y).find(({ id }) => id === 'time-segment');
    let bucketPercentY = 0;
    if (segment) {
      const sr = segment.getBoundingClientRect();
      const sy = sr.y;
      const relativeY = y - sy;
      bucketPercentY = relativeY / sr.height;
    }

    const scrollPercent = toTimelineY(hoverY);

    if (!bucketDate) {
      return;
    }
    // console.log(hoverY, scrollPercent);
    if (wasDragging === false && isDragging) {
      void startScrub?.(bucketDate, scrollPercent, bucketPercentY);
      void onScrub?.(bucketDate, scrollPercent, bucketPercentY);
    }
    if (wasDragging && !isDragging) {
      void stopScrub?.(bucketDate, scrollPercent, bucketPercentY);
    }

    if (!isDragging) {
      return;
    }
    void onScrub?.(bucketDate, scrollPercent, bucketPercentY);
  };
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  on:mousemove={({ clientY }) => (isDragging || isHover) && handleMouseEvent({ clientY })}
  on:mousedown={({ clientY }) => isHover && handleMouseEvent({ clientY, isDragging: true })}
  on:mouseup={({ clientY }) => handleMouseEvent({ clientY, isDragging: false })}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->

<div
  id="immich-scrubbable-scrollbar"
  class="absolute right-0 z-[1] select-none bg-immich-bg hover:cursor-row-resize"
  class:invisible
  style:width={isDragging ? '100vw' : '60px'}
  style:height={height + 'px'}
  style:background-color={isDragging ? 'transparent' : 'transparent'}
  draggable="false"
  bind:this={scrollBar}
  on:mouseenter={() => (isHover = true)}
  on:mouseleave={() => (isHover = false)}
>
  {#if isHover || isDragging}
    <div
      id="time-label"
      class="pointer-events-none absolute right-0 z-[100] min-w-24 w-fit whitespace-nowrap rounded-tl-md border-b-2 border-immich-primary bg-immich-bg py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
      style:top="{clamp(hoverY - HOVER_DATE_HEIGHT, 0, height - HOVER_DATE_HEIGHT - 2)}px"
    >
      {hoverLabel}
    </div>
  {/if}

  <!-- Scroll Position Indicator Line -->
  {#if !isDragging}
    <div class="absolute right-0 h-[2px] w-10 bg-immich-primary dark:bg-immich-dark-primary" style:top="{scrollY}px" />
  {/if}
  <!-- Time Segment -->
  {#each segments as segment}
    <div
      id="time-segment"
      class="relative"
      data-time-segment-bucket-date={segment.date}
      data-label={segment.dateFormatted}
      style:height={segment.height + 'px'}
      aria-label={segment.dateFormatted + ' ' + segment.count}
    >
      {#if segment.hasLabel}
        <div
          aria-label={segment.dateFormatted + ' ' + segment.count}
          class="absolute right-0 bottom-0 z-10 pr-5 text-[12px] dark:text-immich-dark-fg font-immich-mono"
        >
          {segment.date.year}
        </div>
      {:else if segment.height > 5}
        <div
          aria-label={segment.dateFormatted + ' ' + segment.count}
          class="absolute right-0 mr-3 block h-[4px] w-[4px] rounded-full bg-gray-300"
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  #immich-scrubbable-scrollbar,
  #time-segment {
    contain: layout size style;
  }
</style>
