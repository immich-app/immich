<script lang="ts">
  import { Duration } from 'luxon';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiAlertCircleOutline, mdiPauseCircleOutline, mdiPlayCircleOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { AssetStore } from '$lib/stores/assets.store';
  import { generateId } from '$lib/utils/generate-id';
  import { onDestroy } from 'svelte';

  export let assetStore: AssetStore | undefined = undefined;
  export let url: string;
  export let durationInSeconds = 0;
  export let enablePlayback = false;
  export let playbackOnIconHover = false;
  export let showTime = true;
  export let curve = false;
  export let playIcon = mdiPlayCircleOutline;
  export let pauseIcon = mdiPauseCircleOutline;

  const componentId = generateId();
  let remainingSeconds = durationInSeconds;
  let loading = true;
  let error = false;
  let player: HTMLVideoElement;

  $: if (!enablePlayback) {
    // Reset remaining time when playback is disabled.
    remainingSeconds = durationInSeconds;

    if (player) {
      // Cancel video buffering.
      player.src = '';
    }
  }
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
      {Duration.fromObject({ seconds: remainingSeconds }).toFormat('m:ss')}
    </span>
  {/if}

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span class="pr-2 pt-2" on:mouseenter={onMouseEnter} on:mouseleave={onMouseLeave}>
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
    on:play={() => {
      loading = false;
      error = false;
    }}
    on:error={() => {
      error = true;
      loading = false;
    }}
    on:timeupdate={({ currentTarget }) => {
      const remaining = currentTarget.duration - currentTarget.currentTime;
      remainingSeconds = Math.min(Math.ceil(remaining), durationInSeconds);
    }}
  />
{/if}
