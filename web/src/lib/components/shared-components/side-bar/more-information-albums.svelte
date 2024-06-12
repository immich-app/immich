<script lang="ts">
  import { type AlbumCountResponseDto, getAlbumCount } from '@immich/sdk';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { t } from 'svelte-i18n';

  export let albumCountType: keyof AlbumCountResponseDto;

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
  <div>
    <p>{$t('albums_count', { values: { count: data[albumCountType] } })}</p>
  </div>
{/await}
