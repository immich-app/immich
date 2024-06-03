<script lang="ts">
  import { locale } from '$lib/stores/preferences.store.js';
  import { s } from '$lib/utils.js';
  import { getAssetStatistics } from '@immich/sdk';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

  export let assetStats: { [typeof getAssetStatistics]: boolean };

  const getStats = (dto: Parameters<typeof getAssetStatistics>[0]) => getAssetStatistics(dto);
</script>

{#await getStats(assetStats)}
  <LoadingSpinner data-testid="loading-spinner" />
{:then data}
  <div>
    <p>{data.videos.toLocaleString($locale)} Video{s(data.videos)}</p>
    <p>{data.images.toLocaleString($locale)} Photo{s(data.images)}</p>
  </div>
{/await}
