<script lang="ts">
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
  import { untrack } from 'svelte';
  import type { HTMLImgAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLImgAttributes, 'onload' | 'onerror'> {
    src: string | undefined;
    onStart?: () => void;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    ref?: HTMLImageElement;
  }

  let { src, onStart, onLoad, onError, ref = $bindable(), ...rest }: Props = $props();

  let destroyed = false;

  $effect(() => {
    if (src) {
      const capturedSrc = src;
      untrack(() => {
        onStart?.();
      });
      return () => {
        destroyed = true;
        cancelImageUrl(capturedSrc);
      };
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

{#if src}
  {#key src}
    <img bind:this={ref} {src} {...rest} onload={handleLoad} onerror={handleError} />
  {/key}
{/if}
