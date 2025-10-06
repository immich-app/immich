<script lang="ts">
  import { resizeObserver } from '$lib/actions/resize-observer';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { memoryStore } from '$lib/stores/memory.store.svelte';
  import { getAssetThumbnailUrl, memoryLaneTitle } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let shouldRender = $derived(memoryStore.memories?.length > 0);

  onMount(async () => {
    await memoryStore.initialize();
  });

  let memoryLaneElement: HTMLElement | undefined = $state();
  let offsetWidth = $state(0);
  let innerWidth = $state(0);

  let scrollLeftPosition = $state(0);

  const onScroll = () => {
    scrollLeftPosition = memoryLaneElement?.scrollLeft ?? 0;
  };

  let canScrollLeft = $derived(scrollLeftPosition > 0);
  let canScrollRight = $derived(Math.ceil(scrollLeftPosition) < Math.floor(innerWidth - offsetWidth));

  const scrollBy = 400;
  const scrollLeft = () => memoryLaneElement?.scrollBy({ left: -scrollBy, behavior: 'smooth' });
  const scrollRight = () => memoryLaneElement?.scrollBy({ left: scrollBy, behavior: 'smooth' });
</script>

{#if shouldRender}
  <section
    id="memory-lane"
    bind:this={memoryLaneElement}
    class="relative mt-3 overflow-x-scroll overflow-y-hidden whitespace-nowrap transition-all"
    style="scrollbar-width:none"
    use:resizeObserver={({ width }) => (offsetWidth = width)}
    onscroll={onScroll}
  >
    {#if canScrollLeft || canScrollRight}
      <div class="sticky start-0 z-1">
        {#if canScrollLeft}
          <div
            class="absolute start-4 max-md:top-[75px] top-[108px] -translate-y-1/2"
            transition:fade={{ duration: 200 }}
          >
            <button
              type="button"
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              title={$t('previous')}
              aria-label={$t('previous')}
              onclick={scrollLeft}
            >
              <Icon icon={mdiChevronLeft} size="36" aria-label={$t('previous')} /></button
            >
          </div>
        {/if}
        {#if canScrollRight}
          <div
            class="absolute end-4 max-md:top-[75px] top-[108px] -translate-y-1/2 z-1"
            transition:fade={{ duration: 200 }}
          >
            <button
              type="button"
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              title={$t('next')}
              aria-label={$t('next')}
              onclick={scrollRight}
            >
              <Icon icon={mdiChevronRight} size="36" aria-label={$t('next')} /></button
            >
          </div>
        {/if}
      </div>
    {/if}
    <div class="inline-block" use:resizeObserver={({ width }) => (innerWidth = width)}>
      {#each memoryStore.memories as memory (memory.id)}
        <a
          class="memory-card relative me-2 md:me-4 last:me-0 inline-block aspect-3/4 md:aspect-4/3 max-md:h-[150px] xl:aspect-video h-[216px] rounded-xl"
          href="{AppRoute.MEMORY}?{QueryParameter.ID}={memory.assets[0].id}"
        >
          <img
            class="h-full w-full rounded-xl object-cover"
            src={getAssetThumbnailUrl(memory.assets[0].id)}
            alt={$t('memory_lane_title', { values: { title: $getAltText(toTimelineAsset(memory.assets[0])) } })}
            draggable="false"
          />
          <div
            class="absolute start-0 top-0 h-full w-full rounded-xl bg-linear-to-t from-black/40 via-transparent to-transparent transition-all hover:bg-black/20"
          ></div>
          <p class="absolute bottom-2 start-4 text-lg text-white max-md:text-sm">
            {$memoryLaneTitle(memory)}
          </p>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .memory-card {
    box-shadow:
      rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
      rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
  }
</style>
