<script lang="ts">
  import BrokenAsset from '$lib/components/assets/broken-asset.svelte';
  import Image from '$lib/components/Image.svelte';
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

  let sharedClasses = $derived([
    curve && 'rounded-xl',
    circle && 'rounded-full',
    shadow && 'shadow-lg',
    (circle || !heightStyle) && 'aspect-square',
    border && 'border-3 border-immich-dark-primary/80 hover:border-immich-primary',
  ]);

  let style = $derived(
    `width: ${widthStyle}; height: ${heightStyle ?? ''}; filter: ${hidden ? 'grayscale(50%)' : 'none'}; opacity: ${hidden ? '0.5' : '1'};`,
  );
</script>

{#if errored}
  <BrokenAsset class={[sharedClasses, brokenAssetClass]} width={widthStyle} height={heightStyle} />
{:else}
  <Image
    src={url}
    onLoad={setLoaded}
    onError={setErrored}
    class={['object-cover bg-gray-300 dark:bg-gray-700', sharedClasses, imageClass]}
    {style}
    alt={loaded || errored ? altText : ''}
    draggable={false}
    title={title ?? undefined}
    loading={preload ? 'eager' : 'lazy'}
  />
{/if}

{#if hidden}
  <div class="absolute start-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
    <!-- TODO fix `title` type -->
    <Icon title={title ?? undefined} icon={mdiEyeOffOutline} size="2em" class={hiddenIconClass} />
  </div>
{/if}
