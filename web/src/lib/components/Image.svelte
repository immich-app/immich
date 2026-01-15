<script lang="ts">
  import { imageManager } from '$lib/managers/ImageManager.svelte';
  import { onDestroy, untrack } from 'svelte';
  import type { HTMLImgAttributes } from 'svelte/elements';

  type Props = Omit<HTMLImgAttributes, 'onload' | 'onerror'> & {
    src: string | undefined;
    onStart?: () => void;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    ref?: HTMLImageElement;
  };

  let { src, onStart, onLoad, onError, ref = $bindable(), ...rest }: Props = $props();

  let capturedSource: string | undefined = $state();
  let destroyed = false;

  $effect(() => {
    if (src !== undefined && capturedSource === undefined) {
      capturedSource = src;
      untrack(() => {
        onStart?.();
      });
    }
  });

  onDestroy(() => {
    destroyed = true;
    if (capturedSource !== undefined) {
      imageManager.cancelPreloadUrl(capturedSource);
    }
  });

  const handleLoad = () => {
    if (destroyed || !src) {
      return;
    }
    onLoad?.();
  };

  const handleError = () => {
    if (destroyed || !src) {
      return;
    }
    onError?.(new Error(`Failed to load image: ${src}`));
  };
</script>

{#if capturedSource}
  {#key capturedSource}
    <img bind:this={ref} src={capturedSource} {...rest} onload={handleLoad} onerror={handleError} />
  {/key}
{/if}
