<script lang="ts">
  import { slide } from 'svelte/transition';
  import { getAccordionState } from './setting-accordion-state.svelte';
  import { onDestroy } from 'svelte';

  const accordionState = getAccordionState();

  export let title: string;
  export let subtitle = '';
  export let key: string;
  export let isOpen = $accordionState.has(key);

  $: setIsOpen(isOpen);

  const setIsOpen = (isOpen: boolean) => {
    if (isOpen) {
      $accordionState = $accordionState.add(key);
    } else {
      $accordionState.delete(key);
      $accordionState = $accordionState;
    }
  };

  onDestroy(() => {
    setIsOpen(false);
  });
</script>

<div class="border-b-[1px] border-gray-200 py-4 dark:border-gray-700">
  <button
    type="button"
    aria-expanded={isOpen}
    on:click={() => (isOpen = !isOpen)}
    class="flex w-full place-items-center justify-between text-left"
  >
    <div>
      <h2 class="font-medium text-immich-primary dark:text-immich-dark-primary">
        {title}
      </h2>

      <slot name="subtitle">
        <p class="text-sm dark:text-immich-dark-fg">{subtitle}</p>
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
    <ul transition:slide={{ duration: 250 }} class="mb-2 ml-4">
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
