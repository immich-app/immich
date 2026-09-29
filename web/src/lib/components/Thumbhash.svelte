<script lang="ts">
  import { decodeBase64 } from '$lib/utils';
  import { TUNABLES } from '$lib/utils/tunables';
  import type { HTMLCanvasAttributes } from 'svelte/elements';
  import { fade } from 'svelte/transition';
  import { thumbHashToRGBA } from 'thumbhash';

  type Props = HTMLCanvasAttributes & {
    base64ThumbHash: string;
    fadeOut?: boolean;
  };

  const { base64ThumbHash, fadeOut = false, class: className, ...restProps }: Props = $props();

  const {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  let canvas = $state<HTMLCanvasElement>();

  $effect(() => {
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }
    const { w, h, rgba } = thumbHashToRGBA(decodeBase64(base64ThumbHash));
    canvas.width = w;
    canvas.height = h;
    const pixels = ctx.createImageData(w, h);
    pixels.data.set(rgba);
    ctx.putImageData(pixels, 0, 0);
  });
</script>

<canvas
  bind:this={canvas}
  class={className}
  out:fade={{ duration: fadeOut ? THUMBHASH_FADE_DURATION : 0 }}
  {...restProps}
></canvas>
