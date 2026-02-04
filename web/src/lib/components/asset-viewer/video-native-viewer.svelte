<script lang="ts">
  import AdaptiveImage from '$lib/components/asset-viewer/adaptive-image.svelte';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import SwipeFeedback from '$lib/components/asset-viewer/swipe-feedback.svelte';
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
  import { slideshowStore } from '$lib/stores/slideshow.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { getDimensions } from '$lib/utils/asset-utils';
  import { scaleToFit } from '$lib/utils/layout-utils';
  import { AssetMediaSize, type SharedLinkResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { fade } from 'svelte/transition';

  interface Props {
    transitionName?: string;
    cursor: AssetCursor;
    assetId?: string;
    sharedLink?: SharedLinkResponseDto;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    onSwipe?: (direction: 'left' | 'right') => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
    onReady?: () => void;
  }

  let {
    transitionName,
    cursor,
    assetId,
    sharedLink,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    onSwipe,
    onVideoEnded = () => {},
    onVideoStarted = () => {},
    onClose = () => {},
    onReady,
  }: Props = $props();

  const asset = $derived(cursor.current);
  const previousAsset = $derived(cursor.previousAsset);
  const nextAsset = $derived(cursor.nextAsset);
  const effectiveAssetId = $derived(assetId ?? asset.id);

  const { slideshowState, slideshowLook } = slideshowStore;

  let videoPlayer: HTMLVideoElement | undefined = $state();
  let isLoading = $state(true);
  let assetFileUrl = $derived(
    playOriginalVideo
      ? getAssetMediaUrl({ id: effectiveAssetId, size: AssetMediaSize.Original, cacheKey })
      : getAssetPlaybackUrl({ id: effectiveAssetId, cacheKey }),
  );
  let previousAssetFileUrl = $state<string | undefined>();
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

  $effect(() => {
    if (assetFileUrl && assetFileUrl !== previousAssetFileUrl) {
      previousAssetFileUrl = assetFileUrl;
      untrack(() => {
        isLoading = true;
        videoPlayer?.load();
      });
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
    onReady?.();
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
</script>

<SwipeFeedback
  class="flex select-none h-full w-full place-content-center place-items-center"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
  {onSwipe}
>
  {#if showVideo}
    <div
      in:fade={{ duration: assetViewerFadeDuration }}
      class="flex h-full w-full place-content-center place-items-center"
    >
      {#if castManager.isCasting}
        <div class="place-content-center h-full place-items-center">
          <VideoRemoteViewer
            poster={getAssetMediaUrl({ id: effectiveAssetId, size: AssetMediaSize.Preview, cacheKey })}
            {onVideoStarted}
            {onVideoEnded}
            {assetFileUrl}
          />
        </div>
      {:else}
        <div class="relative">
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
            poster={getAssetMediaUrl({ id: effectiveAssetId, size: AssetMediaSize.Preview, cacheKey })}
            src={assetFileUrl}
          >
          </video>

          {#if isLoading}
            <div class="absolute inset-0 flex place-content-center place-items-center">
              <LoadingSpinner />
            </div>
          {/if}

          {#if isFaceEditMode.value}
            <FaceEditor htmlElement={videoPlayer} {containerWidth} {containerHeight} assetId={effectiveAssetId} />
          {/if}
        </div>
      {/if}
    </div>
  {/if}
  {#snippet leftPreview()}
    {#if previousAsset}
      <AdaptiveImage
        asset={previousAsset}
        {sharedLink}
        container={{ width: containerWidth, height: containerHeight }}
        zoomDisabled={true}
        imageClass="object-contain"
        slideshowState={$slideshowState}
        slideshowLook={$slideshowLook}
      />
    {/if}
  {/snippet}

  {#snippet rightPreview()}
    {#if nextAsset}
      <AdaptiveImage
        asset={nextAsset}
        {sharedLink}
        container={{ width: containerWidth, height: containerHeight }}
        zoomDisabled={true}
        imageClass="object-contain"
        slideshowState={$slideshowState}
        slideshowLook={$slideshowLook}
      />
    {/if}
  {/snippet}
</SwipeFeedback>

<style>
  video:focus {
    outline: none;
  }
</style>
