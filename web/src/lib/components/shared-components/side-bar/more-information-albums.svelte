<script lang="ts">
  import { type AlbumStatisticsResponseDto, getAlbumStatistics } from '@immich/sdk';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { t } from 'svelte-i18n';

  export let albumType: keyof AlbumStatisticsResponseDto;

  const handleAlbumCount = async () => {
    try {
      return await getAlbumStatistics();
    } catch {
      return { owned: 0, shared: 0, notShared: 0 };
    }
  };
</script>

{#await handleAlbumCount()}
  <LoadingSpinner />
{:then data}
  <div>
    <p>{$t('albums_count', { values: { count: data[albumType] } })}</p>
  </div>
{/await}
