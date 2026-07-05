<script lang="ts">
  import { accordionManager } from '$lib/managers/accordion-manager.svelte';
  import { Icon } from '@immich/ui';
  import { onDestroy, type Snippet } from 'svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    title: string;
    subtitle?: string;
    key: string;
    isOpen?: boolean;
    autoScrollTo?: boolean;
    icon?: string;
    subtitleSnippet?: Snippet;
    children?: Snippet;
  }

  let {
    title,
    subtitle = '',
    key,
    isOpen = $bindable(false),
    autoScrollTo = false,
    icon = '',
    subtitleSnippet,
    children,
  }: Props = $props();

  let accordionElement: HTMLDivElement | undefined = $state();

  $effect(() => {
    isOpen = accordionManager.isOpen(key);
  });

  const toggleOpen = () => {
    if (isOpen) {
      accordionManager.close(key);
    } else {
      accordionManager.open(key);

      if (autoScrollTo) {
        setTimeout(() => {
          accordionElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 200);
      }
    }
  };

  onDestroy(() => {
    accordionManager.close(key);
  });
</script>

<div
  class="mt-4 rounded-2xl border-2 border-primary/20 px-6 py-4 transition-all {isOpen
    ? 'border-primary/60 shadow-md'
    : ''}"
  bind:this={accordionElement}
>
  <button
    type="button"
    aria-expanded={isOpen}
    onclick={toggleOpen}
    class="flex w-full place-items-center justify-between text-start"
  >
    <div>
      <div class="flex place-items-center gap-2">
        {#if icon}
          <Icon {icon} class="text-primary" size="24" aria-hidden />
        {/if}
        <h2 class="font-medium text-primary">
          {title}
        </h2>
      </div>

      {#if subtitleSnippet}{@render subtitleSnippet()}{:else}
        <p class="mt-1 text-sm dark:text-immich-dark-fg">{subtitle}</p>
      {/if}
    </div>

    <div
      class="immich-circle-icon-button flex place-content-center place-items-center rounded-full p-3 transition-all hover:bg-immich-primary/10 dark:text-immich-dark-fg hover:dark:bg-immich-dark-primary/20"
    >
      <svg
        style="tran"
        width="20"
        height="20"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </button>

  {#if isOpen}
    <ul transition:slide={{ duration: 150 }} class="ms-4 mb-2">
      {@render children?.()}
    </ul>
  {/if}
</div>

<style>
  svg {
    transition: transform 0.2s ease-in;
  }

  [aria-expanded='true'] svg {
    transform: rotate(0.5turn);
  }
</style>
