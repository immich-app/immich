<script lang="ts">
  import type { AssetStore } from '$lib/stores/assets.store';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import { createEventDispatcher } from 'svelte';

  export let timelineY = 0;
  export let height = 0;
  export let assetStore: AssetStore;

  let isHover = false;
  let isDragging = false;
  let isAnimating = false;
  let hoverLabel = '';
  let clientY = 0;
  let windowHeight = 0;

  const toScrollY = (timelineY: number) => (timelineY / $assetStore.timelineHeight) * height;
  const toTimelineY = (scrollY: number) => Math.round((scrollY * $assetStore.timelineHeight) / height);

  const HOVER_DATE_HEIGHT = 30;

  $: hoverY = height - windowHeight + clientY;
  $: scrollY = toScrollY(timelineY);
  $: segments = $assetStore.buckets.map((bucket) => ({
    count: bucket.assets.length,
    height: toScrollY(bucket.bucketHeight),
    timeGroup: bucket.bucketDate,
  }));

  const dispatch = createEventDispatcher<{ scrollTimeline: number }>();
  const scrollTimeline = () => dispatch('scrollTimeline', toTimelineY(hoverY));

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

<svelte:window bind:innerHeight={windowHeight} />

<!-- svelte-ignore a11y-no-static-element-interactions -->

{#if $assetStore.timelineHeight > height}
  <div
    id="immich-scrubbable-scrollbar"
    class="fixed right-0 z-[1] select-none bg-immich-bg hover:cursor-row-resize"
    style:width={isDragging ? '100vw' : '60px'}
    style:height={height + 'px'}
    style:background-color={isDragging ? 'transparent' : 'transparent'}
    draggable="false"
    on:mouseenter={() => (isHover = true)}
    on:mouseleave={() => {
      isHover = false;
      isDragging = false;
    }}
    on:mouseenter={({ clientY, buttons }) => handleMouseEvent({ clientY, isDragging: !!buttons })}
    on:mousemove={({ clientY }) => handleMouseEvent({ clientY })}
    on:mousedown={({ clientY }) => handleMouseEvent({ clientY, isDragging: true })}
    on:mouseup={({ clientY }) => handleMouseEvent({ clientY, isDragging: false })}
  >
    {#if isHover}
      <div
        class="pointer-events-none absolute right-0 z-[100] w-[100px] rounded-tl-md border-b-2 border-immich-primary bg-immich-bg py-1 pl-1 pr-6 text-sm font-medium shadow-lg dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
        style:top="{Math.max(hoverY - HOVER_DATE_HEIGHT, 0)}px"
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
    {#each segments as segment, index (segment.timeGroup)}
      {@const date = fromLocalDateTime(segment.timeGroup)}
      {@const year = date.year}
      {@const label = `${date.toLocaleString({ month: 'short' })} ${year}`}
      {@const lastGroupYear = fromLocalDateTime(segments[index - 1]?.timeGroup).year}

      <!-- Check if the next three segments are different years then don't render
      to avoid overlapse -->
      {@const canRenderYear = segments.slice(index + 1, index + 3).reduce((_, curr) => {
        const nextGroupYear = fromLocalDateTime(curr.timeGroup).year;

        if (nextGroupYear !== year || curr.height < 1) {
          return false;
        }

        return true;
      }, true)}

      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        id="time-segment"
        class="relative"
        style:height={segment.height + 'px'}
        aria-label={segment.timeGroup + ' ' + segment.count}
        on:mousemove={() => (hoverLabel = label)}
      >
        {#if lastGroupYear !== year && canRenderYear}
          <div
            aria-label={segment.timeGroup + ' ' + segment.count}
            class="absolute right-0 z-10 pr-5 text-xs font-medium dark:text-immich-dark-fg font-mono"
          >
            {year}
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
