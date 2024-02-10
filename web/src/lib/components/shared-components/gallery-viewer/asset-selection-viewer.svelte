<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import { getThumbnailSize } from '$lib/utils/thumbnail-util';
  import { type AssetResponseDto, ThumbnailFormat } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { flip } from 'svelte/animate';

  export let assets: AssetResponseDto[];
  export let selectedAssets: Set<AssetResponseDto> = new Set();

  let viewWidth: number;
  $: thumbnailSize = getThumbnailSize(assets.length, viewWidth);

  let dispatch = createEventDispatcher<{
    select: { asset: AssetResponseDto; selectedAssets: Set<AssetResponseDto> };
  }>();

  const selectAssetHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    let temporary = new Set(selectedAssets);
    if (selectedAssets.has(asset)) {
      temporary.delete(asset);
    } else {
      temporary.add(asset);
    }

    selectedAssets = temporary;
    dispatch('select', { asset, selectedAssets });
  };
</script>

{#if assets.length > 0}
  <div class="flex w-full flex-wrap gap-1 pb-20" bind:clientWidth={viewWidth}>
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
