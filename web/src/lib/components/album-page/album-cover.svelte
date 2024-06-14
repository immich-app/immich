<script lang="ts">
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import NoCover from '$lib/components/sharedlinks-page/covers/no-cover.svelte';
  import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
  export let preload = false;
  let className = '';
  export { className as class };

  $: alt = album.albumName || $t('unnamed_album');
  $: thumbnailUrl = album.albumThumbnailAssetId ? getAssetThumbnailUrl({ id: album.albumThumbnailAssetId }) : null;
</script>

<div class="relative aspect-square">
  {#if thumbnailUrl}
    <AssetCover {alt} class={className} src={thumbnailUrl} {preload} />
  {:else}
    <NoCover {alt} class={className} {preload} />
  {/if}
</div>
