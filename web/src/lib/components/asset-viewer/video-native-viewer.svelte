<script lang="ts">
  import { swipeFeedback } from '$lib/actions/swipe-feedback';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { assetCacheManager } from '$lib/managers/AssetCacheManager.svelte';
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
  import { getDimensions } from '$lib/utils/asset-utils';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { AssetMediaSize, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    assetId: string;
    previousAsset?: AssetResponseDto | null | undefined;
    nextAsset?: AssetResponseDto | undefined | null | undefined;
    sharedLink?: SharedLinkResponseDto;
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
    previousAsset,
    nextAsset,
    sharedLink,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    onPreviousAsset = () => {},
    onNextAsset = () => {},
    onVideoEnded = () => {},
    onVideoStarted = () => {},
    onClose = () => {},
  }: Props = $props();

  let asset = $state<AssetResponseDto | null>(null);

  let videoPlayer: HTMLVideoElement | undefined = $state();
  let isLoading = $state(true);
  let assetFileUrl = $derived(
    playOriginalVideo ? getAssetOriginalUrl({ id: assetId, cacheKey }) : getAssetPlaybackUrl({ id: assetId, cacheKey }),
  );
  let isScrubbing = $state(false);
  let showVideo = $state(false);

  let containerWidth = $state(document.documentElement.clientWidth);
  let containerHeight = $state(document.documentElement.clientHeight);

  const exifDimensions = $derived(
    asset?.exifInfo?.exifImageHeight && asset?.exifInfo.exifImageHeight
      ? (getDimensions(asset.exifInfo) as { width: number; height: number })
      : null,
  );
  const container = $derived({
    width: containerWidth,
    height: containerHeight,
  });
  let dimensions = $derived(exifDimensions ?? { width: 1, height: 1 });
  const scaledDimensions = $derived(scaleToFit(dimensions, container));

  onMount(() => {
    // Show video after mount to ensure fading in.
    showVideo = true;
  });

  $effect(
    () =>
      void assetCacheManager.getAsset({ key: cacheKey ?? assetId, id: assetId }).then((assetDto) => (asset = assetDto)),
  );

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
    dimensions = {
      width: videoPlayer?.videoWidth ?? 1,
      height: videoPlayer?.videoHeight ?? 1,
    };
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

  $effect(() => {
    if (isFaceEditMode.value) {
      videoPlayer?.pause();
    }
  });

  const calculateSize = () => {
    const { width, height } = scaledDimensions;

    const size = {
      width: width + 'px',
      height: height + 'px',
    };

    return size;
  };

  const box = $derived(calculateSize());

  const previousAssetUrl = $derived(getAssetUrl({ asset: previousAsset, sharedLink }));
  const nextAssetUrl = $derived(getAssetUrl({ asset: nextAsset, sharedLink }));
</script>

{#if showVideo}
  <div
    in:fade={{ duration: assetViewerFadeDuration }}
    class="flex select-none h-full w-full place-content-center place-items-center"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
    use:swipeFeedback={{
      onSwipeCommit: handleSwipeCommit,
      leftPreviewUrl: previousAssetUrl,
      rightPreviewUrl: nextAssetUrl,
      currentAssetUrl: assetFileUrl,
      target: videoPlayer,
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
