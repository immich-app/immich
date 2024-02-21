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
  import Slider from '../elements/slider.svelte';

  const { slideshowShuffle, slideshowDelay, showProgressBar } = slideshowStore;
  const { restartProgress, stopProgress } = slideshowStore;

  let progressBarStatus: ProgressBarStatus;
  let progressBar: ProgressBar;
  let showSettings = false;
  let delay = $slideshowDelay;

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

  const handleInput = () => {
    if (delay < 1) {
      delay = 5;
      $slideshowDelay = 5;
    }
    $slideshowDelay = delay;
  };
</script>

<div class="m-4 flex gap-2">
  <CircleIconButton buttonSize="50" icon={mdiClose} on:click={() => dispatch('close')} title="Exit Slideshow" />
  {#if $slideshowShuffle}
    <CircleIconButton buttonSize="50" icon={mdiShuffle} on:click={() => ($slideshowShuffle = false)} title="Shuffle" />
  {:else}
    <CircleIconButton
      buttonSize="50"
      icon={mdiShuffleDisabled}
      on:click={() => ($slideshowShuffle = true)}
      title="No shuffle"
    />
  {/if}
  <CircleIconButton
    buttonSize="50"
    icon={progressBarStatus === ProgressBarStatus.Paused ? mdiPlay : mdiPause}
    on:click={() => (progressBarStatus === ProgressBarStatus.Paused ? progressBar.play() : progressBar.pause())}
    title={progressBarStatus === ProgressBarStatus.Paused ? 'Play' : 'Pause'}
  />
  <CircleIconButton buttonSize="50" icon={mdiChevronLeft} on:click={() => dispatch('prev')} title="Previous" />
  <CircleIconButton buttonSize="50" icon={mdiChevronRight} on:click={() => dispatch('next')} title="Next" />

  <CircleIconButton buttonSize="50" icon={mdiCog} on:click={() => (showSettings = !showSettings)} title="Next" />

  {#if showSettings}
    <div class="bg-black/10 rounded-lg p-2 h-fit min-w-48" transition:fly={{ x: 100, duration: 100, easing: quintOut }}>
      <div class="grid grid-cols-[60%_40%] gap-1">
        <div class="text-white" title="in seconds">Slidehow Delay :</div>
        <input
          class="rounded-xl text-white bg-gray-400/20 px-3 py-3 text-sm focus:border-immich-primary h-2"
          type="number"
          min="1"
          size="8"
          bind:value={delay}
          on:input={handleInput}
        />

        <div class="text-white">Show progress bar :</div>
        <div class="flex items-center">
          <Slider checked={$showProgressBar} on:toggle={() => ($showProgressBar = !$showProgressBar)} />
        </div>
      </div>
    </div>
  {/if}
</div>

<ProgressBar autoplay bind:this={progressBar} bind:status={progressBarStatus} on:done={() => dispatch('next')} />
