<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAssetTileUrl, getAssetUrl } from '$lib/utils';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
  };

  let { asset }: Props = $props();

  const assetId = $derived(asset.id);

  const tileconfig = $derived(
    asset.id === '6e899018-32fe-4fd5-b6ac-b3a525b8e61f'
      ? {
          width: 12_988,
          // height: 35,
          cols: 16,
          rows: 8,
        }
      : undefined,
  );

  const loadAssetData = async (id: string) => {
    const data = await viewAsset({ ...authManager.params, id, size: AssetMediaSize.Preview });
    return URL.createObjectURL(data);
  };

  // TODO: determine whether to return null based on 1. if asset has tiles, 2. if tile is inside 'cropped' bounds.
  const tileUrl = (col: number, row: number, level: number) =>
    tileconfig ? getAssetTileUrl({ id: asset.id, level, col, row, cacheKey: asset.thumbhash }) : null;
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await Promise.all([loadAssetData(assetId), import('./photo-sphere-viewer-adapter.svelte')])}
    <LoadingSpinner />
  {:then [data, { default: PhotoSphereViewer }]}
    <PhotoSphereViewer
      baseUrl={data}
      {tileUrl}
      {tileconfig}
      originalPanorama={getAssetUrl({ asset, forceOriginal: true })}
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
