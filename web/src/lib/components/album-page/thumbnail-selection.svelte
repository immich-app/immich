<script lang="ts">
  import type { AlbumResponseDto, AssetResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  export let album: AlbumResponseDto;

  let selectedThumbnail: AssetResponseDto | undefined;
  const dispatch = createEventDispatcher();

  $: isSelected = (id: string): boolean | undefined => {
    if (!selectedThumbnail && album.albumThumbnailAssetId == id) {
      return true;
    } else {
      return selectedThumbnail?.id == id;
    }
  };
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg py-[160px] dark:bg-immich-dark-bg"
>
  <ControlAppBar on:close-button-click={() => dispatch('close')}>
    <svelte:fragment slot="leading">
      <p class="text-lg">Select album cover</p>
    </svelte:fragment>

    <svelte:fragment slot="trailing">
      <Button
        size="sm"
        rounded="lg"
        disabled={selectedThumbnail == undefined}
        on:click={() => dispatch('thumbnail-selected', { asset: selectedThumbnail })}
      >
        Done
      </Button>
    </svelte:fragment>
  </ControlAppBar>

  <section class="flex flex-wrap gap-14 overflow-y-auto px-20">
    <!-- Image grid -->
    <div class="flex flex-wrap gap-[2px]">
      {#each album.assets as asset}
        <Thumbnail {asset} on:click={() => (selectedThumbnail = asset)} selected={isSelected(asset.id)} />
      {/each}
    </div>
  </section>
</section>
