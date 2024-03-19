<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ProgressBar, { ProgressBarStatus } from '$lib/components/shared-components/progress-bar/progress-bar.svelte';
  import SlideshowSettings from '$lib/components/slideshow-settings.svelte';
  import { SlideshowNavigation, slideshowStore } from '$lib/stores/slideshow.store';
  import { AssetTypeEnum, type AssetResponseDto } from '@immich/sdk';
  import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiCog, mdiFullscreen, mdiPause, mdiPlay } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  export let asset: AssetResponseDto;
  export let isFullScreen: boolean;
  export let onNext = () => {};
  export let onPrevious = () => {};
  export let onClose = () => {};
  export let onSetToFullScreen = () => {};

  const { restartProgress, stopProgress, slideshowDelay, showProgressBar, slideshowNavigation, slideshowPlaying } =
    slideshowStore;

  let progressBarStatus: ProgressBarStatus;
  let progressBar: ProgressBar;
  let showSettings = false;
  let showControls = true;
  let timer: NodeJS.Timeout;
  let isOverControls = false;

  let unsubscribeRestart: () => void;
  let unsubscribeStop: () => void;

  const resetTimer = () => {
    clearTimeout(timer);
    document.body.style.cursor = '';
    showControls = true;
    startTimer();
  };

  const startTimer = () => {
    timer = setTimeout(() => {
      if (!isOverControls) {
        showControls = false;
        document.body.style.cursor = 'none';
      }
    }, 10_000);
  };

  onMount(() => {
    startTimer();
    unsubscribeRestart = restartProgress.subscribe((value) => {
      if (value) {
        $slideshowPlaying = true;
        progressBar.restart(value);
      }
    });

    unsubscribeStop = stopProgress.subscribe((value) => {
      if (value) {
        progressBar.restart(false);
      }
    });
  });

  onDestroy(() => {
    if (unsubscribeRestart) {
      unsubscribeRestart();
    }

    if (unsubscribeStop) {
      unsubscribeStop();
    }
  });

  const handleDone = () => {
    if ($slideshowNavigation === SlideshowNavigation.AscendingOrder) {
      onPrevious();
      return;
    }
    onNext();
  };

  const handlePlaySlideshow = () => {
    if ($slideshowPlaying) {
      if (asset.type === AssetTypeEnum.Image) {
        progressBar.pause();
      }
      $slideshowPlaying = false;
    } else {
      if (asset.type === AssetTypeEnum.Image) {
        progressBar.play();
      }
      $slideshowPlaying = true;
    }
  };
</script>

<svelte:window on:mousemove={resetTimer} />

{#if showControls}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="m-4 flex gap-2"
    on:mouseenter={() => (isOverControls = true)}
    on:mouseleave={() => (isOverControls = false)}
    transition:fly={{ duration: 150 }}
  >
    <CircleIconButton buttonSize="50" icon={mdiClose} on:click={onClose} title="Exit Slideshow" />
    <CircleIconButton
      buttonSize="50"
      icon={$slideshowPlaying ? mdiPause : mdiPlay}
      on:click={handlePlaySlideshow}
      title={$slideshowPlaying ? 'Pause' : 'Play'}
    />
    <CircleIconButton buttonSize="50" icon={mdiChevronLeft} on:click={onPrevious} title="Previous" />
    <CircleIconButton buttonSize="50" icon={mdiChevronRight} on:click={onNext} title="Next" />
    <CircleIconButton buttonSize="50" icon={mdiCog} on:click={() => (showSettings = !showSettings)} title="Next" />
    {#if !isFullScreen}
      <CircleIconButton
        buttonSize="50"
        icon={mdiFullscreen}
        on:click={onSetToFullScreen}
        title="Set Slideshow to fullscreen"
      />
    {/if}
  </div>
{/if}
{#if showSettings}
  <SlideshowSettings onClose={() => (showSettings = false)} />
{/if}

<ProgressBar
  autoplay
  hidden={!$showProgressBar}
  duration={$slideshowDelay}
  bind:this={progressBar}
  bind:status={progressBarStatus}
  onDone={handleDone}
  onPlaying={() => ($slideshowPlaying = true)}
  onPaused={() => ($slideshowPlaying = false)}
/>
