<script lang="ts">
  import { dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';

  export let assetCount: number;
  export let album: AlbumResponseDto;
  export let oldestAsset: AssetResponseDto | undefined = undefined;
  export let newestAsset: AssetResponseDto | undefined = undefined;

  $: startDate = formatDate(oldestAsset?.fileCreatedAt || album.startDate);
  $: endDate = formatDate(newestAsset?.fileCreatedAt || album.endDate);

  const formatDate = (date?: string) => {
    return date ? new Date(date).toLocaleDateString($locale, dateFormats.album) : undefined;
  };

  const getDateRange = (start?: string, end?: string) => {
    if (start && end && start !== end) {
      return `${start} - ${end}`;
    }

    if (start) {
      return start;
    }

    return '';
  };
</script>

{#if assetCount > 0}
  <span class="my-2 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
    <p>{getDateRange(startDate, endDate)}</p>
    <p>·</p>
    <p>{assetCount} items</p>
  </span>
{/if}
