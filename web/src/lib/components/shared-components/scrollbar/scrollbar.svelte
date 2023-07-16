<script lang="ts" context="module">
  type OnScrollbarClick = {
    onscrollbarclick: OnScrollbarClickDetail;
  };

  export type OnScrollbarClickDetail = {
    scrollTo: number;
  };

  type OnScrollbarDrag = {
    onscrollbardrag: OnScrollbarDragDetail;
  };

  export type OnScrollbarDragDetail = {
    scrollTo: number;
  };
</script>

<script lang="ts">
  import { albumAssetSelectionStore } from '$lib/stores/album-asset-selection.store';

  import { assetGridState } from '$lib/stores/assets.store';

  import { createEventDispatcher } from 'svelte';
  import { SegmentScrollbarLayout } from './segment-scrollbar-layout';

  export let scrollTop = 0;
  export let scrollbarHeight = 0;

  $: timelineHeight = $assetGridState.timelineHeight;
  $: timelineScrolltop = (scrollbarPosition / scrollbarHeight) * timelineHeight;

  let segmentScrollbarLayout: SegmentScrollbarLayout[] = [];
  let isHover = false;
  let isDragging = false;
  let hoveredDate: Date;
  let currentMouseYLocation = 0;
  let scrollbarPosition = 0;
  let animationTick = false;

  const { isAlbumAssetSelectionOpen } = albumAssetSelectionStore;
  $: offset = $isAlbumAssetSelectionOpen ? 100 : 71;
  const dispatchClick = createEventDispatcher<OnScrollbarClick>();
  const dispatchDrag = createEventDispatcher<OnScrollbarDrag>();
  $: {
    scrollbarPosition = (scrollTop / timelineHeight) * scrollbarHeight;
  }

  $: {
    let result: SegmentScrollbarLayout[] = [];
    for (const bucket of $assetGridState.buckets) {
      let segmentLayout = new SegmentScrollbarLayout();
      segmentLayout.count = bucket.assets.length;
      segmentLayout.height = (bucket.bucketHeight / timelineHeight) * scrollbarHeight;
      segmentLayout.timeGroup = bucket.bucketDate;
      result.push(segmentLayout);
    }
    segmentScrollbarLayout = result;
  }

  const handleMouseMove = (e: MouseEvent, currentDate: Date) => {
    currentMouseYLocation = e.clientY - offset - 30;

    hoveredDate = new Date(currentDate.toISOString().slice(0, -1));
  };

  const handleMouseDown = (e: MouseEvent) => {
    isDragging = true;
    scrollbarPosition = e.clientY - offset;
  };

  const handleMouseUp = (e: MouseEvent) => {
    isDragging = false;
    scrollbarPosition = e.clientY - offset;
    dispatchClick('onscrollbarclick', { scrollTo: timelineScrolltop });
  };

  const handleMouseDrag = (e: MouseEvent) => {
    if (isDragging) {
      if (!animationTick) {
        window.requestAnimationFrame(() => {
          const dy = e.clientY - scrollbarPosition - offset;
          scrollbarPosition += dy;
          dispatchDrag('onscrollbardrag', { scrollTo: timelineScrolltop });
          animationTick = false;
        });

        animationTick = true;
      }
    }
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  id="immich-scrubbable-scrollbar"
  class="fixed right-0 bg-immich-bg z-[100] hover:cursor-row-resize select-none"
  style:width={isDragging ? '100vw' : '60px'}
  style:background-color={isDragging ? 'transparent' : 'transparent'}
  on:mouseenter={() => (isHover = true)}
  on:mouseleave={() => {
    isHover = false;
    isDragging = false;
  }}
  on:mouseup={handleMouseUp}
  on:mousemove={handleMouseDrag}
  on:mousedown={handleMouseDown}
  style:height={scrollbarHeight + 'px'}
>
  {#if isHover}
    <div
      class="border-b-2 border-immich-primary dark:border-immich-dark-primary w-[100px] right-0 pr-6 py-1 text-sm pl-1 font-medium absolute bg-immich-bg dark:bg-immich-dark-gray z-[100] pointer-events-none rounded-tl-md shadow-lg dark:text-immich-dark-fg"
      style:top={currentMouseYLocation + 'px'}
    >
      {hoveredDate?.toLocaleString('default', { month: 'short' })}
      {hoveredDate?.getFullYear()}
    </div>
  {/if}

  <!-- Scroll Position Indicator Line -->
  {#if !isDragging}
    <div
      class="absolute right-0 w-10 h-[2px] bg-immich-primary dark:bg-immich-dark-primary"
      style:top={scrollbarPosition + 'px'}
    />
  {/if}
  <!-- Time Segment -->
  {#each segmentScrollbarLayout as segment, index (segment.timeGroup)}
    {@const groupDate = new Date(segment.timeGroup)}

    <div
      id="time-segment"
      class="relative"
      style:height={segment.height + 'px'}
      aria-label={segment.timeGroup + ' ' + segment.count}
      on:mousemove={(e) => handleMouseMove(e, groupDate)}
    >
      {#if new Date(segmentScrollbarLayout[index - 1]?.timeGroup).getFullYear() !== groupDate.getFullYear()}
        {#if segment.height > 8}
          <div
            aria-label={segment.timeGroup + ' ' + segment.count}
            class="absolute right-0 pr-5 z-10 text-xs font-medium dark:text-immich-dark-fg"
          >
            {groupDate.getFullYear()}
          </div>
        {/if}
      {:else if segment.height > 5}
        <div
          aria-label={segment.timeGroup + ' ' + segment.count}
          class="absolute right-0 rounded-full h-[4px] w-[4px] mr-3 bg-gray-300 block"
        />
      {/if}
    </div>
  {/each}
</div>

<style>
  #immich-scrubbable-scrollbar,
  #time-segment {
    contain: layout;
  }
</style>
