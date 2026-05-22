<script lang="ts">
  import { isFirefox } from '$lib/utils/asset-utils';
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
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
  let loaded = $state(false);
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
      cancelImageUrl(capturedSource);
    }
  });

  const completeLoad = () => {
    if (destroyed) {
      return;
    }
    loaded = true;
    onLoad?.();
  };

  const handleLoad = () => {
    if (destroyed || !src) {
      return;
    }

    if (isFirefox && ref) {
      ref.decode().then(completeLoad, completeLoad);
      return;
    }

    completeLoad();
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
    <img
      bind:this={ref}
      src={capturedSource}
      {...rest}
      style:visibility={isFirefox && !loaded ? 'hidden' : undefined}
      onload={handleLoad}
      onerror={handleError}
    />
  {/key}
{/if}
