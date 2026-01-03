<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAssetOriginalUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
    zoomToggle?: (() => void) | null;
  };

  let { asset, zoomToggle = $bindable() }: Props = $props();

  const loadAssetData = async (id: string, useOriginal: boolean) => {
    // For 360° panorama images, we must use the original or fullsize image
    // because the preview may have a broken aspect ratio (2:1 is required for equirectangular projection)
    const size = useOriginal ? AssetMediaSize.Fullsize : AssetMediaSize.Preview;
    const data = await viewAsset({ ...authManager.params, id, size });
    return URL.createObjectURL(data);
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await Promise.all([loadAssetData(asset.id, true), import('./photo-sphere-viewer-adapter.svelte')])}
    <LoadingSpinner />
  {:then [data, { default: PhotoSphereViewer }]}
    <PhotoSphereViewer
      bind:zoomToggle
      panorama={data}
      originalPanorama={isWebCompatibleImage(asset)
        ? getAssetOriginalUrl(asset.id)
        : getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Fullsize, cacheKey: asset.thumbhash })}
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
