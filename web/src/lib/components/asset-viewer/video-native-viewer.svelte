<script lang="ts">
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/video-remote-viewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { autoPlayVideo, loopVideo as loopVideoPreference } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { timeToSeconds } from '$lib/utils/date-time';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import {
    mdiFullscreen,
    mdiFullscreenExit,
    mdiPause,
    mdiPlay,
    mdiVolumeHigh,
    mdiVolumeLow,
    mdiVolumeMedium,
    mdiVolumeMute,
  } from '@mdi/js';
  import 'media-chrome/media-control-bar';
  import 'media-chrome/media-controller';
  import 'media-chrome/media-fullscreen-button';
  import 'media-chrome/media-mute-button';
  import 'media-chrome/media-play-button';
  import 'media-chrome/media-playback-rate-button';
  import 'media-chrome/media-time-display';
  import 'media-chrome/media-time-range';
  import 'media-chrome/media-volume-range';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: AssetResponseDto;
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    showFullscreen?: boolean;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
    onClose?: () => void;
  }

  let {
    asset,
    assetId,
    loopVideo,
    cacheKey,
    playOriginalVideo,
    showFullscreen = true,
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
      if (!video.paused) {
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
</script>

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
      <media-controller class="h-full dark" defaultduration={timeToSeconds(asset.duration)}>
        <video
          bind:this={videoPlayer}
          slot="media"
          loop={$loopVideoPreference && loopVideo}
          autoplay={$autoPlayVideo}
          disablePictureInPicture
          {...useSwipe(onSwipe)}
          class="h-full object-contain"
          oncanplay={(e) => handleCanPlay(e.currentTarget)}
          onended={onVideoEnded}
          onplaying={(e) => e.currentTarget.focus()}
          onclose={onClose}
          poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey })}
          src={assetFileUrl}
        ></video>
        <div part="center" slot="centered-chrome">
          <media-play-button class="rounded-full h-12 p-3 outline-none bg-light-100/60 hover:bg-light-100"
          ></media-play-button>
        </div>
        <div class="flex h-16 w-full place-items-center bg-linear-to-b to-black/40 px-3">
          <media-control-bar part="bottom" class="flex justify-end gap-2 h-10 w-full">
            <media-play-button class="rounded-full p-2 outline-none">
              <Icon slot="play" icon={mdiPlay} />
              <Icon slot="pause" icon={mdiPause} />
            </media-play-button>
            <media-time-range class="rounded-lg p-2 outline-none"></media-time-range>
            <media-time-display showduration class="rounded-lg p-2 outline-none"></media-time-display>

            <div class="media-volume-wrapper" style:position="relative">
              <media-mute-button class="rounded-full p-2 outline-none">
                <Icon slot="off" icon={mdiVolumeMute} />
                <Icon slot="low" icon={mdiVolumeLow} />
                <Icon slot="medium" icon={mdiVolumeMedium} />
                <Icon slot="high" icon={mdiVolumeHigh} />
              </media-mute-button>
              <div class="media-volume-range-wrapper">
                <media-volume-range class="rounded-lg h-10 p-2 outline-none bg-light-100"></media-volume-range>
              </div>
            </div>

            {#if showFullscreen}
              <media-fullscreen-button class="rounded-full p-2 outline-none">
                <Icon slot="enter" icon={mdiFullscreen} />
                <Icon slot="exit" icon={mdiFullscreenExit} />
              </media-fullscreen-button>
            {/if}
          </media-control-bar>
        </div>
      </media-controller>

      {#if isLoading}
        <div class="absolute flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {/if}

      {#if isFaceEditMode.value}
        <FaceEditor htmlElement={videoPlayer!} {containerWidth} {containerHeight} {assetId} />
      {/if}
    {/if}
  </div>
{/if}

<style>
  /* Always */
  media-controller {
    --media-control-background: none;
    --media-control-hover-background: var(--immich-ui-light-100);
    --media-focus-box-shadow: 0 0 0 2px var(--immich-ui-dark);
    --media-font: none;
    --media-primary-color: var(--immich-ui-dark);
    --media-time-range-buffered-color: var(--immich-ui-dark-400);
    --media-range-track-border-radius: 2px;
    --media-range-padding: calc(var(--spacing) * 1);
    --media-tooltip-arrow-display: none;
    --media-tooltip-border-radius: var(--radius-lg);
    --media-tooltip-background-color: var(--immich-ui-light-200);
    --media-tooltip-distance: 8px;
    --media-tooltip-padding: calc(var(--spacing) * 4) calc(var(--spacing) * 3.5);
  }

  /* Needs special handling for some reason */
  media-time-display:focus-visible {
    box-shadow: var(--media-focus-box-shadow);
  }

  /* Small screens */
  media-controller {
    --bottom-play-button-display: none;
    --center-play-button-display: inline-flex;
    --media-time-range-display: none;
  }

  /* Larger screens */
  *[breakpointsm] {
    --bottom-play-button-display: flex;
    --center-play-button-display: none;
    --media-time-range-display: flex;
  }

  *::part(bottom) {
    --media-play-button-display: var(--bottom-play-button-display);
  }

  *::part(center) {
    --media-play-button-display: var(--center-play-button-display);
  }

  *::part(tooltip) {
    font-size: var(--text-xs);
    color: white;
  }

  /* should be media-volume-range[mediavolumeunavailable] */
  *[mediavolumeunavailable] {
    display: none;
  }

  .media-volume-wrapper {
    --media-tooltip-display: none;
  }

  .media-volume-range-wrapper {
    transform: rotate(-90deg);
    position: absolute;
    top: -70px;
    left: -30px;
    opacity: 0;
    --media-control-background: var(--media-control-hover-background);
  }

  media-mute-button:hover + .media-volume-range-wrapper,
  media-mute-button:focus + .media-volume-range-wrapper,
  media-mute-button:focus-within + .media-volume-range-wrapper,
  .media-volume-range-wrapper:hover,
  .media-volume-range-wrapper:focus,
  .media-volume-range-wrapper:focus-within {
    opacity: 1;
  }
</style>
