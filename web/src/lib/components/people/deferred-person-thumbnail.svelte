<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import type { ThumbnailLoadQueue } from '$lib/components/people/thumbnail-load-queue.svelte';
  import { onDestroy, untrack } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    queue: ThumbnailLoadQueue;
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
    highlighted?: boolean;
    hiddenIconClass?: string;
    class?: ClassValue;
    brokenAssetClass?: ClassValue;
  }

  let {
    queue,
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
    highlighted = false,
    hiddenIconClass = 'text-white',
    class: imageClass = '',
    brokenAssetClass = '',
  }: Props = $props();

  let element: HTMLDivElement;
  let started = $state(false);
  let releaseQueued: (() => void) | undefined;
  let released = false;

  const requestStart = () => {
    if (started || releaseQueued) {
      return;
    }

    releaseQueued = queue.request(() => {
      releaseQueued = undefined;
      started = true;
    });
  };

  const release = () => {
    if (!started || released) {
      return;
    }

    released = true;
    queue.release();
  };

  $effect(() => {
    if (!element) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      requestStart();
      return () => {
        untrack(() => {
          if (!started) {
            releaseQueued?.();
          }
        });
      };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        requestStart();
        observer.disconnect();
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      untrack(() => {
        if (!started) {
          releaseQueued?.();
        }
      });
    };
  });

  onDestroy(() => {
    releaseQueued?.();
    release();
  });

  let sharedClasses = $derived([
    curve && 'rounded-xl',
    circle && 'rounded-full',
    shadow && 'shadow-lg',
    (circle || !heightStyle) && 'aspect-square',
    border && 'border-3 border-immich-dark-primary/80 hover:border-immich-primary',
    'transition-shadow duration-150',
    highlighted && 'ring-4 ring-immich-primary dark:ring-immich-dark-primary',
  ]);

  let style = $derived(
    `width: ${widthStyle}; height: ${heightStyle ?? ''}; filter: ${hidden ? 'grayscale(50%)' : 'none'}; opacity: ${hidden ? '0.5' : '1'};`,
  );
</script>

<div bind:this={element}>
  {#if started}
    <ImageThumbnail
      {url}
      {altText}
      {title}
      {heightStyle}
      {widthStyle}
      {curve}
      {shadow}
      {circle}
      {hidden}
      {border}
      {highlighted}
      {hiddenIconClass}
      class={imageClass}
      {brokenAssetClass}
      preload={false}
      onComplete={release}
    />
  {:else}
    <img
      class={['object-cover bg-gray-300 dark:bg-gray-700', sharedClasses, imageClass]}
      {style}
      alt={altText ?? ''}
      draggable={false}
      title={title ?? undefined}
    />
  {/if}
</div>
