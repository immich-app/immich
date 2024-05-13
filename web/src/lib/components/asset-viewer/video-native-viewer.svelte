<script lang="ts">
  import { loopVideo as loopVideoPreference, videoViewerVolume, videoViewerMuted } from '$lib/stores/preferences.store';
  import { getAssetFileUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { ThumbnailFormat } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let assetId: string;
  export let loopVideo: boolean;

  let element: HTMLVideoElement | undefined = undefined;
  let isVideoLoading = true;

  const dispatch = createEventDispatcher<{ onVideoEnded: void; onVideoStarted: void }>();

  const handleCanPlay = async (event: Event) => {
    try {
      const video = event.currentTarget as HTMLVideoElement;
      await video.play();
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
    loop={$loopVideoPreference && loopVideo}
    autoplay
    playsinline
    controls
    class="h-full object-contain"
    on:canplay={handleCanPlay}
    on:ended={() => dispatch('onVideoEnded')}
    bind:muted={$videoViewerMuted}
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
