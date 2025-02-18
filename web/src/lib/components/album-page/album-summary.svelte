<script lang="ts">
  import { getAlbumDateRange } from '$lib/utils/date-time';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    viewCount?: number;
    album: AlbumResponseDto;
  }

  let { album, viewCount }: Props = $props();
</script>

<span class="my-2 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
  <span>{getAlbumDateRange(album)}</span>
  <span>•</span>
  <span>{$t('items_count', { values: { count: album.assetCount } })}</span>
  {#if viewCount}
    <span>•</span>
    <span>{$t('views_count', { values: { count: viewCount } })}</span>
  {/if}
</span>
