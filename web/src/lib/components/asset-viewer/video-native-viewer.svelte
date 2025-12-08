<script lang="ts">
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import {
    autoPlayVideo,
    loopVideo as loopVideoPreference,
    videoViewerMuted,
    videoViewerVolume,
  } from '$lib/stores/preferences.store';
  import { getAssetOriginalUrl, getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';

  interface Props {
    transitionName?: string | null;
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
  }

  let {
    transitionName,
    assetId,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    onPreviousAsset = () => {},
    onNextAsset = () => {},
    onVideoEnded = () => {},
    onVideoStarted = () => {},
    onClose = () => {},
  }: Props = $props();

  let videoPlayer: HTMLVideoElement | undefined = $state();
  let isLoading = $state(true);
  let assetFileUrl = $derived(
    playOriginalVideo ? getAssetOriginalUrl({ id: assetId, cacheKey }) : getAssetPlaybackUrl({ id: assetId, cacheKey }),
  );
  let isScrubbing = $state(false);
  let showVideo = $state(false);

  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });

  $effect(() => {
    // reactive on `assetFileUrl` changes
    if (assetFileUrl) {
      videoPlayer?.load();
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
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        await tryForceMutedPlay(video);
        return;
      }

      // auto-play failed
    } finally {
      isLoading = false;
    }
  };

  const tryForceMutedPlay = async (video: HTMLVideoElement) => {
    if (video.muted) {
      return;
    }

    try {
      video.muted = true;
      await handleCanPlay(video);
    } catch {
      // muted auto-play failed
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

  const calculateSize = () => {
    const videoWidth = videoPlayer?.videoWidth ?? 1;
    const videoHeight = videoPlayer?.videoHeight ?? 1;

    const scaleX = containerWidth / videoWidth;
    const scaleY = containerHeight / videoHeight;

    // Use the smaller scale to ensure image fits (like object-fit: contain)
    const scale = Math.min(scaleX, scaleY);

    return {
      width: videoWidth * scale + 'px',
      height: videoHeight * scale + 'px',
    };
  };

  let box = $derived(calculateSize());
</script>

{#if showVideo}
  <div
    transition:fade={{ duration: assetViewerFadeDuration }}
    class="flex select-none h-full w-full place-content-center place-items-center"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
  >
    {#if castManager.isCasting}
      <div class="place-content-center h-full place-items-center">
        <VideoRemoteViewer
          poster={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
          {onVideoStarted}
          {onVideoEnded}
          {assetFileUrl}
        />
      </div>
    {:else}
      <video
        style:view-transition-name={transitionName}
        style:height={box.height}
        style:width={box.width}
        bind:this={videoPlayer}
        loop={$loopVideoPreference && loopVideo}
        autoplay={$autoPlayVideo}
        playsinline
        controls
        disablePictureInPicture
        {...useSwipe(onSwipe)}
        onloadedmetadata={() => (box = calculateSize())}
        oncanplay={(e) => handleCanPlay(e.currentTarget)}
        onended={onVideoEnded}
        onvolumechange={(e) => ($videoViewerMuted = e.currentTarget.muted)}
        onseeking={() => (isScrubbing = true)}
        onseeked={() => (isScrubbing = false)}
        onplaying={(e) => {
          e.currentTarget.focus();
        }}
        onclose={() => onClose()}
        muted={$videoViewerMuted}
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
    {/if}
  </div>
{/if}

<style>
  video:focus {
    outline: none;
  }
</style>
