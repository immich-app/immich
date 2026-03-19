<script lang="ts">
  import Image from '$lib/components/Image.svelte';
  import type { AdaptiveImageLoader, ImageQuality } from '$lib/utils/adaptive-image-loader.svelte';
  import type { Snippet } from 'svelte';

  type Props = {
    adaptiveImageLoader: AdaptiveImageLoader;
    quality: ImageQuality;
    src: string | undefined;
    alt?: string;
    role?: string;
    ref?: HTMLImageElement;
    width: string;
    height: string;
    overlays?: Snippet;
  };

  let {
    adaptiveImageLoader,
    quality,
    src,
    alt = '',
    role,
    ref = $bindable(),
    width,
    height,
    overlays,
  }: Props = $props();
</script>

{#key adaptiveImageLoader}
  <div class="absolute top-0" style:width style:height>
    <Image
      {src}
      onStart={() => adaptiveImageLoader.onStart(quality)}
      onLoad={() => adaptiveImageLoader.onLoad(quality)}
      onError={() => adaptiveImageLoader.onError(quality)}
      bind:ref
      class="h-full w-full bg-transparent pointer-events-auto"
      {alt}
      {role}
      draggable={false}
      data-testid={quality}
    />
    {@render overlays?.()}
  </div>
{/key}
