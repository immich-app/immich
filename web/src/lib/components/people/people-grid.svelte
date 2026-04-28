<script lang="ts" generics="T extends { id: string }">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    items: T[];
    class?: string;
    hasNextPage?: boolean;
    loading?: boolean;
    loadNextPage: () => void;
    children?: Snippet<[T, number]>;
  }

  let {
    items,
    class: className = 'w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-10 gap-1',
    hasNextPage = false,
    loading = false,
    loadNextPage,
    children,
  }: Props = $props();
  let sentinel: HTMLElement | undefined = $state();
  let intersectionObserver: IntersectionObserver | undefined;
  let cancelVisibilityCheck: (() => void) | undefined;
  let lastVisibilityCheckItemCount: number | undefined;
  let lastVisibilityCheckSentinel: HTMLElement | undefined;

  const cancelScheduledVisibilityCheck = () => {
    cancelVisibilityCheck?.();
    cancelVisibilityCheck = undefined;
  };

  const requestNextPage = () => {
    cancelScheduledVisibilityCheck();
    loadNextPage();
  };

  $effect(() => {
    if (!hasNextPage || !sentinel || typeof IntersectionObserver === 'undefined') {
      intersectionObserver?.disconnect();
      intersectionObserver = undefined;
      return;
    }

    const observedSentinel = sentinel;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((entry) => entry.target === observedSentinel);
      if (entry?.isIntersecting && hasNextPage && !loading) {
        requestNextPage();
      }
    });

    intersectionObserver?.disconnect();
    intersectionObserver = observer;
    observer.observe(observedSentinel);

    return () => {
      observer.disconnect();
      if (intersectionObserver === observer) {
        intersectionObserver = undefined;
      }
    };
  });

  onDestroy(() => {
    intersectionObserver?.disconnect();
    cancelScheduledVisibilityCheck();
  });

  $effect(() => {
    const itemCount = items.length;
    const observedSentinel = sentinel;

    if (!hasNextPage || !observedSentinel) {
      cancelScheduledVisibilityCheck();
      lastVisibilityCheckItemCount = undefined;
      lastVisibilityCheckSentinel = undefined;
      return;
    }

    if (lastVisibilityCheckItemCount === itemCount && lastVisibilityCheckSentinel === observedSentinel) {
      return;
    }

    cancelScheduledVisibilityCheck();
    lastVisibilityCheckItemCount = itemCount;
    lastVisibilityCheckSentinel = observedSentinel;

    if (loading) {
      return;
    }

    const checkSentinelVisibility = () => {
      cancelVisibilityCheck = undefined;
      if (!hasNextPage || loading || !observedSentinel) {
        return;
      }

      const rect = observedSentinel.getBoundingClientRect();
      if (rect.top < globalThis.innerHeight) {
        requestNextPage();
      }
    };

    if (typeof requestAnimationFrame === 'function') {
      const frame = requestAnimationFrame(checkSentinelVisibility);
      cancelVisibilityCheck = () => cancelAnimationFrame(frame);
    } else {
      const timeout = globalThis.setTimeout(checkSentinelVisibility, 0);
      cancelVisibilityCheck = () => globalThis.clearTimeout(timeout);
    }
  });
</script>

<div class={className}>
  {#each items as item, index (item.id)}
    {@render children?.(item, index)}
  {/each}
</div>

{#if hasNextPage}
  <div bind:this={sentinel} class="flex h-8 w-full items-center justify-center">
    {#if loading}
      <span class="text-sm text-gray-500" aria-live="polite">{$t('loading')}</span>
    {/if}
  </div>
{/if}
