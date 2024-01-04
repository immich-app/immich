<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiMagnify } from '@mdi/js';

  export let options: {
    zone: string;
    offset: string;
  }[] = [];
  export let selectedOption: {
    zone: string;
    offset: string;
  };
  let isOpened = false;
  let searchQuery = '';

  $: filteredOptions = options.filter((option) => option.zone.toLowerCase().includes(searchQuery.toLowerCase()));
</script>

<button
  class="text-sm my-4 text-left w-full bg-gray-200 p-3 rounded-lg dark:text-white dark:bg-gray-600"
  on:click={() => (isOpened = !isOpened)}
  >{selectedOption.zone}
</button>

{#if isOpened}
  <div class="absolute w-full dark:bg-gray-800 rounded-lg border border-gray-700">
    <div class="relative border-b border-gray-700 flex">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <div class="dark:text-immich-dark-fg/75">
          <button class="flex items-center">
            <Icon path={mdiMagnify} size="1rem" />
          </button>
        </div>
      </div>

      <input bind:value={searchQuery} placeholder="Search timezone..." class="ml-9 grow bg-transparent py-2" />
    </div>
    <div class="h-64 overflow-y-auto">
      {#each filteredOptions as option}
        <button
          class="block text-left w-full px-4 py-2 cursor-pointer hover:bg-gray-700"
          class:bg-gray-700={option.zone === selectedOption.zone}
          on:click={() => {
            selectedOption = option;
            isOpened = false;
            searchQuery = '';
          }}
        >
          {option.zone}
        </button>
      {/each}
    </div>
  </div>
{/if}
