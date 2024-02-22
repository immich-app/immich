<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ProgressBar, { ProgressBarStatus } from '$lib/components/shared-components/progress-bar/progress-bar.svelte';
  import SlideshowSettings from '$lib/components/slideshow-settings.svelte';
  import { slideshowStore } from '$lib/stores/slideshow.store';
  import { mdiChevronLeft, mdiChevronRight, mdiClose, mdiCog, mdiPause, mdiPlay } from '@mdi/js';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';

  const { restartProgress, stopProgress, slideshowDelay, showProgressBar } = slideshowStore;

  let progressBarStatus: ProgressBarStatus;
  let progressBar: ProgressBar;
  let showSettings = false;

  let unsubscribeRestart: () => void;
  let unsubscribeStop: () => void;

  const dispatch = createEventDispatcher<{
    next: void;
    prev: void;
    close: void;
  }>();

  onMount(() => {
    unsubscribeRestart = restartProgress.subscribe((value) => {
      if (value) {
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
</script>

<div class="m-4 flex gap-2">
  <CircleIconButton buttonSize="50" icon={mdiClose} on:click={() => dispatch('close')} title="Exit Slideshow" />
  <CircleIconButton
    buttonSize="50"
    icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
    on:click={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar.play() : progressBar.pause())}
    title={progressBarStatus === ProgressBarStatus.Paused ? 'Play' : 'Pause'}
  />
  <CircleIconButton buttonSize="50" icon={mdiChevronLeft} on:click={() => dispatch('prev')} title="Previous" />
  <CircleIconButton buttonSize="50" icon={mdiChevronRight} on:click={() => dispatch('next')} title="Next" />
  <CircleIconButton buttonSize="50" icon={mdiCog} on:click={() => (showSettings = !showSettings)} title="Next" />
</div>

{#if showSettings}
  <SlideshowSettings onClose={() => (showSettings = false)} />
{/if}

<ProgressBar
  autoplay
  hidden={!$showProgressBar}
  duration={$slideshowDelay}
  bind:this={progressBar}
  bind:status={progressBarStatus}
  on:done={() => dispatch('next')}
/>
