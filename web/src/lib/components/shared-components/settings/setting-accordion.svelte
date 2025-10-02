<script lang="ts">
  import { Icon } from '@immich/ui';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { slide } from 'svelte/transition';
  import { getAccordionState } from './setting-accordion-state.svelte';

  const accordionState = getAccordionState();

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
    isOpen = $bindable($accordionState.has(key)),
    autoScrollTo = false,
    icon = '',
    subtitleSnippet,
    children,
  }: Props = $props();

  let accordionElement: HTMLDivElement | undefined = $state();

  const setIsOpen = (isOpen: boolean) => {
    if (isOpen) {
      $accordionState = $accordionState.add(key);

      if (autoScrollTo) {
        setTimeout(() => {
          accordionElement?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 200);
      }
    } else {
      $accordionState.delete(key);
      // eslint-disable-next-line no-self-assign
      $accordionState = $accordionState;
    }
  };

  onDestroy(() => {
    setIsOpen(false);
  });

  const onclick = () => {
    isOpen = !isOpen;
    setIsOpen(isOpen);
  };

  onMount(() => {
    setIsOpen(isOpen);
  });
</script>

<div
  class="border-2 rounded-2xl border-primary/20 my-4 px-6 py-4 transition-all {isOpen
    ? 'border-primary/60 shadow-md'
    : ''}"
  bind:this={accordionElement}
>
  <button
    type="button"
    aria-expanded={isOpen}
    {onclick}
    class="flex w-full place-items-center justify-between text-start"
  >
    <div>
      <div class="flex gap-2 place-items-center">
        {#if icon}
          <Icon {icon} class="text-primary" size="24" aria-hidden />
        {/if}
        <h2 class="font-medium text-primary">
          {title}
        </h2>
      </div>

      {#if subtitleSnippet}{@render subtitleSnippet()}{:else}
        <p class="text-sm dark:text-immich-dark-fg mt-1">{subtitle}</p>
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
    <ul transition:slide={{ duration: 150 }} class="mb-2 ms-4">
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
