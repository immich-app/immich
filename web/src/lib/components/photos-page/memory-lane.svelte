<script lang="ts">
  import { resizeObserver } from '$lib/actions/resize-observer';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { loadMemories, memoryStore } from '$lib/stores/memory.store';
  import { getAssetThumbnailUrl, memoryLaneTitle } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  let shouldRender = $derived($memoryStore?.length > 0);

  onMount(async () => {
    await loadMemories();
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
    class="relative mt-5 overflow-x-scroll overflow-y-hidden whitespace-nowrap transition-all"
    style="scrollbar-width:none"
    use:resizeObserver={({ width }) => (offsetWidth = width)}
    onscroll={onScroll}
  >
    {#if canScrollLeft || canScrollRight}
      <div class="sticky left-0 z-20">
        {#if canScrollLeft}
          <div class="absolute left-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
            <button
              type="button"
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              title={$t('previous')}
              aria-label={$t('previous')}
              onclick={scrollLeft}
            >
              <Icon path={mdiChevronLeft} size="36" ariaLabel={$t('previous')} /></button
            >
          </div>
        {/if}
        {#if canScrollRight}
          <div class="absolute right-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
            <button
              type="button"
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              title={$t('next')}
              aria-label={$t('next')}
              onclick={scrollRight}
            >
              <Icon path={mdiChevronRight} size="36" ariaLabel={$t('next')} /></button
            >
          </div>
        {/if}
      </div>
    {/if}
    <div class="inline-block" use:resizeObserver={({ width }) => (innerWidth = width)}>
      {#each $memoryStore as memory (memory.id)}
        {#if memory.assets.length > 0}
          <a
            class="memory-card relative mr-8 last:mr-0 inline-block aspect-[3/4] md:aspect-[4/3] xl:aspect-video h-[215px] rounded-xl"
            href="{AppRoute.MEMORY}?{QueryParameter.ID}={memory.assets[0].id}"
          >
            <img
              class="h-full w-full rounded-xl object-cover"
              src={getAssetThumbnailUrl(memory.assets[0].id)}
              alt={$t('memory_lane_title', { values: { title: $getAltText(memory.assets[0]) } })}
              draggable="false"
            />
            <p class="absolute bottom-2 left-4 z-10 text-lg text-white">
              {$memoryLaneTitle(memory)}
            </p>
            <div
              class="absolute left-0 top-0 z-0 h-full w-full rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent transition-all hover:bg-black/20"
            ></div>
          </a>
        {/if}
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
