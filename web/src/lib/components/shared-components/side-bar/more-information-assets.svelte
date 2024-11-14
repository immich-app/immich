<script lang="ts">
  import { getAssetStatistics } from '@immich/sdk';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    assetStats: NonNullable<Parameters<typeof getAssetStatistics>[0]>;
  }

  let { assetStats }: Props = $props();
</script>

{#await getAssetStatistics(assetStats)}
  <LoadingSpinner />
{:then data}
  <div>
    <p>{$t('videos_count', { values: { count: data.videos } })}</p>
    <p>{$t('photos_count', { values: { count: data.images } })}</p>
  </div>
{/await}
