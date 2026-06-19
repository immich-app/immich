<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
  import { getFileSize } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { type AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    onViewAsset: (asset: AssetResponseDto) => void;
  }

  let { asset, onViewAsset }: Props = $props();

  let assetData = $derived(JSON.stringify(asset, null, 2));

  let boxWidth = $state(300);
</script>

<div
  class="aspect-square w-full rounded-xl border-4 border-gray-200 bg-gray-200 text-xs font-semibold transition-colors dark:border-gray-800 dark:bg-gray-800"
  bind:clientWidth={boxWidth}
  title={assetData}
>
  <div class="relative size-full overflow-hidden rounded-lg">
    <Thumbnail asset={toTimelineAsset(asset)} readonly onClick={() => onViewAsset(asset)} thumbnailSize={boxWidth} />

    {#if !!asset.libraryId}
      <div class="absolute inset-e-3 bottom-1 rounded-xl bg-red-500 px-4 py-1 text-xs transition-colors">External</div>
    {/if}
  </div>
  <div class="mt-4 truncate px-4 text-center text-sm font-normal" title={asset.originalFileName}>
    {asset.originalFileName}
  </div>
  <div class="text-center">
    <p class="py-3 text-xl font-semibold text-primary">{getFileSize(asset, 1)}</p>
  </div>
</div>
