<script lang="ts">
  import { videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetFileUrl, getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { ThumbnailFormat } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { slideshowStore } from '$lib/stores/slideshow.store';

  const { slideshowPlaying } = slideshowStore;

  export let assetId: string;
  export let controls: boolean;

  let element: HTMLVideoElement | undefined = undefined;
  let isVideoLoading = true;

  $: {
    if ($slideshowPlaying && element) {
      handlePromiseError(element.play());
    }
    if (!$slideshowPlaying && element) {
      element.pause();
    }
  }

  const dispatch = createEventDispatcher<{ onVideoEnded: void; onVideoStarted: void }>();

  const handleCanPlay = async (event: Event) => {
    try {
      const video = event.currentTarget as HTMLVideoElement;
      video.muted = true;
      await video.play();
      video.muted = false;
      $slideshowPlaying = true;
      dispatch('onVideoStarted');
    } catch (error) {
      handleError(error, 'Unable to play video');
    } finally {
      isVideoLoading = false;
    }
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <video
    bind:this={element}
    autoplay
    playsinline
    {controls}
    class="h-full object-contain"
    on:canplay={handleCanPlay}
    on:ended={() => dispatch('onVideoEnded')}
    bind:volume={$videoViewerVolume}
    poster={getAssetThumbnailUrl(assetId, ThumbnailFormat.Jpeg)}
  >
    <source src={getAssetFileUrl(assetId, false, true)} type="video/mp4" />
    <track kind="captions" />
  </video>

  {#if isVideoLoading}
    <div class="absolute flex place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</div>
