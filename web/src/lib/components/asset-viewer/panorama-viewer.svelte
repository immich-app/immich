<script lang="ts">
  import { serveFile, type AssetResponseDto } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let asset: AssetResponseDto;

  const loadAssetData = async () => {
    const data = await serveFile({ id: asset.id, isWeb: false, isThumb: false });
    return URL.createObjectURL(data);
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <!-- the photo sphere viewer is quite large, so lazy load it in parallel with loading the data -->
  {#await Promise.all([loadAssetData(), import('./photo-sphere-viewer-adapter.svelte')])}
    <LoadingSpinner />
  {:then [data, module]}
    <svelte:component this={module.default} panorama={data} />
  {:catch}
    Failed to load asset
  {/await}
</div>
