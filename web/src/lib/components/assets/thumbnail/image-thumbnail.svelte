<script lang="ts">
  import { imageLoad } from '$lib/utils/image-load';
  import { fade } from 'svelte/transition';
  import { thumbHashToDataURL } from 'thumbhash';
  import { Buffer } from 'buffer';
  import { mdiEyeOffOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let url: string;
  export let altText: string;
  export let title: string | null = null;
  export let heightStyle: string | undefined = undefined;
  export let widthStyle: string;
  export let thumbhash: string | null = null;
  export let curve = false;
  export let shadow = false;
  export let circle = false;
  export let hidden = false;
  export let border = false;
  let complete = false;

  export let eyeColor: 'black' | 'white' = 'white';
</script>

<img
  style:width={widthStyle}
  style:height={heightStyle}
  style:filter={hidden ? 'grayscale(50%)' : 'none'}
  style:opacity={hidden ? '0.5' : '1'}
  src={url}
  alt={altText}
  {title}
  class="object-cover transition duration-300 {border
    ? 'border-[3px] border-immich-dark-primary/80 hover:border-immich-primary'
    : ''}"
  class:rounded-xl={curve}
  class:shadow-lg={shadow}
  class:rounded-full={circle}
  class:opacity-0={!thumbhash && !complete}
  draggable="false"
  use:imageLoad
  on:image-load|once={() => (complete = true)}
/>

{#if hidden}
  <div class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <Icon path={mdiEyeOffOutline} size="2em" class="text-{eyeColor}" />
  </div>
{/if}

{#if thumbhash && !complete}
  <img
    style:width={widthStyle}
    style:height={heightStyle}
    src={thumbHashToDataURL(Buffer.from(thumbhash, 'base64'))}
    alt={altText}
    {title}
    class="absolute top-0 object-cover"
    class:rounded-xl={curve}
    class:shadow-lg={shadow}
    class:rounded-full={circle}
    draggable="false"
    out:fade={{ duration: 300 }}
  />
{/if}
