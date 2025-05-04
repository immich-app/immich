<script lang="ts">
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAssetOriginalUrl } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { AssetMediaSize, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import { mdiGoogleCardboard } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  interface Props {
    asset: AssetResponseDto;
  }

  const { asset }: Props = $props();

  let isVrSupported = $state(false);

  onMount(async () => {
    // Check if WebXR is supported and specifically if immersive-vr is supported
    if ('xr' in navigator && typeof navigator?.xr?.isSessionSupported === 'function') {
      try {
        isVrSupported = await navigator.xr.isSessionSupported('immersive-vr');
      } catch (err) {
        console.error('Error checking VR support:', err);
        isVrSupported = false;
      }
    } else {
      console.error('WebXR not supported');
    }
  });

  let showVR = $state(false);

  const loadAssetData = async (id: string) => {
    const data = await viewAsset({ id, size: AssetMediaSize.Preview, key: authManager.key });
    return URL.createObjectURL(data);
  };

  const handleVRClick = () => {
    showVR = true;
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await Promise.all([
    loadAssetData(asset.id), 
    import('./photo-sphere-viewer-adapter.svelte')
  ])}
    <LoadingSpinner />
  {:then [data, { default: PhotoSphereViewer }]}
    {#if !showVR}
      <div class="relative h-full w-full">
        <PhotoSphereViewer
          panorama={data}
          originalPanorama={isWebCompatibleImage(asset) ? getAssetOriginalUrl(asset.id) : undefined}
        />
        {#if isVrSupported}
          <div class="absolute bottom-4 right-4 z-10">
            <CircleIconButton title="Enter VR Mode" icon={mdiGoogleCardboard} color="opaque" onclick={handleVRClick} />
          </div>
        {/if}
      </div>
    {:else}
      {#await import('./immersive-panorama-viewer.svelte')}
        <LoadingSpinner />
      {:then { default: ImmersivePanoramaViewer }}
        <ImmersivePanoramaViewer
          imageUrl={isWebCompatibleImage(asset) ? getAssetOriginalUrl({ id: asset.id }) : data}
          onClose={() => {
            showVR = false;
          }}
        />
      {/await}
    {/if}
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
