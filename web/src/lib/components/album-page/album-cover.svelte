<script lang="ts">
  import { ThumbnailFormat, type AlbumResponseDto } from '@immich/sdk';
  import { getAssetThumbnailUrl } from '$lib/utils';

  export let album: AlbumResponseDto | undefined;
  export let preload = false;
  export let css = '';

  $: thumbnailUrl =
    album && album.albumThumbnailAssetId
      ? getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Webp)
      : null;
</script>

<div class="relative aspect-square">
  {#if thumbnailUrl}
    <img
      loading={preload ? 'eager' : 'lazy'}
      src={thumbnailUrl}
      alt={album?.albumName ?? 'Unknown Album'}
      class="z-0 rounded-xl object-cover {css}"
      data-testid="album-image"
      draggable="false"
    />
  {:else}
    <enhanced:img
      loading={preload ? 'eager' : 'lazy'}
      src="$lib/assets/no-thumbnail.png"
      sizes="min(271px,186px)"
      alt={album?.albumName ?? 'Empty Album'}
      class="z-0 rounded-xl object-cover {css}"
      data-testid="album-image"
      draggable="false"
    />
  {/if}
</div>
