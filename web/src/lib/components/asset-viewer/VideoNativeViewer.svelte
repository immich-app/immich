<script lang="ts">
  import FaceEditor from '$lib/components/asset-viewer/face-editor/FaceEditor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/VideoRemoteViewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { autoPlayVideo, lang, loopVideo as loopVideoPreference } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import {
    mdiCheck,
    mdiChevronLeft,
    mdiChevronRight,
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
  import 'media-chrome/menu/media-playback-rate-menu';
  import 'media-chrome/menu/media-settings-menu';
  import 'media-chrome/menu/media-settings-menu-button';
  import 'media-chrome/menu/media-settings-menu-item';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    asset: AssetResponseDto;
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    playOriginalVideo: boolean;
    extendedControls?: boolean;
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
    extendedControls = false,
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
  const aspectRatio = $derived(asset.width && asset.height ? `${asset.width} / ${asset.height}` : undefined);
  let showVideo = $state(false);
  let hasFocused = $state(false);

  onMount(() => {
    showVideo = true;
  });

  $effect(() => {
    // reactive on `assetFileUrl` changes
    if (assetFileUrl) {
      hasFocused = false;
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
    if (assetViewerManager.isFaceEditMode) {
      videoPlayer?.pause();
    }
  });
</script>

{#if showVideo}
  <div
    transition:fade={{ duration: assetViewerFadeDuration }}
    class="flex h-full place-content-center place-items-center select-none"
    bind:clientWidth={containerWidth}
    bind:clientHeight={containerHeight}
  >
    {#if castManager.isCasting}
      <div class="h-full place-content-center place-items-center">
        <VideoRemoteViewer
          poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
          {onVideoStarted}
          {onVideoEnded}
          {assetFileUrl}
        />
      </div>
    {:else}
      <!-- dir=ltr based on https://github.com/videojs/video.js/issues/949 -->
      <media-controller
        dir="ltr"
        lang={$lang}
        nohotkeys
        class="dark h-full max-w-full"
        style:aspect-ratio={aspectRatio}
        defaultduration={asset.duration! / 1000}
      >
        <video
          bind:this={videoPlayer}
          slot="media"
          loop={$loopVideoPreference && loopVideo}
          autoplay={$autoPlayVideo}
          disablePictureInPicture
          playsinline
          {...useSwipe(onSwipe)}
          class="h-full object-contain"
          oncanplay={(e) => handleCanPlay(e.currentTarget)}
          onended={onVideoEnded}
          onplaying={(e) => {
            if (!hasFocused) {
              e.currentTarget.focus();
              hasFocused = true;
            }
          }}
          onclose={onClose}
          poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey })}
          src={assetFileUrl}
        ></video>

        {#if extendedControls}
          <media-settings-menu hidden anchor="auto" class="min-w-3xs rounded-xl border border-light-300 shadow-sm">
            <Icon slot="checked-indicator" icon={mdiCheck} class="m-2" />
            <media-settings-menu-item class="mx-1 rounded-lg p-1 ps-2">
              {$t('media_chrome.playback_rate')}
              <Icon slot="suffix" icon={mdiChevronRight} class="m-2" />
              <media-playback-rate-menu slot="submenu" hidden rates="0.5 1 1.5 2">
                <Icon slot="back-icon" icon={mdiChevronLeft} class="m-2" />
                <span slot="title">{$t('media_chrome.playback_rate')}</span>
              </media-playback-rate-menu>
            </media-settings-menu-item>
          </media-settings-menu>
        {/if}

        <div class="flex h-32 w-full flex-col justify-end bg-linear-to-b to-black/80 px-4">
          <media-control-bar part="bottom" class="flex h-10 w-full gap-2">
            <media-play-button class="shrink-0 rounded-full p-2 outline-none">
              <Icon slot="play" icon={mdiPlay} />
              <Icon slot="pause" icon={mdiPause} />
            </media-play-button>
            <media-time-display showduration class="rounded-lg p-2 outline-none"></media-time-display>

            <span class="grow"></span>

            <div
              class="volume-wrapper shrink-0 rounded-full bg-light-100/0 transition-colors duration-400 hover:bg-light-100"
            >
              <media-volume-range class="h-full bg-none outline-none"></media-volume-range>
              <media-mute-button class="bg-none p-2 outline-none">
                <Icon slot="off" icon={mdiVolumeMute} />
                <Icon slot="low" icon={mdiVolumeLow} />
                <Icon slot="medium" icon={mdiVolumeMedium} />
                <Icon slot="high" icon={mdiVolumeHigh} />
              </media-mute-button>
            </div>

            {#if extendedControls}
              <media-fullscreen-button class="shrink-0 rounded-full p-2 outline-none">
                <Icon slot="enter" icon={mdiFullscreen} />
                <Icon slot="exit" icon={mdiFullscreenExit} />
              </media-fullscreen-button>
              <media-settings-menu-button class="shrink-0 rounded-full p-2 outline-none"></media-settings-menu-button>
            {/if}
          </media-control-bar>
          <media-time-range class="h-8 w-full rounded-lg px-2 pb-3 outline-none"></media-time-range>
        </div>
      </media-controller>

      {#if isLoading}
        <div class="absolute flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {/if}

      {#if assetViewerManager.isFaceEditMode}
        <FaceEditor htmlElement={videoPlayer} {containerWidth} {containerHeight} {assetId} />
      {/if}
    {/if}
  </div>
{/if}

<style>
  media-controller {
    --media-control-background: none;
    --media-control-hover-background: var(--immich-ui-light-100);
    --media-focus-box-shadow: 0 0 0 2px var(--immich-ui-dark);
    --media-font-family: var(--font-sans);
    --media-font-size: var(--text-base);
    --media-font-weight: var(--font-weight-medium);
    --media-menu-border-radius: var(--radius-xl);
    --media-menu-gap: var(--spacing);
    --media-menu-item-hover-background: var(--immich-ui-light-200);
    --media-menu-item-icon-height: 1em;
    --media-menu-item-indicator-height: 1em;
    --media-primary-color: var(--immich-ui-dark);
    --media-time-range-buffered-color: var(--immich-ui-dark-400);
    --media-time-range-hover-bottom: 0;
    --media-time-range-hover-height: 100%;
    --media-range-thumb-box-shadow: none;
    --media-range-thumb-opacity: 0;
    --media-range-thumb-transition: opacity 0.15s ease;
    --media-range-track-border-radius: 2px;
    --media-range-track-height: 3.5px;
    --media-range-padding: 0;
    --media-settings-menu-background: var(--immich-ui-light-100);
    --media-text-content-height: var(--text-base--line-height);
    --media-tooltip-arrow-display: none;
    --media-tooltip-border-radius: var(--radius-lg);
    --media-tooltip-background-color: var(--immich-ui-light-200);
    --media-tooltip-distance: 8px;
    --media-tooltip-padding: calc(var(--spacing) * 2) calc(var(--spacing) * 3.5);
  }

  media-time-display {
    font-variant-numeric: tabular-nums;
  }

  media-time-range,
  media-volume-range {
    --media-control-hover-background: none;
  }

  media-time-range:hover,
  media-volume-range:hover {
    --media-range-thumb-opacity: 1;
  }

  *::part(tooltip) {
    --media-font-size: var(--text-xs);
    --media-text-content-height: var(--text-xs--line-height);
    color: white;
  }

  *[mediavolumeunavailable] {
    --media-volume-range-display: none;
  }

  .volume-wrapper {
    --media-control-hover-background: none;
  }

  media-volume-range:has(+ media-mute-button) {
    padding: 0;
    margin: 0;
    width: 0;
    overflow: hidden;
    transition: width 0.4s ease-out;
  }

  /* Expand volume control in all relevant states */
  .volume-wrapper:hover > media-volume-range,
  media-volume-range:has(+ media-mute-button:hover),
  media-volume-range:has(+ media-mute-button:focus),
  media-volume-range:has(+ media-mute-button:focus-within),
  media-volume-range:hover,
  media-volume-range:focus,
  media-volume-range:focus-within {
    padding: 0 calc(var(--spacing) * 2);
    margin-left: calc(var(--spacing) * 2);
    width: 70px;
  }
</style>
