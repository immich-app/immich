<script lang="ts">
  import CustomVideoPlayer from '$lib/components/asset-viewer/custom-video-player.svelte';
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
  import { getAssetHlsManifestUrl, getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
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
  let isBuffering = $state(false);
  let hlsInstance: any = $state(null);

  // Direct playback URL (used as fallback)
  let assetFileUrl = $derived(
    playOriginalVideo
      ? getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Original, cacheKey })
      : getAssetPlaybackUrl({ id: assetId, cacheKey }),
  );

  // HLS manifest URL for segmented streaming
  let hlsManifestUrl = $derived(
    playOriginalVideo ? null : getAssetHlsManifestUrl({ id: assetId, cacheKey }),
  );

  let isScrubbing = $state(false);
  let showVideo = $state(false);
  let hasFocused = $state(false);

  const initHls = async () => {
    if (!videoPlayer || !hlsManifestUrl) return;

    try {
      const Hls = (await import('hls.js')).default;

      if (Hls.isSupported()) {
        // Destroy previous instance if any
        if (hlsInstance) {
          hlsInstance.destroy();
        }

        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          startLevel: -1, // auto
          enableWorker: true,
        });

        hls.loadSource(hlsManifestUrl);
        hls.attachMedia(videoPlayer);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if ($autoPlayVideo && videoPlayer) {
            videoPlayer.play().catch(() => {
              // auto-play blocked
            });
          }
        });

        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            // On fatal error, fallback to direct playback
            hls.destroy();
            hlsInstance = null;
            if (videoPlayer) {
              videoPlayer.src = assetFileUrl;
            }
          }
        });

        hlsInstance = hls;
        return;
      }
    } catch {
      // hls.js not available, fall through to direct playback
    }

    // Fallback: native HLS support (Safari) or direct playback
    if (videoPlayer) {
      if (hlsManifestUrl && videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        videoPlayer.src = hlsManifestUrl;
      } else {
        videoPlayer.src = assetFileUrl;
      }
    }
  };

  onMount(() => {
    showVideo = true;
  });

  $effect(() => {
    if (assetFileUrl && videoPlayer) {
      hasFocused = false;
      void initHls();
    }
  });

  onDestroy(() => {
    if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
    }
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
      <CustomVideoPlayer
        src={assetFileUrl}
        poster={getAssetMediaUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
        autoplay={$autoPlayVideo}
        loop={$loopVideoPreference && loopVideo}
        bind:muted={$videoViewerMuted}
        bind:volume={$videoViewerVolume}
        bind:videoElement={videoPlayer}
        bind:isBuffering
        onCanPlay={(video) => handleCanPlay(video)}
        onEnded={onVideoEnded}
        onVolumeChange={(e) => {
          const target = e.currentTarget as HTMLVideoElement;
          $videoViewerMuted = target.muted;
        }}
        onSeeking={() => (isScrubbing = true)}
        onSeeked={() => (isScrubbing = false)}
        onPlaying={(e) => {
          const target = e.currentTarget as HTMLVideoElement;
          if (!hasFocused) {
            target.focus();
            hasFocused = true;
          }
        }}
        onClose={() => onClose()}
      />

      {#if isLoading}
        <div class="absolute flex place-content-center place-items-center">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
        </div>
      {/if}

      {#if isFaceEditMode.value && videoPlayer}
        <FaceEditor htmlElement={videoPlayer} {containerWidth} {containerHeight} {assetId} />
      {/if}
    {/if}
  </div>
{/if}
