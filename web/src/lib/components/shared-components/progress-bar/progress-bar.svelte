<script lang="ts">
  import { ProgressBarStatus } from '$lib/constants';
  import { handlePromiseError } from '$lib/utils';

  import { onMount } from 'svelte';
  import { tweened } from 'svelte/motion';

  interface Props {
    /**
     * Autoplay on mount
     * @default false
     */
    autoplay?: boolean;
    /**
     * Progress bar status
     */
    status?: ProgressBarStatus;
    hidden?: boolean;
    duration?: number;
    onDone: () => void;
    onPlaying?: () => void;
    onPaused?: () => void;
  }

  let {
    autoplay = false,
    status = $bindable(),
    hidden = false,
    duration = 5,
    onDone,
    onPlaying = () => {},
    onPaused = () => {},
  }: Props = $props();

  const onChange = async (progressDuration: number) => {
    progress = setDuration(progressDuration);
    await play();
  };

  let progress = setDuration(duration);

  $effect(() => {
    handlePromiseError(onChange(duration));
  });

  $effect(() => {
    if ($progress === 1) {
      onDone();
    }
  });

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
  <span class="absolute start-0 h-[3px] bg-immich-primary shadow-2xl" style:width={`${$progress * 100}%`}></span>
{/if}
