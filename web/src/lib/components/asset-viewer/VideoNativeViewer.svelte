<script lang="ts">
  import FaceEditor from '$lib/components/asset-viewer/face-editor/FaceEditor.svelte';
  import VideoRemoteViewer from '$lib/components/asset-viewer/VideoRemoteViewer.svelte';
  import { assetViewerFadeDuration } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { castManager } from '$lib/managers/cast-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { mediaCapabilitiesManager } from '$lib/managers/media-capabilities-manager.svelte';
  import { autoPlayVideo, lang, loopVideo as loopVideoPreference } from '$lib/stores/preferences.store';
  import { getAssetHlsSessionUrl, getAssetHlsUrl, getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { Icon, LoadingSpinner, shortcuts } from '@immich/ui';
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
  import 'hls-video-element';
  import type HlsVideoElement from 'hls-video-element';
  import Hls, { AbrController, Events, type FragLoadedData, type FragLoadingData, type HlsConfig } from 'hls.js';
  import 'media-chrome/media-control-bar';
  import 'media-chrome/media-controller';
  import 'media-chrome/media-fullscreen-button';
  import 'media-chrome/media-mute-button';
  import 'media-chrome/media-play-button';
  import 'media-chrome/media-playback-rate-button';
  import 'media-chrome/media-time-display';
  import 'media-chrome/media-volume-range';
  import 'media-chrome/menu/media-playback-rate-menu';
  import 'media-chrome/menu/media-rendition-menu';
  import 'media-chrome/menu/media-settings-menu';
  import 'media-chrome/menu/media-settings-menu-button';
  import 'media-chrome/menu/media-settings-menu-item';
  import { onDestroy, onMount } from 'svelte';
  import { useSwipe, type SwipeCustomEvent } from 'svelte-gestures';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import './immich-time-range';

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
  let assetFileUrl = $derived.by(() => {
    if (featureFlagsManager.value.realtimeTranscoding) {
      return getAssetHlsUrl(assetId);
    }

    if (playOriginalVideo) {
      return getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Original, cacheKey });
    }

    return getAssetPlaybackUrl({ id: assetId, cacheKey });
  });
  const aspectRatio = $derived(asset.width && asset.height ? `${asset.width} / ${asset.height}` : undefined);
  let showVideo = $state(false);
  let hasFocused = $state(false);
  let activeSession: { assetId: string; id: string } | undefined;
  let rebuildCount = 0;

  const MAX_REBUILDS = 1;
  const SESSION_ID_REGEX = /\/video\/stream\/([0-9a-f-]{36})\//;

  // hls.js can abandon fetching an in-flight fragment if it thinks it'll take too long, in which case
  // it emergency switches to a different variant. This extends the delay even further due to
  // cold starting another transcode, so let the fragment finish and have steady ABR decide the next level.
  //
  // It can also emergency switch between fragments: while a switch's first segment is still loading,
  // it can run out of buffer and drop to a lower level for just one segment before continuing at the switched quality.
  // This can cause multiple redundant transcoding restarts when it occurs.
  // Hold the committed level until its first fragment lands, then resume normal ABR.
  class NoAbandonAbrController extends AbrController {
    private switchTarget = -1;

    protected override onFragLoading(_event: Events.FRAG_LOADING, data: FragLoadingData) {
      if (data.frag.sn === 'initSegment') {
        this.switchTarget = data.frag.level;
      }
    }

    protected override onFragLoaded(event: Events.FRAG_LOADED, data: FragLoadedData) {
      if (data.frag.sn !== 'initSegment') {
        this.switchTarget = -1;
      }
      super.onFragLoaded(event, data);
    }

    override get nextAutoLevel(): number {
      const level = super.nextAutoLevel;
      const target = this.hls.levels[this.switchTarget];
      // Hold the committed level, but only while hls.js still considers it healthy.
      if (target && level < this.switchTarget && target.loadError === 0 && target.fragmentError === 0) {
        return this.switchTarget;
      }
      return level;
    }

    override set nextAutoLevel(level: number) {
      super.nextAutoLevel = level;
    }
  }

  const hlsConfig: Partial<HlsConfig> = {
    abrController: NoAbandonAbrController,
    highBufferWatchdogPeriod: 10,
    detectStallWithCurrentTimeMs: 10_000,
    maxBufferHole: 0.5,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    fragLoadPolicy: {
      default: {
        maxTimeToFirstByteMs: 30_000,
        maxLoadTimeMs: 60_000,
        timeoutRetry: { maxNumRetry: 5, retryDelayMs: 100, maxRetryDelayMs: 0 },
        errorRetry: { maxNumRetry: 3, retryDelayMs: 1000, maxRetryDelayMs: 8000 },
      },
    },
    useMediaCapabilities: false,
    xhrSetup: (xhr: XMLHttpRequest, url: string) => {
      const authenticatedUrl = new URL(url, location.origin);
      for (const [key, value] of Object.entries(authManager.params)) {
        if (value) {
          authenticatedUrl.searchParams.set(key, value as string);
        }
      }
      xhr.open('GET', authenticatedUrl.href);
    },
  };

  const releaseSession = () => {
    const session = activeSession;
    if (!session) {
      return;
    }
    activeSession = undefined;
    const url = getAssetHlsSessionUrl(session.assetId, session.id);
    void fetch(url, { method: 'DELETE' }).catch(() => console.warn('Failed to release HLS session', session));
  };

  const isHlsElement = (el: HTMLVideoElement | undefined): el is HlsVideoElement => {
    return el?.tagName === 'HLS-VIDEO';
  };

  const wireHlsListeners = (el: HlsVideoElement, assetId: string, resumeTime?: number) => {
    const api = el.api;
    if (!api) {
      return;
    }

    // This is a hack to make the rendition menu use `api.currentLevel` instead of `api.nextLevel`.
    // `api.nextLevel` makes the player request the next segment followed by the current segment.
    // That backward request causes the server to restart transcoding for no reason.
    Object.defineProperty(api, 'nextLevel', {
      configurable: true,
      get: () => api.currentLevel,
      set: (level: number) => {
        api.currentLevel = level;
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    api.on(Hls.Events.MANIFEST_PARSED, async () => {
      // Defer hls.js's first fragment load until we filter out suboptimal variants
      api.stopLoad();
      const id = api.levels[0]?.url[0]?.match(SESSION_ID_REGEX)?.[1];
      if (id) {
        activeSession = { assetId, id };
      }

      const keep = await mediaCapabilitiesManager.efficientLevels(api.levels);
      for (let i = api.levels.length - 1; i >= 0; i--) {
        if (!keep.has(i)) {
          api.removeLevel(i);
        }
      }

      api.startLoad(resumeTime);
    });

    api.on(Hls.Events.FRAG_LOADED, () => (rebuildCount = 0));

    api.on(Hls.Events.ERROR, (_, data) => {
      // 404 on a fragment can mean the server-side session has expired. Refetch
      // master for a new session, but give up if it still 404s.
      if (
        !data.fatal ||
        data.details !== Hls.ErrorDetails.FRAG_LOAD_ERROR ||
        data.response?.code !== 404 ||
        rebuildCount++ >= MAX_REBUILDS
      ) {
        console.error('HLS error', JSON.stringify(data));
        return;
      }
      console.warn('Error loading segment, starting new session');
      activeSession = undefined;
      resumeTime = el.currentTime;
      el.load();
      // wireHlsListeners must run after el.api is repopulated.
      queueMicrotask(() => wireHlsListeners(el, assetId, resumeTime));
    });
  };

  onMount(() => {
    showVideo = true;
  });

  $effect(() => {
    // reactive on `assetFileUrl` changes
    if (videoPlayer && assetFileUrl) {
      hasFocused = false;
      rebuildCount = 0;
      releaseSession();
      if (isHlsElement(videoPlayer)) {
        videoPlayer.config = hlsConfig;
        videoPlayer.src = assetFileUrl;
        const el = videoPlayer;
        queueMicrotask(() => wireHlsListeners(el, assetId));
      } else {
        videoPlayer.load();
      }
    }
    return releaseSession;
  });

  const onPagehide = (event: PageTransitionEvent) => {
    if (!event.persisted) {
      releaseSession();
    }
  };

  $effect(() => {
    window.addEventListener('pagehide', onPagehide);
    return () => window.removeEventListener('pagehide', onPagehide);
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
    } else if (event.detail.direction === 'right') {
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

  // The time is only refreshed on HLS fragment decode by default,
  // so manually emit events on seek to update it immediately.
  const onSeeking = (event: Event) => event.currentTarget?.dispatchEvent(new Event('timeupdate'));
</script>

<svelte:body
  use:shortcuts={[
    {
      shortcut: { key: ' ' },
      onShortcut: () => (videoPlayer?.paused ? videoPlayer?.play() : videoPlayer?.pause()),
    },
    {
      shortcut: { shift: true, key: 'ArrowLeft' },
      onShortcut: () =>
        videoPlayer ? (videoPlayer.currentTime = Math.max(videoPlayer.currentTime - 0.4, 0)) : undefined,
    },
    {
      shortcut: { shift: true, key: 'ArrowRight' },
      onShortcut: () =>
        videoPlayer
          ? (videoPlayer.currentTime = Math.min(videoPlayer.currentTime + 0.4, videoPlayer.duration))
          : undefined,
    },
  ]}
/>

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
        {#if featureFlagsManager.value.realtimeTranscoding}
          <hls-video
            bind:this={videoPlayer}
            slot="media"
            loop={$loopVideoPreference && loopVideo}
            autoplay={$autoPlayVideo}
            disablePictureInPicture
            playsinline
            {...useSwipe(onSwipe)}
            class="h-full object-contain"
            oncanplay={(e: Event) => handleCanPlay(e.currentTarget as HTMLVideoElement)}
            onended={onVideoEnded}
            onseeking={onSeeking}
            onplaying={(e: Event) => {
              if (hasFocused) {
                return;
              }

              (e.currentTarget as HTMLElement).focus();
              hasFocused = true;
            }}
            onclose={onClose}
            poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey })}
          ></hls-video>
        {:else}
          <video
            bind:this={videoPlayer}
            slot="media"
            src={assetFileUrl}
            loop={$loopVideoPreference && loopVideo}
            autoplay={$autoPlayVideo}
            disablePictureInPicture
            playsinline
            {...useSwipe(onSwipe)}
            class="h-full object-contain"
            oncanplay={(e) => handleCanPlay(e.currentTarget)}
            onended={onVideoEnded}
            onseeking={onSeeking}
            onplaying={(e) => {
              if (hasFocused) {
                return;
              }

              e.currentTarget.focus();
              hasFocused = true;
            }}
            onclose={onClose}
            poster={getAssetMediaUrl({ id: asset.id, size: AssetMediaSize.Preview, cacheKey })}
          ></video>
        {/if}

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
            {#if featureFlagsManager.value.realtimeTranscoding}
              <media-settings-menu-item class="mx-1 rounded-lg p-1 ps-2">
                {$t('video_quality')}
                <Icon slot="suffix" icon={mdiChevronRight} class="m-2" />
                <media-rendition-menu slot="submenu" hidden>
                  <Icon slot="back-icon" icon={mdiChevronLeft} class="m-2" />
                  <span slot="title">{$t('video_quality')}</span>
                </media-rendition-menu>
              </media-settings-menu-item>
            {/if}
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
          <immich-time-range class="h-8 w-full rounded-lg px-2 pb-3 outline-none"></immich-time-range>
        </div>
      </media-controller>

      {#if isLoading}
        <div class="absolute flex place-content-center place-items-center">
          <LoadingSpinner />
        </div>
      {/if}

      {#if assetViewerManager.isFaceEditMode && videoPlayer}
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

  immich-time-range,
  media-volume-range {
    --media-control-hover-background: none;
  }

  immich-time-range:hover,
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
