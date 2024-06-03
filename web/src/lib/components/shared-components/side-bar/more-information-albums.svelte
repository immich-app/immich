<script lang="ts">
  import { locale } from '$lib/stores/preferences.store.js';
  import { s } from '$lib/utils.js';
  import { type AlbumCountResponseDto, getAlbumCount } from '@immich/sdk';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

  export let show: keyof AlbumCountResponseDto;

  const handleAlbumCount = async () => {
    try {
      return await getAlbumCount();
    } catch {
      return { owned: 0, shared: 0, notShared: 0 };
    }
  };
</script>

{#await handleAlbumCount()}
  <LoadingSpinner />
{:then data}
  <div data-testid="data">
    <p>{data[show].toLocaleString($locale)} Album{s(data[show])}</p>
  </div>
{/await}
