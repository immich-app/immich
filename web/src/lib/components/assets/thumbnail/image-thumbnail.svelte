<script lang="ts">
  import { onMount } from 'svelte';
  import { decodeBase64 } from '$lib/utils';
  import { fade } from 'svelte/transition';
  import { thumbHashToDataURL } from 'thumbhash';
  import { mdiEyeOffOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let url: string;
  export let altText: string | undefined;
  export let title: string | null = null;
  export let heightStyle: string | undefined = undefined;
  export let widthStyle: string;
  export let thumbhash: string | null = null;
  export let curve = false;
  export let shadow = false;
  export let circle = false;
  export let hidden = false;
  export let border = false;
  export let preload = true;
  export let hiddenIconClass = 'text-white';
  export let onComplete: (() => void) | undefined = undefined;

  let duration: number = 150;
  let loaded = false;
  let errored = false;
  let img: HTMLImageElement;

  onMount(() => {
    const _onload = () => {
      loaded = true;
      onComplete?.();
    };
    const _onerror = () => {
      errored = true;
      onComplete?.();
    };
    if (img.complete) {
      _onload();
    }
    img.addEventListener('load', _onload);
    img.addEventListener('error', _onerror);
    return () => {
      img?.removeEventListener('load', _onload);
      img?.removeEventListener('error', _onerror);
    };
  });
</script>

<img
  bind:this={img}
  loading={preload ? 'eager' : 'lazy'}
  style:width={widthStyle}
  style:height={heightStyle}
  style:filter={hidden ? 'grayscale(50%)' : 'none'}
  style:opacity={hidden ? '0.5' : '1'}
  src={url}
  alt={loaded || errored ? altText : ''}
  {title}
  class="object-cover {border ? 'border-[3px] border-immich-dark-primary/80 hover:border-immich-primary' : ''}"
  class:rounded-xl={curve}
  class:shadow-lg={shadow}
  class:rounded-full={circle}
  class:aspect-square={circle || !heightStyle}
  class:opacity-0={!thumbhash && !loaded}
  draggable="false"
/>

{#if hidden}
  <div class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <Icon {title} path={mdiEyeOffOutline} size="2em" class={hiddenIconClass} />
  </div>
{/if}

{#if thumbhash && (!loaded || errored)}
  <img
    style:width={widthStyle}
    style:height={heightStyle}
    src={thumbHashToDataURL(decodeBase64(thumbhash))}
    alt={altText}
    {title}
    class="absolute top-0 object-cover"
    class:rounded-xl={curve}
    class:shadow-lg={shadow}
    class:rounded-full={circle}
    draggable="false"
    out:fade={{ duration }}
  />
{/if}
