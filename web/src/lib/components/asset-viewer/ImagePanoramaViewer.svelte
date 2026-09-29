<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAssetUrl } from '$lib/utils';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
  };

  let { asset }: Props = $props();

  const assetId = $derived(asset.id);

  const loadAssetData = async (id: string) => {
    const data = await viewAsset({ ...authManager.params, id, size: AssetMediaSize.Preview });
    return URL.createObjectURL(data);
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full place-content-center place-items-center select-none">
  {#await Promise.all([loadAssetData(assetId), import('./PhotoSphereViewerAdapter.svelte')])}
    <LoadingSpinner />
  {:then [data, { default: PhotoSphereViewer }]}
    <PhotoSphereViewer panorama={data} originalPanorama={getAssetUrl({ asset, forceOriginal: true })} />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
