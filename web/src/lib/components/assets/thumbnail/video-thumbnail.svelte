<script lang="ts">
  import { Icon, LoadingSpinner } from '@immich/ui';
  import { mdiAlertCircleOutline, mdiPauseCircleOutline, mdiPlayCircleOutline } from '@mdi/js';
  import { Duration } from 'luxon';

  interface Props {
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
    url,
    durationInSeconds = 0,
    enablePlayback = $bindable(false),
    playbackOnIconHover = false,
    showTime = true,
    curve = false,
    playIcon = mdiPlayCircleOutline,
    pauseIcon = mdiPauseCircleOutline,
  }: Props = $props();

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
    if (playbackOnIconHover) {
      enablePlayback = true;
    }
  };

  const onMouseLeave = () => {
    if (playbackOnIconHover) {
      enablePlayback = false;
    }
  };
</script>

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

<div class="absolute end-0 top-0 flex place-items-center gap-1 text-xs font-medium text-white">
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
  <span class="pe-2 pt-2" onmouseenter={onMouseEnter} onmouseleave={onMouseLeave}>
    {#if enablePlayback}
      {#if loading}
        <LoadingSpinner />
      {:else if error}
        <Icon icon={mdiAlertCircleOutline} size="24" class="text-red-600" />
      {:else}
        <Icon icon={pauseIcon} size="24" />
      {/if}
    {:else}
      <Icon icon={playIcon} size="24" />
    {/if}
  </span>
</div>
