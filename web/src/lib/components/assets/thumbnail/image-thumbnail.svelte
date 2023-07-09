<script lang="ts">
  import { imageLoad } from '$lib/utils/image-load';
  import { fade } from 'svelte/transition';
  import { thumbHashToDataURL } from 'thumbhash';
  import { Buffer } from 'buffer';

  export let url: string;
  export let altText: string;
  export let heightStyle: string | undefined = undefined;
  export let widthStyle: string;
  export let thumbhash: string | null = null;
  export let curve = false;
  export let shadow = false;
  export let circle = false;

  let complete = false;
</script>

<img
  style:width={widthStyle}
  style:height={heightStyle}
  src={url}
  alt={altText}
  class="object-cover transition-opacity duration-300"
  class:rounded-lg={curve}
  class:shadow-lg={shadow}
  class:rounded-full={circle}
  class:opacity-0={!thumbhash && !complete}
  draggable="false"
  use:imageLoad
  on:image-load|once={() => (complete = true)}
/>

{#if thumbhash && !complete}
  <img
    style:width={widthStyle}
    style:height={heightStyle}
    src={thumbHashToDataURL(Buffer.from(thumbhash, 'base64'))}
    alt={altText}
    class="absolute object-cover top-0"
    class:rounded-lg={curve}
    class:shadow-lg={shadow}
    class:rounded-full={circle}
    draggable="false"
    out:fade={{ duration: 300 }}
  />
{/if}
