<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { PanoramaViewerEngine, panoramaViewerEngine } from '$lib/stores/preferences.store';
  import { getAssetUrl } from '$lib/utils';
  import { gpanoTagsToPannellumConfig, readGpanoTags } from '$lib/utils/gpano';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
  };

  let { asset }: Props = $props();

  const assetId = $derived(asset.id);

  const loadAssetBlob = async (id: string) => {
    return viewAsset({ ...authManager.params, id, size: AssetMediaSize.Preview });
  };

  const loadPhotoSphereData = async (id: string) => {
    const blob = await loadAssetBlob(id);
    return URL.createObjectURL(blob);
  };

  const loadPannellumData = async (id: string) => {
    const blob = await loadAssetBlob(id);
    const pose = gpanoTagsToPannellumConfig(await readGpanoTags(blob));
    return { panorama: URL.createObjectURL(blob), pose };
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full place-content-center place-items-center select-none">
  {#if $panoramaViewerEngine === PanoramaViewerEngine.Pannellum}
    {#await Promise.all([loadPannellumData(assetId), import('./PannellumViewerAdapter.svelte')])}
      <LoadingSpinner />
    {:then [{ panorama, pose }, { default: PannellumViewer }]}
      <PannellumViewer {panorama} originalPanorama={getAssetUrl({ asset, forceOriginal: true })} {pose} />
    {:catch}
      {$t('errors.failed_to_load_asset')}
    {/await}
  {:else}
    {#await Promise.all([loadPhotoSphereData(assetId), import('./PhotoSphereViewerAdapter.svelte')])}
      <LoadingSpinner />
    {:then [data, { default: PhotoSphereViewer }]}
      <PhotoSphereViewer panorama={data} originalPanorama={getAssetUrl({ asset, forceOriginal: true })} />
    {:catch}
      {$t('errors.failed_to_load_asset')}
    {/await}
  {/if}
</div>
