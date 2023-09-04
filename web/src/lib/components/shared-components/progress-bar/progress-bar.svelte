<script context="module" lang="ts">
  export enum ProgressBarStatus {
    Playing = 'playing',
    Paused = 'paused',
  }
</script>

<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { tweened } from 'svelte/motion';

  /**
   * Autoplay on mount
   * @default false
   */
  export let autoplay = false;

  /**
   * Duration in milliseconds
   * @default 5000
   */
  export let duration = 5000;

  /**
   * Progress bar status
   */
  export let status: ProgressBarStatus = ProgressBarStatus.Paused;

  let progress = tweened<number>(0, {
    duration: (from: number, to: number) => (to ? duration * (to - from) : 0),
  });

  const dispatch = createEventDispatcher<{
    done: void;
    playing: void;
    paused: void;
  }>();

  onMount(() => {
    if (autoplay) {
      play();
    }
  });

  export const play = () => {
    status = ProgressBarStatus.Playing;
    dispatch('playing');
    progress.set(1);
  };

  export const pause = () => {
    status = ProgressBarStatus.Paused;
    dispatch('paused');
    progress.set($progress);
  };

  export const restart = (autoplay: boolean) => {
    progress.set(0);

    if (autoplay) {
      play();
    }
  };

  export const reset = () => {
    status = ProgressBarStatus.Paused;
    progress.set(0);
  };

  export const setDuration = (newDuration: number) => {
    progress = tweened<number>(0, {
      duration: (from: number, to: number) => (to ? newDuration * (to - from) : 0),
    });
  };

  progress.subscribe((value) => {
    if (value === 1) {
      dispatch('done');
    }
  });
</script>

<span class="absolute left-0 h-[3px] bg-immich-primary shadow-2xl" style:width={`${$progress * 100}%`} />
