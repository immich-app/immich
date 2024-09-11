<script lang="ts">
  import { dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;

  $: startDate = formatDate(album.startDate);
  $: endDate = formatDate(album.endDate);

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

<span class="my-2 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
  <span>{getDateRange(startDate, endDate)}</span>
  <span>•</span>
  <span>{$t('items_count', { values: { count: album.assetCount } })}</span>
</span>
