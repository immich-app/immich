<script lang="ts">
  import { videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetFileUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { ThumbnailFormat } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

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
