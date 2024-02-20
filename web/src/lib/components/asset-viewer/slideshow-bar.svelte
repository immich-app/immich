<script lang="ts">
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import ProgressBar, { ProgressBarStatus } from '../shared-components/progress-bar/progress-bar.svelte';
  import { slideshowStore } from '$lib/stores/slideshow.store';
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import {
    mdiChevronLeft,
    mdiChevronRight,
    mdiClose,
    mdiCog,
    mdiPause,
    mdiPlay,
    mdiShuffle,
    mdiShuffleDisabled,
  } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  const { slideshowShuffle, slideshowDelay } = slideshowStore;
  const { restartProgress, stopProgress } = slideshowStore;

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

  <CircleIconButton icon={mdiCog} on:click={() => (showSettings = !showSettings)} title="Next" />
  {#if showSettings}
    <div class="flex items-center gap-2">
      <div transition:fly={{ x: 100, duration: 100, easing: quintOut }} class="text-white w-full">Slidehow Delay :</div>
      <input
        class="rounded-xl bg-slate-200 px-3 py-3 text-sm focus:border-immich-primary disabled:cursor-not-allowed h-2"
        type="number"
        min="1"
        bind:value={$slideshowDelay}
      />
    </div>
  {/if}
</div>

<ProgressBar autoplay bind:this={progressBar} bind:status={progressBarStatus} on:done={() => dispatch('next')} />
