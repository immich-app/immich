<script lang="ts">
  import { getAssetOriginalUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  interface Props {
    assetId: string;
  }

  const { assetId }: Props = $props();

  let isVrSupported = $state(false);
  let showVR = $state(false);
  let currentTime = $state(0);

  onMount(async () => {
    // Check if WebXR is supported and specifically if immersive-vr is supported
    if ('xr' in navigator && typeof navigator?.xr?.isSessionSupported === 'function') {
      try {
        isVrSupported = await navigator.xr.isSessionSupported('immersive-vr');
        showVR = isVrSupported;
      } catch (err) {
        console.error('Error checking VR support:', err);
        isVrSupported = false;
      }
    } else {
      console.error('WebXR not supported');
    }
  });

  const modules = Promise.all([
    import('./photo-sphere-viewer-adapter.svelte').then((module) => module.default),
    import('@photo-sphere-viewer/equirectangular-video-adapter').then((module) => module.EquirectangularVideoAdapter),
    import('@photo-sphere-viewer/video-plugin').then((module) => module.VideoPlugin),
    import('@photo-sphere-viewer/video-plugin/index.css'),
  ]);

  const immersiveModule = Promise.all([
    import('./immersive-video-panorama-viewer.svelte').then((module) => module.default),
  ]);
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#if !showVR || !isVrSupported}
    {#await modules}
      <LoadingSpinner />
    {:then [PhotoSphereViewer, adapter, videoPlugin]}
      <PhotoSphereViewer
        panorama={{ source: getAssetPlaybackUrl(assetId) }}
        originalPanorama={{ source: getAssetOriginalUrl(assetId) }}
        plugins={[videoPlugin]}
        {adapter}
        navbar
      />
    {:catch}
      {$t('errors.failed_to_load_asset')}
    {/await}
  {:else}
    {#await immersiveModule}
      <LoadingSpinner />
    {:then [ImmersiveVideoPanoramaViewer]}
      <ImmersiveVideoPanoramaViewer
        videoUrl={getAssetPlaybackUrl(assetId)}
        {currentTime}
        onClose={() => {
          showVR = false;
        }}
      />
    {:catch}
      {$t('errors.failed_to_load_asset')}
    {/await}
  {/if}
</div>
