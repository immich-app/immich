<script lang="ts">
  import { videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetFileUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { ThumbnailFormat } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let assetId: string;
  export let checksum: string;

  let assetFileUrl: string;
  $: {
    let prev = assetFileUrl;
    const next = getAssetFileUrl(assetId, false, true, checksum);
    if (prev !== next) {
      assetFileUrl = getAssetFileUrl(assetId, false, true, checksum);
      if (element) {
        element.load();
      }
    }
  }

  let element: HTMLVideoElement | undefined = undefined;
  let isVideoLoading = true;

  const dispatch = createEventDispatcher<{ onVideoEnded: void; onVideoStarted: void }>();

  const handleCanPlay = async (event: Event) => {
    try {
      const video = event.currentTarget as HTMLVideoElement;
      video.muted = true;
      await video.play();
      video.muted = false;
      dispatch('onVideoStarted');
    } catch (error) {
      handleError(error, 'Unable to play video');
    } finally {
      isVideoLoading = false;
    }
  };
</script>

<div
  transition:fade={{ duration: 150 }}
  class="flex select-none place-content-center place-items-center"
  style="height: calc(100% - 64px)"
>
  <video
    bind:this={element}
    autoplay
    playsinline
    controls
    class="h-full object-contain"
    on:canplay={handleCanPlay}
    on:ended={() => dispatch('onVideoEnded')}
    bind:volume={$videoViewerVolume}
    poster={getAssetThumbnailUrl(assetId, ThumbnailFormat.Jpeg, checksum)}
  >
    <source src={assetFileUrl} type="video/mp4" />
    <track kind="captions" />
  </video>

  {#if isVideoLoading}
    <div class="absolute flex place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</div>
