<script lang="ts">
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import ProgressBar, { ProgressBarStatus } from '../shared-components/progress-bar/progress-bar.svelte';
  import { slideshowStore } from '$lib/stores/slideshow.store';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import {
    mdiChevronLeft,
    mdiChevronRight,
    mdiClose,
    mdiPause,
    mdiPlay,
    mdiShuffle,
    mdiShuffleDisabled,
  } from '@mdi/js';

  const { slideshowShuffle } = slideshowStore;
  const { restartProgress, stopProgress } = slideshowStore;

  let progressBarStatus: ProgressBarStatus;
  let progressBar: ProgressBar;

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
  <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} title="Exit Slideshow" />
  {#if $slideshowShuffle}
    <CircleIconButton icon={mdiShuffle} on:click={() => ($slideshowShuffle = false)} title="Shuffle" />
  {:else}
    <CircleIconButton icon={mdiShuffleDisabled} on:click={() => ($slideshowShuffle = true)} title="No shuffle" />
  {/if}
  <CircleIconButton
    icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
    on:click={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar.play() : progressBar.pause())}
    title={progressBarStatus === ProgressBarStatus.Paused ? 'Play' : 'Pause'}
  />
  <CircleIconButton icon={mdiChevronLeft} on:click={() => dispatch('prev')} title="Previous" />
  <CircleIconButton icon={mdiChevronRight} on:click={() => dispatch('next')} title="Next" />
</div>

<ProgressBar
  autoplay
  bind:this={progressBar}
  bind:status={progressBarStatus}
  on:done={() => dispatch('next')}
  duration={5000}
/>
