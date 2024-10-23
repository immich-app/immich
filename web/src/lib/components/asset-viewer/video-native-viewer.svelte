<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { loopVideo as loopVideoPreference, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetMediaSize } from '@immich/sdk';
  import { tick } from 'svelte';
  import { swipe } from 'svelte-gestures';
  import type { SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import CastPlayer from '$lib/utils/cast-sender';
  import { get } from 'svelte/store';

  export let assetId: string;
  export let loopVideo: boolean;
  export let checksum: string;
  export let onPreviousAsset: () => void = () => {};
  export let onNextAsset: () => void = () => {};
  export let onVideoEnded: () => void = () => {};
  export let onVideoStarted: () => void = () => {};

  let castPlayer: CastPlayer | undefined;

  let element: HTMLVideoElement | undefined = undefined;
  let isVideoLoading = true;
  let assetFileUrl: string;
  let forceMuted = false;

  let isConnected = false;

  $: if (element) {
    assetFileUrl = getAssetPlaybackUrl({ id: assetId, checksum });
    forceMuted = false;
    element.load();
    cast(assetFileUrl);
  }

  const cast = async (url: string) => {
    castPlayer = await CastPlayer.getInstance();

    if (!castPlayer) {
      return;
    }

    isConnected = get(castPlayer.isConnected);
    castPlayer.isConnected.subscribe((value) => {
      isConnected = value;
    });

    const fullUrl = new URL(url, window.location.href);
    await castPlayer.loadMedia(fullUrl.href);
  };

  const handleCanPlay = async (video: HTMLVideoElement) => {
    try {
      await video.play();
      onVideoStarted();
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

  const onSwipe = (event: SwipeCustomEvent) => {
    if (event.detail.direction === 'left') {
      onNextAsset();
    }
    if (event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#if isConnected}
    abcd
  {:else}
    <video
      bind:this={element}
      loop={$loopVideoPreference && loopVideo}
      autoplay
      playsinline
      controls
      class="h-full object-contain"
      use:swipe
      on:swipe={onSwipe}
      on:canplay={(e) => handleCanPlay(e.currentTarget)}
      on:ended={onVideoEnded}
      on:volumechange={(e) => {
        if (!forceMuted) {
          $videoViewerMuted = e.currentTarget.muted;
        }
      }}
      muted={forceMuted || $videoViewerMuted}
      bind:volume={$videoViewerVolume}
      poster={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, checksum })}
      src={assetFileUrl}
    >
    </video>

    {#if isVideoLoading}
      <div class="absolute flex place-content-center place-items-center">
        <LoadingSpinner />
      </div>
    {/if}
  {/if}
</div>
