<script lang="ts">
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { api, type AssetResponseDto } from '@api';
  import PhotoSphere from './photo-sphere-viewer-adapter.svelte';

  export let asset: AssetResponseDto;

  let dataUrl = '';
  let errorMessage = '';

  const loadAssetData = async () => {
    try {
      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: false, isWeb: false, key: api.getKey() },
        { responseType: 'blob' },
      );
      if (data instanceof Blob) {
        dataUrl = URL.createObjectURL(data);
        return dataUrl;
      } else {
        throw new TypeError('Invalid data format');
      }
    } catch {
      errorMessage = 'Failed to load asset';
      return '';
    }
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await loadAssetData()}
    <LoadingSpinner />
  {:then assetData}
    {#if assetData}
      <PhotoSphere panorama={assetData} />
    {:else}
      <p>{errorMessage}</p>
    {/if}
  {/await}
</div>
