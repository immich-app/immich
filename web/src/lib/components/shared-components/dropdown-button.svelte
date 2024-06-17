<script lang="ts" context="module">
  // Necessary for eslint
  /* eslint-disable @typescript-eslint/no-explicit-any */
  type T = any;

  export type RenderedOption = {
    title: string;
    disabled?: boolean;
  };
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher<{
    select: T;
  }>();

  export let options: T[];
  export let selectedOption: T;
  export let disabled = false;
  export let isOpen = false;

  export let render: (item: T) => string | RenderedOption = String;

  const handleSelectOption = (option: T) => {
    dispatch('select', option);
    selectedOption = option;
    isOpen = false;
  };

  const toggle = () => (isOpen = !isOpen);
</script>

<div id="immich-dropdown" class="relative">
  <button
    type="button"
    {disabled}
    on:click={toggle}
    aria-expanded={isOpen}
    class="flex w-full place-items-center justify-between rounded-lg bg-gray-200 p-2 disabled:cursor-not-allowed disabled:bg-gray-600 dark:bg-gray-600 dark:disabled:bg-gray-300"
  >
    <div>
      {render(selectedOption)}
    </div>

    <div>
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
    <div class="absolute mt-2 flex w-full flex-col">
      {#each options as option}
        <button
          type="button"
          on:click={() => {
            handleSelectOption(option);
          }}
          class="flex w-full bg-gray-200 p-2 transition-all hover:bg-gray-300 dark:bg-gray-500 dark:hover:bg-gray-700"
        >
          {render(option)}
        </button>
      {/each}
    </div>
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
