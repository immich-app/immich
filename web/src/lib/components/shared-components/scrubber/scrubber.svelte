<script lang="ts">
  import type { AssetStore, AssetBucket, BucketListener } from '$lib/stores/assets.store';
  import type { DateTime } from 'luxon';
  import { fromLocalDateTime, type ScrubberListener } from '$lib/utils/timeline-util';
  import { clamp } from 'lodash-es';
  import { onMount } from 'svelte';

  export let timelineTopOffset = 0;
  export let timelineBottomOffset = 0;
  export let height = 0;
  export let assetStore: AssetStore;
  export let invisible = false;
  export let scrubOverallPercent: number = 0;
  export let scrubBucketPercent: number = 0;
  export let scrubBucket: { bucketDate: string | undefined } | undefined = undefined;
  export let leadout: boolean = false;
  export let onScrub: ScrubberListener | undefined = undefined;
  export let startScrub: ScrubberListener | undefined = undefined;
  export let stopScrub: ScrubberListener | undefined = undefined;

  let isHover = false;
  let isDragging = false;
  let hoverLabel: string | undefined;
  let bucketDate: string | undefined;
  let hoverY = 0;
  let clientY = 0;
  let windowHeight = 0;
  let scrollBar: HTMLElement | undefined;
  let segments: Segment[] = [];

  const toScrollY = (percent: number) => percent * (height - HOVER_DATE_HEIGHT * 2);
  const toTimelineY = (scrollY: number) => scrollY / (height - HOVER_DATE_HEIGHT * 2);

  const HOVER_DATE_HEIGHT = 31.75;
  const MIN_YEAR_LABEL_DISTANCE = 16;
  const MIN_DOT_DISTANCE = 8;

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
      // 2px is the height of the indicator
      return offset - 2;
    } else if (leadout) {
      let offset = relativeTopOffset;
      for (const segment of segments) {
        offset += segment.height;
      }
      offset += scrubOverallPercent * relativeBottomOffset;
      return offset - 2;
    } else {
      // 2px is the height of the indicator
      return scrubOverallPercent * (height - HOVER_DATE_HEIGHT * 2) - 2;
    }
  };
  $: scrollY = toScrollFromBucketPercentage(scrubBucket, scrubBucketPercent, scrubOverallPercent);
  $: timelineFullHeight = $assetStore.timelineHeight + timelineTopOffset + timelineBottomOffset;
  $: relativeTopOffset = toScrollY(timelineTopOffset / timelineFullHeight);
  $: relativeBottomOffset = toScrollY(timelineBottomOffset / timelineFullHeight);

  const listener: BucketListener = (event) => {
    const { type } = event;
    if (type === 'viewport') {
      segments = calculateSegments($assetStore.buckets);
      scrollY = toScrollFromBucketPercentage(scrubBucket, scrubBucketPercent, scrubOverallPercent);
    }
  };

  onMount(() => {
    assetStore.addListener(listener);
    return () => assetStore.removeListener(listener);
  });

  type Segment = {
    count: number;
    height: number;
    dateFormatted: string;
    bucketDate: string;
    date: DateTime;
    hasLabel: boolean;
    hasDot: boolean;
  };

  const calculateSegments = (buckets: AssetBucket[]) => {
    let height = 0;
    let dotHeight = 0;

    let segments: Segment[] = [];
    let previousLabeledSegment: Segment | undefined;

    for (const [i, bucket] of buckets.entries()) {
      const scrollBarPercentage =
        bucket.bucketHeight / ($assetStore.timelineHeight + timelineTopOffset + timelineBottomOffset);

      const segment = {
        count: bucket.assets.length,
        height: toScrollY(scrollBarPercentage),
        bucketDate: bucket.bucketDate,
        date: fromLocalDateTime(bucket.bucketDate),
        dateFormatted: bucket.bucketDateFormattted,
        hasLabel: false,
        hasDot: false,
      };

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

    hoverLabel = segments[0]?.dateFormatted;
    return segments;
  };

  const updateLabel = (segment: HTMLElement) => {
    hoverLabel = segment.dataset.label;
    bucketDate = segment.dataset.timeSegmentBucketDate;
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
    const upper = rect?.height - HOVER_DATE_HEIGHT * 2;
    hoverY = clamp(clientY - rect?.top - HOVER_DATE_HEIGHT, lower, upper);
    const x = rect!.left + rect!.width / 2;
    const elems = document.elementsFromPoint(x, clientY);
    const segment = elems.find(({ id }) => id === 'time-segment');
    let bucketPercentY = 0;
    if (segment) {
      updateLabel(segment as HTMLElement);
      const sr = segment.getBoundingClientRect();
      const sy = sr.y;
      const relativeY = clientY - sy;
      bucketPercentY = relativeY / sr.height;
    } else {
      const leadin = elems.find(({ id }) => id === 'lead-in');
      if (leadin) {
        updateLabel(leadin as HTMLElement);
      } else {
        bucketDate = undefined;
        bucketPercentY = 0;
      }
    }

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
  class={`absolute right-0 z-[1] select-none bg-immich-bg hover:cursor-row-resize`}
  style:padding-top={HOVER_DATE_HEIGHT + 'px'}
  style:padding-bottom={HOVER_DATE_HEIGHT + 'px'}
  class:invisible
  style:width={isDragging ? '100vw' : '60px'}
  style:height={height + 'px'}
  style:background-color={isDragging ? 'transparent' : 'transparent'}
  draggable="false"
  bind:this={scrollBar}
  on:mouseenter={() => (isHover = true)}
  on:mouseleave={() => (isHover = false)}
>
  {#if hoverLabel && (isHover || isDragging)}
    <div
      id="time-label"
      class="truncate opacity-85 pointer-events-none absolute right-0 z-[100] min-w-20 max-w-64 w-fit rounded-tl-md border-b-2 border-immich-primary bg-immich-bg py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
      style:top="{hoverY + 2}px"
    >
      {hoverLabel}
    </div>
  {/if}
  <!-- Scroll Position Indicator Line -->
  {#if !isDragging}
    <div
      class="absolute right-0 h-[2px] w-10 bg-immich-primary dark:bg-immich-dark-primary"
      style:top="{scrollY + HOVER_DATE_HEIGHT}px"
    />
  {/if}
  <div id="lead-in" class="relative" style:height={relativeTopOffset + 'px'} data-label={segments.at(0)?.dateFormatted}>
    {#if relativeTopOffset > 6}
      <div class="absolute right-[0.75rem] h-[4px] w-[4px] rounded-full bg-gray-300" />
    {/if}
  </div>
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
          class="absolute right-[1.25rem] top-[-16px] z-10 text-[12px] dark:text-immich-dark-fg font-immich-mono"
        >
          {segment.date.year}
        </div>
      {/if}
      {#if segment.hasDot}
        <div
          aria-label={segment.dateFormatted + ' ' + segment.count}
          class="absolute right-[0.75rem] bottom-0 h-[4px] w-[4px] rounded-full bg-gray-300"
        />
      {/if}
    </div>
  {/each}
  <div id="lead-out" class="relative" style:height={relativeBottomOffset + 'px'}></div>
</div>

<style>
  #immich-scrubbable-scrollbar,
  #time-segment {
    contain: layout size style;
  }
</style>
