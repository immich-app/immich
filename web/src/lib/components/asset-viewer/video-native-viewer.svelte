<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import { zoomImageAction } from '$lib/actions/zoom-image';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import AssetViewerEvents from '$lib/components/AssetViewerEvents.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import {
    autoPlayVideo,
    loopVideo as loopVideoPreference,
    videoViewerMuted,
    videoViewerVolume,
  } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';

  interface Props {
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
    playOriginalVideo
      ? getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Original, cacheKey })
      : getAssetPlaybackUrl({ id: assetId, cacheKey }),
  );
  let isScrubbing = $state(false);
  let showVideo = $state(false);

  $effect.pre(() => {
    void assetId;
    untrack(() => {
      assetViewerManager.resetZoomState();
    });
  });

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

  const onZoom = () => {
    assetViewerManager.zoom = assetViewerManager.zoom > 1 ? 1 : 2;
  };

  const onSwipe = (event: SwipeCustomEvent) => {
    if (assetViewerManager.zoom > 1) {
      return;
    }

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

<AssetViewerEvents {onZoom} />

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'z' }, onShortcut: onZoom, preventDefault: true },
  ]}
/>
{#if showVideo}
  <div
    transition:fade={{ duration: assetViewerFadeDuration }}
    class="flex h-full select-none place-content-center place-items-center"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
  >
    {#if castManager.isCasting}
      <div class="place-content-center h-full place-items-center">
        <VideoRemoteViewer
          poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
          {onVideoStarted}
          {onVideoEnded}
          {assetFileUrl}
        />
      </div>
    {:else}
      <div
        use:zoomImageAction
        {...useSwipe(onSwipe)}
        class="h-full w-full"
      >
        <video
          bind:this={videoPlayer}
          loop={$loopVideoPreference && loopVideo}
          autoplay={$autoPlayVideo}
          playsinline
          controls
          disablePictureInPicture
          class="h-full w-full object-contain"
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
          poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
          src={assetFileUrl}
        >
        </video>
      </div>

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
