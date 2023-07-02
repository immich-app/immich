<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { AssetResponseDto, ThumbnailFormat } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();

  let viewWidth: number;
  let thumbnailSize = 300;

  let dispatch = createEventDispatcher();
  $: {
    if (assets.length < 6) {
      thumbnailSize = Math.min(320, Math.floor(viewWidth / assets.length - assets.length));
    } else {
      if (viewWidth > 600) thumbnailSize = Math.floor(viewWidth / 7 - 7);
      else if (viewWidth > 400) thumbnailSize = Math.floor(viewWidth / 4 - 6);
      else if (viewWidth > 300) thumbnailSize = Math.floor(viewWidth / 2 - 6);
      else if (viewWidth > 200) thumbnailSize = Math.floor(viewWidth / 2 - 6);
      else if (viewWidth > 100) thumbnailSize = Math.floor(viewWidth / 1 - 6);
    }
  }

  const selectAssetHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    let temp = new Set(selectedAssets);
    if (selectedAssets.has(asset)) {
      temp.delete(asset);
    } else {
      temp.add(asset);
    }

    selectedAssets = temp;
    dispatch('select', { asset, selectedAssets });
  };
</script>

{#if assets.length > 0}
  <div class="flex flex-wrap gap-1 w-full pb-20" bind:clientWidth={viewWidth}>
    {#each assets as asset (asset.id)}
      <div animate:flip={{ duration: 500 }}>
        <Thumbnail
          {asset}
          {thumbnailSize}
          format={assets.length < 7 ? ThumbnailFormat.Jpeg : ThumbnailFormat.Webp}
          on:click={selectAssetHandler}
          selected={selectedAssets.has(asset)}
        />
      </div>
    {/each}
  </div>
{/if}
