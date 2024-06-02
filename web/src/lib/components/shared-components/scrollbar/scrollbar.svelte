<script lang="ts">
  import type { AssetStore, AssetBucket } from '$lib/stores/assets.store';
  import type { DateTime } from 'luxon';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import { createEventDispatcher } from 'svelte';
  import { clamp } from 'lodash-es';
  import { locale } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';

  export let timelineY = 0;
  export let height = 0;
  export let assetStore: AssetStore;

  let isHover = false;
  let isDragging = false;
  let isAnimating = false;
  let hoverLabel = '';
  let hoverY = 0;
  let clientY = 0;
  let windowHeight = 0;
  let scrollBar: HTMLElement | undefined;

  const toScrollY = (timelineY: number) => (timelineY / $assetStore.timelineHeight) * height;
  const toTimelineY = (scrollY: number) => Math.round((scrollY * $assetStore.timelineHeight) / height);

  const HOVER_DATE_HEIGHT = 30;
  const MIN_YEAR_LABEL_DISTANCE = 16;

  $: {
    hoverY = clamp(height - windowHeight + clientY, 0, height);
    if (scrollBar) {
      const rect = scrollBar.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + Math.min(hoverY, height - 1);
      updateLabel(x, y);
    }
  }

  $: scrollY = toScrollY(timelineY);

  class Segment {
    public count = 0;
    public height = 0;
    public timeGroup = '';
    public date!: DateTime;
    public hasLabel = false;
  }

  const calculateSegments = (buckets: AssetBucket[]) => {
    let height = 0;
    let previous: Segment;
    return buckets.map((bucket) => {
      const segment = new Segment();
      segment.count = bucket.assets.length;
      segment.height = toScrollY(bucket.bucketHeight);
      segment.timeGroup = bucket.bucketDate;
      segment.date = fromLocalDateTime(segment.timeGroup);

      if (previous?.date.year !== segment.date.year && height > MIN_YEAR_LABEL_DISTANCE) {
        previous.hasLabel = true;
        height = 0;
      }

      height += segment.height;
      previous = segment;
      return segment;
    });
  };

  $: segments = calculateSegments($assetStore.buckets);

  const dispatch = createEventDispatcher<{ scrollTimeline: number }>();
  const scrollTimeline = () => dispatch('scrollTimeline', toTimelineY(hoverY));

  const updateLabel = (cursorX: number, cursorY: number) => {
    const segment = document.elementsFromPoint(cursorX, cursorY).find(({ id }) => id === 'time-segment');
    if (!segment) {
      return;
    }
    const attr = (segment as HTMLElement).dataset.date;
    if (!attr) {
      return;
    }
    hoverLabel = new Date(attr).toLocaleString($locale, {
      month: 'short',
      year: 'numeric',
      timeZone: $t('utc'),
    });
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
</script>

<svelte:window
  bind:innerHeight={windowHeight}
  on:mousemove={({ clientY }) => (isDragging || isHover) && handleMouseEvent({ clientY })}
  on:mousedown={({ clientY }) => isHover && handleMouseEvent({ clientY, isDragging: true })}
  on:mouseup={({ clientY }) => handleMouseEvent({ clientY, isDragging: false })}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if $assetStore.timelineHeight > height}
  <div
    id="immich-scrubbable-scrollbar"
    class="absolute right-0 z-[1] select-none bg-immich-bg hover:cursor-row-resize"
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
        class="pointer-events-none absolute right-0 z-[100] w-[100px] rounded-tl-md border-b-2 border-immich-primary bg-immich-bg py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
        style:top="{clamp(hoverY - HOVER_DATE_HEIGHT, 0, height - HOVER_DATE_HEIGHT - 2)}px"
      >
        {hoverLabel}
      </div>
    {/if}

    <!-- Scroll Position Indicator Line -->
    {#if !isDragging}
      <div
        class="absolute right-0 h-[2px] w-10 bg-immich-primary dark:bg-immich-dark-primary"
        style:top="{scrollY}px"
      />
    {/if}
    <!-- Time Segment -->
    {#each segments as segment}
      <div
        id="time-segment"
        class="relative"
        data-date={segment.date}
        style:height={segment.height + 'px'}
        aria-label={segment.timeGroup + ' ' + segment.count}
      >
        {#if segment.hasLabel}
          <div
            aria-label={segment.timeGroup + ' ' + segment.count}
            class="absolute right-0 bottom-0 z-10 pr-5 text-[12px] dark:text-immich-dark-fg font-immich-mono"
          >
            {segment.date.year}
          </div>
        {:else if segment.height > 5}
          <div
            aria-label={segment.timeGroup + ' ' + segment.count}
            class="absolute right-0 mr-3 block h-[4px] w-[4px] rounded-full bg-gray-300"
          />
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  #immich-scrubbable-scrollbar,
  #time-segment {
    contain: layout;
  }
</style>
