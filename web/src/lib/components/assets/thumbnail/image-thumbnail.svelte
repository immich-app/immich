<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
  import { TUNABLES } from '$lib/utils/tunables';
  import { mdiEyeOffOutline } from '@mdi/js';
  import type { ClassValue } from 'svelte/elements';
  import type { ActionReturn } from 'svelte/action';
  import { fade } from 'svelte/transition';

  interface Props {
    url: string;
    altText: string | undefined;
    title?: string | null;
    heightStyle?: string | undefined;
    widthStyle: string;
    base64ThumbHash?: string | null;
    curve?: boolean;
    shadow?: boolean;
    circle?: boolean;
    hidden?: boolean;
    border?: boolean;
    hiddenIconClass?: string;
    class?: ClassValue;
    brokenAssetClass?: ClassValue;
    onComplete?: ((errored: boolean) => void) | undefined;
  }

  let {
    url,
    altText,
    title = null,
    heightStyle = undefined,
    widthStyle,
    base64ThumbHash = null,
    curve = false,
    shadow = false,
    circle = false,
    hidden = false,
    border = false,
    hiddenIconClass = 'text-white',
    onComplete = undefined,
    class: imageClass = '',
    brokenAssetClass = '',
  }: Props = $props();

  let {
    IMAGE_THUMBNAIL: { THUMBHASH_FADE_DURATION },
  } = TUNABLES;

  let loaded = $state(false);
  let errored = $state(false);

  const setLoaded = () => {
    loaded = true;
    onComplete?.(false);
  };
  const setErrored = () => {
    errored = true;
    onComplete?.(true);
  };

  function mount(elem: HTMLImageElement): ActionReturn {
    if (elem.complete) {
      loaded = true;
      onComplete?.(false);
    }
    return {
      destroy: () => cancelImageUrl(url),
    };
  }

  let optionalClasses = $derived(
    [
      curve && 'rounded-xl',
      circle && 'rounded-full',
      shadow && 'shadow-lg',
      (circle || !heightStyle) && 'aspect-square',
      border && 'border-[3px] border-immich-dark-primary/80 hover:border-immich-primary',
      brokenAssetClass,
    ]
      .filter(Boolean)
      .join(' '),
  );
</script>

{#if errored}
  <BrokenAsset class={optionalClasses} width={widthStyle} height={heightStyle} />
{:else}
  <img
    use:mount
    onload={setLoaded}
    onerror={setErrored}
    style:width={widthStyle}
    style:height={heightStyle}
    style:filter={hidden ? 'grayscale(50%)' : 'none'}
    style:opacity={hidden ? '0.5' : '1'}
    src={url}
    alt={loaded || errored ? altText : ''}
    {title}
    class={['object-cover', optionalClasses, imageClass]}
    class:opacity-0={!thumbhash && !loaded}
    draggable="false"
  />
{/if}

{#if hidden}
  <div class="absolute start-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
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
  ></canvas>
{/if}
