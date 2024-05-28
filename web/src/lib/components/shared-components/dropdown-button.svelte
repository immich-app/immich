<script lang="ts" context="module">
  export type ImmichDropDownOption = {
    default: string;
    options: string[];
  };
</script>

<script lang="ts">
  import { onMount } from 'svelte';

  export let options: ImmichDropDownOption;
  export let selected: string;
  export let disabled = false;

  onMount(() => {
    selected = options.default;
  });

  export let isOpen = false;
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
      {selected}
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
      {#each options.options as option}
        <button
          type="button"
          on:click={() => {
            selected = option;
            isOpen = false;
          }}
          class="flex w-full bg-gray-200 p-2 transition-all hover:bg-gray-300 dark:bg-gray-500 dark:hover:bg-gray-700"
        >
          {option}
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
