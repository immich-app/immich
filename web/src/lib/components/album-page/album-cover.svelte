<script lang="ts">
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto | undefined;
  export let preload = false;
  export let css = '';

  $: thumbnailUrl =
    album && album.albumThumbnailAssetId ? getAssetThumbnailUrl({ id: album.albumThumbnailAssetId }) : null;
</script>

<div class="relative aspect-square">
  {#if thumbnailUrl}
    <img
      loading={preload ? 'eager' : 'lazy'}
      src={thumbnailUrl}
      alt={album?.albumName ?? $t('unknown_album')}
      class="z-0 rounded-xl object-cover {css}"
      data-testid="album-image"
      draggable="false"
    />
  {:else}
    <enhanced:img
      loading={preload ? 'eager' : 'lazy'}
      src="$lib/assets/no-thumbnail.png"
      sizes="min(271px,186px)"
      alt={album?.albumName ?? $t('empty_album')}
      class="z-0 rounded-xl object-cover {css}"
      data-testid="album-image"
      draggable="false"
    />
  {/if}
</div>
