<script lang="ts" context="module">
  // Necessary for eslint
  /* eslint-disable @typescript-eslint/no-explicit-any */
  type T = any;
</script>

<script lang="ts" generics="T">
  import Icon from '$lib/components/elements/icon.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiMagnify, mdiUnfoldMoreHorizontal } from '@mdi/js';

  type ComboBoxOption = {
    label: string;
    value: T;
  };

  export let options: ComboBoxOption[] = [];
  export let selectedOption: ComboBoxOption;
  export let placeholder = '';

  let isOpen = false;
  let searchQuery = '';

  $: filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  let handleClick = () => {
    searchQuery = '';
    isOpen = !isOpen;
  };

  let handleOutClick = () => {
    searchQuery = '';
    isOpen = false;
  };

  let handleSelect = (option: ComboBoxOption) => {
    selectedOption = option;
    isOpen = false;
  };
</script>

<div class="relative" use:clickOutside on:outclick={handleOutClick}>
  <button
    class="text-sm text-left w-full bg-gray-200 p-3 rounded-lg dark:text-white dark:bg-gray-600 dark:hover:bg-gray-500 transition-all"
    on:click={handleClick}
    >{selectedOption.label}
    <div class="absolute right-0 top-0 h-full flex px-4 justify-center items-center content-between">
      <Icon path={mdiUnfoldMoreHorizontal} />
    </div>
  </button>

  {#if isOpen}
    <div
      class="absolute w-full top-full mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-900"
    >
      <div class="relative border-b flex">
        <div class="absolute inset-y-0 left-0 flex items-center pl-3">
          <div class="dark:text-immich-dark-fg/75">
            <button class="flex items-center">
              <Icon path={mdiMagnify} />
            </button>
          </div>
        </div>

        <!-- svelte-ignore a11y-autofocus -->
        <input bind:value={searchQuery} autofocus {placeholder} class="ml-9 grow bg-transparent py-2" />
      </div>
      <div class="h-64 overflow-y-auto">
        {#each filteredOptions as option (option.label)}
          <button
            class="block text-left w-full px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all
             ${option.label === selectedOption.label ? 'bg-gray-300 dark:bg-gray-600' : ''}
            "
            class:bg-gray-300={option.label === selectedOption.label}
            on:click={() => handleSelect(option)}
          >
            {option.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
