<script lang="ts">
  import { imageLoader } from '$lib/actions/image-loader.svelte';
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import { Icon } from '@immich/ui';
  import { mdiEyeOffOutline } from '@mdi/js';
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
    preload?: boolean;
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
    preload = true,
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

  let optionalClasses = $derived(
    [
      curve && 'rounded-xl',
      circle && 'rounded-full',
      shadow && 'shadow-lg',
      (circle || !heightStyle) && 'aspect-square',
      border && 'border-3 border-immich-dark-primary/80 hover:border-immich-primary',
      brokenAssetClass,
    ]
      .filter(Boolean)
      .join(' '),
  );

  let style = $derived(
    `width: ${widthStyle}; height: ${heightStyle ?? ''}; filter: ${hidden ? 'grayscale(50%)' : 'none'}; opacity: ${hidden ? '0.5' : '1'};`,
  );
</script>

{#if errored}
  <BrokenAsset class={optionalClasses} width={widthStyle} height={heightStyle} />
{:else}
  <div
    use:imageLoader={{
      src: url,
      onLoad: setLoaded,
      onError: setErrored,
      imgClass: ['object-cover', optionalClasses, imageClass],
      style,
      alt: loaded || errored ? altText : '',
      draggable: false,
      title,
      loading: preload ? 'eager' : 'lazy',
    }}
  ></div>
{/if}

{#if hidden}
  <div class="absolute start-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <!-- TODO fix `title` type -->
    <Icon title={title ?? undefined} icon={mdiEyeOffOutline} size="2em" class={hiddenIconClass} />
  </div>
{/if}
