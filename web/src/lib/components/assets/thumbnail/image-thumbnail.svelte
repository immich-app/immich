<script lang="ts">
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { cancelImageUrl } from '$lib/utils/sw-messaging';
  import { Icon } from '@immich/ui';
  import { mdiEyeOffOutline } from '@mdi/js';
  import type { ActionReturn } from 'svelte/action';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    url: string;
    altText: string | undefined;
    title?: string | null;
    heightStyle?: string | undefined;
    widthStyle: string;
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
    draggable="false"
  />
{/if}

{#if hidden}
  <div class="absolute start-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <!-- TODO fix `title` type -->
    <Icon title={title ?? undefined} icon={mdiEyeOffOutline} size="2em" class={hiddenIconClass} />
  </div>
{/if}
