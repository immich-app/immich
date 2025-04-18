<script lang="ts">
  import { loopVideo as loopVideoPreference, videoViewerMuted, videoViewerVolume } from '$lib/stores/preferences.store';
  import { getAssetPlaybackUrl, getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetMediaSize } from '@immich/sdk';
  import { swipe } from 'svelte-gestures';
  import type { SwipeCustomEvent } from 'svelte-gestures';
  import { fade } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import FaceEditor from '$lib/components/asset-viewer/face-editor/face-editor.svelte';
  import 'vidstack/bundle';
  import type { MediaPlayerElement } from 'vidstack/elements';
  import type { MediaVolumeChangeEvent, MediaAutoPlayFailEvent } from 'vidstack';
  import { tick } from 'svelte';

  interface Props {
    assetId: string;
    loopVideo: boolean;
    cacheKey: string | null;
    onPreviousAsset?: () => void;
    onNextAsset?: () => void;
    onVideoEnded?: () => void;
    onVideoStarted?: () => void;
  }

  let {
    assetId,
    loopVideo,
    cacheKey,
    onPreviousAsset = () => {},
    onNextAsset = () => {},
    onVideoEnded = () => {},
    onVideoStarted = () => {},
  }: Props = $props();

  let player: MediaPlayerElement | undefined = $state();
  let assetFileUrl = $derived(getAssetPlaybackUrl({ id: assetId, cacheKey }));
  let videoElement = $derived(player?.querySelector('video') as HTMLVideoElement);

  let forceMuted = $state(false);
  let containerWidth = $state(0);
  let containerHeight = $state(0);

  const streamType = 'on-demand';
  const logLevel: 'silent' | 'error' | 'warn' | 'info' | 'debug' = 'silent';

  const onSwipe = (event: SwipeCustomEvent) => {
    if (event.detail.direction === 'left') {
      onNextAsset();
    }
    if (event.detail.direction === 'right') {
      onPreviousAsset();
    }
  };

  $effect(() => {
    if (isFaceEditMode.value) {
      void player?.pause();
    }
  });
</script>

<div
  transition:fade={{ duration: 150 }}
  class="flex h-full select-none place-content-center place-items-center"
  bind:clientWidth={containerWidth}
  bind:clientHeight={containerHeight}
  use:swipe={() => ({})}
  onswipe={onSwipe}
>
  {// vidstack is missing some types for svelte5 event syntax: onauto-play-fail
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  /* @ts-ignore */ void 0}
  <media-player
    class="h-full w-full"
    bind:this={player}
    src={assetFileUrl}
    poster={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
    {logLevel}
    {streamType}
    loop={$loopVideoPreference && loopVideo}
    autoPlay
    playsInline
    muted={forceMuted || $videoViewerMuted}
    onauto-play-fail={async (e: MediaAutoPlayFailEvent) => {
      if (e.detail.error.name === 'NotAllowedError') {
        forceMuted = true;
        try {
          await tick();
          await player?.play();
        } catch (error) {
          handleError(error, $t('errors.unable_to_play_video'));
        }
      }
    }}
    onvolume-change={(e: MediaVolumeChangeEvent) => {
      if (forceMuted && !e.detail.muted && e.detail.volume > 0) {
        forceMuted = false;
      }
      if (!forceMuted) {
        $videoViewerVolume = e.detail.volume;
        $videoViewerMuted = e.detail.muted;
      }
    }}
    onended={onVideoEnded}
    onstarted={() => {
      if (!forceMuted) {
        player!.volume = $videoViewerVolume;
        player!.muted = $videoViewerMuted;
      }
      onVideoStarted();
    }}
  >
    <media-provider>
      <media-poster
        class="vds-poster"
        src={getAssetThumbnailUrl({ id: assetId, size: AssetMediaSize.Preview, cacheKey })}
      ></media-poster>
    </media-provider>
    <media-video-layout noScrubGesture smallWhen="never"></media-video-layout>
  </media-player>
  {#if isFaceEditMode.value}
    <FaceEditor htmlElement={videoElement} {containerWidth} {containerHeight} {assetId} />
  {/if}
</div>
