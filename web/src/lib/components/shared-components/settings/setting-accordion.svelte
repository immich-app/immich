<script lang="ts">
  import { slide } from 'svelte/transition';
  import { getAccordionState } from './setting-accordion-state.svelte';
  import { onDestroy } from 'svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  const accordionState = getAccordionState();

  export let title: string;
  export let subtitle = '';
  export let key: string;
  export let isOpen = $accordionState.has(key);
  export let autoScrollTo = false;
  export let icon = '';

  let accordionElement: HTMLDivElement;

  $: setIsOpen(isOpen);

  const setIsOpen = (isOpen: boolean) => {
    if (isOpen) {
      $accordionState = $accordionState.add(key);

      if (autoScrollTo) {
        setTimeout(() => {
          accordionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 200);
      }
    } else {
      $accordionState.delete(key);
      $accordionState = $accordionState;
    }
  };

  onDestroy(() => {
    setIsOpen(false);
  });
</script>

<div
  class="border rounded-2xl my-4 px-6 py-4 transition-all {isOpen
    ? 'border-immich-primary/40 dark:border-immich-dark-primary/50 shadow-md'
    : 'dark:border-gray-800'}"
  bind:this={accordionElement}
>
  <button
    type="button"
    aria-expanded={isOpen}
    on:click={() => (isOpen = !isOpen)}
    class="flex w-full place-items-center justify-between text-left"
  >
    <div>
      <div class="flex gap-2 place-items-center">
        {#if icon}
          <Icon path={icon} class="text-immich-primary dark:text-immich-dark-primary" size="24" ariaHidden />
        {/if}
        <h2 class="font-medium text-immich-primary dark:text-immich-dark-primary">
          {title}
        </h2>
      </div>

      <slot name="subtitle">
        <p class="text-sm dark:text-immich-dark-fg mt-1">{subtitle}</p>
      </slot>
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
    <ul transition:slide={{ duration: 150 }} class="mb-2 ml-4">
      <slot />
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
