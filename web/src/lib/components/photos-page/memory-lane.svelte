<script lang="ts">
  import { onMount } from 'svelte';
  import { api } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import { memoryStore } from '$lib/stores/memory.store';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { mdiChevronLeft, mdiChevronRight } from '@mdi/js';
  import { AppRoute, QueryParameter } from '$lib/constants';

  $: shouldRender = $memoryStore?.length > 0;

  onMount(async () => {
    const localTime = new Date();
    const { data } = await api.assetApi.getMemoryLane({
      month: localTime.getMonth() + 1,
      day: localTime.getDate(),
    });
    $memoryStore = data;
  });

  let memoryLaneElement: HTMLElement;
  let offsetWidth = 0;
  let innerWidth = 0;

  let scrollLeftPosition = 0;

  const onScroll = () => (scrollLeftPosition = memoryLaneElement?.scrollLeft);

  $: canScrollLeft = scrollLeftPosition > 0;
  $: canScrollRight = Math.ceil(scrollLeftPosition) < innerWidth - offsetWidth;

  const scrollBy = 400;
  const scrollLeft = () => memoryLaneElement.scrollBy({ left: -scrollBy, behavior: 'smooth' });
  const scrollRight = () => memoryLaneElement.scrollBy({ left: scrollBy, behavior: 'smooth' });
</script>

{#if shouldRender}
  <section
    id="memory-lane"
    bind:this={memoryLaneElement}
    class="relative mt-5 overflow-x-hidden whitespace-nowrap transition-all"
    bind:offsetWidth
    on:scroll={onScroll}
  >
    {#if canScrollLeft || canScrollRight}
      <div class="sticky left-0 z-20">
        {#if canScrollLeft}
          <div class="absolute left-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
            <button
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              on:click={scrollLeft}
            >
              <Icon path={mdiChevronLeft} size="36" /></button
            >
          </div>
        {/if}
        {#if canScrollRight}
          <div class="absolute right-4 top-[6rem] z-20" transition:fade={{ duration: 200 }}>
            <button
              class="rounded-full border border-gray-500 bg-gray-100 p-2 text-gray-500 opacity-50 hover:opacity-100"
              on:click={scrollRight}
            >
              <Icon path={mdiChevronRight} size="36" /></button
            >
          </div>
        {/if}
      </div>
    {/if}

    <div class="inline-block" bind:offsetWidth={innerWidth}>
      {#each $memoryStore as memory, index (memory.title)}
        <button
          class="memory-card relative mr-8 inline-block aspect-video h-[215px] rounded-xl"
          on:click={() => goto(`${AppRoute.MEMORY}?${QueryParameter.MEMORY_INDEX}=${index}`)}
        >
          <img
            class="h-full w-full rounded-xl object-cover"
            src={api.getAssetThumbnailUrl(memory.assets[0].id, 'JPEG')}
            alt={memory.title}
            draggable="false"
          />
          <p class="absolute bottom-2 left-4 z-10 text-lg text-white">{memory.title}</p>
          <div
            class="absolute left-0 top-0 z-0 h-full w-full rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent transition-all hover:bg-black/20"
          />
        </button>
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
