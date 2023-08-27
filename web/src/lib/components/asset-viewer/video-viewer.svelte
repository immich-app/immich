<script lang="ts">
  import { ThumbnailFormat, api } from '@api';
  import { fade } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  import { videoViewerVolume } from '$lib/stores/preferences.store';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { handleError } from '$lib/utils/handle-error';

  export let assetId: string;

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
      await handleError(error, 'Unable to play video');
    } finally {
      isVideoLoading = false;
    }
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <video
    autoplay
    playsinline
    controls
    class="h-full object-contain"
    on:canplay={handleCanPlay}
    on:ended={() => dispatch('onVideoEnded')}
    bind:volume={$videoViewerVolume}
    poster={api.getAssetThumbnailUrl(assetId, ThumbnailFormat.Jpeg)}
  >
    <source src={api.getAssetFileUrl(assetId, false, true)} type="video/mp4" />
    <track kind="captions" />
  </video>

  {#if isVideoLoading}
    <div class="absolute flex place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</div>
