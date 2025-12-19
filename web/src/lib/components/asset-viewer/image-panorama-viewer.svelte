<script lang="ts">
  import { getAssetOriginalUrl, getAssetThumbnailUrl, getAssetTileUrl } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
    zoomToggle?: (() => void) | null;
  };

  let { asset, zoomToggle = $bindable() }: Props = $props();

  const tileconfig =
    asset.id === '6e899018-32fe-4fd5-b6ac-b3a525b8e61f'
      ? {
          width: 12_988,
          // height: 35,
          cols: 16,
          rows: 8,
        }
      : undefined;

  const baseUrl = getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey: asset.thumbhash });
  // TODO: determine whether to return null based on 1. if asset has tiles, 2. if tile is inside 'cropped' bounds.
  const tileUrl = (col: number, row: number, level: number) =>
    tileconfig ? getAssetTileUrl({ id: asset.id, level, col, row, cacheKey: asset.thumbhash }) : null;
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await import('./photo-sphere-viewer-adapter.svelte')}
    <LoadingSpinner />
  {:then { default: PhotoSphereViewer }}
    <PhotoSphereViewer
      bind:zoomToggle
      {baseUrl}
      {tileUrl}
      {tileconfig}
      originalPanorama={isWebCompatibleImage(asset)
        ? getAssetOriginalUrl(asset.id)
        : getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Fullsize, cacheKey: asset.thumbhash })}
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
