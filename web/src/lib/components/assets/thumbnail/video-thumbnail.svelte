<script lang="ts">
  import { Duration } from 'luxon';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { mdiAlertCircleOutline, mdiPauseCircleOutline, mdiPlayCircleOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let url: string;
  export let durationInSeconds = 0;
  export let enablePlayback = false;
  export let playbackOnIconHover = false;
  export let showTime = true;
  export let curve = false;
  export let playIcon = mdiPlayCircleOutline;
  export let pauseIcon = mdiPauseCircleOutline;

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
</script>

<div class="absolute right-0 top-0 z-20 flex place-items-center gap-1 text-xs font-medium text-white">
  {#if showTime}
    <span class="pt-2">
      {Duration.fromObject({ seconds: remainingSeconds }).toFormat('m:ss')}
    </span>
  {/if}

  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    class="pr-2 pt-2"
    on:mouseenter={() => {
      if (playbackOnIconHover) {
        enablePlayback = true;
      }
    }}
    on:mouseleave={() => {
      if (playbackOnIconHover) {
        enablePlayback = false;
      }
    }}
  >
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
