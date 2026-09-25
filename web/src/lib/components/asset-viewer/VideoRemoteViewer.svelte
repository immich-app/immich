<script lang="ts">
  import { castManager, CastState } from '$lib/managers/cast-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Icon, LoadingSpinner } from '@immich/ui';
  import { mdiPause, mdiPlay, mdiVolumeHigh, mdiVolumeLow, mdiVolumeMedium, mdiVolumeMute } from '@mdi/js';
  import 'media-chrome/media-control-bar';
  import 'media-chrome/media-controller';
  import 'media-chrome/media-mute-button';
  import 'media-chrome/media-play-button';
  import 'media-chrome/media-time-display';
  import 'media-chrome/media-volume-range';
  import './cast-video.svelte';
  import './immich-time-range';

  interface Props {
    poster: string;
    assetFileUrl: string;
    duration: number;
    onVideoStarted: () => void;
    onVideoEnded: () => void;
  }

  let { poster, assetFileUrl, duration, onVideoEnded, onVideoStarted }: Props = $props();

  let previousPlayerState: CastState | null = $state(null);

  const castUrl = $derived(new URL(assetFileUrl, location.href).href);

  $effect(() => {
    if (assetFileUrl) {
      void cast(assetFileUrl);
    }
  });

  $effect(() => {
    if (
      castManager.castState === CastState.IDLE &&
      previousPlayerState !== null &&
      previousPlayerState !== CastState.PAUSED
    ) {
      onVideoEnded();
    }

    previousPlayerState = castManager.castState;
  });

  const cast = async (url: string, force: boolean = false) => {
    if (!url || !castManager.isCasting) {
      return;
    }
    const fullUrl = new URL(url, location.href);

    try {
      await castManager.loadMedia({ key: fullUrl.href, url: fullUrl.href }, force);
      onVideoStarted();
    } catch (error) {
      handleError(error, 'Unable to cast');
      return;
    }
  };
</script>

<div class="relative size-full">
  <media-controller dir="ltr" nohotkeys novolumepref nomutedpref defaultduration={duration} class="dark size-full">
    <cast-video slot="media" src={castUrl} {poster}></cast-video>

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
      </media-control-bar>
      <immich-time-range class="h-8 w-full rounded-lg px-2 pb-3 outline-none"></immich-time-range>
    </div>
  </media-controller>

  {#if castManager.castState === CastState.BUFFERING}
    <div class="pointer-events-none absolute inset-0 flex place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
</div>

<style>
  media-controller {
    --media-control-background: none;
    --media-control-hover-background: var(--immich-ui-light-100);
    --media-focus-box-shadow: 0 0 0 2px var(--immich-ui-dark);
    --media-font-family: var(--font-sans);
    --media-font-size: var(--text-base);
    --media-font-weight: var(--font-weight-medium);
    --media-primary-color: var(--immich-ui-dark);
    --media-range-thumb-box-shadow: none;
    --media-range-thumb-opacity: 0;
    --media-range-thumb-transition: opacity 0.15s ease;
    --media-range-track-border-radius: 2px;
    --media-range-track-height: 3.5px;
    --media-range-padding: 0;
    --media-time-range-buffered-color: var(--immich-ui-dark-400);
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
