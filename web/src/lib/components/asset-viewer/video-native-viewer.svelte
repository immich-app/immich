<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { loopVideo as loopVideoPreference, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetMediaSize } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import { swipe } from 'svelte-gestures';
  import type { SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';

  interface Props {
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
  }

  let {
    assetId,
    loopVideo,
    cacheKey,
    onPreviousAsset = () => {},
    onNextAsset = () => {},
    onVideoEnded = () => {},
    onVideoStarted = () => {},
    onClose = () => {},
  }: Props = $props();

  let videoPlayer: HTMLVideoElement | undefined = $state();
  let isLoading = $state(true);
  let assetFileUrl = $state('');
  let forceMuted = $state(false);
  let isScrubbing = $state(false);

  onMount(() => {
    if (videoPlayer) {
      assetFileUrl = getAssetPlaybackUrl({ id: assetId, cacheKey });
      forceMuted = false;
      videoPlayer.load();
    }
  });

  onDestroy(() => {
    if (videoPlayer) {
      videoPlayer.src = '';
    }
  });

  const handleCanPlay = async (video: HTMLVideoElement) => {
    try {
      if (!video.paused && !isScrubbing) {
        await video.play();
        onVideoStarted();
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError' && !forceMuted) {
        await tryForceMutedPlay(video);
        return;
      }

      handleError(error, $t('errors.unable_to_play_video'));
    } finally {
      isLoading = false;
    }
  };

  const tryForceMutedPlay = async (video: HTMLVideoElement) => {
    try {
      video.muted = true;
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

  let containerWidth = $state(0);
  let containerHeight = $state(0);

  $effect(() => {
    if (isFaceEditMode.value) {
      videoPlayer?.pause();
    }
  });
</script>

<div
  transition:fade={{ duration: 150 }}
  class="flex h-full select-none place-content-center place-items-center"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
>
  <video
    bind:this={videoPlayer}
    loop={$loopVideoPreference && loopVideo}
    autoplay
    playsinline
    controls
    class="h-full object-contain"
    use:swipe={() => ({})}
    onswipe={onSwipe}
    oncanplay={(e) => handleCanPlay(e.currentTarget)}
    onended={onVideoEnded}
    onvolumechange={(e) => {
      if (!forceMuted) {
        $videoViewerMuted = e.currentTarget.muted;
      }
    }}
    onseeking={() => (isScrubbing = true)}
    onseeked={() => (isScrubbing = false)}
    onclose={() => onClose()}
    muted={forceMuted || $videoViewerMuted}
    bind:volume={$videoViewerVolume}
    poster={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
    src={assetFileUrl}
  >
  </video>

  {#if isLoading}
    <div class="absolute flex place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}

  {#if isFaceEditMode.value}
    <FaceEditor htmlElement={videoPlayer} {containerWidth} {containerHeight} {assetId} />
  {/if}
</div>
