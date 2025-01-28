<script lang="ts">
  import { dateFormats } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();

  const formatDate = (date?: string) => {
    const dateWithoutTimeZone = date?.slice(0, -1);
    return dateWithoutTimeZone
      ? new Date(dateWithoutTimeZone).toLocaleDateString($locale, dateFormats.album)
      : undefined;
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
  let startDate = $derived(formatDate(album.startDate));
  let endDate = $derived(formatDate(album.endDate));
</script>

<span class="my-2 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
  <span>{getDateRange(startDate, endDate)}</span>
  <span>•</span>
  <span>{$t('items_count', { values: { count: album.assetCount } })}</span>
</span>
