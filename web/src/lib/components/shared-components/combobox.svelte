<script lang="ts" context="module">
  export type ComboBoxOption = {
    label: string;
    value: string;
  };

  export function toComboBoxOptions(items: string[]) {
    return items.map<ComboBoxOption>((item) => ({ label: item, value: item }));
  }
</script>

<script lang="ts">
  import { fly } from 'svelte/transition';

  import Icon from '$lib/components/elements/icon.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiMagnify, mdiUnfoldMoreHorizontal, mdiClose } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';

  export let id: string | undefined = undefined;
  export let options: ComboBoxOption[] = [];
  export let selectedOption: ComboBoxOption | undefined;
  export let placeholder = '';

  let isOpen = false;
  let searchQuery = selectedOption?.label || '';

  $: filteredOptions = options.filter((option) => option.label.toLowerCase().includes(searchQuery.toLowerCase()));

  const dispatch = createEventDispatcher<{
    select: ComboBoxOption | undefined;
    click: void;
  }>();

  const handleClick = () => {
    searchQuery = '';
    isOpen = true;
    dispatch('click');
  };

  let handleOutClick = () => {
    isOpen = false;
  };

  let handleSelect = (option: ComboBoxOption) => {
    selectedOption = option;
    dispatch('select', option);
    isOpen = false;
  };

  const onClear = () => {
    selectedOption = undefined;
    searchQuery = '';
    dispatch('select', selectedOption);
  };
</script>

<div class="relative w-full dark:text-gray-300 text-gray-700 text-base" use:clickOutside on:outclick={handleOutClick}>
  <div>
    {#if isOpen}
      <div class="absolute inset-y-0 left-0 flex items-center pl-3">
        <div class="dark:text-immich-dark-fg/75">
          <Icon path={mdiMagnify} />
        </div>
      </div>
    {/if}

    <input
      {id}
      {placeholder}
      role="combobox"
      aria-expanded={isOpen}
      aria-controls={id}
      class="immich-form-input text-sm text-left w-full !pr-12 transition-all"
      class:!pl-8={isOpen}
      class:!rounded-b-none={isOpen}
      class:cursor-pointer={!isOpen}
      value={isOpen ? '' : selectedOption?.label || ''}
      on:input={(e) => (searchQuery = e.currentTarget.value)}
      on:focus={handleClick}
    />

    <div
      class="absolute right-0 top-0 h-full flex px-4 justify-center items-center content-between"
      class:pr-2={selectedOption}
      class:pointer-events-none={!selectedOption}
    >
      {#if selectedOption}
        <IconButton color="transparent-gray" on:click={onClear} title="Clear value">
          <Icon path={mdiClose} />
        </IconButton>
      {:else if !isOpen}
        <Icon path={mdiUnfoldMoreHorizontal} />
      {/if}
    </div>
  </div>

  {#if isOpen}
    <div
      role="listbox"
      transition:fly={{ duration: 250 }}
      class="absolute text-left text-sm w-full max-h-64 overflow-y-auto bg-white dark:bg-gray-800 rounded-b-lg border border-t-0 border-gray-300 dark:border-gray-900 z-10"
    >
      {#if filteredOptions.length === 0}
        <div class="px-4 py-2 font-medium">No results</div>
      {/if}
      {#each filteredOptions as option (option.label)}
        {@const selected = option.label === selectedOption?.label}
        <button
          type="button"
          role="option"
          aria-selected={selected}
          class="text-left w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          class:bg-gray-300={selected}
          class:dark:bg-gray-600={selected}
          on:click={() => handleSelect(option)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
