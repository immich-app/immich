<script lang="ts">
  import { castManager, CastState } from '$lib/managers/cast-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Icon, IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiCastConnected, mdiPause, mdiPlay } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    poster: string;
    assetFileUrl: string;
    onVideoStarted: () => void;
    onVideoEnded: () => void;
  }

  let { poster, assetFileUrl, onVideoEnded, onVideoStarted }: Props = $props();

  let previousPlayerState: CastState | null = $state(null);

  const handlePlayPauseButton = async () => {
    switch (castManager.castState) {
      case CastState.PLAYING: {
        castManager.pause();
        break;
      }
      case CastState.IDLE: {
        await cast(assetFileUrl, true);
        break;
      }
      default: {
        castManager.play();
        break;
      }
    }
  };

  $effect(() => {
    if (assetFileUrl) {
      // this can't be in an async context with $effect
      void cast(assetFileUrl);
    }
  });

  $effect(() => {
    if (castManager.castState === CastState.IDLE && previousPlayerState !== CastState.PAUSED) {
      onVideoEnded();
    }

    previousPlayerState = castManager.castState;
  });

  const cast = async (url: string, force: boolean = false) => {
    if (!url || !castManager.isCasting) {
      return;
    }
    const fullUrl = new URL(url, globalThis.location.href);

    try {
      await castManager.loadMedia(fullUrl.href, force);
      onVideoStarted();
    } catch (error) {
      handleError(error, 'Unable to cast');
      return;
    }
  };

  function handleSeek(event: Event) {
    const newTime = Number.parseFloat((event.target as HTMLInputElement).value);
    castManager.seekTo(newTime);
  }
</script>

<span class="flex items-center space-x-2 text-gray-200 text-2xl font-bold">
  <Icon icon={mdiCastConnected} class="text-primary" size="36" />
  <span>{$t('connected_to')} {castManager.receiverName}</span>
</span>

<img src={poster} alt="poster" class="rounded-xl m-4" />

<div class="flex place-content-center place-items-center">
  {#if castManager.castState == CastState.BUFFERING}
    <div class="p-3">
      <LoadingSpinner />
    </div>
  {:else}
    <IconButton
      color="primary"
      shape="round"
      variant="ghost"
      icon={castManager.castState == CastState.PLAYING ? mdiPause : mdiPlay}
      onclick={() => handlePlayPauseButton()}
      aria-label={castManager.castState == CastState.PLAYING ? 'Pause' : 'Play'}
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
