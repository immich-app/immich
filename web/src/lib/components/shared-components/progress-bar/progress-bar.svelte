<script context="module" lang="ts">
  export enum ProgressBarStatus {
    Playing = 'playing',
    Paused = 'paused',
  }
</script>

<script lang="ts">
  import { handlePromiseError } from '$lib/utils';

  import { onMount } from 'svelte';
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

  export let onDone: () => void;
  export let onPlaying: () => void = () => {};
  export let onPaused: () => void = () => {};

  const onChange = async () => {
    progress = setDuration(duration);
    await play();
  };

  let progress = setDuration(duration);

  // svelte 5, again....
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  $: duration, handlePromiseError(onChange());

  $: {
    if ($progress === 1) {
      onDone();
    }
  }

  onMount(async () => {
    if (autoplay) {
      await play();
    }
  });

  export const play = async () => {
    status = ProgressBarStatus.Playing;
    onPlaying();
    await progress.set(1);
  };

  export const pause = async () => {
    status = ProgressBarStatus.Paused;
    onPaused();
    await progress.set($progress);
  };

  export const restart = async (autoplay: boolean) => {
    await progress.set(0);

    if (autoplay) {
      await play();
    }
  };

  export const reset = async () => {
    status = ProgressBarStatus.Paused;
    await progress.set(0);
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
