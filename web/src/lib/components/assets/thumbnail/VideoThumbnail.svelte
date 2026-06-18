<script lang="ts">
  import { cleanClass } from '$lib';
  import '$lib/components/asset-viewer/immich-video-element';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { videoSessionManager } from '$lib/managers/video-session-manager.svelte';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import { mdiAlertCircleOutline, mdiPauseCircleOutline, mdiPlayCircleOutline } from '@mdi/js';
  import { Duration } from 'luxon';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    assetId: string;
    cacheKey: string | null;
    durationInSeconds?: number;
    enablePlayback?: boolean;
    playbackOnIconHover?: boolean;
    showTime?: boolean;
    curve?: boolean;
    playIcon?: string;
    pauseIcon?: string;
    class?: ClassValue;
  }

  let {
    assetId,
    cacheKey,
    durationInSeconds = 0,
    enablePlayback = $bindable(false),
    playbackOnIconHover = false,
    showTime = true,
    curve = false,
    playIcon = mdiPlayCircleOutline,
    pauseIcon = mdiPauseCircleOutline,
    class: className,
  }: Props = $props();

  const useHls = $derived(featureFlagsManager.value.realtimeTranscoding);

  let active = $state(false);
  const controller = $derived(videoSessionManager.get(assetId));
  const remainingSeconds = $derived(controller?.remainingSeconds || durationInSeconds);

  $effect(() => {
    if (!enablePlayback) {
      active = false;
      return;
    }
    if (!useHls) {
      active = true;
      return;
    }
    // Cold-starting a transcode for every thumbnail the pointer brushes over would hammer the server,
    // so wait for the hover to settle before opening an HLS session.
    const timer = setTimeout(() => (active = true), 200);
    return () => clearTimeout(timer);
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

{#if active}
  <immich-video
    asset-id={assetId}
    cache-key={cacheKey ?? ''}
    muted
    loop
    autoplay
    class={cleanClass('h-full w-full [--media-object-fit:cover]', className, curve && 'rounded-xl overflow-hidden')}
  ></immich-video>
{/if}

<div
  class="@container absolute inset-x-0 top-0 flex place-items-center justify-end gap-1 text-xs font-medium text-white text-shadow-[1px_1px_6px_rgb(0_0_0)]"
>
  {#if showTime}
    <span class="hidden pt-2 @min-[100px]:inline">
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
  <span
    class="pe-2 pt-2 drop-shadow-[1px_1px_6px_rgb(0_0_0)] @max-[99px]:scale-75 @max-[99px]:pe-1 @max-[99px]:pt-1"
    onmouseenter={onMouseEnter}
    onmouseleave={onMouseLeave}
  >
    {#if active}
      {#if !controller || controller.loading}
        <LoadingSpinner size="large" />
      {:else if controller.error}
        <Icon icon={mdiAlertCircleOutline} size="24" class="text-red-600" />
      {:else}
        <Icon icon={pauseIcon} size="24" />
      {/if}
    {:else}
      <Icon icon={playIcon} size="24" />
    {/if}
  </span>
</div>
