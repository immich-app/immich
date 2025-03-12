<script lang="ts">
  import { Duration } from 'luxon';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiAlertCircleOutline, mdiPauseCircleOutline, mdiPlayCircleOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AssetStore } from '$lib/stores/assets-store.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { onDestroy } from 'svelte';

  interface Props {
    assetStore?: AssetStore | undefined;
    url: string;
    durationInSeconds?: number;
    enablePlayback?: boolean;
    playbackOnIconHover?: boolean;
    showTime?: boolean;
    curve?: boolean;
    playIcon?: string;
    pauseIcon?: string;
  }

  let {
    assetStore = undefined,
    url,
    durationInSeconds = 0,
    enablePlayback = $bindable(false),
    playbackOnIconHover = false,
    showTime = true,
    curve = false,
    playIcon = mdiPlayCircleOutline,
    pauseIcon = mdiPauseCircleOutline,
  }: Props = $props();

  const componentId = generateId();
  let remainingSeconds = $state(durationInSeconds);
  let loading = $state(true);
  let error = $state(false);
  let player: HTMLVideoElement | undefined = $state();

  $effect(() => {
    if (!enablePlayback) {
      // Reset remaining time when playback is disabled.
      remainingSeconds = durationInSeconds;

      if (player) {
        // Cancel video buffering.
        player.src = '';
      }
    }
  });
  const onMouseEnter = () => {
    if (assetStore) {
      assetStore.taskManager.queueScrollSensitiveTask({
        componentId,
        task: () => {
          if (playbackOnIconHover) {
            enablePlayback = true;
          }
        },
      });
    } else {
      if (playbackOnIconHover) {
        enablePlayback = true;
      }
    }
  };

  const onMouseLeave = () => {
    if (assetStore) {
      assetStore.taskManager.queueScrollSensitiveTask({
        componentId,
        task: () => {
          if (playbackOnIconHover) {
            enablePlayback = false;
          }
        },
      });
    } else {
      if (playbackOnIconHover) {
        enablePlayback = false;
      }
    }
  };

  onDestroy(() => {
    assetStore?.taskManager.removeAllTasksForComponent(componentId);
  });
</script>

<div class="absolute right-0 top-0 z-20 flex place-items-center gap-1 text-xs font-medium text-white">
  {#if showTime}
    <span class="pt-2">
      {#if remainingSeconds < 60}
        {Duration.fromObject({ seconds: remainingSeconds }).toFormat('m:ss')}
      {:else if remainingSeconds < 3600}
        {Duration.fromObject({ seconds: remainingSeconds }).toFormat('mm:ss')}
      {:else}
        {Duration.fromObject({ seconds: remainingSeconds }).toFormat('h:mm:ss')}
      {/if}
    </span>
  {/if}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <span class="pr-2 pt-2" onmouseenter={onMouseEnter} onmouseleave={onMouseLeave}>
    {#if enablePlayback}
      {#if loading}
        <LoadingSpinner />
      {:else if error}
        <Icon path={mdiAlertCircleOutline} size="24" class="text-red-600" />
      {:else}
        <Icon path={pauseIcon} size="24" />
      {/if}
    {:else}
      <Icon path={playIcon} size="24" />
    {/if}
  </span>
</div>

{#if enablePlayback}
  <video
    bind:this={player}
    class="h-full w-full object-cover"
    class:rounded-xl={curve}
    muted
    autoplay
    loop
    src={url}
    onplay={() => {
      loading = false;
      error = false;
    }}
    onerror={() => {
      if (!player?.src) {
        // Do not show error when the URL is empty.
        return;
      }
      error = true;
      loading = false;
    }}
    ontimeupdate={({ currentTarget }) => {
      const remaining = currentTarget.duration - currentTarget.currentTime;
      remainingSeconds = Math.min(
        Math.ceil(Number.isNaN(remaining) ? Number.POSITIVE_INFINITY : remaining),
        durationInSeconds,
      );
    }}
  ></video>
{/if}
