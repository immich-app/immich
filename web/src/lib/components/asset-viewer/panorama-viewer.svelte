<script lang="ts">
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { api, AssetResponseDto } from '@api';
  import View360, { EquirectProjection } from '@egjs/svelte-view360';
  import './panorama-viewer.css';
  export let asset: AssetResponseDto;
  export let publicSharedKey = '';
  let dataUrl = '';
  let errorMessage = '';
  const loadAssetData = async () => {
    try {
      const { data } = await api.assetApi.serveFile(
        { id: asset.id, isThumb: false, isWeb: false, key: publicSharedKey },
        { responseType: 'blob' },
      );
      if (data instanceof Blob) {
        dataUrl = URL.createObjectURL(data);
        return dataUrl;
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error) {
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
      <View360 autoResize={true} initialZoom={0.5} projection={new EquirectProjection({ src: assetData })} />
    {:else}
      <p>{errorMessage}</p>
    {/if}
  {/await}
</div>
