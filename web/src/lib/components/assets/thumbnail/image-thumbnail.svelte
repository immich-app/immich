<script lang="ts">
  import { onMount } from 'svelte';

  import { fade } from 'svelte/transition';

  import { thumbhash } from '$lib/actions/thumbhash';
  import Icon from '$lib/components/elements/icon.svelte';
  import { TUNABLES } from '$lib/utils/tunables';
  import { mdiEyeOffOutline, mdiImageBrokenVariant } from '@mdi/js';

  export let url: string;
  export let altText: string | undefined;
  export let title: string | null = null;
  export let heightStyle: string | undefined = undefined;
  export let widthStyle: string;
  export let base64ThumbHash: string | null = null;
  export let curve = false;
  export let shadow = false;
  export let circle = false;
  export let hidden = false;
  export let border = false;
  export let preload = true;
  export let hiddenIconClass = 'text-white';
  export let onComplete: (() => void) | undefined = undefined;

  let {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  let loaded = false;
  let errored = false;

  let img: HTMLImageElement;

  const setLoaded = () => {
    loaded = true;
    onComplete?.();
  };
  const setErrored = () => {
    errored = true;
    onComplete?.();
  };
  onMount(() => {
    if (img.complete) {
      setLoaded();
    }
  });
</script>

{#if errored}
  <div class="absolute flex h-full w-full items-center justify-center p-4 z-10">
    <Icon path={mdiImageBrokenVariant} size="48" />
  </div>
{:else}
  <img
    bind:this={img}
    on:load={setLoaded}
    on:error={setErrored}
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
{/if}

{#if hidden}
  <div class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <Icon {title} path={mdiEyeOffOutline} size="2em" class={hiddenIconClass} />
  </div>
{/if}

{#if base64ThumbHash && (!loaded || errored)}
  <canvas
    use:thumbhash={{ base64ThumbHash }}
    data-testid="thumbhash"
    style:width={widthStyle}
    style:height={heightStyle}
    {title}
    class="absolute top-0 object-cover"
    class:rounded-xl={curve}
    class:shadow-lg={shadow}
    class:rounded-full={circle}
    draggable="false"
    out:fade={{ duration: THUMBHASH_FADE_DURATION }}
  />
{/if}
