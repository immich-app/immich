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
   * Progress bar status
   */
  export let status: ProgressBarStatus = ProgressBarStatus.Paused;

  export let hidden = false;

  export let duration = 5;

  const onChange = () => {
    progress = setDuration(duration);
    play();
  };

  let progress = setDuration(duration);

  $: duration, onChange();

  $: {
    if ($progress === 1) {
      dispatch('done');
    }
  }

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

  function setDuration(newDuration: number) {
    return tweened<number>(0, {
      duration: (from: number, to: number) => (to ? newDuration * 1000 * (to - from) : 0),
    });
  }
</script>

{#if !hidden}
  <span class="absolute left-0 h-[3px] bg-immich-primary shadow-2xl" style:width={`${$progress * 100}%`} />
{/if}
