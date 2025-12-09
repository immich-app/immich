<script lang="ts">
  import { swipeFeedback } from '$lib/actions/swipe-feedback';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import {
    autoPlayVideo,
    loopVideo as loopVideoPreference,
    videoViewerMuted,
    videoViewerVolume,
  } from '$lib/stores/preferences.store';
  import { getAssetOriginalUrl, getAssetPlaybackUrl, getAssetThumbnailUrl, getAssetUrl } from '$lib/utils';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { AssetMediaSize, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    transitionName?: string | null;
    assetId: string;
    previousAsset?: AssetResponseDto;
    nextAsset?: AssetResponseDto;
    sharedLink?: SharedLinkResponseDto;
    nextSizeHint?: { width: number; height: number } | null;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    onAboutToNavigate?: ({
      direction,
      nextWidth,
      nextHeight,
    }: {
      direction: 'left' | 'right';
      nextWidth: number;
      nextHeight: number;
    }) => void;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
  }

  let {
    transitionName,
    assetId,
    previousAsset,
    nextAsset,
    nextSizeHint,
    sharedLink,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    onAboutToNavigate,
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

  let containerWidth = $state(document.documentElement.clientWidth);
  let containerHeight = $state(document.documentElement.clientHeight);
  let videoHeight = $derived(nextSizeHint?.height ?? 1);
  let videoWidth = $derived(nextSizeHint?.width ?? 1);
  $inspect(videoWidth).with(console.log.bind(null, 'vwidth'));
  console.log('next', nextSizeHint);
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

  const handleLoadedMetadata = () => {
    console.log('loaded', videoPlayer?.videoWidth);
    videoWidth = videoPlayer?.videoWidth ?? 1;
    videoHeight = videoPlayer?.videoHeight ?? 1;
    eventManager.emit('AssetViewerFree');
  };

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

  const handleSwipeCommit = (direction: 'left' | 'right') => {
    if (direction === 'left' && onNextAsset) {
      onNextAsset();
    } else if (direction === 'right' && onPreviousAsset) {
      onPreviousAsset();
    }
  };

  const handlePreCommit = (direction: 'left' | 'right', nextWidth: number, nextHeight: number) => {
    const { width: scaledWidth, height: scaledHeight } = scaleToFit(
      nextWidth,
      nextHeight,
      containerWidth,
      containerHeight,
    );

    onAboutToNavigate?.({ direction, nextWidth: scaledWidth, nextHeight: scaledHeight });
  };

  $effect(() => {
    if (isFaceEditMode.value) {
      videoPlayer?.pause();
    }
  });

  const calculateSize = () => {
    const { width, height } = scaleToFit(videoWidth, videoHeight, containerWidth, containerHeight);

    const size = {
      width: width + 'px',
      height: height + 'px',
    };

    return size;
  };

  const box = $derived(calculateSize());

  const previousAssetUrl = $derived(getAssetUrl({ asset: previousAsset, sharedLink }));
  const nextAssetUrl = $derived(getAssetUrl({ asset: nextAsset, sharedLink }));
  const transitionFn = (node: Element) => {
    if (nextSizeHint === null) {
      return fade(node, { duration: assetViewerFadeDuration });
    }
    return {};
  };
</script>

{#if showVideo}
  <div
    transition:transitionFn
    class="flex select-none h-full w-full place-content-center place-items-center"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
    use:swipeFeedback={{
      onPreCommit: handlePreCommit,
      onSwipeCommit: handleSwipeCommit,
      leftPreviewUrl: previousAssetUrl,
      rightPreviewUrl: nextAssetUrl,
      currentAssetUrl: assetFileUrl,
      imageElement: videoPlayer,
    }}
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
      <div>
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
          onloadedmetadata={() => handleLoadedMetadata()}
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
      </div>
    {/if}
  </div>
{/if}

<style>
  video:focus {
    outline: none;
  }
</style>
