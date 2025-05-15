<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { castManager, CastState } from '$lib/managers/cast-manager.svelte';
  import { mdiCastConnected, mdiPause, mdiPlay } from '@mdi/js';

  interface Props {
    poster: string;
    assetFileUrl: string;
    onVideoStarted: () => void;
    onVideoEnded: () => void;
  }

  let { poster, assetFileUrl, onVideoEnded, onVideoStarted }: Props = $props();

  let previousPlayerState: CastState | null = $state(null);

  const handlePlayPauseButton = () => {
    if (castManager.castState === CastState.PLAYING) {
      castManager.pause();
    } else if (castManager.castState === CastState.IDLE) {
      void cast(assetFileUrl, true);
    } else {
      castManager.play();
    }
  };

  $effect(() => {
    if (assetFileUrl) {
      void cast(assetFileUrl);
    }
  });

  $effect(() => {
    if (
      castManager.castState !== previousPlayerState &&
      castManager.castState === CastState.IDLE &&
      previousPlayerState !== CastState.PAUSED
    ) {
      onVideoEnded();
    }

    previousPlayerState = castManager.castState;
  });

  const cast = async (url: string, force: boolean = false) => {
    if (!url) {
      return;
    }
    const fullUrl = new URL(url, globalThis.location.href);
    const didCast = await castManager.loadMedia(fullUrl.href, force);

    if (didCast) {
      onVideoStarted();
    }
  };

  function handleSeek(event: Event) {
    const newTime: number = Number.parseFloat((event.target as HTMLInputElement).value);
    castManager.seekTo(newTime);
  }
</script>

<span class="flex items-center space-x-2 text-gray-200 text-2xl font-bold">
  <Icon path={mdiCastConnected} class="text-primary" size="36" />
  <span>Connected to {castManager.receiverName}</span>
</span>

<img src={poster} alt="poster" class="rounded-xl m-4" />

<div class="flex place-content-center place-items-center">
  {#if castManager.castState == CastState.BUFFERING}
    <div class="p-3">
      <LoadingSpinner />
    </div>
  {:else}
    <CircleIconButton
      color="opaque"
      icon={castManager.castState == CastState.PLAYING ? mdiPause : mdiPlay}
      onclick={() => handlePlayPauseButton()}
      title={castManager.castState == CastState.PLAYING ? 'Pause' : 'Play'}
    />
  {/if}

  <input
    type="range"
    min="0"
    max={castManager.duration}
    value={castManager.currentTime ?? 0}
    onchange={handleSeek}
    class="w-full h-4 bg-primary"
  />
</div>
