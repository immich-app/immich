<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { loopVideo as loopVideoPreference, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetMediaSize } from '@immich/sdk';
  import { createEventDispatcher, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  export let assetId: string;
  export let loopVideo: boolean;
  export let checksum: string;

  let element: HTMLVideoElement | undefined = undefined;
  let isVideoLoading = true;
  let assetFileUrl: string;
  let forceMuted = false;

  $: if (element) {
    assetFileUrl = getAssetPlaybackUrl({ id: assetId, checksum });
    forceMuted = false;
    element.load();
  }

  const dispatch = createEventDispatcher<{ onVideoEnded: void; onVideoStarted: void }>();

  const handleCanPlay = async (video: HTMLVideoElement) => {
    try {
      await video.play();
      dispatch('onVideoStarted');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError' && !forceMuted) {
        await tryForceMutedPlay(video);
        return;
      }
      handleError(error, $t('errors.unable_to_play_video'));
    } finally {
      isVideoLoading = false;
    }
  };

  const tryForceMutedPlay = async (video: HTMLVideoElement) => {
    try {
      forceMuted = true;
      await tick();
      await handleCanPlay(video);
    } catch (error) {
      handleError(error, $t('errors.unable_to_play_video'));
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
    on:canplay={(e) => handleCanPlay(e.currentTarget)}
    on:ended={() => dispatch('onVideoEnded')}
    on:volumechange={(e) => {
      if (!forceMuted) {
        $videoViewerMuted = e.currentTarget.muted;
      }
    }}
    muted={forceMuted || $videoViewerMuted}
    bind:volume={$videoViewerVolume}
    poster={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, checksum })}
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
