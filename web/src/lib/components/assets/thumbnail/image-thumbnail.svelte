<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { TUNABLES } from '$lib/utils/tunables';
  import { mdiEyeOffOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

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

  $: optionalClasses = [
    curve && 'rounded-xl',
    circle && 'rounded-full',
    shadow && 'shadow-lg',
    (circle || !heightStyle) && 'aspect-square',
    border && 'border-[3px] border-immich-dark-primary/80 hover:border-immich-primary',
  ]
    .filter(Boolean)
    .join(' ');
</script>

{#if errored}
  <BrokenAsset class={optionalClasses} width={widthStyle} height={heightStyle} />
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
    class="object-cover {optionalClasses}"
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
