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
    viewerHeight: number;
    zoomToggle?: (() => void) | null;
  };

  let { asset, viewerHeight, zoomToggle = $bindable() }: Props = $props();

  const loadAssetData = async (id: string) => {
    const data = await viewAsset({ ...authManager.params, id, size: AssetMediaSize.Preview });
    return URL.createObjectURL(data);
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-dvh select-none place-content-center place-items-center">
  {#await Promise.all([loadAssetData(asset.id), import('./photo-sphere-viewer-adapter.svelte')])}
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
